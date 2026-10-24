import { Router } from 'express';
import { addItem, clearCart, getCart, removeItem, updateItem } from '../controllers/cartController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getCart);
router.delete('/', clearCart);
router.post('/items', addItem);
router.patch('/items/:productId', updateItem);
router.delete('/items/:productId', removeItem);

export default router;
