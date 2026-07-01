import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';

// Helper: fetch or create the cart for the logged-in user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name images price stockQuantity');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// ─── GET /api/v1/cart ────────────────────────────────────────────────────────

export const getCart = async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);

  res.status(200).json({
    status: 'success',
    data: { cart }
  });
};

// ─── POST /api/v1/cart ───────────────────────────────────────────────────────

export const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  // Validate the product exists and has sufficient stock
  const product = await Product.findById(productId);
  if (!product) throw new ApiError('Product not found', 404);
  if (product.stockQuantity < quantity) {
    throw new ApiError(`Only ${product.stockQuantity} unit(s) in stock`, 400);
  }

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }

  // Check if product is already in cart
  const existingIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingIndex >= 0) {
    // Update quantity — also validate against total stock
    const newQty = cart.items[existingIndex].quantity + quantity;
    if (product.stockQuantity < newQty) {
      throw new ApiError(`Only ${product.stockQuantity} unit(s) available in stock`, 400);
    }
    cart.items[existingIndex].quantity = newQty;
  } else {
    // Add new item with price snapshot
    const effectivePrice = product.discount > 0 ? product.price - product.discount : product.price;
    cart.items.push({
      product: productId,
      quantity,
      price: effectivePrice
    });
  }

  await cart.save();
  await cart.populate('items.product', 'name images price stockQuantity');

  res.status(200).json({
    status: 'success',
    message: 'Item added to cart',
    data: { cart }
  });
};

// ─── PATCH /api/v1/cart/:productId ──────────────────────────────────────────

export const updateCartItem = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError('Product not found', 404);
  if (product.stockQuantity < quantity) {
    throw new ApiError(`Only ${product.stockQuantity} unit(s) available in stock`, 400);
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) throw new ApiError('Cart not found', 404);

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );
  if (itemIndex < 0) throw new ApiError('Item not found in cart', 404);

  cart.items[itemIndex].quantity = quantity;
  await cart.save();
  await cart.populate('items.product', 'name images price stockQuantity');

  res.status(200).json({
    status: 'success',
    message: 'Cart item updated',
    data: { cart }
  });
};

// ─── DELETE /api/v1/cart/:productId ─────────────────────────────────────────

export const removeFromCart = async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) throw new ApiError('Cart not found', 404);

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );
  if (itemIndex < 0) throw new ApiError('Item not found in cart', 404);

  cart.items.splice(itemIndex, 1);
  await cart.save();
  await cart.populate('items.product', 'name images price stockQuantity');

  res.status(200).json({
    status: 'success',
    message: 'Item removed from cart',
    data: { cart }
  });
};

// ─── DELETE /api/v1/cart ─────────────────────────────────────────────────────

export const clearCart = async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [] },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Cart cleared',
    data: { cart }
  });
};
