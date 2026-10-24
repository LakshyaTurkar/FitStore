import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

/**
 * Holds the signed-in user. The session itself lives in an HttpOnly cookie
 * that JavaScript cannot read - we only keep the public profile in state.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Any 401 from the API (expired/invalid session) signs the user out locally.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('fitstore:unauthorized', onUnauthorized);
    return () => window.removeEventListener('fitstore:unauthorized', onUnauthorized);
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const res = await authApi.google(credential);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      window.google?.accounts?.id?.disableAutoSelect();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', loginWithGoogle, logout }),
    [user, loading, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
