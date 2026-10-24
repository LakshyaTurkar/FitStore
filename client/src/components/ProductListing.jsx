import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { productApi, storeApi } from '../api/endpoints';
import useApi from '../hooks/useApi';
import ProductGrid, { ProductGridSkeleton } from './ProductGrid';
import Pagination from './Pagination';
import { EmptyState, ErrorState } from './Feedback';
import { SORT_OPTIONS } from '../utils/constants';

/**
 * Shared listing used by the Shop, Category and Search pages.
 * All filters live in the URL so results are shareable and survive refresh.
 */
export default function ProductListing({ fixedCategory, searchMode = false }) {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const search = params.get('q') || '';
  const category = fixedCategory || params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const inStock = params.get('inStock') === 'true';
  const page = Number(params.get('page')) || 1;

  const [priceDraft, setPriceDraft] = useState({ min: minPrice, max: maxPrice });
  const [searchDraft, setSearchDraft] = useState(search);
  useEffect(() => setPriceDraft({ min: minPrice, max: maxPrice }), [minPrice, maxPrice]);
  useEffect(() => setSearchDraft(search), [search]);

  const categories = useApi(() => storeApi.categories().then((r) => r.data), []);
  const products = useApi(
    () =>
      productApi.list({
        search: search || undefined,
        category: category || undefined,
        sort,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        inStock: inStock || undefined,
        page,
        limit: 12,
      }),
    [search, category, sort, minPrice, maxPrice, inStock, page],
  );

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === '' || v === undefined || v === false ? next.delete(k) : next.set(k, v)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const applyPrice = (e) => {
    e.preventDefault();
    update({ minPrice: priceDraft.min, maxPrice: priceDraft.max });
  };

  const clearAll = () => setParams(searchMode && search ? { q: search } : {});
  const hasFilters = Boolean(minPrice || maxPrice || inStock || (!fixedCategory && category));
  const pagination = products.data?.pagination;

  return (
    <div className="container listing">
      <aside className={`filters card ${showFilters ? 'is-open' : ''}`} aria-label="Filters">
        <div className="filters__head">
          <h2>Filters</h2>
          <button type="button" className="icon-btn filters__close" onClick={() => setShowFilters(false)} aria-label="Close filters">
            <X size={20} />
          </button>
        </div>

        {searchMode && (
          <form
            className="filters__group"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: searchDraft.trim() });
            }}
          >
            <label htmlFor="search-page-input" className="filters__label">Search</label>
            <div className="inline-form">
              <input id="search-page-input" type="search" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder="e.g. protein, shoes" />
              <button type="submit" className="btn btn--dark btn--sm">Go</button>
            </div>
          </form>
        )}

        {!fixedCategory && (
          <div className="filters__group">
            <span className="filters__label">Category</span>
            <ul className="filters__list">
              <li>
                <button type="button" className={!category ? 'is-active' : ''} onClick={() => update({ category: '' })}>All categories</button>
              </li>
              {categories.data?.map((c) => (
                <li key={c._id}>
                  <button type="button" className={category === c.slug ? 'is-active' : ''} onClick={() => update({ category: c.slug })}>
                    {c.name} <span>({c.productCount})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form className="filters__group" onSubmit={applyPrice}>
          <span className="filters__label">Price (INR)</span>
          <div className="price-range">
            <label className="sr-only" htmlFor="min-price">Minimum price</label>
            <input id="min-price" type="number" min="0" placeholder="Min" value={priceDraft.min} onChange={(e) => setPriceDraft((d) => ({ ...d, min: e.target.value }))} />
            <span aria-hidden="true">-</span>
            <label className="sr-only" htmlFor="max-price">Maximum price</label>
            <input id="max-price" type="number" min="0" placeholder="Max" value={priceDraft.max} onChange={(e) => setPriceDraft((d) => ({ ...d, max: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn--outline btn--sm btn--block">Apply price</button>
        </form>

        <div className="filters__group">
          <label className="checkbox">
            <input type="checkbox" checked={inStock} onChange={(e) => update({ inStock: e.target.checked ? 'true' : '' })} />
            In stock only
          </label>
        </div>

        {hasFilters && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={clearAll}>
            Clear filters
          </button>
        )}
      </aside>

      <section className="listing__main">
        <div className="listing__toolbar">
          <p className="listing__count">
            {products.loading ? 'Loading products...' : `${pagination?.total ?? 0} product${pagination?.total === 1 ? '' : 's'}${search ? ` for "${search}"` : ''}`}
          </p>
          <div className="listing__controls">
            <button type="button" className="btn btn--outline btn--sm filters__toggle" onClick={() => setShowFilters(true)}>
              <SlidersHorizontal size={16} /> Filters
            </button>
            <label htmlFor="sort" className="sr-only">Sort by</label>
            <select id="sort" value={sort} onChange={(e) => update({ sort: e.target.value })}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {products.loading && <ProductGridSkeleton count={8} />}
        {!products.loading && products.error && <ErrorState message={products.error} onRetry={products.reload} />}
        {!products.loading && !products.error && products.data?.data.length === 0 && (
          <EmptyState
            icon={SearchX}
            title={searchMode && !search ? 'Search FitStore' : 'No products found'}
            message={searchMode && !search ? 'Type a product name, brand or keyword above.' : 'Try a different keyword or remove some filters.'}
            action={{ to: '/shop', label: 'Browse all products' }}
          />
        )}
        {!products.loading && !products.error && products.data?.data.length > 0 && (
          <>
            <ProductGrid products={products.data.data} />
            <Pagination page={page} pages={pagination?.pages} onChange={(p) => update({ page: String(p) })} />
          </>
        )}
        {fixedCategory && (
          <p className="listing__back">
            <Link to="/categories">&larr; All categories</Link>
          </p>
        )}
      </section>
    </div>
  );
}
