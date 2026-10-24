import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EmptyState, Spinner } from '../components/Feedback';

/**
 * Hides admin screens from non-admins. This is NOT the security boundary:
 * every /admin API request is checked for the admin role on the server.
 */
export default function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking your session..." />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) {
    return (
      <div className="container section">
        <EmptyState icon={ShieldAlert} title="403 - Admins only" message="Your account does not have admin access." action={{ to: '/', label: 'Back to store' }} />
      </div>
    );
  }
  return <Outlet />;
}
