import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validationMiddleware.js';
import { createReviewSchema, updateReviewSchema } from '../validations/review.schema.js';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';

const router = express.Router();

// GET /api/v1/reviews (Query param ?product=productId required)
router.get('/', getProductReviews);

// Protected routes
router.use(protect);

router.post('/', validate(createReviewSchema), createReview);
router.patch('/:id', validate(updateReviewSchema), updateReview);
router.delete('/:id', deleteReview);

export default router;
