import { supabase } from './supabase';
import { getPrintifyProduct } from './printify';

export async function getValidatedProduct(productId: string, variantId?: string | number) {
  // 1. Tentar buscar no Supabase (Produtos Locais)
  const { data: localProduct } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (localProduct) {
    return {
      name: localProduct.name,
      price: localProduct.price, // Preço Real em R$
      image: localProduct.image,
      source: 'local'
    };
  }

  // 2. Se não encontrar, buscar no Printify
  const printifyProduct = await getPrintifyProduct(productId);
  if (printifyProduct) {
    const variant = printifyProduct.variants.find((v: any) => v.id.toString() === variantId?.toString());
    
    // Se não houver variante específica, pega a primeira disponível
    const selectedVariant = variant || printifyProduct.variants[0];
    
    return {
      name: printifyProduct.title,
      price: (parseFloat(selectedVariant.price) / 100) * 5, // Converter centavos USD para R$ (Estimado x5)
      image: printifyProduct.images[0]?.src,
      source: 'printify'
    };
  }

  return null;
}
