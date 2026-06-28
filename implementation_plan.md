# ShopSphere E-Commerce Backend API - Phased Implementation Plan

This implementation plan outlines the development of the **ShopSphere E-Commerce Backend API** in a structured, step-by-step manner. The architecture is designed to align with the MVC and Service Layer principles taught in Jonas Schmedtmann's Node.js course, while introducing modern backend tools like **Better Auth** and **Zod Validation** at logical stages.

---

## Phased Approach Overview

We will build the application in **6 logical phases**:
1. **Phase 1: Foundation & Jonas-Style Global Error Handling** — Base server setup, MongoDB configuration, custom operational error handler, and global async handler.
2. **Phase 2: Product & Category Management with Advanced API Features** — Mongoose models, public/admin routes, Cloudinary uploads via Multer, and a custom APIFeatures class for advanced search/filter/sort/pagination.
3. **Phase 3: Better Auth Integration & Zod Validations** — Modern authentication setup using Better Auth, custom user attributes (role/phone), role-based middleware, and custom reusable Zod validation middleware.
4. **Phase 4: Shopping Cart, Wishlist, & Reviews System** — Cart persistence, stock checks, wishlist transfers, and rating/review aggregation hooks.
5. **Phase 5: Orders, Stripe Payments, & Nodemailer Automations** — MongoDB Transaction-based order checkout, inventory management, Stripe checkout sessions, Stripe webhooks, and Nodemailer email triggers.
6. **Phase 6: Redis Caching, Analytics, Dockerization & API Docs** — Performance optimization with Redis, admin analytics using MongoDB aggregation pipelines, Docker Compose setup, and Postman API documentation.

---

## User Review Required

> [!IMPORTANT]
> - **Express 5 Native Async Handling**: Since we will use Express 5, uncaught promises are automatically forwarded to the error-handling middleware. We do not need a custom `asyncHandler` utility.
> - **Admin Seeding**: We will implement an admin user seeding script to set up a default admin user.
> - **Auth Strategy**: We will use HttpOnly secure cookies as the primary authentication method, and add JWT/Bearer token support specifically for external API clients.

---

## Open Questions

> [!NOTE]
> All initial questions have been resolved with the user's feedback.

---

## Proposed Changes

Below is the directory mapping and files affected in each phase.

### Phase 1: Foundation & Jonas-Style Global Error Handling

Initialize project and create the boilerplate configuration, error middleware, and application logger.

#### [NEW] [package.json](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/package.json)
Configure startup scripts and dependencies:
- Core: `express@5` (or latest supporting native async error catching), `mongoose`, `dotenv`, `cors`, `helmet`, `morgan`, `cookie-parser`
- Security: `express-rate-limit`, `express-mongo-sanitize`, `xss-clean`
- Utils: `winston`, `bcrypt`, `zod`

#### [NEW] [.env](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/.env)
Establish local environmental variables:
- `PORT`, `DATABASE_URL`, `NODE_ENV=development`
- Config templates for Stripe, Cloudinary, Redis, etc.

#### [NEW] [database.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/config/database.js)
Establish connection to MongoDB via Mongoose.

#### [NEW] [ApiError.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/utils/ApiError.js)
Jonas-style operational error class extending standard JS `Error`:
- Captures status code (e.g., 400, 404, 500)
- Identifies if error is operational (trusted) or programming error
- Captures status (`fail` or `error`)

#### [NEW] [asyncHandler.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/utils/asyncHandler.js)
Jonas-style catchAsync wrapper function that passes caught errors down the Express chain to the global handler.

#### [NEW] [errorMiddleware.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/middleware/errorMiddleware.js)
Centralized Express error handling middleware:
- Development mode: Sends full stack traces and JSON objects.
- Production mode: Sanitizes error message, hides implementation details, and handles specific Mongoose errors (CastError, ValidationError, DuplicateFields).

#### [NEW] [logger.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/utils/logger.js)
Simple Winston/Morgan request and application logger.

#### [NEW] [app.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/app.js)
Primary app file to assemble security middlewares, base routes, global error handler, and spin up the server.

---

### Phase 2: Product & Category Management with Advanced API Features

Create product tables, category structures, custom Jonas-style query builder, and handle image uploads.

#### [NEW] [Product.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/models/Product.js)
Mongoose Schema for Product containing:
- Basic info: `name`, `description`, `price`, `discount`, `brand`, `stockQuantity`
- References: `category`, `ratings` (avg), `reviews` (count)
- Media & Metadata: `images` (array), variants (size/color/storage), and `createdAt`
- Indexing on fields like `name`, `brand`, and `category` for search speed.

#### [NEW] [Category.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/models/User.js) (Used for categories)
Mongoose Schema to organize and classify products.

