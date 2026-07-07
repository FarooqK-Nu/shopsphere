import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';
import {
  getDashboardStats,
  getRevenueTrend,
  getTopProducts,
  getUserStats,
  getLowStockProducts
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication + Admin role
router.use(protect, restrictTo('Admin'));

router.get('/dashboard',               getDashboardStats);   // GET /api/v1/admin/dashboard
router.get('/analytics/revenue',       getRevenueTrend);     // GET /api/v1/admin/analytics/revenue
router.get('/analytics/top-products',  getTopProducts);      // GET /api/v1/admin/analytics/top-products
router.get('/analytics/users',         getUserStats);         // GET /api/v1/admin/analytics/users
router.get('/analytics/inventory',     getLowStockProducts); // GET /api/v1/admin/analytics/inventory

export default router;
