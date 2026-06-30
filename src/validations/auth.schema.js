import * as z from 'zod';

export const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than or equal to 50 characters"),
  
  email: z.string()
    .trim()
    .email("Invalid email address"),
  
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than or equal to 100 characters"),
  
  phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .optional()
});

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email("Invalid email address"),
  
  password: z.string()
    .min(1, "Password is required")
});
