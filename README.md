# SteamJek — Digital Game Distribution Platform

> A Steam-like digital game distribution platform for Windows PC, built for third-party and indie game developers to publish, sell, and manage their games.

---

## 📋 Project Overview

SteamJek is a full-stack digital game distribution platform featuring:

- **Game Store** — Browse, search, and purchase games by genre, price, and age rating
- **Library** — Access purchased games with cloud/local toggle
- **Shopping Cart** — Add games and checkout with Stripe payment simulation
- **Wishlist** — Save games for later
- **Ratings & Reviews** — Rate and review games you own
- **In-Game Item Marketplace** — Buy and sell in-game items between users
- **Admin Panel** — Approve/reject game submissions, manage users and purchases
- **JWT Authentication** — Secure login and registration system

---
## How to run (Just from EXE)
Download An EXE FROM THIS link  https://drive.google.com/file/d/1M3M4b4493s-jDjHtHWgLhGj-Ev3_VrhS/view?usp=sharing

## 🛠 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | v22 |
| Framework | Express.js | ^5.2.1 |
| Database | PostgreSQL | 16 |
| Authentication | JSON Web Token (JWT) | ^9.0.3 |
| Password Hashing | bcryptjs | ^3.0.3 |
| Payment Processing | Stripe | ^20.4.1 |
| Environment Config | dotenv | ^17.3.1 |
| Cross-Origin | cors | ^2.8.6 |
| Dev Server | nodemon | ^3.1.14 |
| Testing | Jest + Supertest | ^29.7.0 / ^7.0.0 |
| API Testing | Postman | — |

---

## ✅ Prerequisites

Before running the test for this project, make sure you have the following installed:

- **Node.js** v18 or higher — https://nodejs.org
- **PostgreSQL 16** — https://www.postgresql.org/download
- **Neon Database** (optional, for database management) — https://neon.com/
- **Git** — https://git-scm.com
- **Postman** (optional, for API testing) — https://www.postman.com
- **Stripe Account** (for payment simulation) — https://stripe.com

---

## 🚀 Build & test Instructions

### 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/2025-ITCS383-Motrakor.git
cd Implementations/steamjek-backend
```

### 2 — Install Dependencies

```bash
npm install
```

### 3 — Configure Environment Variables

Create a `.env` file in the root of `steamjek-backend/`:

```env
PORT=3000
JWT_SECRET=your_jwt_secret_key_here

DB_HOST=localhost
DB_PORT=5432
DB_NAME=steamjek
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

> Get your Stripe test keys from https://dashboard.stripe.com → Developers → API Keys

### 4 — Set Up the Database

Open **pgAdmin 4** or any PostgreSQL client and run the following SQL:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  address TEXT,
  credit_card_token VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  genre VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  age_rating VARCHAR(20),
  creator_id INTEGER REFERENCES users(id),
  file_url VARCHAR(255),
  cover_image VARCHAR(255),
  system_requirements TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id)
);

CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id)
);

CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id)
);

CREATE TABLE item_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  image_url VARCHAR(255),
  rarity VARCHAR(50) DEFAULT 'common',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_items (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_id, item_type_id)
);

