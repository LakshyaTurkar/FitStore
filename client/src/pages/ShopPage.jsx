import PageHeader from '../components/PageHeader';
import ProductListing from '../components/ProductListing';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function ShopPage() {
  useDocumentTitle('Shop');
  return (
    <>
      <PageHeader eyebrow="Shop" title="All Products" subtitle="Filter by category, price and availability to find the right gear." />
      <ProductListing />
    </>
  );
}
