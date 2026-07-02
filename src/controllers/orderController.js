import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import * as emailService from '../services/emailService.js';

// Pricing constants
const TAX_RATE = 0.08;         // 8 % tax
const FREE_SHIPPING_THRESHOLD = 100; // Free shipping above $100
const SHIPPING_COST = 10;      // Flat shipping fee

// Helper: compute order pricing
const computePricing = (items) => {
  const itemsPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxPrice = parseFloat((itemsPrice * TAX_RATE).toFixed(2));
  const totalPrice = parseFloat((itemsPrice + shippingPrice + taxPrice).toFixed(2));
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
};

// POST /api/v1/orders
/**
 * Create an order from the user's current cart.
 * Uses a MongoDB transaction to atomically:
 *   1. Validate stock for every cart item
 *   2. Deduct inventory
 *   3. Create the order document
 *   4. Clear the user's cart
 */
export const createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  // 1) Fetch the user's cart
  const cart = await Cart.findOne({ user: req.user.id }).populate(
    'items.product',
    'name images price discount stockQuantity'
  );

  if (!cart || cart.items.length === 0) {
    throw new ApiError('Your cart is empty. Add items before placing an order.', 400);
  }

  // 2) Start a MongoDB session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 3) Validate stock and build order items inside the transaction
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id).session(session);

      if (!product) {
        throw new ApiError(`Product "${item.product.name}" no longer exists.`, 404);
      }
      if (product.stockQuantity < item.quantity) {
        throw new ApiError(
          `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, requested: ${item.quantity}.`,
          400
        );
      }

      // Deduct inventory
      product.stockQuantity -= item.quantity;
      await product.save({ session });

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || '',
        quantity: item.quantity,
        price: item.price // use the price snapshot from the cart
      });
    }

    // 4) Compute pricing
    const { itemsPrice, shippingPrice, taxPrice, totalPrice } = computePricing(orderItems);

    // 5) Create the order
    const [order] = await Order.create(
      [
        {
          user: req.user.id,
          items: orderItems,
          shippingAddress,
          paymentMethod,
          itemsPrice,
          shippingPrice,
          taxPrice,
          totalPrice,
          // Cash-on-delivery orders are automatically confirmed
          ...(paymentMethod === 'CashOnDelivery' && { status: 'Confirmed' })
        }
      ],
      { session }
    );

    // 6) Clear the cart
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [] },
      { session }
    );

    // 7) Commit
    await session.commitTransaction();

    // Trigger confirmation email
    order.user = req.user; // Attach user object for email address
    emailService.sendOrderEmail(
      order,
      'Order Placed Successfully',
      paymentMethod === 'CashOnDelivery'
        ? 'Your order has been placed and confirmed (Cash on Delivery). We will process and ship it soon!'
        : 'Your order has been placed and is pending payment via Stripe.'
    );

    res.status(201).json({
      status: 'success',
      message: 'Order placed successfully',
      data: { order }
    });
  } catch (err) {
    await session.abortTransaction();
    throw err; // Re-throw so the global error handler catches it
  } finally {
    session.endSession();
  }
};

// GET /api/v1/orders/my-orders
/**
 * Return all orders belonging to the authenticated user (newest first) for current page.
 */
export const getMyOrders = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user.id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name images'),
    Order.countDocuments({ user: req.user.id })
  ]);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { orders }
  });
};

// GET /api/v1/orders/:id
/**
 * Get a single order by ID.
 * Customers can only view their own orders; Admins can view any.
 */
export const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'items.product',
    'name images price'
  );

  if (!order) throw new ApiError('Order not found', 404);

  // Ownership check for non-admin users
  if (req.user.role !== 'Admin' && order.user !== req.user.id) {
    throw new ApiError('You are not authorised to view this order', 403);
  }

  res.status(200).json({
    status: 'success',
    data: { order }
  });
};

// PATCH /api/v1/orders/:id/cancel
/**
 * Cancel an order (Customer action).
 * Only allowed while the order is in Pending or Confirmed state.
 * Restores inventory for each item using a transaction.
 */
export const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) throw new ApiError('Order not found', 404);
  if (order.user !== req.user.id) {
    throw new ApiError('You are not authorised to cancel this order', 403);
  }
  if (!['Pending', 'Confirmed'].includes(order.status)) {
    throw new ApiError(
      `Order cannot be cancelled once it is in "${order.status}" status.`,
      400
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Restore inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: item.quantity } },
        { session }
      );
    }

    order.status = 'Cancelled';
    await order.save({ session });

    await session.commitTransaction();

    // Trigger cancellation email
    order.user = req.user;
    emailService.sendOrderEmail(
      order,
      'Order Cancelled',
      'Your order has been successfully cancelled, and the items have been restored to inventory.'
    );

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled and inventory restored',
      data: { order }
    });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ADMIN ROUTES

// GET /api/v1/orders (Admin)
/**
 * Admin: get all orders with optional status filter and pagination.
 */
export const getAllOrders = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const filter = req.query.status ? { status: req.query.status } : {};

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name images'),
    Order.countDocuments(filter)
  ]);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { orders }
  });
};

// PATCH /api/v1/orders/:id/status (Admin)
/**
 * Admin: update order status along the lifecycle.
 * Enforces the valid state transition order.
 */
const STATUS_ORDER = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled'
];

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) throw new ApiError('Order not found', 404);
  if (order.status === 'Cancelled') {
    throw new ApiError('Cancelled orders cannot be updated', 400);
  }

  // Enforce forward-only transitions (except Admin can cancel from any state)
  if (status !== 'Cancelled') {
    const currentIndex = STATUS_ORDER.indexOf(order.status);
    const newIndex = STATUS_ORDER.indexOf(status);
    if (newIndex <= currentIndex) {
      throw new ApiError(
        `Cannot move order from "${order.status}" to "${status}". Status can only move forward.`,
        400
      );
    }
  }

  // Mark payment/delivery timestamps
  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  // If cash-on-delivery reaches Delivered, mark as paid
  if (status === 'Delivered' && order.paymentMethod === 'CashOnDelivery') {
    order.isPaid = true;
    order.paidAt = Date.now();
  }

  // Restore inventory if admin cancels
  if (status === 'Cancelled' && order.status !== 'Cancelled') {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stockQuantity: item.quantity } },
          { session }
        );
      }
      order.status = 'Cancelled';
      await order.save({ session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    order.status = status;
    await order.save();
  }

  // Populate user info for order update email
  const populatedOrder = await Order.findById(order._id).populate('user');
  if (populatedOrder) {
    emailService.sendOrderEmail(
      populatedOrder,
      `Order Status Update: ${status}`,
      `Your order status has been updated to "${status}".`
    );
  }

  res.status(200).json({
    status: 'success',
    message: `Order status updated to "${order.status}"`,
    data: { order }
  });
};
