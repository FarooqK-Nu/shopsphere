import Review from '../models/Review.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';

// GET /api/v1/reviews?product=productId
export const getProductReviews = async (req, res) => {
  const { product } = req.query;
  if (!product) {
    throw new ApiError('Product ID query parameter is required', 400);
  }

  const reviews = await Review.find({ product }).populate('user', 'name image');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews }
  });
};

// POST /api/v1/reviews
export const createReview = async (req, res) => {
  const { product, rating, comment } = req.body;

  // Check if product exists
  const targetProduct = await Product.findById(product);
  if (!targetProduct) {
    throw new ApiError('Product not found', 404);
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    product,
    user: req.user.id
  });

  if (existingReview) {
    throw new ApiError('You have already reviewed this product', 400);
  }

  const review = await Review.create({
    product,
    user: req.user.id,
    rating,
    comment
  });

  res.status(201).json({
    status: 'success',
    message: 'Review created successfully',
    data: { review }
  });
};

// PATCH /api/v1/reviews/:id
export const updateReview = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError('Review not found', 404);
  }

  // Ensure owner is updating
  if (review.user !== req.user.id && req.user.role !== 'Admin') {
    throw new ApiError('You are not authorized to update this review', 403);
  }

  if (rating) review.rating = rating;
  if (comment) review.comment = comment;

  await review.save();

  res.status(200).json({
    status: 'success',
    message: 'Review updated successfully',
    data: { review }
  });
};

// DELETE /api/v1/reviews/:id
export const deleteReview = async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError('Review not found', 404);
  }

  // Ensure owner or admin is deleting
  if (review.user !== req.user.id && req.user.role !== 'Admin') {
    throw new ApiError('You are not authorized to delete this review', 403);
  }

  await Review.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: 'Review deleted successfully',
    data: null
  });
};
