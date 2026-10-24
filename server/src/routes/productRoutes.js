import { Router } from 'express';
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from '../controllers/productController.js';
import { createReview, listReviews } from '../controllers/reviewController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', listProducts);
router.post('/', requireAuth, requireAdmin, createProduct);

router.get('/:id/reviews', listReviews);
router.post('/:id/reviews', requireAuth, createReview);

router.get('/:idOrSlug', getProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
