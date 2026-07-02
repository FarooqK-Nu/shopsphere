import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import ApiError from '../utils/ApiError.js';

// GET /api/v1/wishlist

export const getWishlist = async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user.id }).populate(
    'products',
    'name images price discount ratings stockQuantity'
  );

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user.id, products: [] });
  }

  res.status(200).json({
    status: 'success',
    results: wishlist.products.length,
    data: { wishlist }
  });
};

// POST /api/v1/wishlist/:productId

export const addToWishlist = async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError('Product not found', 404);

  let wishlist = await Wishlist.findOne({ user: req.user.id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user.id, products: [] });
  }

  // Avoid duplicates
  if (wishlist.products.map(String).includes(productId)) {
    throw new ApiError('Product is already in your wishlist', 400);
  }

  wishlist.products.push(productId);
  await wishlist.save();
  await wishlist.populate('products', 'name images price discount ratings stockQuantity');

  res.status(200).json({
    status: 'success',
    message: 'Product added to wishlist',
    data: { wishlist }
  });
};

// DELETE /api/v1/wishlist/:productId

export const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user.id });
  if (!wishlist) throw new ApiError('Wishlist not found', 404);

  const index = wishlist.products.map(String).indexOf(productId);
  if (index === -1) throw new ApiError('Product not found in wishlist', 404);

  wishlist.products.splice(index, 1);
  await wishlist.save();
  await wishlist.populate('products', 'name images price discount ratings stockQuantity');

  res.status(200).json({
    status: 'success',
    message: 'Product removed from wishlist',
    data: { wishlist }
  });
};

// POST /api/v1/wishlist/:productId/move-to-cart

export const moveToCart = async (req, res) => {
  const { productId } = req.params;

  // Verify product
  const product = await Product.findById(productId);
  if (!product) throw new ApiError('Product not found', 404);
  if (product.stockQuantity < 1) {
    throw new ApiError('This product is out of stock', 400);
  }

  // Remove from wishlist
  const wishlist = await Wishlist.findOne({ user: req.user.id });
  if (!wishlist) throw new ApiError('Wishlist not found', 404);

  const index = wishlist.products.map(String).indexOf(productId);
  if (index === -1) throw new ApiError('Product not found in wishlist', 404);

  wishlist.products.splice(index, 1);
  await wishlist.save();

  // Add to cart (quantity = 1)
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }

  const existingIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += 1;
  } else {
    const effectivePrice = product.discount > 0 ? product.price - product.discount : product.price;
    cart.items.push({ product: productId, quantity: 1, price: effectivePrice });
  }

  await cart.save();
  await cart.populate('items.product', 'name images price stockQuantity');

  res.status(200).json({
    status: 'success',
    message: 'Product moved from wishlist to cart',
    data: { cart }
  });
};
