import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Save, User } from 'lucide-react';
import { adminApi, orderApi } from '../../api/endpoints';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';
import OrderView from '../../components/OrderView';
import FormField from '../../components/FormField';
import { ErrorState, Spinner } from '../../components/Feedback';

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const { data: order, loading, error, reload, setData } = useApi(() => orderApi.get(id).then((r) => r.data), [id]);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  useDocumentTitle(order ? `Admin - ${order.orderNumber}` : 'Order');

  useEffect(() => {
    setStatus(order?.allowedNextStatuses?.[0] || '');
  }, [order]);

  const submit = async (e) => {
    e.preventDefault();
    if (!status) return;
    if (status === 'Cancelled') {
      // eslint-disable-next-line no-alert
      if (!window.confirm('Cancel this order? Stock will be restored and a paid order will be marked as refunded (simulated).')) return;
    }
    setSaving(true);
    try {
      const res = await adminApi.updateStatus(order._id, status, note);
      setData(res.data);
      setNote('');
      toast.success(`${res.message} The customer has been notified by email.`);
    } catch (err) {
      toast.error(err.message);
      reload();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading order..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="admin-page">
      <div className="admin-page__head admin-page__head--row">
        <h1>Order {order.orderNumber}</h1>
        <Link to="/admin/orders" className="btn btn--ghost">&larr; All orders</Link>
      </div>
      <OrderView order={order}>
        <div className="admin-customer">
          <User size={18} />
          <div>
            <strong>{order.user?.name}</strong>
            <br />
            <small className="muted">{order.user?.email}</small>
          </div>
        </div>
        {order.allowedNextStatuses?.length > 0 ? (
          <form onSubmit={submit} className="status-form">
            <FormField id="next-status" label="Update order status">
              <select id="next-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {order.allowedNextStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField id="status-note" label="Note (optional, shown in timeline)">
              <input id="status-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
            </FormField>
            <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
              <Save size={18} /> {saving ? 'Updating...' : 'Update status'}
            </button>
            {order.orderStatus === 'Pending Payment' && (
              <small className="muted">Orders are confirmed automatically after a verified payment. Admins can only cancel unpaid orders.</small>
            )}
          </form>
        ) : (
          <p className="muted">No further status changes are possible for this order.</p>
        )}
      </OrderView>
    </div>
  );
}
