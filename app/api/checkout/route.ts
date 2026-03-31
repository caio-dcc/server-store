import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getValidatedProduct } from '@/lib/products';

export async function POST(req: Request) {
  try {
    const { items, userId } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
    }

    // SECURITY FIX: Fetch real prices from server-side source of truth
    const line_items = await Promise.all(items.map(async (item: any) => {
      const validated = await getValidatedProduct(item.productId || item.id, item.variantId);
      
      if (!validated) {
        throw new Error(`Produto não encontrado: ${item.name}`);
      }

      return {
        price_data: {
          currency: 'brl',
          product_data: {
            name: `${validated.name} - ${item.size || ''} ${item.color || ''}`.trim(),
            images: [validated.image].filter(Boolean),
          },
          unit_amount: Math.round(validated.price * 100),
        },
        quantity: item.quantity,
      };
    }));

    // Compress cart for metadata (p = productId, v = variantId, q = quantity)
    const compressedItems = items.map((i: any) => ({ p: i.productId, v: i.variantId, q: i.quantity }));
    const cartItemsJson = JSON.stringify(compressedItems).slice(0, 500);

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      client_reference_id: userId || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pedidos?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
      metadata: {
        cart_items: cartItemsJson,
        user_id: userId || '',
      },

      shipping_address_collection: {

        allowed_countries: ['BR', 'US', 'GB', 'CA'],
      },
    });



    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
