import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, LogIn, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import PageHeader from '../components/PageHeader';
import QuantitySelector from '../components/QuantitySelector';
import OrderSummary from '../components/OrderSummary';
import { EmptyState, ErrorState, Spinner } from '../components/Feedback';
import { MAX_QTY_PER_ITEM } from '../utils/constants';
import { formatINR } from '../utils/format';

export default function CartPage() {
  useDocumentTitle('Cart');
  const { user, loading: authLoading } = useAuth();
  const { cart, loading, ready, error, refresh, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (authLoading) return <Spinner label="Loading..." />;

  if (!user) {
    return (
      <>
        <PageHeader title="Your Cart" />
        <div className="container section">
          <EmptyState icon={LogIn} title="Sign in to view your cart" message="Your cart is saved to your account so it is available on every device." action={{ to: '/login?redirect=/cart', label: 'Sign in with Google' }} />
        </div>
      </>
    );
  }

  const { items, totals, rules, hasStockIssues } = cart;
  const amountAfterDiscount = totals.subtotal - totals.discount;
  const remainingForFree = rules.freeShippingThreshold - amountAfterDiscount;

  return (
    <>
      <PageHeader title="Your Cart" subtitle={items.length ? `${totals.itemsCount} item${totals.itemsCount === 1 ? '' : 's'} in your cart` : undefined} />
      <div className="container section">
        {!ready && <Spinner label="Loading your cart..." />}
        {error && <ErrorState message={error} onRetry={refresh} />}
        {ready && !error && !items.length && (
          <EmptyState icon={ShoppingBag} title="Your cart is empty" message="Find something you love in our store." action={{ to: '/shop', label: 'Start shopping' }} />
        )}

        {items.length > 0 && (
          <div className="two-col">
            <div className="cart-list">
              {remainingForFree > 0 ? (
                <div className="alert alert--info">
                  <Truck size={18} /> Add {formatINR(remainingForFree)} more to get <strong>free shipping</strong> (orders above {formatINR(rules.freeShippingThreshold)}).
                </div>
              ) : (
                <div className="alert alert--success">
                  <Truck size={18} /> You have unlocked <strong>free shipping</strong>!
                </div>
              )}
              {hasStockIssues && (
                <div className="alert alert--error" role="alert">
                  <AlertTriangle size={18} /> Some items exceed available stock. Please adjust them before checkout.
                </div>
              )}

              {items.map((item) => (
                <article key={item.product._id} className="cart-item card">
                  <Link to={`/product/${item.product.slug}`} className="cart-item__img">
                    <img src={item.product.image} alt={item.product.name} />
                  </Link>
                  <div className="cart-item__info">
                    <Link to={`/product/${item.product.slug}`} className="cart-item__name">{item.product.name}</Link>
                    <span className="cart-item__unit">
                      {formatINR(item.unitPrice)} each
                      {item.unitPrice < item.product.price && <s> {formatINR(item.product.price)}</s>}
                    </span>
                    {item.stockIssue && <span className="badge badge--danger">{item.stockIssue}</span>}
                    <div className="cart-item__actions">
                      <QuantitySelector
                        value={item.quantity}
                        max={Math.max(1, Math.min(item.product.stock, MAX_QTY_PER_ITEM))}
                        onChange={(q) => updateQuantity(item.product._id, q)}
                        disabled={loading || item.product.stock === 0}
                      />
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeItem(item.product._id)} aria-label={`Remove ${item.product.name}`}>
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </div>
                  <strong className="cart-item__total">{formatINR(item.lineTotal)}</strong>
                </article>
              ))}
            </div>

            <OrderSummary totals={totals}>
              <p className="summary__note">
                Shipping: {formatINR(rules.shippingCharge)} per order, FREE above {formatINR(rules.freeShippingThreshold)}. Totals are calculated by the server.
              </p>
              <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => navigate('/checkout')} disabled={hasStockIssues || loading}>
                Proceed to checkout <ArrowRight size={18} />
              </button>
              <Link to="/shop" className="btn btn--ghost btn--block">Continue shopping</Link>
            </OrderSummary>
          </div>
        )}
      </div>
    </>
  );
}
