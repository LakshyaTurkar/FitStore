import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/Feedback';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../../utils/constants';
import { formatDate, formatINR } from '../../utils/format';

export default function AdminOrdersPage() {
  useDocumentTitle('Manage Orders');
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const status = params.get('status') || '';
  const paymentStatus = params.get('paymentStatus') || '';
  const search = params.get('search') || '';
  const [draft, setDraft] = useState(search);

  const { data, loading, error, reload } = useApi(
    () => adminApi.orders({ page, limit: 15, status: status || undefined, paymentStatus: paymentStatus || undefined, search: search || undefined }),
    [page, status, paymentStatus, search],
  );

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  return (
    <div className="admin-page">
      <div className="admin-page__head"><h1>Orders</h1></div>

      <form
        className="toolbar card"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          update({ search: draft.trim() });
        }}
      >
        <label htmlFor="order-search" className="sr-only">Search orders</label>
        <input id="order-search" type="search" placeholder="Order number, customer name or email" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <label htmlFor="order-status" className="sr-only">Order status</label>
        <select id="order-status" value={status} onChange={(e) => update({ status: e.target.value })}>
          <option value="">All order statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label htmlFor="payment-status" className="sr-only">Payment status</label>
        <select id="payment-status" value={paymentStatus} onChange={(e) => update({ paymentStatus: e.target.value })}>
          <option value="">All payment statuses</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="btn btn--dark"><Search size={16} /> Search</button>
      </form>

      {loading && <Spinner label="Loading orders..." />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && data.data.length === 0 && <EmptyState title="No orders found" message="Try changing the filters." />}

      {!loading && !error && data.data.length > 0 && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.data.map((o) => (
                <tr key={o._id}>
                  <td><Link to={`/admin/orders/${o._id}`}><strong>{o.orderNumber}</strong></Link></td>
                  <td>{formatDate(o.createdAt, true)}</td>
                  <td>{o.user?.name || o.shippingAddress?.fullName}<br /><small className="muted">{o.user?.email}</small></td>
                  <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td>{formatINR(o.totalAmount)}</td>
                  <td><StatusBadge status={o.paymentStatus} /></td>
                  <td><StatusBadge status={o.orderStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={data?.pagination?.pages} onChange={(p) => update({ page: String(p) })} />
    </div>
  );
}
