import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';

// GET /api/v1/admin/dashboard
/**
 * Aggregate overview: total revenue, orders, users, and products.
 */
export const getDashboardStats = async (req, res) => {
  const [revenueData, orderStats, totalUsers, totalProducts] = await Promise.all([
    // Total revenue from paid orders
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]),

    // Order counts by status
    Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    User.countDocuments(),
    Product.countDocuments()
  ]);

  const totalRevenue = revenueData[0]?.totalRevenue || 0;

  // Shape order stats into an easy-to-consume map
  const ordersByStatus = orderStats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const totalOrders = orderStats.reduce((sum, item) => sum + item.count, 0);

  res.status(200).json({
    status: 'success',
    data: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      ordersByStatus,
      totalUsers,
      totalProducts
    }
  });
};

// GET /api/v1/admin/analytics/revenue
/**
 * Monthly revenue trend for the last 12 months.
 */
export const getRevenueTrend = async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        isPaid: true,
        createdAt: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        revenue: { $round: ['$revenue', 2] },
        orderCount: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: monthlyRevenue.length,
    data: { monthlyRevenue }
  });
};

// GET /api/v1/admin/analytics/top-products 
/**
 * Top 10 best-selling products by total quantity sold.
 */
export const getTopProducts = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const topProducts = await Order.aggregate([
    // Only consider paid/confirmed+ orders
    {
      $match: {
        status: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: { path: '$product', preserveNullAndEmpty: true } },
    {
      $project: {
        _id: 1,
        name: 1,
        totalSold: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        images: '$product.images',
        stockQuantity: '$product.stockQuantity'
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: topProducts.length,
    data: { topProducts }
  });
};

// GET /api/v1/admin/analytics/users
/**
 * New user registrations per month for the last 12 months.
 */
export const getUserStats = async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [monthlyUsers, roleBreakdown] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          newUsers: 1
        }
      }
    ]),

    // Breakdown by role
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ])
  ]);

  const usersByRole = roleBreakdown.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  res.status(200).json({
    status: 'success',
    data: { monthlyUsers, usersByRole }
  });
};

// GET /api/v1/admin/analytics/inventory
/**
 * Products with low stock (below a configurable threshold).
 */
export const getLowStockProducts = async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;

  const lowStock = await Product.find({ stockQuantity: { $lte: threshold } })
    .select('name brand stockQuantity price category images')
    .populate('category', 'name')
    .sort('stockQuantity')
    .lean();

  res.status(200).json({
    status: 'success',
    threshold,
    results: lowStock.length,
    data: { products: lowStock }
  });
};
