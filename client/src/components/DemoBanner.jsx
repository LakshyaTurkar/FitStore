import { FlaskConical } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div className="demo-banner" role="note">
      <FlaskConical size={14} aria-hidden="true" />
      <span>
        <strong>Demo store:</strong> college project - payments run in Razorpay <strong>test mode</strong>. No real money is charged.
      </span>
    </div>
  );
}
