import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { loadScript } from '../utils/loadScript';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Opens Razorpay Checkout (TEST MODE) for an order created by the server.
 * Success in the popup is NOT trusted: the response is sent to the backend,
 * which verifies the signature before marking the order as paid.
 */
export default function useRazorpayCheckout() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh: refreshCart } = useCart();
  const [opening, setOpening] = useState(false);

  const openCheckout = useCallback(
    async ({ order, payment }) => {
      const resultUrl = `/orders/${order._id}/result`;
      setOpening(true);
      const loaded = await loadScript(CHECKOUT_SRC);
      setOpening(false);

      if (!loaded || !window.Razorpay) {
        toast.error('Could not load Razorpay Checkout. Check your internet connection and retry from the order page.');
        navigate(resultUrl);
        return;
      }

      let finished = false;
      const rzp = new window.Razorpay({
        key: payment.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: payment.razorpayOrderId,
        amount: payment.amount,
        currency: payment.currency,
        name: payment.name,
        description: payment.description,
        prefill: payment.prefill,
        notes: { orderNumber: order.orderNumber },
        theme: { color: '#ff6a00' },
        handler: async (response) => {
          finished = true;
          try {
            const res = await orderApi.verifyPayment(order._id, response);
            if (res.data.result === 'paid' || res.data.result === 'already-paid') toast.success(res.message);
            else toast.info(res.message);
          } catch (err) {
            toast.error(err.message);
          }
          refreshCart();
          navigate(resultUrl, { replace: true });
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            if (finished) return;
            toast.info('Payment not completed. You can retry from the order page.');
            navigate(resultUrl, { replace: true });
          },
        },
      });

      // The popup stays open after a failure so the customer can try another method.
      rzp.on('payment.failed', async (response) => {
        const paymentId = response?.error?.metadata?.payment_id;
        toast.error(response?.error?.description || 'Payment failed. You can try again.');
        if (paymentId) {
          try {
            await orderApi.reportFailure(order._id, paymentId);
          } catch {
            /* status is re-checked on the order page */
          }
        }
      });

      rzp.open();
    },
    [navigate, toast, refreshCart],
  );

  return { openCheckout, opening };
}
