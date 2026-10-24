import { Link } from 'react-router-dom';
import { AlertTriangle, Boxes, IndianRupee, ShoppingBag, Users } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import StatusBadge from '../../components/StatusBadge';
import { ErrorState, Spinner } from '../../components/Feedback';
import { formatDate, formatINR } from '../../utils/format';
import { ORDER_STATUSES } from '../../utils/constants';

export default function AdminDashboardPage() {
  useDocumentTitle('Admin Dashboard');
  const { data, loading, error, reload } = useApi(() => adminApi.dashboard().then((r) => r.data), []);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const cards = [
    { label: 'Paid revenue', value: formatINR(data.revenue), icon: IndianRupee, hint: `${data.paidOrders} verified paid orders` },
    { label: 'Total orders', value: data.totalOrders, icon: ShoppingBag, hint: 'All statuses' },
    { label: 'Products', value: data.totalProducts, icon: Boxes, hint: `${data.lowStock.length} low on stock` },
    { label: 'Registered users', value: data.totalUsers, icon: Users, hint: 'Signed in with Google' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1>Dashboard</h1>
        <p className="muted">Revenue counts only orders whose payment was verified by the server (test mode).</p>
      </div>

      <div className="stat-grid">
        {cards.map(({ label, value, icon: Icon, hint }) => (
          <div key={label} className="stat card">
            <Icon size={24} aria-hidden="true" />
            <span className="stat__label">{label}</span>
            <strong className="stat__value">{value}</strong>
            <small className="muted">{hint}</small>
          </div>
        ))}
      </div>

      <section className="card">
        <h2>Orders by status</h2>
        <div className="status-chips">
          {ORDER_STATUSES.map((s) => (
            <Link key={s} to={`/admin/orders?status=${encodeURIComponent(s)}`} className="status-chip">
              <StatusBadge status={s} /> <strong>{data.ordersByStatus[s] || 0}</strong>
            </Link>
          ))}
        </div>
      </section>

      <div className="admin-grid">
        <section className="card">
          <div className="section__head">
            <h2>Recent orders</h2>
            <Link to="/admin/orders" className="link-arrow">View all</Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="muted">No orders yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td><Link to={`/admin/orders/${o._id}`}>{o.orderNumber}</Link><br /><small className="muted">{formatDate(o.createdAt)}</small></td>
                      <td>{o.user?.name || '-'}</td>
                      <td>{formatINR(o.totalAmount)}</td>
                      <td><StatusBadge status={o.paymentStatus} /></td>
                      <td><StatusBadge status={o.orderStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2><AlertTriangle size={18} /> Low stock (5 or fewer)</h2>
          {data.lowStock.length === 0 ? (
            <p className="muted">All products are well stocked.</p>
          ) : (
            <ul className="low-stock">
              {data.lowStock.map((p) => (
                <li key={p._id}>
                  <img src={p.image} alt="" />
                  <Link to={`/admin/products/${p._id}/edit`}>{p.name}</Link>
                  <span className={`badge ${p.stock === 0 ? 'badge--danger' : 'badge--warn'}`}>{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
