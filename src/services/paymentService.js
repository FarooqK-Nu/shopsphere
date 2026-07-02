import { stripe } from '../config/stripe.js';

/**
 * Creates a Stripe Checkout Session for a specific Order.
 * @param {Object} order - The Mongoose Order document
 * @param {string} successUrl - URL redirect on successful payment
 * @param {string} cancelUrl - URL redirect on cancelled/failed payment
 * @returns {Promise<Object>} The Stripe Session object
 */
export const createCheckoutSession = async (order, successUrl, cancelUrl) => {
  const lineItems = order.items.map((item) => {
    // stripe price is in cents
    const unitAmountCents = Math.round(item.price * 100);

    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : []
        },
        unit_amount: unitAmountCents
      },
      quantity: item.quantity
    };
  });

  // If there is tax or shipping, append them as separate line items
  if (order.taxPrice > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Tax'
        },
        unit_amount: Math.round(order.taxPrice * 100)
      },
      quantity: 1
    });
  }

  if (order.shippingPrice > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Shipping Fee'
        },
        unit_amount: Math.round(order.shippingPrice * 100)
      },
      quantity: 1
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: order.shippingAddress.email || undefined, // fallback email if available
    client_reference_id: order._id.toString(),
    metadata: {
      orderId: order._id.toString()
    },
    line_items: lineItems
  });

  return session;
};

/**
 * Verifies a Stripe signature and constructs the webhook event.
 * @param {Buffer} rawBody - Raw binary request body
 * @param {string} signature - Stripe signature header
 * @param {string} webhookSecret - Webhook secret key
 * @returns {Object} Stripe Event object
 */
export const constructWebhookEvent = (rawBody, signature, webhookSecret) => {
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
};
