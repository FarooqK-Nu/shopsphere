import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validationMiddleware.js';
import { wishlistProductSchema } from '../validations/order.schema.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart
} from '../controllers/wishlistController.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

router.get('/', getWishlist);                                                        // GET /api/v1/wishlist

router.post(
  '/:productId',
  validate(wishlistProductSchema),
  addToWishlist
);                                                                                   // POST /api/v1/wishlist/:productId

router.delete(
  '/:productId',
  validate(wishlistProductSchema),
  removeFromWishlist
);                                                                                   // DELETE /api/v1/wishlist/:productId

router.post(
  '/:productId/move-to-cart',
  validate(wishlistProductSchema),
  moveToCart
);                                                                                   // POST /api/v1/wishlist/:productId/move-to-cart

export default router;
