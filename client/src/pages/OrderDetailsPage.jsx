import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CreditCard, RefreshCw, XCircle } from 'lucide-react';
import { orderApi } from '../api/endpoints';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useRazorpayCheckout from '../hooks/useRazorpayCheckout';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import OrderView from '../components/OrderView';
import { EmptyState, ErrorState, Spinner } from '../components/Feedback';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const toast = useToast();
  const { openCheckout, opening } = useRazorpayCheckout();
  const [busy, setBusy] = useState(false);
  const { data: order, loading, error, reload, setData } = useApi(() => orderApi.get(id).then((r) => r.data), [id]);
  useDocumentTitle(order ? `Order ${order.orderNumber}` : 'Order');

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

  const cancel = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setBusy(true);
    try {
      const res = await orderApi.cancel(order._id);
      setData(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading order..." />;
  if (error) {
    return (
      <div className="container section">
        {/not found/i.test(error) ? (
          <EmptyState title="Order not found" message="This order does not exist or does not belong to your account." action={{ to: '/orders', label: 'My orders' }} />
        ) : (
          <ErrorState message={error} onRetry={reload} />
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Order Details">
        <Link to="/orders" className="link-arrow">&larr; All orders</Link>
      </PageHeader>
      <div className="container section">
        <OrderView order={order}>
          {order.canRetryPayment && (
            <>
              <p className="alert alert--warn">
                {order.paymentStatus === 'Failed' ? 'Your last payment attempt failed.' : 'Payment for this order is pending.'} You can retry the (test) payment below.
              </p>
              <button type="button" className="btn btn--primary btn--block" onClick={retry} disabled={busy || opening}>
                <CreditCard size={18} /> Retry payment
              </button>
            </>
          )}
          <button type="button" className="btn btn--outline btn--block" onClick={reload} disabled={busy}>
            <RefreshCw size={16} /> Refresh status
          </button>
          {order.canCancel && (
            <button type="button" className="btn btn--danger-ghost btn--block" onClick={cancel} disabled={busy}>
              <XCircle size={18} /> Cancel order
            </button>
          )}
        </OrderView>
      </div>
    </>
  );
}
