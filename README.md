# ShopSphere — Production-Grade E-Commerce Backend API

A scalable, secure, and production-ready RESTful backend API built to power a full e-commerce platform, following professional software engineering standards.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 |
| Framework | Express.js 5 |
| Database | MongoDB + Mongoose |
| Auth | Better Auth (JWT + HttpOnly cookies) |
| Validation | Zod |
| Payments | Stripe |
| File Upload | Multer + Cloudinary |
| Caching | Redis |
| Email | Nodemailer |
| Logging | Winston |
| Containers | Docker + Docker Compose |

---

## Architecture

```
src/
├── config/          # Database, Redis, Cloudinary, Stripe config
├── controllers/     # Route handlers (thin — delegate to services)
├── middleware/      # Auth, role, validation, cache, upload, error handlers
├── models/          # Mongoose schemas (User, Product, Category, Order, Cart, Wishlist, Review)
├── routes/          # Express routers
├── services/        # Business logic (email, payment, upload)
├── utils/           # ApiError, logger, APIFeatures
└── validations/     # Zod schemas
```

---

## Getting Started

### Prerequisites
- Node.js 22+
- MongoDB Atlas account (or local MongoDB replica set for transactions)
- Redis 7+
- Stripe account
- Cloudinary account
- SMTP credentials (e.g. Mailtrap for development)

### Installation

```bash
git clone https://github.com/FarooqK-Nu/shopsphere.git
cd shopsphere
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=3000
NODE_ENV=development

# MongoDB
DATABASE_URL=mongodb+srv://<user>:<db_password>@cluster.mongodb.net/
DATABASE_PASSWORD=your_password

# Better Auth
BETTER_AUTH_SECRET=your-32-char-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis
REDIS_URL=redis://localhost:6379

# Email (Nodemailer)
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_user
EMAIL_PASS=your_pass
EMAIL_FROM="ShopSphere Support" <support@shopsphere.com>
```

### Run Locally

```bash
# Development (with hot reload)
npm run dev

# Production
NODE_ENV=production npm start
```

### Run with Docker

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f api

# Stop services
docker compose down
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication — `/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/sign-up/email` | Public | Register a new user |
| POST | `/auth/sign-in/email` | Public | Login |
| POST | `/auth/sign-out` | Auth | Logout |

### Products — `/products`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/products` | Public | List products (filter, sort, paginate) |
| GET | `/products/:id` | Public | Get single product |
| POST | `/products` | Admin | Create product + image upload |
| PATCH | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Delete product |

**Query Parameters:** `keyword`, `category`, `brand`, `price[gte]`, `price[lte]`, `ratings[gte]`, `sort`, `fields`, `page`, `limit`

### Categories — `/categories`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/categories` | Public | List all categories |
| GET | `/categories/:id` | Public | Get single category |
| POST | `/categories` | Admin | Create category |
| PATCH | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Delete category |

### Cart — `/cart`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/cart` | Auth | View cart |
| POST | `/cart` | Auth | Add item (validates stock) |
| PATCH | `/cart/:productId` | Auth | Update item quantity |
| DELETE | `/cart/:productId` | Auth | Remove item |
| DELETE | `/cart` | Auth | Clear entire cart |

### Wishlist — `/wishlist`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/wishlist` | Auth | View wishlist |
| POST | `/wishlist/:productId` | Auth | Add product |
| DELETE | `/wishlist/:productId` | Auth | Remove product |
| POST | `/wishlist/:productId/move-to-cart` | Auth | Move to cart |

### Orders — `/orders`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/orders` | Auth | Place order from cart (MongoDB transaction) |
| GET | `/orders/my-orders` | Auth | My orders (paginated) |
| GET | `/orders/:id` | Auth | Get order details |
| PATCH | `/orders/:id/cancel` | Auth | Cancel order (restores stock) |
| GET | `/orders` | Admin | All orders (filterable by status) |
| PATCH | `/orders/:id/status` | Admin | Update order status |

### Payments — `/payment`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/payment/checkout-session/:orderId` | Auth | Create Stripe checkout session |
| POST | `/payment/webhook` | Stripe | Stripe webhook (raw body) |

Webhook handles:
- `checkout.session.completed` → marks order as Paid + Confirmed
- `checkout.session.expired` → cancels order + restores inventory

### Reviews — `/reviews`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/reviews?product=:id` | Public | Get reviews for a product |
| POST | `/reviews` | Auth | Create review (1 per user per product) |
| PATCH | `/reviews/:id` | Auth | Update own review |
| DELETE | `/reviews/:id` | Auth/Admin | Delete review |

### Admin Analytics — `/admin`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | Admin | Overview stats (revenue, orders, users, products) |
| GET | `/admin/analytics/revenue` | Admin | Monthly revenue trend (12 months) |
| GET | `/admin/analytics/top-products` | Admin | Best-selling products |
| GET | `/admin/analytics/users` | Admin | User registration trend + role breakdown |
| GET | `/admin/analytics/inventory` | Admin | Low-stock products (`?threshold=10`) |

---

## Key Features

### Security
- **Better Auth** — session management with HttpOnly cookies and JWT
- **Helmet** — secure HTTP headers
- **CORS** — configurable origin whitelist
- **Rate Limiting** — 100 requests/min per IP
- **NoSQL Injection Protection** — `express-mongo-sanitize`
- **Zod Validation** — all inputs validated and sanitized before reaching the database

### Payments
- Stripe Checkout Sessions with a 30-minute expiration window
- Webhook signature verification for tamper-proof event handling
- Automatic inventory restoration when payment sessions expire

### Caching (Redis)
- Product lists cached for **60 seconds**
- Product detail pages cached for **120 seconds**
- Category lists/details cached for **5 minutes**
- Cache degrades gracefully — API continues to work without Redis

### Database
- MongoDB Atlas (replica set) for ACID-compliant **multi-document transactions**
- Transactions used on: order creation, order cancellation, admin cancellation, and expired session recovery
- MongoDB indexes on frequently queried fields for performance
- Aggregation pipelines for analytics

---

## License

MIT
