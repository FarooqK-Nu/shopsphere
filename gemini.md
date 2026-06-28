# Gemini Project Instructions — ShopSphere E-Commerce Backend API

You are an expert backend engineer responsible for building a production-grade E-Commerce Backend API called **ShopSphere**.

Your task is to design and implement a scalable, secure, maintainable, real-world backend system similar to platforms like Amazon or Shopify.

Follow professional backend engineering standards. Do not create a simple CRUD application. Build a complete production-ready architecture.

---

# Project Goal

Build a RESTful E-Commerce Backend API using:

- Node.js
- Express.js
- MongoDB
- Mongoose
- Better Auth
- JWT Authentication
- bcrypt
- Zod Validation
- Stripe Payment Gateway
- Cloudinary
- Redis
- Nodemailer
- Docker
- Docker Compose

The application must follow:

- MVC Architecture
- Service Layer Architecture
- Modular folder structure
- Clean code principles
- Production-level security
- Scalable backend patterns

---

# Important Authentication Requirement

Authentication MUST be implemented using:

## Better Auth

Use Better Auth for:

- User registration
- Login
- Session management
- Authentication flow
- JWT access tokens
- Refresh token mechanism
- Secure cookie handling

Do not manually create an insecure authentication system.

---

# Input Validation Requirement

All incoming data must be validated and sanitized using:

## Zod

Implement Zod schemas for:

- Request body validation
- Query validation
- Route parameter validation
- User input sanitization

Reject:

- Invalid data types
- Missing required fields
- Unexpected fields
- Malicious input

Create reusable validation middleware.

Example:

```
POST /api/v1/auth/register

Validate:

name
email
password
phone
```

---

# Required Folder Architecture

Use this structure:

```
ShopSphere
│
├── src
│   │
│   ├── config
│   │   ├── database.js
│   │   ├── redis.js
│   │   ├── cloudinary.js
│   │   ├── stripe.js
│   │
│   ├── models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Cart.js
│   │   ├── Wishlist.js
│   │   ├── Review.js
│   │
│   ├── controllers
│   │
│   ├── routes
│   │
│   ├── middleware
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── validationMiddleware.js
│   │
│   ├── services
│   │   ├── authService.js
│   │   ├── paymentService.js
│   │   ├── emailService.js
│   │   ├── uploadService.js
│   │
│   ├── validations
│   │   ├── auth.schema.js
│   │   ├── product.schema.js
│   │   ├── order.schema.js
│   │
│   ├── utils
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   ├── logger.js
│   │
│   └── app.js
│
├── docker-compose.yml
├── Dockerfile
├── .env
└── README.md
```

---

# Core Modules

Create these API modules:

```
/api/v1/auth

/api/v1/users

/api/v1/products

/api/v1/categories

/api/v1/cart

/api/v1/wishlist

/api/v1/orders

/api/v1/payment

/api/v1/reviews

/api/v1/admin
```

---

# Authentication & User Management

Implement:

- Register
- Login
- Logout
- JWT authentication
- Refresh tokens
- Email verification
- Forgot password
- Reset password
- Update password
- User profile
- Account security controls


User roles:

```
Customer
Admin
```

Implement role-based authorization middleware.

---

# Password Security

Use:

- bcrypt password hashing
- Secure password storage
- Password comparison
- Password update security

---

# Product Management

Create Product model:

Fields:

```
name

description

price

discount

category

brand

images

ratings

reviews

stockQuantity

createdAt
```

Features:

- Admin CRUD
- Product categories
- Product variants

Examples:

```
Size:
S
M
L


Color:
Black
White


Storage:
128GB
256GB
512GB
```

---

# Image Upload System

Implement:

- Multer
- Cloudinary

Features:

- Multiple images
- Image validation
- Image optimization
- Secure upload handling

---

# Advanced Product Search

Support:

## Keyword search

Example:

```
/products?keyword=iphone
```

## Filtering

Support:

```
category
brand
price range
rating
availability
```

## Sorting

Example:

```
/products?sort=-price
```

## Pagination

Example:

```
?page=2&limit=20
```

## Field selection

Example:

```
?fields=name,price
```

Use:

- MongoDB indexes
- Aggregation pipelines
- Optimized queries

---

# Shopping Cart System

Implement:

Features:

- Add product
- Remove product
- Update quantity
- Calculate total
- Validate stock
- Persistent user cart


Relationship:

```
User
 |
Cart
```

---

# Wishlist System

Features:

- Add product
- Remove product
- View wishlist
- Move wishlist item to cart

---

# Order Management System

Order lifecycle:

```
Pending

↓

Confirmed

↓

Processing

↓

Shipped

↓

Delivered


OR


Cancelled
```

Implement:

- Create order from cart
- Order history
- Order details
- Admin order management
- Update order status
- Inventory deduction

Use MongoDB transactions.

---

# Stripe Payment Integration

Implement:

- Checkout session creation
- Payment verification
- Stripe webhooks
- Payment success handling
- Payment failure handling

Flow:

```
Cart

↓

Stripe Checkout

↓

Payment Success

↓

Create Order

↓

Reduce Inventory

↓

Send Email
```

---

# Inventory Management

Implement:

- Stock tracking
- Automatic stock reduction
- Prevent overselling
- Low stock monitoring
- Admin stock updates

---

# Reviews & Ratings

Users can:

- Create review
- Update review
- Delete review
- Rate product


Rules:

- One review per user per product
- Rating must be between 1-5


Automatically calculate:

```
Average Rating

Total Reviews
```

---

# Email Service

Use:

Nodemailer


Send emails for:

## User

- Welcome email
- Verification email
- Password reset email


## Orders

- Order confirmation
- Payment confirmation
- Shipping updates
- Delivery notification

---

# Redis Caching

Implement Redis caching for:

- Product lists
- Product details
- Categories


Example:

```
Request Product

↓

Check Redis

↓

If exists return cache

↓

Else query MongoDB

↓

Store result
```

---

# Admin Dashboard APIs

Create analytics endpoints.

Provide:

## Users

- Total users
- New registrations


## Orders

- Total orders
- Completed orders


## Revenue

- Total revenue
- Sales trends


## Products

- Best selling products
- Inventory insights


Use MongoDB aggregation pipelines.

---

# Security Requirements

Implement:

## Authentication

- Better Auth
- JWT
- Secure cookies


## Middleware

Use:

- Helmet
- CORS
- Rate limiting
- NoSQL injection protection
- XSS protection


## Validation

All API input must pass through Zod validation.

---

# Error Handling

Create:

Custom error class:

```
ApiError
```

Implement:

- Centralized error handler
- Async error wrapper
- Production error responses
- Structured logging


---

# Performance Optimization

Implement:

- MongoDB indexes
- Query optimization
- Efficient aggregation pipelines
- Redis caching
- Lean queries where suitable

---

# Logging

Implement:

- API request logging
- Error logging
- Production-friendly logs

---

# Environment Configuration

Use:

```
.env
```

Example:

```
PORT=

DATABASE_URL=

JWT_SECRET=

REDIS_URL=

STRIPE_SECRET=

CLOUDINARY_KEY=

EMAIL_HOST=
```

Never hardcode secrets.

---

# Docker Setup

Create:

```
Dockerfile

docker-compose.yml
```

Include services:

```
Node API

MongoDB

Redis
```

---

# API Documentation

Create Postman documentation covering:

- Authentication endpoints
- Product endpoints
- Cart endpoints
- Order endpoints
- Payment endpoints
- Admin endpoints

---

# Coding Rules

Follow:

- Clean architecture
- Reusable functions
- Modular files
- Meaningful naming
- Async/await
- Error handling everywhere
- No duplicated logic

Avoid:

- Spaghetti code
- Huge controllers
- Business logic inside routes
- Unvalidated input

---

# Final Requirement

The finished ShopSphere backend should demonstrate professional backend engineering skills:

- Advanced authentication with Better Auth
- JWT security
- Zod validation and sanitization
- MVC architecture
- MongoDB design
- Aggregation pipelines
- Stripe payments
- Cloudinary uploads
- Redis caching
- Email automation
- Security implementation
- Docker deployment
- Production-ready API design

Build it as if it will be deployed to production.