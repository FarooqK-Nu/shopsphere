import express from 'express';
import validate from '../middleware/validationMiddleware.js';
import categorySchema from '../validations/category.schema.js';
import * as categoryController from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(categoryController.getAllCategories)
  .post(protect, restrictTo('Admin'), validate(categorySchema), categoryController.createCategory);

router
  .route('/:id')
  .get(categoryController.getCategory)
  .patch(protect, restrictTo('Admin'), categoryController.updateCategory)
  .delete(protect, restrictTo('Admin'), categoryController.deleteCategory);

export default router;
