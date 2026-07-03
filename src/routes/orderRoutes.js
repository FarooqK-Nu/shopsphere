import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';
import validate from '../middleware/validationMiddleware.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validations/order.schema.js';
import {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} from '../controllers/orderController.js';

const router = express.Router();

// All order routes require authentication
router.use(protect);

// Customer routes
router.post('/', validate(createOrderSchema), createOrder);          // POST   /api/v1/orders
router.get('/my-orders', getMyOrders);                              // GET    /api/v1/orders/my-orders
router.get('/:id', getOrder);                                       // GET    /api/v1/orders/:id
router.patch('/:id/cancel', cancelOrder);                           // PATCH  /api/v1/orders/:id/cancel

// Admin routes
router.get('/', restrictTo('Admin'), getAllOrders);                  // GET    /api/v1/orders
router.patch(
  '/:id/status',
  restrictTo('Admin'),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);                                                                   // PATCH  /api/v1/orders/:id/status

export default router;
