import { Router } from 'express';
import {
  cancelOrder,
  checkout,
  getOrder,
  myOrders,
  reportPaymentFailure,
  retryPayment,
  verifyPayment,
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.use(requireAuth);
router.post('/checkout', paymentLimiter, checkout);
router.get('/my', myOrders);
router.get('/:id', getOrder);
router.post('/:id/verify-payment', paymentLimiter, verifyPayment);
router.post('/:id/payment-failed', paymentLimiter, reportPaymentFailure);
router.post('/:id/retry-payment', paymentLimiter, retryPayment);
router.post('/:id/cancel', cancelOrder);

export default router;
