import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import * as paymentService from '../services/paymentService.js';
import * as emailService from '../services/emailService.js';
import logger from '../utils/logger.js';

// POST /api/v1/payment/checkout-session/:orderId
export const createCheckoutSession = async (req, res) => {
  const { orderId } = req.params;
  const { successUrl, cancelUrl } = req.body;

  if (!successUrl || !cancelUrl) {
    throw new ApiError('successUrl and cancelUrl are required in body', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  // Ensure owner is making request
  if (order.user !== req.user.id && req.user.role !== 'Admin') {
    throw new ApiError('You are not authorized to pay for this order', 403);
  }

  if (order.isPaid) {
    throw new ApiError('Order is already paid', 400);
  }

  // Inject user email into shippingAddress context for Stripe session config if not set
  if (!order.shippingAddress.email) {
    order.shippingAddress.email = req.user.email;
  }

  const session = await paymentService.createCheckoutSession(order, successUrl, cancelUrl);

  // Store session id on the order
  order.stripeSessionId = session.id;
  await order.save();

  res.status(200).json({
    status: 'success',
    data: {
      sessionId: session.id,
      sessionUrl: session.url
    }
  });
};

// POST /api/v1/payment/webhook
// NOTE: Must consume raw body. We'll set up express.raw() route middleware specifically for this route.
export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'dummy_webhook_secret';

  let event;
  try {
    event = paymentService.constructWebhookEvent(req.body, signature, webhookSecret);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Process the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      const order = await Order.findById(orderId).populate('user');
      if (order) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = 'Confirmed';
        order.paymentResult = {
          id: session.id,
          status: session.payment_status,
          update_time: new Date().toISOString(),
          email_address: session.customer_details?.email || ''
        };
        await order.save();

        logger.info(`Order ${orderId} successfully paid via Stripe`);

        // Send confirmation email
        await emailService.sendOrderEmail(
          order,
          'Payment Success & Order Confirmed',
          'We have successfully received your payment. Your order is now confirmed and is being processed!'
        );
      } else {
        logger.error(`Webhook order not found: ${orderId}`);
      }
    }
  }

  res.status(200).json({ received: true });
};
