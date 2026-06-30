import express from 'express';
import validate from '../middleware/validationMiddleware.js';
import productSchema from '../validations/product.schema.js';
import * as productController from '../controllers/productController.js';
import { uploadProductImages } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { restrictTo } from '../middleware/roleMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(productController.getAllProducts)
  .post(protect, restrictTo('Admin'), uploadProductImages, validate(productSchema), productController.createProduct);

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(protect, restrictTo('Admin'), uploadProductImages, productController.updateProduct)
  .delete(protect, restrictTo('Admin'), productController.deleteProduct);

export default router;
