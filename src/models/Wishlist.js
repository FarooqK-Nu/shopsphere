import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: String, // Better Auth uses string IDs
      ref: 'User',
      required: [true, 'Wishlist must belong to a user'],
      unique: true // One wishlist per user
    },
    products: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product'
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent duplicate product entries in the products array
// wishlistSchema.index({ user: 1 }); no need already unique true.

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
