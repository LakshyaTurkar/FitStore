import { storeApi } from '../api/endpoints';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import PageHeader from '../components/PageHeader';
import CategoryCard from '../components/CategoryCard';
import { EmptyState, ErrorState, Spinner } from '../components/Feedback';

export default function CategoriesPage() {
  useDocumentTitle('Categories');
  const { data, loading, error, reload } = useApi(() => storeApi.categories().then((r) => r.data), []);

  return (
    <>
      <PageHeader eyebrow="Browse" title="Categories" subtitle="Everything for training, nutrition, apparel and recovery." />
      <div className="container section">
        {loading && <Spinner label="Loading categories..." />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data?.length === 0 && <EmptyState title="No categories yet" message="Run the seed script to add sample data." />}
        <div className="category-grid">
          {data?.map((c) => (
            <div key={c._id} className="category-tile">
              <CategoryCard category={c} />
              <p>{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
