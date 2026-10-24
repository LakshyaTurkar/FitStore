import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { productApi } from '../../api/endpoints';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/Feedback';
import { effectivePrice, formatINR } from '../../utils/format';

export default function AdminProductsPage() {
  useDocumentTitle('Manage Products');
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const search = params.get('search') || '';
  const [draft, setDraft] = useState(search);
  const [deleting, setDeleting] = useState(null);

  const { data, loading, error, reload } = useApi(
    () => productApi.list({ page, limit: 15, search: search || undefined, sort: 'name' }),
    [page, search],
  );

  const onSearch = (e) => {
    e.preventDefault();
    setParams(draft.trim() ? { search: draft.trim() } : {});
  };

  const remove = async (product) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${product.name}"? Existing orders keep their copy of the product details.`)) return;
    setDeleting(product._id);
    try {
      await productApi.remove(product._id);
      toast.success('Product deleted.');
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__head admin-page__head--row">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn btn--primary"><Plus size={18} /> Add product</Link>
      </div>

      <form className="toolbar card" onSubmit={onSearch} role="search">
        <label htmlFor="admin-product-search" className="sr-only">Search products</label>
        <input id="admin-product-search" type="search" placeholder="Search by name, SKU or brand" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="btn btn--dark"><Search size={16} /> Search</button>
      </form>

      {loading && <Spinner label="Loading products..." />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && data.data.length === 0 && <EmptyState title="No products found" message={search ? 'Try another search.' : 'Add your first product or run the seed script.'} />}

      {!loading && !error && data.data.length > 0 && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p._id}>
                  <td className="table__product">
                    <img src={p.image} alt="" />
                    <div>
                      <Link to={`/product/${p.slug}`}>{p.name}</Link>
                      {p.featured && <span className="badge badge--orange">Featured</span>}
                    </div>
                  </td>
                  <td><code>{p.sku}</code></td>
                  <td>{p.category?.name}</td>
                  <td>
                    {formatINR(effectivePrice(p))}
                    {p.discountPrice && <><br /><s className="muted">{formatINR(p.price)}</s></>}
                  </td>
                  <td><span className={`badge ${p.stock === 0 ? 'badge--danger' : p.stock <= 5 ? 'badge--warn' : 'badge--success'}`}>{p.stock}</span></td>
                  <td><Star size={14} className="star star--full" /> {p.rating.toFixed(1)} ({p.numReviews})</td>
                  <td className="table__actions">
                    <Link to={`/admin/products/${p._id}/edit`} className="icon-btn" aria-label={`Edit ${p.name}`}><Pencil size={17} /></Link>
                    <button type="button" className="icon-btn icon-btn--danger" onClick={() => remove(p)} disabled={deleting === p._id} aria-label={`Delete ${p.name}`}>
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        pages={data?.pagination?.pages}
        onChange={(p) => setParams({ ...(search ? { search } : {}), page: String(p) })}
      />
    </div>
  );
}
