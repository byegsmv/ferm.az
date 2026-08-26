import { z } from 'zod';

// User Registration
export const userRegisterSchema = z.object({
  email: z.string().email('Invalid email').max(255),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(255),
  phone: z.string().regex(/^(\+994|0)\d{9}$/, 'Invalid AZ phone'),
  role: z.enum(['FARMER', 'STORE', 'BUYER']),
});

// Product Create
export const productCreateSchema = z.object({
  name: z.string().min(3).max(500),
  description: z.string().max(5000),
  price: z.number().min(0).max(999999),
  categoryId: z.string().uuid(),
  images: z.array(z.string().url()).max(10),
  stock: z.number().min(0),
  tags: z.array(z.string()).max(20),
});

// Blog Post
export const blogCreateSchema = z.object({
  title: z.string().min(5).max(500),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(200),
  content: z.string().min(100).max(50000), // Will be sanitized
  excerpt: z.string().max(500),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).max(10),
});

// Comment/Review
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(2000),
  verified: z.boolean().optional(),
});

// Order
export const orderCreateSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().min(1).max(1000),
    })
  ),
  shippingAddress: z.object({
    street: z.string().min(3),
    city: z.string().min(2),
    postal: z.string().regex(/^\d{4}$/),
    country: z.string().length(2),
  }),
  couponCode: z.string().optional(),
});
