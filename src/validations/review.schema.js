import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    product: z.string().min(1, 'Product ID is required'),
    rating: z
      .number({ invalid_type_error: 'Rating must be a number' })
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5'),
    comment: z.string().min(3, 'Comment must be at least 3 characters')
  })
});

export const updateReviewSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Review ID is required')
  }),
  body: z.object({
    rating: z
      .number({ invalid_type_error: 'Rating must be a number' })
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5')
      .optional(),
    comment: z.string().min(3, 'Comment must be at least 3 characters').optional()
  })
});
