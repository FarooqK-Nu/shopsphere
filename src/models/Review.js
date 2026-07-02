import mongoose from 'mongoose';
import Product from './Product.js';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: String, // Better Auth string ID
      ref: 'User',
      required: [true, 'Review must belong to a user']
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
      required: [true, 'Review must have a rating']
    },
    comment: {
      type: String,
      required: [true, 'Review must have a comment'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Allow only one review per user for a single product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to calculate average rating and total reviews
reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId }
    },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratings: stats[0].avgRating,
      reviews: stats[0].nRating
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratings: 0,
      reviews: 0
    });
  }
};

// Call calcAverageRatings after saving a review
reviewSchema.post('save', function () {
  // 'this' points to current review
  this.constructor.calcAverageRatings(this.product);
});

// Call calcAverageRatings after updating or deleting a review
// findByIdAndUpdate, findByIdAndDelete triggers findOneAnd... under the hood
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.product);
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
