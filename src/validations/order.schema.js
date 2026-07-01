import { z } from 'zod';

// ─── Shared sub-schemas ─────────────────────────────────────────────────────

export const shippingAddressSchema = z.object({
  fullName:   z.string().min(2, 'Full name must be at least 2 characters'),
  phone:      z.string().min(7, 'Phone must be at least 7 characters'),
  address:    z.string().min(5, 'Address must be at least 5 characters'),
  city:       z.string().min(2, 'City must be at least 2 characters'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters'),
  country:    z.string().min(2, 'Country must be at least 2 characters')
});

// ─── Order schemas ──────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.enum(['Stripe', 'CashOnDelivery'], {
      errorMap: () => ({ message: 'Payment method must be Stripe or CashOnDelivery' })
    })
  })
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required')
  }),
  body: z.object({
    status: z.enum(
      ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      { errorMap: () => ({ message: 'Invalid order status value' }) }
    )
  })
});

// ─── Cart schemas ───────────────────────────────────────────────────────────

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z
      .number({ invalid_type_error: 'Quantity must be a number' })
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
      .default(1)
  })
});

export const updateCartItemSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required')
  }),
  body: z.object({
    quantity: z
      .number({ invalid_type_error: 'Quantity must be a number' })
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
  })
});

// ─── Wishlist schemas ────────────────────────────────────────────────────────

export const wishlistProductSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required')
  })
});
