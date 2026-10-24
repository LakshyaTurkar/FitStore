import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import GoogleSignInButton from '../components/GoogleSignInButton';
import Logo from '../components/Logo';
import { Spinner } from '../components/Feedback';

/**
 * Only allow same-site paths like "/cart" (prevents open-redirect attacks).
 * Rejects "//evil.com", "/\\evil.com" and anything with a scheme.
 */
const safeRedirect = (value) => (value && /^\/(?![/\\])[^\\]*$/.test(value) ? value : '/');

export default function LoginPage() {
  useDocumentTitle('Sign in');
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const redirect = safeRedirect(params.get('redirect'));

  if (loading) return <Spinner label="Checking your session..." />;
  if (user) return <Navigate to={redirect === '/login' ? '/' : redirect} replace />;

  return (
    <div className="container section">
      <div className="login card">
        <Logo />
        <h1>Sign in to FitStore</h1>
        <p>Use your Google account to sign in or create a FitStore account. We never see or store your Google password.</p>
        <GoogleSignInButton onSuccess={() => navigate(redirect, { replace: true })} />
        <ul className="login__points">
          <li><ShieldCheck size={16} /> Your Google sign-in is verified by our server</li>
          <li><Lock size={16} /> Session stored in a secure HttpOnly cookie</li>
        </ul>
        <small>By continuing you agree to our Terms &amp; Conditions and Privacy Policy.</small>
      </div>
    </div>
  );
}
