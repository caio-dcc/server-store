const PRINTIFY_BASE_URL = 'https://api.printify.com/v1';

export async function createPrintifyOrder(session: any) {
  const apiKey = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!apiKey || !shopId) {
    throw new Error('Printify API Key or Shop ID missing');
  }

  const { metadata, customer_details, shipping_details } = session;

  const compressedItems = JSON.parse(metadata?.cart_items || '[]');
  const lineItems = compressedItems.map((item: any) => ({
    product_id: item.p,
    variant_id: parseInt(item.v),
    quantity: item.q,
  }));

  const safeCustomer = customer_details || { name: 'Cliente Teste', email: 'teste@grandsys.com', phone: '' };
  const safeShipping = shipping_details?.address || {
    country: 'BR',
    state: 'RJ',
    line1: 'Rua Teste',
    line2: '',
    city: 'Rio de Janeiro',
    postal_code: '00000-000',
  };

  const orderData = {
    external_id: session.id, // Using Stripe session ID as external ID
    label: `Stripe Order ${session.id}`,
    line_items: lineItems,
    shipping_method: 1, // Standard shipping
    is_printify_express: false,
    send_shipping_notification: false,
    address_to: {
      first_name: safeCustomer.name.split(' ')[0] || 'Cliente',
      last_name: safeCustomer.name.split(' ').slice(1).join(' ') || '.',
      email: safeCustomer.email || 'teste@grandsys.com',
      phone: safeCustomer.phone || '000000000',
      country: safeShipping.country || 'BR',
      region: safeShipping.state || 'RJ',
      address1: safeShipping.line1 || 'Rua Teste, 123',
      address2: safeShipping.line2 || '',
      city: safeShipping.city || 'Rio de Janeiro',
      zip: safeShipping.postal_code || '00000-000',
    },
  };


  const response = await fetch(`${PRINTIFY_BASE_URL}/shops/${shopId}/orders.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Printify order failed: ${errorData.message}`);
  }

  return await response.json();
}

export async function getPrintifyProduct(productId: string) {
  const apiKey = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!apiKey || !shopId) {
    throw new Error('Printify API Key or Shop ID missing');
  }

  const response = await fetch(`${PRINTIFY_BASE_URL}/shops/${shopId}/products/${productId}.json`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}
