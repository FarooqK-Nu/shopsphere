import express from 'express';
import validate from '../middleware/validationMiddleware.js';
import categorySchema from '../validations/category.schema.js';
import * as categoryController from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';
import cache from '../middleware/cacheMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(cache('categories', 300), categoryController.getAllCategories)       // cached 5 min
  .post(protect, restrictTo('Admin'), validate(categorySchema), categoryController.createCategory);

router
  .route('/:id')
  .get(cache('categories', 300), categoryController.getCategory)            // cached 5 min
  .patch(protect, restrictTo('Admin'), categoryController.updateCategory)
  .delete(protect, restrictTo('Admin'), categoryController.deleteCategory);

export default router;
