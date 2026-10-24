import { formatINR } from '../utils/format';

/** Shows totals that were calculated by the SERVER. */
export default function OrderSummary({ totals, children, title = 'Order Summary' }) {
  return (
    <aside className="summary card">
      <h2>{title}</h2>
      <dl>
        <div><dt>Subtotal (MRP)</dt><dd>{formatINR(totals.subtotal)}</dd></div>
        {totals.discount > 0 && (
          <div className="summary__discount"><dt>Discount</dt><dd>- {formatINR(totals.discount)}</dd></div>
        )}
        <div><dt>Shipping</dt><dd>{totals.shippingCharge ? formatINR(totals.shippingCharge) : 'FREE'}</dd></div>
        <div className="summary__total"><dt>Total</dt><dd>{formatINR(totals.total ?? totals.totalAmount)}</dd></div>
      </dl>
      {children}
    </aside>
  );
}
