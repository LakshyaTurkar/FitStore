import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, RotateCcw, ShieldCheck, ShoppingCart, Truck, XCircle, Zap } from 'lucide-react';
import { productApi, storeApi } from '../api/endpoints';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useCart } from '../context/CartContext';
import PriceTag from '../components/PriceTag';
import RatingStars from '../components/RatingStars';
import QuantitySelector from '../components/QuantitySelector';
import ProductGrid from '../components/ProductGrid';
import ReviewSection from '../components/ReviewSection';
import { EmptyState, ErrorState, Spinner } from '../components/Feedback';
import { MAX_QTY_PER_ITEM } from '../utils/constants';
import { formatINR } from '../utils/format';

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload, setData } = useApi(() => productApi.get(slug).then((r) => r.data), [slug]);
  const config = useApi(() => storeApi.config().then((r) => r.data), []);
  const product = data?.product;
  useDocumentTitle(product?.name || 'Product');

  if (loading) return <Spinner label="Loading product..." />;
  if (error) {
    return (
      <div className="container section">
        {/404|not found/i.test(error) ? (
          <EmptyState title="Product not found" message="It may have been removed or the link is incorrect." action={{ to: '/shop', label: 'Back to shop' }} />
        ) : (
          <ErrorState message={error} onRetry={reload} />
        )}
      </div>
    );
  }

  const outOfStock = product.stock === 0;
  const maxQty = Math.min(product.stock, MAX_QTY_PER_ITEM);

  const add = async (goToCart) => {
    setBusy(true);
    const ok = await addToCart(product._id, qty);
    setBusy(false);
    if (ok && goToCart) navigate('/cart');
  };

  return (
    <div className="container section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link> <ChevronRight size={14} />
        <Link to={`/category/${product.category.slug}`}>{product.category.name}</Link> <ChevronRight size={14} />
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp__media">
          <img src={product.image.replace('w=800', 'w=1200')} alt={product.name} />
        </div>

        <div className="pdp__info">
          <span className="product-card__category">{product.brand} &middot; {product.category.name}</span>
          <h1>{product.name}</h1>
          <a href="#reviews-title" className="pdp__rating">
            <RatingStars rating={product.rating} count={product.numReviews} size={18} />
          </a>
          <PriceTag product={product} large />
          <p className="pdp__tax">Inclusive of all taxes</p>

          <p className={`stock ${outOfStock ? 'stock--out' : product.stock <= 5 ? 'stock--low' : 'stock--in'}`}>
            {outOfStock ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            {outOfStock ? 'Out of stock' : product.stock <= 5 ? `Hurry - only ${product.stock} left` : 'In stock'}
          </p>

          {!outOfStock && (
            <div className="pdp__buy">
              <QuantitySelector value={qty} max={maxQty} onChange={setQty} />
              <button type="button" className="btn btn--dark btn--lg" onClick={() => add(false)} disabled={busy}>
                <ShoppingCart size={18} /> Add to cart
              </button>
              <button type="button" className="btn btn--primary btn--lg" onClick={() => add(true)} disabled={busy}>
                <Zap size={18} /> Buy now
              </button>
            </div>
          )}

          <ul className="pdp__perks">
            <li><Truck size={18} /> Free shipping above {formatINR(config.data?.freeShippingThreshold ?? 999)}</li>
            <li><RotateCcw size={18} /> 7-day easy returns on unused items</li>
            <li><ShieldCheck size={18} /> Secure Razorpay checkout (test mode)</li>
          </ul>

          <div className="pdp__desc">
            <h2>Description</h2>
            <p>{product.description}</p>
            <dl className="pdp__specs">
              <div><dt>SKU</dt><dd>{product.sku}</dd></div>
              <div><dt>Brand</dt><dd>{product.brand}</dd></div>
              <div><dt>Category</dt><dd>{product.category.name}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <ReviewSection
        product={product}
        onReviewAdded={() => productApi.get(slug).then((r) => setData(r.data)).catch(() => {})}
      />

      {data.related.length > 0 && (
        <section className="section">
          <div className="section__head"><h2>You may also like</h2></div>
          <ProductGrid products={data.related} />
        </section>
      )}
    </div>
  );
}
