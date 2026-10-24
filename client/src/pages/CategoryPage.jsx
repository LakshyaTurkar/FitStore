import { useParams } from 'react-router-dom';
import { storeApi } from '../api/endpoints';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import PageHeader from '../components/PageHeader';
import ProductListing from '../components/ProductListing';

export default function CategoryPage() {
  const { slug } = useParams();
  const { data } = useApi(() => storeApi.categories().then((r) => r.data), []);
  const category = data?.find((c) => c.slug === slug);
  const title = category?.name || (data ? 'Category not found' : 'Category');
  useDocumentTitle(title);

  return (
    <>
      <PageHeader eyebrow="Category" title={title} subtitle={category?.description} />
      <ProductListing fixedCategory={slug} />
    </>
  );
}
