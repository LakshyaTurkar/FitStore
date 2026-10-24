import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { loadScript } from '../utils/loadScript';
import { Spinner } from './Feedback';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Renders the official Google Identity Services button. Google returns an
 * ID token ("credential") which we send to our backend for verification.
 */
export default function GoogleSignInButton({ onSuccess }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const buttonRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState(clientId ? 'loading' : 'missing');
  const [signingIn, setSigningIn] = useState(false);

  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;

    loadScript(GSI_SRC).then((ok) => {
      if (cancelled) return;
      if (!ok || !window.google?.accounts?.id) {
        setStatus('error');
        return;
      }
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: async ({ credential }) => {
          setSigningIn(true);
          try {
            const result = await loginWithGoogle(credential);
            toast.success(result.isNewUser ? `Welcome to FitStore, ${result.user.name}!` : `Welcome back, ${result.user.name}!`);
            onSuccessRef.current?.(result.user);
          } catch (err) {
            toast.error(err.message);
          } finally {
            setSigningIn(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        width: 280,
      });
      setStatus('ready');
    });

    return () => {
      cancelled = true;
    };
  }, [clientId, loginWithGoogle, toast]);

  if (status === 'missing') {
    return (
      <div className="alert alert--warn">
        <AlertTriangle size={18} /> Google Sign-In is not configured. Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>client/.env</code> and restart Vite.
      </div>
    );
  }

  return (
    <div className="google-signin">
      {status === 'loading' && <Spinner inline label="Loading Google Sign-In" />}
      {status === 'error' && (
        <div className="alert alert--error">
          <AlertTriangle size={18} /> Could not load Google Sign-In. Check your connection or disable blockers for accounts.google.com.
        </div>
      )}
      <div ref={buttonRef} aria-busy={signingIn} />
      {signingIn && <Spinner inline label="Signing you in" />}
    </div>
  );
}
