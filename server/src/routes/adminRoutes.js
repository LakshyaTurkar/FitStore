import { Router } from 'express';
import { dashboard, listOrders, updateOrderStatus } from '../controllers/adminController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

// Every admin route checks the JWT AND the admin role stored in the database.
router.use(requireAuth, requireAdmin);
router.get('/dashboard', dashboard);
router.get('/orders', listOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
