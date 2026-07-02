import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Create a transporter helper
const getTransporter = () => {
  const host = process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io';
  const port = parseInt(process.env.EMAIL_PORT) || 2525;
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';

  return nodemailer.createTransport({
    host,
    port,
    auth: {
      user,
      pass
    }
  });
};

/**
 * Send an email using Nodemailer
 * @param {Object} options - Email options (to, subject, html, text)
 */
export const sendEmail = async (options) => {
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"ShopSphere Support" <support@shopsphere.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || ''
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email to ${options.to}: ${error.message}`);
    // Do not throw error in development or production if we don't want to crash the request flow
    // but log it clearly
  }
};

/**
 * Send welcome email to a new user
 * @param {string} email
 * @param {string} name
 */
export const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #4F46E5;">Welcome to ShopSphere, ${name}!</h2>
      <p>Thank you for creating an account with us. We are thrilled to have you here.</p>
      <p>Start exploring our latest products, curate your wishlist, and enjoy premium shopping experience!</p>
      <div style="margin: 20px 0;">
        <a href="${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explore ShopSphere</a>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 40px;">If you did not sign up for this account, please ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to ShopSphere!',
    html
  });
};

/**
 * Send email verification link
 * @param {string} email
 * @param {string} url
 */
export const sendVerificationEmail = async (email, url) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #4F46E5;">Verify Your Email Address</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <div style="margin: 20px 0;">
        <a href="${url}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
      </div>
      <p>If the button doesn't work, copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #4F46E5;">${url}</p>
      <p style="color: #666; font-size: 12px; margin-top: 40px;">Link will expire in 24 hours.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify your email — ShopSphere',
    html
  });
};

/**
 * Send password reset email
 * @param {string} email
 * @param {string} url
 */
export const sendPasswordResetEmail = async (email, url) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #EF4444;">Reset Your Password</h2>
      <p>You requested a password reset. Click the button below to choose a new password:</p>
      <div style="margin: 20px 0;">
        <a href="${url}" style="background-color: #EF4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If the button doesn't work, copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #EF4444;">${url}</p>
      <p style="color: #666; font-size: 12px; margin-top: 40px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset your password — ShopSphere',
    html
  });
};

/**
 * Send order placement and payment confirmations, shipping updates
 * @param {Object} order - Order document
 * @param {string} title - Email subject/heading
 * @param {string} message - Intro text message
 */
export const sendOrderEmail = async (order, title, message) => {
  // Try to find target email from shippingAddress
  const emailRecipient = order.shippingAddress.email || (order.user && order.user.email);
  if (!emailRecipient) {
    logger.warn('No email recipient found for order notification');
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${item.name} x ${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #4F46E5;">${title}</h2>
      <p>${message}</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod} (${order.isPaid ? 'Paid' : 'Unpaid'})</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="border-bottom: 2px solid #ddd;">
            <th style="text-align: left; padding-bottom: 10px;">Item</th>
            <th style="text-align: right; padding-bottom: 10px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr>
            <td style="padding: 10px 0; font-weight: bold;">Items Price</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold;">$${order.itemsPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">Shipping</td>
            <td style="padding: 10px 0; text-align: right;">$${order.shippingPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">Tax</td>
            <td style="padding: 10px 0; text-align: right;">$${order.taxPrice.toFixed(2)}</td>
          </tr>
          <tr style="border-top: 2px solid #ddd; font-size: 16px; font-weight: bold;">
            <td style="padding: 10px 0; color: #4F46E5;">Total Price</td>
            <td style="padding: 10px 0; text-align: right; color: #4F46E5;">$${order.totalPrice.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style="background-color: #F9FAFB; padding: 15px; border-radius: 5px;">
        <h4 style="margin-top: 0;">Shipping Address:</h4>
        <p style="margin: 5px 0;">${order.shippingAddress.fullName}</p>
        <p style="margin: 5px 0;">${order.shippingAddress.address}, ${order.shippingAddress.city}</p>
        <p style="margin: 5px 0;">${order.shippingAddress.postalCode}, ${order.shippingAddress.country}</p>
        <p style="margin: 5px 0;">Phone: ${order.shippingAddress.phone}</p>
      </div>

      <p style="color: #666; font-size: 12px; margin-top: 40px;">Thank you for shopping at ShopSphere.</p>
    </div>
  `;

  await sendEmail({
    to: emailRecipient,
    subject: `${title} — ShopSphere`,
    html
  });
};