#### [NEW] [APIFeatures.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/utils/APIFeatures.js)
Jonas's signature query processor helper class to structure MongoDB queries chainably:
- `.filter()`: Parse query operators (e.g. `price[gte]=100`).
- `.sort()`: Sort records dynamically (e.g. `?sort=-price,ratings`).
- `.limitFields()`: Select specific fields (e.g. `?fields=name,price`).
- `.paginate()`: Calculate page offsets and limit records (e.g. `?page=2&limit=20`).

#### [NEW] [productController.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/controllers/productController.js) & [productRoutes.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/routes/productRoutes.js)
Handle API endpoints `/api/v1/products` for CRUD actions (Admin) and list view with keyword search/filters (Public).

#### [NEW] [cloudinary.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/config/cloudinary.js) & [uploadService.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/services/uploadService.js)
Configures Cloudinary SDK and exports helpers to upload Multer buffers directly, supporting secure multi-image optimization.

---

### Phase 3: Better Auth Integration, Zod Validation, & User Management

Integrate authentication systems, define schemas, roles, and access controls.

#### [NEW] [auth.schema.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/validations/auth.schema.js)
Zod validation rules for registration, login, and profile modification.

#### [NEW] [validationMiddleware.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/middleware/validationMiddleware.js)
Reusable validation middleware that compiles Zod rules and passes issues cleanly into `ApiError`.

#### [NEW] [authService.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/services/authService.js)
Initializes Better Auth utilizing MongoDB's adapter (via `mongoose.connection.getClient()`). Declares custom schema extensions for user roles (`Customer`, `Admin`) and contact numbers (`phone`).

#### [NEW] [authMiddleware.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/middleware/authMiddleware.js) & [roleMiddleware.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/middleware/roleMiddleware.js)
- `authMiddleware`: Uses Better Auth's `getSession` to verify current requests and assign users to `req.user`.
- `roleMiddleware`: Asserts privileges, restricting critical endpoints to administrators.

#### [NEW] [authRoutes.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/routes/authRoutes.js)
Mounts Better Auth's core route handler `/api/v1/auth/*` and defines custom routes (forgot password, reset password).

---

### Phase 4: Shopping Cart, Wishlist, & Reviews System

Develop customer utility tables (cart, wishlist, reviews) and connect them with database triggers.

#### [NEW] [Cart.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/models/Cart.js) & [cartController.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/controllers/cartController.js)
Manages user cart contents. Dynamically validates current stock volumes and computes price aggregates.

#### [NEW] [Wishlist.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/models/Wishlist.js) & [wishlistController.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/controllers/wishlistController.js)
Supports adding/removing items, viewing list, and moving wishlist items into active carts.

#### [NEW] [Review.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/models/Review.js) & [reviewController.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/controllers/reviewController.js)
Stores customer ratings. Uses Mongoose static hooks to recalculate ratings/reviews counts on `Product` whenever reviews are updated or removed.

---

### Phase 5: Orders, Stripe Payments, & Nodemailer Automations

Build checkout system using MongoDB transactions, hook up Stripe, and trigger emails.

#### [NEW] [Order.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/models/Order.js) & [orderController.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/controllers/orderController.js)
Coordinates ordering using MongoDB sessions/transactions to deduct stocks atomically and track states (`Pending` -> `Confirmed` -> `Processing` -> `Shipped` -> `Delivered`).

#### [NEW] [stripe.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/config/stripe.js) & [paymentService.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/services/paymentService.js)
Sets up Stripe sessions and handles background payment webhooks to mark orders paid and alert shipping channels.

#### [NEW] [emailService.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/services/emailService.js)
Configures Nodemailer to automate email delivery for signups, password resets, and order confirmations.

---

### Phase 6: Redis Caching, Analytics, Dockerization & API Docs

Cache performance optimization, database aggregations for dashboards, and container config.

#### [NEW] [redis.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/config/redis.js)
Establishes connection client to Redis for query caching.

#### [NEW] [cacheMiddleware.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/middleware/cacheMiddleware.js)
Express caching middleware for high-traffic read routes (`/products`, `/categories`). Invalidates cache on creations or updates.

#### [NEW] [adminController.js](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/src/controllers/adminController.js)
Leverages MongoDB's high-performance Aggregation Pipeline to generate counts of sales trends, best sellers, registration counts, and revenue.

#### [NEW] [Dockerfile](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/Dockerfile) & [docker-compose.yml](file:///c:/Users/HP%20ZBOOK/OneDrive/Desktop/ecommers-store/docker-compose.yml)
Packages application alongside MongoDB and Redis containers into a single command setup.

---

## Verification Plan

### Automated Tests
- We will set up lightweight endpoint testing using a test runner (e.g. `Jest` or built-in Node test runner with `supertest`) to verify public and authenticated routes.

### Manual Verification
- **Postman Collection**: Build a structured Postman file covering auth, roles, CRUD, filters, carts, and order checkout flows.
- **Stripe Webhook CLI**: Run local Stripe CLI webhook simulations to verify the order success callbacks.
- **Docker validation**: Validate compose cluster spins up database, memory store, and application with single command.
