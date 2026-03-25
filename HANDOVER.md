# Project Handover Report - MharRuengSang

## 1. Project Features
The project, "Steamjek," is a digital game distribution and marketplace platform. Based on the source code and frontend wireframes received, the system supports the following key features:
- **User Authentication & Profiles:** User registration and login with JWT-based security, and user profile management (`authController`, `page7_profile.html`).
- **Game Storefront:** Browsing the game catalog, searching, and viewing detailed game information (`gamesController`, `page1_store.html`, `page2_game_detail.html`).
- **Shopping Cart & Checkout:** Managing a cart of games and facilitating secure transactions using a Stripe integration (`cartController`, `purchasesController`, `page3_cart.html`).
- **User Library:** Viewing games a user has purchased and currently owns (`page6_library.html`).
- **Community Marketplace:** A secondary market allowing users to buy, sell, and trade in-game items (`marketController`, `page4_marketplace.html`).
- **Wishlisting:** Adding and removing games from a personal wishlist for future purchases (`wishlistController`, `page5_wishlist.html`).
- **Ratings & Reviews:** Allowing users to leave 1-5 star ratings and comments on games (`ratingsController`).
- **Admin Management:** Special administrative tools for overseeing and approving users, games, and marketplace activity (`adminController`).

## 2. Design Verification
The implementation closely follows the structural design outlined in the C4 documentation.

## Context Diagram

* **Consistencies:** The actors **User**, **Game Creator**, and **Admin** are consistently represented in the implementation. The system still functions as a platform for browsing, purchasing, and managing games.
* **Update the C4 Diagram:**
    * Update the database specification from only "Cloud Database" to specifically use **PostgreSQL**.
    * The external payment system can be confirmed to be **Stripe API**.

## Container Diagram

* **Consistencies:**
    * The split between **Frontend** and **Backend** remains accurate. But some part of code in Frontend still use hardcode.
* **Update the C4 Diagram:**
    * Update **Database** container to **PostgreSQL**.
    * Include **JWT (JSON Web Token)** as the specific container.
    * The external payment system can be confirmed to be **Stripe API**.

## Component Diagram

### SteamJek App Client 
* **Consistencies:** The frontend uses a modular structure where specific pages (Store, Cart, Profile) interact with a centralized `api.js` for data fetching.
* **Update the C4 Diagram:** Note the use of **Local Storage** for persistent token storage, which manages the "Authenticated" state.

### API Gateway Service
* **Consistencies:** The entry point for all client requests is handled by the **Express** server, which routes traffic to specific sub-services/controllers.
* **Update the C4 Diagram:** Add **CORS Middleware** and **JSON Parsing Middleware** as explicit components at the gateway level to reflect implementation requirements.

### Order & Cart Service
* **Consistencies:** Implemented via `cartController.js` and `cart.js` routes, handling the logic for adding, removing, and viewing items in a user's temporary purchase list.
* **Update the C4 Diagram:**
    * Include the **Stripe Integration Component** within this service to handle the final checkout and payment verification.
    * Update **Database** container to **PostgreSQL**.

### Store Service
* **Consistencies:** Managed by the `gamesController.js`, allowing users to retrieve lists of games and specific game details.
* **Update the C4 Diagram:** Add a **Rating/Review Component** as the implementation includes specific logic for user feedback and average ratings.

### User Service
* **Consistencies:** The `authController.js` handles user profile data and account management.
* **Update the C4 Diagram:** Explicitly show the **Bcrypt Hashing Component** used for protecting user passwords during storage and verification.

### Marketplace Service
* **Consistencies:** Dedicated logic in `marketController.js` handles item listings and community transactions.
* **Update the C4 Diagram:** Add a **Transaction Ledger Component** to track marketplace history between buyers and sellers.

### Search Service
* **Consistencies:** Search functionality is integrated into the `gamesController.js` through **SQL queries** (using LIKE or full-text search parameters).
* **Update the C4 Diagram:** Rather than a standalone service, represent this as a **Search Query Component** within the Store Service.

### Authentication Service
* **Consistencies:** Secure login and registration are handled via dedicated endpoints in `routes/auth.js`.
* **Update the C4 Diagram:** Formally add the **JWT Generator/Validator** as the core component that issues and verifies access tokens for all other protected services.


## 3. Reflections on Project Handover

### a. Technologies Used
- **Backend Infrastructure:** Node.js backend using the Express.js framework for RESTful API routing.
- **Database:** PostgreSQL used as the primary relational database, interfaced via `pg` (node-postgres) and pure SQL queries (`setup.sql`, `migrate_v2.sql`).
- **Frontend / Client:** Vanilla HTML, CSS, and JavaScript. It is wrapped as a desktop client using **Electron** (`electron .` setup).
- **Payments:** Stripe API for handling checkout and payments.
- **Security & Validation:** JSON Web Tokens (JWT) for route authorization and access control (e.g., `isAuth`, `isAdmin` middlewares).
- **Testing:** Evidence of test scripts in the `tests/` directory (likely Jest or Supertest) for testing backend endpoints.

### b. Required Information for a Successful Handover
To successfully receive and deploy this project without friction, the receiving team requires:
1. **Environment Variables:** A `.env.example` file that shows exactly all the necessary configuration keys (e.g. `DB_HOST`, `DB_PASSWORD`, `JWT_SECRET`, `STRIPE_SECRET_KEY`).
2. **Setup Instructions:** Step-by-step commands to install dependencies (`npm install`), boot the database schema (`node migrate.js`), and populate it with seed data (`node db_seed.js`).
3. **Execution Commands:** Clear instructions on how to start the independent backend server and the Electron-based frontend concurrently.
4. **Third-Party Services Context:** Stripe test accounts and test card details mapped to the `.env` provided in order to verify full business logic (checkout flows).
5. **System Architecture Document:** Up-to-date C4 Model or ERD (Entity Relationship Diagram) mapping out the domains (store vs. community market).

### c. Code Quality (SonarQube)
![SonarQube](Image/SonarQube.png)
![Issues](Image/Issue.png)

### d. Identified & Resolved Initialization Issues
During the initial setup and handover of this codebase, several configuration and database script bugs were identified and successfully fixed:
1. **Database SSL Connection Failure:** The `pg` pool connection in `db/index.js` was hardcoded to `ssl: { rejectUnauthorized: false }`, which caused connection errors for local servers that didn't support SSL.
    * *Resolution:* Made SSL conditional based on a `.env` variable (checking for `DB_SSL=true`).
2. **PostgreSQL Permissions Issues:** Application queries and migrations previously threw `error: permission denied for table games` and ownership errors because database tables were assigned to the local system user rather than the defined `postgres` role.
    * *Resolution:* Altered the schema, table, and sequence ownerships to explicitly belong to the `postgres` user using PostgreSQL administration scripts.
3. **Seeding Script Errors (`db_seed.js`):** The seed script couldn't execute cleanly due to parameter mismatch issues (asking for SQL bind parameters like `$6` or `$8` but providing too few values) and an outdated trailing foreign-key constraint (`market_listings_item_id_fkey`) colliding with the newer `item_type_id` schema migration.
    * *Resolution:* Corrected the query bind parameter indexes in the script and dropped the stale constraint on `market_listings` in the database, updating it to properly reference `item_types`. The migrations and seeders now execute without failing.