CREATE TABLE market_listings (
  id SERIAL PRIMARY KEY,
  item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 1),
  price DECIMAL(10,2) NOT NULL,
  is_sold BOOLEAN DEFAULT false,
  listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE market_transactions (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES market_listings(id),
  buyer_id INTEGER REFERENCES users(id),
  seller_id INTEGER REFERENCES users(id),
  item_type_id INTEGER REFERENCES item_types(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5 — Start the Development Server

```bash
npm run dev
```

Server starts at: **http://localhost:3000** ✅

---

## ⚠️ Warning

- **Never commit your `.env` file** — it is listed in `.gitignore` for security
- **Never share your `STRIPE_SECRET_KEY`** or `JWT_SECRET` publicly
- All Stripe payments use **test mode only** — no real charges are made
- The `STRIPE_SECRET_KEY` must start with `sk_test_` for test mode
- Changing a user's role to `admin` requires re-login to get an updated JWT token
- Ratings can only be submitted by users who have **purchased** the game
- Games must be **approved by an admin** before they appear in the public store

---

## 🔌 Default Ports

| Service | Port |
|---|---|
| Express Backend | 3000 |
| PostgreSQL | 5432 |


---

## 📡 API Endpoints with Postman

All endpoints are prefixed with `/api`

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login and receive JWT token |

### 🎮 Games — `/api/games`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/` | ❌ | Get all approved games |
| GET | `/:id` | ❌ | Get single game by ID |
| GET | `/search?query=&genre=` | ❌ | Search and filter games |
| POST | `/` | ✅ | Create a new game listing |

### 🛒 Cart — `/api/cart`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/` | ✅ | Get current user's cart |
| POST | `/` | ✅ | Add game to cart |
| DELETE | `/:gameId` | ✅ | Remove game from cart |

### 💳 Purchases — `/api/purchases`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/` | ✅ | Get purchase history |
| POST | `/create-payment-intent` | ✅ | Create Stripe payment intent |
| POST | `/confirm` | ✅ | Confirm payment and finalize purchase |

### ❤️ Wishlist — `/api/wishlist`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/` | ✅ | Get user's wishlist |
| POST | `/` | ✅ | Add game to wishlist |
| DELETE | `/:gameId` | ✅ | Remove game from wishlist |

### ⭐ Ratings — `/api/ratings`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/:gameId` | ❌ | Get all ratings for a game |
| POST | `/:gameId` | ✅ | Rate a game (must own it) |

### ⚔️ Marketplace — `/api/market`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/listings` | ❌ | Get all active listings |
| GET | `/my-items` | ✅ | Get user's item inventory |
| GET | `/my-listings` | ✅ | Get user's active listings |
| POST | `/listings` | ✅ | List item for sale |
| POST | `/buy/:listingId` | ✅ | Purchase a listed item |

### 🔧 Admin — `/api/admin`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/users` | ✅ Admin | Get all users |
| DELETE | `/users/:id` | ✅ Admin | Delete a user |
| GET | `/games/pending` | ✅ Admin | Get pending game approvals |
| PUT | `/games/:id/approve` | ✅ Admin | Approve a game |
| DELETE | `/games/:id/reject` | ✅ Admin | Reject a game |
| GET | `/purchases` | ✅ Admin | Get all platform purchases |

### Authentication Header Format
```
Authorization: Bearer <your_jwt_token>
```

---

## 🧪 Running Backend Tests

### Run All Tests
```bash
npm test
```

### Run a Specific Test File
```bash
npx jest tests/auth.test.js
npx jest tests/games.test.js
npx jest tests/cart.test.js
npx jest tests/purchases.test.js
npx jest tests/wishlist.test.js
npx jest tests/ratings.test.js
npx jest tests/market.test.js
npx jest tests/admin.test.js
```

### Test Files Location
```
tests/
├── auth.test.js        — Register & Login
├── games.test.js       — Game CRUD & Search
├── cart.test.js        — Cart Management
├── purchases.test.js   — Stripe Payment & Checkout
├── wishlist.test.js    — Wishlist Management
├── ratings.test.js     — Game Ratings & Reviews
├── market.test.js      — Item Marketplace
└── admin.test.js       — Admin Operations
```

---

## 📊 Test Results
```
Test Suites: 8 passed, 8 total
Tests:       42 passed, 42 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        4.745 s, estimated 5 s
```
---

## 🐛 Common Issues

**`Cart is empty` error during purchases test**
The cart may have been cleared by a previous test run. The `beforeAll` in `purchases.test.js` clears and re-adds the game automatically. If it still fails, manually verify:
```sql
SELECT * FROM cart;
SELECT * FROM games WHERE is_approved = true;
```

**`relation "items" does not exist` error**
You still have the old `items` table structure. Drop and recreate the market tables using the SQL in step 4, then update `controllers/marketController.js` to use `item_types` and `user_items`.

**`Email already registered` in auth tests**
The test user already exists from a previous run. Auth tests use a timestamped email (`testuser_<timestamp>@example.com`) to avoid this automatically.

**`Payment not completed. Status: requires_payment_method`**
You created a Payment Intent but haven't confirmed it with a test card. Confirm via Stripe API using `pm_card_visa` before calling `/api/purchases/confirm`.

**`Access denied. Admins only.`**
The JWT token was issued before the role was updated to admin. Update the role then log in again:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

**`No tests found` when running `npm test`**
Make sure your `package.json` jest config includes:
```json
"jest": {
  "testMatch": ["**/tests/**/*.test.js"]
}
```

**PostgreSQL connection refused**
Make sure the PostgreSQL service is running. On Windows open **Services** and start `postgresql-x64-16`.

---

## 👤 Test Accounts

Register an account via the API, then promote to admin via SQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@steamjek.com';
```
### Pre-seeded Test Accounts

| Name | Email | Password | Role |
|---|---|---|---|
| Alice | alice@example.com | password123 | user |

### Stripe Test Cards

| Card Type | Number | Result |
|---|---|---|
| Visa (success) | `4242 4242 4242 4242` | ✅ Payment succeeds |
| Card declined | `4000 0000 0000 0002` | ❌ Payment declined |
| Insufficient funds | `4000 0000 0000 9995` | ❌ Insufficient funds |

> Use any future expiry date and any 3-digit CVV

---

## 📁 Repository Structure

```
2025-ITCS383-Motrakor/
├── README.md                           — Project documentation (this file)
├── Motrakor_D3_AILog.md                — AI log and development notes
├── sonar-project.properties            — SonarQube configuration
├── steamjekDB.sql                      — Database schema and seed data
│
├── designs/
│   └── Motrakor_D1_Design.md           — Design document and architecture
│
└── Implementations/
    ├── test/                           — Test utilities
    │
    ├── steamjek-backend/               — Express.js Backend Server
    │   ├── config/
    │   │   └── stripe.js               — Stripe payment client config
    │   │
    │   ├── controllers/                — Business logic handlers
    │   │   ├── authController.js       — Register & Login logic
    │   │   ├── gamesController.js      — Game CRUD & search operations
    │   │   ├── cartController.js       — Shopping cart management
    │   │   ├── purchasesController.js  — Checkout & Stripe payment processing
    │   │   ├── wishlistController.js   — User wishlist management
    │   │   ├── ratingsController.js    — Game ratings & reviews
    │   │   ├── marketController.js     — In-game item marketplace
    │   │   └── adminController.js      — Admin dashboard operations
    │   │
    │   ├── middleware/                 — Express middleware
    │   │   ├── auth.js                 — JWT verification & authentication
    │   │   └── isAdmin.js              — Admin role authorization guard
    │   │
    │   ├── routes/                     — API route definitions
    │   │   ├── auth.js                 — /api/auth endpoints
    │   │   ├── games.js                — /api/games endpoints
    │   │   ├── cart.js                 — /api/cart endpoints
    │   │   ├── purchases.js            — /api/purchases endpoints
    │   │   ├── wishlist.js             — /api/wishlist endpoints
    │   │   ├── ratings.js              — /api/ratings endpoints
    │   │   ├── market.js               — /api/market endpoints
    │   │   └── admin.js                — /api/admin endpoints
    │   │
    │   ├── db/                         — Database configuration
    │   │   ├── index.js                — PostgreSQL connection pool
    │   │   ├── setup.sql               — Initial database schema
    │   │   └── migrate_v2.sql          — Database migration scripts
    │   │
    │   ├── tests/                      — Jest unit & integration tests
    │   │   ├── auth.test.js            — Authentication tests
    │   │   ├── games.test.js           — Games endpoint tests
    │   │   ├── cart.test.js            — Shopping cart tests
    │   │   ├── purchases.test.js       — Stripe payment tests
    │   │   ├── wishlist.test.js        — Wishlist tests
    │   │   ├── ratings.test.js         — Ratings endpoint tests
    │   │   ├── market.test.js          — Marketplace tests
    │   │   ├── admin.test.js           — Admin operations tests
    │   │   ├── setup.js                — Test environment setup
    │   │   └── smoke-test.js           — Smoke test suite
    │   │
    │   ├── .env                        — Environment variables (GITIGNORE)
    │   ├── .gitignore                  — Git ignore rules
    │   ├── server.js                   — Express app entry point
    │   ├── package.json                — NPM dependencies & scripts
    │   ├── check_db.js                 — Database connection checker
    │   ├── db_seed.js                  — Database seeding script
    │   ├── migrate.js                  — Database migration runner
    │   ├── seed.js                     — Seed script for test data
    │   └── test-wishlist.js            — Wishlist feature testing
    │
    └── steamjek-frontend/              — Vanilla JavaScript Frontend
        ├── api.js                      — Frontend API client (XHR calls)
        ├── main.js                     — Global app logic & utilities
        ├── package.json                — Frontend dependencies
        │
        └── HTML Pages/
            ├── page1_store.html        — Game store & catalog
            ├── page2_game_detail.html  — Individual game details
            ├── page3_cart.html         — Shopping cart page
            ├── page4_marketplace.html  — In-game item marketplace
            ├── page5_wishlist.html     — User wishlist page
            ├── page6_library.html      — Purchased games library
            └── page7_profile.html      — User profile & account page
```

---

## 📝 Notes

- All Stripe payments run in **test mode** — no real money is charged
- The `.env` file is excluded from Git via `.gitignore` — never commit it
- JWT tokens expire after **7 days**
- Games are **not publicly visible** until approved by an admin (`is_approved = true`)
- Users can only rate a game they have **purchased**
- The marketplace uses a **quantity-based inventory system** — one row per item type per user, tracked by quantity
- Selling an item reduces the seller's quantity; buying increases the buyer's quantity automatically
- When deploying to production, set environment variables directly on your hosting platform (Railway, Render, etc.) — never use a `.env` file on the server
- For cloud database hosting, use **NeonDB** (free PostgreSQL) and set `DATABASE_URL` with SSL enabled in `db/index.js`

## Members of Motrakor
```
6688006 Kuntapat Asawaworarit
6688134 Pawaris Traimongkolkul
6688144 Napat Wiangain
6688152 Thanadon Yindeesuk
6688160 Akanat Apiluckpanich
6688161 Tinnaphob Boonkua
```

---

*Built as part of ITCS383 Software Engineering Project — Mahidol University 2025*
