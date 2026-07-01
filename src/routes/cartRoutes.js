import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validationMiddleware.js';
import { addToCartSchema, updateCartItemSchema } from '../validations/order.schema.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router
  .route('/')
  .get(getCart)                         // GET  /api/v1/cart
  .post(validate(addToCartSchema), addToCart)  // POST /api/v1/cart
  .delete(clearCart);                   // DELETE /api/v1/cart

router
  .route('/:productId')
  .patch(validate(updateCartItemSchema), updateCartItem)  // PATCH /api/v1/cart/:productId
  .delete(removeFromCart);                                // DELETE /api/v1/cart/:productId

export default router;
