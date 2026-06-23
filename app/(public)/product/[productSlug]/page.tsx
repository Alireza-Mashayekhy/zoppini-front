import ProductContent from '@/components/pages/product/content';
import { getProduct } from '@/services/features/products/server.api';

interface ProductPageProps {
  params: Promise<{ productSlug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productSlug } = await params;
  const product = await getProduct(productSlug);
  console.log(product);

  return <ProductContent products={product.data} />;
}
