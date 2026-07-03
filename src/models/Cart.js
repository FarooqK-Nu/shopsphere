import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Cart item must reference a product']
    },
    quantity: {
      type: Number,
      required: [true, 'Cart item must have a quantity'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    price: {
      // Snapshot of price at the time of adding to cart
      type: Number,
      required: [true, 'Cart item must have a price']
    }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: String, // Better Auth uses string IDs
      ref: 'User',
      required: [true, 'Cart must belong to a user'],
      unique: true // One cart per user
    },
    items: {
      type: [cartItemSchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: compute total price of all items
cartSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
});

// Virtual: total number of items
cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((acc, item) => acc + item.quantity, 0);
});

// cartSchema.index({ user: 1 }); no need already unique true.

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
