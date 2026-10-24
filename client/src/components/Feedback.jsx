import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2, PackageOpen } from 'lucide-react';

export function Spinner({ label = 'Loading...', inline = false }) {
  return (
    <div className={inline ? 'spinner spinner--inline' : 'spinner'} role="status">
      <Loader2 className="spin" size={inline ? 18 : 32} aria-hidden="true" />
      <span className={inline ? 'sr-only' : ''}>{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = PackageOpen, title, message, action }) {
  return (
    <div className="state-box">
      <Icon size={44} aria-hidden="true" />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && (
        <Link to={action.to} className="btn btn--primary">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state-box state-box--error" role="alert">
      <AlertTriangle size={44} aria-hidden="true" />
      <h3>We couldn&apos;t load this</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
