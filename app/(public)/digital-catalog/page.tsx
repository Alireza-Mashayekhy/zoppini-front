import CatalogViewer from '@/components/pages/digital-catalog/catalog-viewer';
import { getCatalogPages } from '@/services/features/catalog/server.api';

export default async function CatalogPage() {
  const catalogPages = await getCatalogPages();

  return <CatalogViewer pages={catalogPages?.data} />;
}
