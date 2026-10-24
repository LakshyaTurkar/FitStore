import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/endpoints';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

const EMPTY_CART = {
  items: [],
  totals: { itemsCount: 0, subtotal: 0, discount: 0, shippingCharge: 0, total: 0 },
  rules: { shippingCharge: 99, freeShippingThreshold: 999 },
  hasStockIssues: false,
};

/**
 * The cart is stored on the server (inside the user's document), so it
 * persists across refreshes and devices. Totals always come from the server.
 */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Id of the user whose cart is loaded - lets pages wait for the first fetch.
  const [loadedFor, setLoadedFor] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await cartApi.get();
      setCart(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refresh().then(() => setLoadedFor(user.id));
    } else {
      setCart(EMPTY_CART);
      setLoadedFor(null);
    }
  }, [user, refresh]);

  const ready = !user || loadedFor === user.id;

  const requireLogin = useCallback(() => {
    toast.info('Please sign in with Google to use the cart.');
    navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
  }, [toast, navigate, location]);

  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!user) {
        requireLogin();
        return false;
      }
      try {
        const res = await cartApi.add(productId, quantity);
        setCart(res.data);
        toast.success(res.message || 'Added to cart.');
        return true;
      } catch (err) {
        toast.error(err.message);
        return false;
      }
    },
    [user, requireLogin, toast],
  );

  const updateQuantity = useCallback(
    async (productId, quantity) => {
      try {
        const res = await cartApi.update(productId, quantity);
        setCart(res.data);
      } catch (err) {
        toast.error(err.message);
      }
    },
    [toast],
  );

  const removeItem = useCallback(
    async (productId) => {
      try {
        const res = await cartApi.remove(productId);
        setCart(res.data);
        toast.info('Item removed from cart.');
      } catch (err) {
        toast.error(err.message);
      }
    },
    [toast],
  );

  const value = useMemo(
    () => ({ cart, loading, ready, error, count: cart.totals.itemsCount, refresh, addToCart, updateQuantity, removeItem }),
    [cart, loading, ready, error, refresh, addToCart, updateQuantity, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
