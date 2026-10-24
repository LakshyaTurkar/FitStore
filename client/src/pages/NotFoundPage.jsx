import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="container section">
      <div className="not-found">
        <span className="not-found__code">404</span>
        <Compass size={48} aria-hidden="true" />
        <h1>This page skipped leg day</h1>
        <p>The page you are looking for does not exist or has moved.</p>
        <div className="hero__actions">
          <Link to="/" className="btn btn--primary">Go home</Link>
          <Link to="/shop" className="btn btn--outline">Browse products</Link>
        </div>
      </div>
    </div>
  );
}
