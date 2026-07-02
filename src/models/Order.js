import mongoose from 'mongoose';

// Embedded sub-schemas

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Order item must reference a product']
    },
    name: {
      type: String,
      required: [true, 'Order item must store the product name']
    },
    image: String, // First image at time of purchase
    quantity: {
      type: Number,
      required: [true, 'Order item must have a quantity'],
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: [true, 'Order item must store the unit price']
    }
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  { _id: false }
);

const paymentResultSchema = new mongoose.Schema(
  {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  { _id: false }
);

// Main Order schema

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: String, // Better Auth string ID
      ref: 'User',
      required: [true, 'Order must belong to a user']
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Order must have at least one item'],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Order must contain at least one item'
      }
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Order must have a shipping address']
    },
    paymentMethod: {
      type: String,
      required: [true, 'Order must have a payment method'],
      enum: {
        values: ['Stripe', 'CashOnDelivery'],
        message: 'Payment method must be Stripe or CashOnDelivery'
      }
    },
    paymentResult: paymentResultSchema, // Populated after Stripe webhook
    itemsPrice: {
      type: Number,
      required: true,
      default: 0
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        message: 'Invalid order status'
      },
      default: 'Pending'
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,

    // Stripe checkout session ID (for webhook verification)
    stripeSessionId: String
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ stripeSessionId: 1 }, { sparse: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
