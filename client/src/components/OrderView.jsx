import { Link } from 'react-router-dom';
import { CircleDot, CreditCard, MapPin, Truck } from 'lucide-react';
import StatusBadge from './StatusBadge';
import OrderSummary from './OrderSummary';
import { formatDate, formatINR } from '../utils/format';

/** Read-only order details shared by the customer and admin pages. */
export default function OrderView({ order, children }) {
  const a = order.shippingAddress;
  return (
    <div className="two-col">
      <div className="order-view">
        <section className="card">
          <div className="order-view__head">
            <div>
              <h2>Order {order.orderNumber}</h2>
              <span className="muted">Placed on {formatDate(order.createdAt, true)}</span>
            </div>
            <div className="order-row__status">
              <StatusBadge status={order.orderStatus} />
              <StatusBadge status={order.paymentStatus} />
            </div>
          </div>
          <ul className="order-items">
            {order.items.map((item) => (
              <li key={String(item.product)}>
                <img src={item.image} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <span className="muted">SKU {item.sku} &middot; {formatINR(item.unitPrice)} &times; {item.quantity}</span>
                </div>
                <strong>{formatINR(item.lineTotal)}</strong>
              </li>
            ))}
          </ul>
        </section>

        <div className="order-view__grid">
          <section className="card">
            <h3><MapPin size={18} /> Delivery address</h3>
            <p>
              <strong>{a.fullName}</strong><br />
              {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
              {a.city}, {a.state} - {a.pincode}<br />
              Phone: {a.phone}<br />
              {a.email}
            </p>
          </section>
          <section className="card">
            <h3><CreditCard size={18} /> Payment</h3>
            <dl className="kv">
              <div><dt>Method</dt><dd>{order.paymentMethod}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge status={order.paymentStatus} /></dd></div>
              {order.razorpayPaymentId && <div><dt>Payment ID</dt><dd><code>{order.razorpayPaymentId}</code></dd></div>}
              {order.paymentVerifiedAt && <div><dt>Verified</dt><dd>{formatDate(order.paymentVerifiedAt, true)}</dd></div>}
              {order.paymentFailureReason && order.paymentStatus === 'Failed' && <div><dt>Last error</dt><dd>{order.paymentFailureReason}</dd></div>}
            </dl>
            {order.refundNote && <p className="alert alert--info">{order.refundNote}</p>}
          </section>
        </div>

        {order.demoTrackingNumber && (
          <section className="card">
            <h3><Truck size={18} /> Shipment tracking <span className="badge badge--muted">Demo</span></h3>
            <p>
              Tracking number: <code>{order.demoTrackingNumber}</code>
              <br />
              <small className="muted">Simulated for demonstration - not linked to a real courier.</small>
            </p>
          </section>
        )}

        <section className="card">
          <h3>Order timeline</h3>
          <ol className="timeline">
            {[...order.statusHistory].reverse().map((h, idx) => (
              <li key={`${h.at}-${idx}`}>
                <CircleDot size={16} aria-hidden="true" />
                <div>
                  <strong>{h.status}</strong>
                  {h.note && <span> - {h.note}</span>}
                  <small className="muted"> {formatDate(h.at, true)} &middot; by {h.changedBy}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <OrderSummary totals={{ subtotal: order.subtotal, discount: order.discount, shippingCharge: order.shippingCharge, total: order.totalAmount }} title="Payment Summary">
        {children}
        <Link to="/shop" className="btn btn--ghost btn--block">Continue shopping</Link>
      </OrderSummary>
    </div>
  );
}
