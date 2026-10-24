const TONES = {
  Paid: 'success',
  Delivered: 'success',
  Confirmed: 'success',
  Processing: 'info',
  Shipped: 'info',
  Pending: 'warn',
  'Pending Payment': 'warn',
  Failed: 'danger',
  Cancelled: 'danger',
  Refunded: 'neutral',
};

export default function StatusBadge({ status }) {
  return <span className={`status status--${TONES[status] || 'neutral'}`}>{status}</span>;
}
