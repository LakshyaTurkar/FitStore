import { useSearchParams } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import PageHeader from '../components/PageHeader';
import ProductListing from '../components/ProductListing';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  useDocumentTitle(q ? `Search: ${q}` : 'Search');
  return (
    <>
      <PageHeader eyebrow="Search" title={q ? `Results for "${q}"` : 'Search Products'} subtitle="Search by product name, brand, SKU or description." />
      <ProductListing searchMode />
    </>
  );
}
