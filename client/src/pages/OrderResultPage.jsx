import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, RefreshCw, XCircle } from 'lucide-react';
import { orderApi } from '../api/endpoints';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useRazorpayCheckout from '../hooks/useRazorpayCheckout';
import { useToast } from '../context/ToastContext';
import { ErrorState, Spinner } from '../components/Feedback';
import { formatINR } from '../utils/format';

/** Shown after Razorpay closes. The status comes from the server, never from the popup. */
export default function OrderResultPage() {
  const { id } = useParams();
  const toast = useToast();
  const { openCheckout, opening } = useRazorpayCheckout();
  const [busy, setBusy] = useState(false);
  const { data: order, loading, error, reload } = useApi(() => orderApi.get(id).then((r) => r.data), [id]);
  useDocumentTitle('Payment status');

  const retry = async () => {
    setBusy(true);
    try {
      const res = await orderApi.retryPayment(order._id);
      await openCheckout(res.data);
    } catch (err) {
      toast.error(err.message);
      reload();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Checking payment status..." />;
  if (error) return <div className="container section"><ErrorState message={error} onRetry={reload} /></div>;

  const paid = order.paymentStatus === 'Paid';
  const failed = order.paymentStatus === 'Failed';
  const cancelled = order.orderStatus === 'Cancelled';

  let tone = 'warn';
  let Icon = Clock;
  let title = 'Payment pending';
  let text = 'We have not received a verified payment for this order yet. If you closed the payment window, you can retry below.';
  if (paid) {
    tone = 'success';
    Icon = CheckCircle2;
    title = 'Payment successful!';
    text = 'Your payment was verified by our server and your order is confirmed. A confirmation email is on its way.';
  } else if (cancelled) {
    tone = 'danger';
    Icon = XCircle;
    title = 'Order cancelled';
    text = order.cancellationReason || 'This order has been cancelled.';
  } else if (failed) {
    tone = 'danger';
    Icon = AlertTriangle;
    title = 'Payment failed';
    text = `${order.paymentFailureReason ? `${order.paymentFailureReason}. ` : ''}No money was charged. You can try again.`;
  }

  return (
    <div className="container section">
      <div className={`result card result--${tone}`}>
        <Icon size={56} aria-hidden="true" />
        <h1>{title}</h1>
        <p>{text}</p>
        {order.refundNote && <p className="alert alert--info">{order.refundNote}</p>}

        <dl className="kv result__kv">
          <div><dt>Order number</dt><dd><strong>{order.orderNumber}</strong></dd></div>
          <div><dt>Amount</dt><dd>{formatINR(order.totalAmount)}</dd></div>
          <div><dt>Payment status</dt><dd>{order.paymentStatus}</dd></div>
          <div><dt>Order status</dt><dd>{order.orderStatus}</dd></div>
          {order.razorpayPaymentId && <div><dt>Payment ID</dt><dd><code>{order.razorpayPaymentId}</code></dd></div>}
        </dl>

        <div className="result__actions">
          {order.canRetryPayment && (
            <button type="button" className="btn btn--primary" onClick={retry} disabled={busy || opening}>
              <CreditCard size={18} /> Retry payment
            </button>
          )}
          {!paid && !cancelled && (
            <button type="button" className="btn btn--outline" onClick={reload}>
              <RefreshCw size={16} /> Refresh status
            </button>
          )}
          <Link to={`/orders/${order._id}`} className="btn btn--dark">View order details</Link>
          <Link to="/shop" className="btn btn--ghost">Continue shopping</Link>
        </div>
        <small className="muted">Demo store - Razorpay test mode. No real money was charged.</small>
      </div>
    </div>
  );
}
