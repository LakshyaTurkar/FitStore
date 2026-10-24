import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import { orderApi } from '../api/endpoints';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { EmptyState, ErrorState, Spinner } from '../components/Feedback';
import { formatDate, formatINR } from '../utils/format';

export default function MyOrdersPage() {
  useDocumentTitle('My Orders');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi(() => orderApi.mine({ page, limit: 10 }), [page]);

  return (
    <>
      <PageHeader title="My Orders" subtitle="Track your orders and payment status." />
      <div className="container section">
        {loading && <Spinner label="Loading your orders..." />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && data?.data.length === 0 && (
          <EmptyState icon={Package} title="No orders yet" message="When you place an order it will appear here." action={{ to: '/shop', label: 'Start shopping' }} />
        )}
        <ul className="order-list">
          {data?.data.map((o) => (
            <li key={o._id}>
              <Link to={`/orders/${o._id}`} className="order-row card">
                <div className="order-row__thumbs">
                  {o.items.slice(0, 3).map((i) => <img key={String(i.product)} src={i.image} alt="" />)}
                </div>
                <div className="order-row__info">
                  <strong>{o.orderNumber}</strong>
                  <span className="muted">{formatDate(o.createdAt, true)} &middot; {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)</span>
                </div>
                <div className="order-row__status">
                  <StatusBadge status={o.orderStatus} />
                  <StatusBadge status={o.paymentStatus} />
                </div>
                <strong className="order-row__total">{formatINR(o.totalAmount)}</strong>
                <ChevronRight size={20} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
        <Pagination page={page} pages={data?.pagination?.pages} onChange={setPage} />
      </div>
    </>
  );
}
