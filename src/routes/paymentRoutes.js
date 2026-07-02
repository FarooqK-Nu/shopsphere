import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createCheckoutSession } from '../controllers/paymentController.js';

const router = express.Router();

// Checkout session creation requires login
router.post('/checkout-session/:orderId', protect, createCheckoutSession);

export default router;
