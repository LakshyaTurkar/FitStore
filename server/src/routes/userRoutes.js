import { Router } from 'express';
import { addAddress, deleteAddress, listAddresses } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/addresses', listAddresses);
router.post('/addresses', addAddress);
router.delete('/addresses/:addressId', deleteAddress);

export default router;
