# FitStore — Fitness E-Commerce Website

> **Fuel Your Fitness Journey.**
> A MERN-stack (MongoDB, Express, React, Node.js) college project: an online store for gym equipment, supplements, fitness accessories, sportswear, sports shoes and yoga/recovery gear.

FitStore is a **demo / educational project**. Payments run in **Razorpay test mode only**: no real money is ever charged.

---

## Contents

1. [Features](#1-features)
2. [Tech stack](#2-tech-stack)
3. [Folder structure](#3-folder-structure)
4. [Required software](#4-required-software)
5. [Setup in VS Code](#5-setup-in-vs-code)
6. [Create a MongoDB Atlas database](#6-create-a-mongodb-atlas-database)
7. [Configure Google Sign-In](#7-configure-google-sign-in)
8. [Configure Razorpay (test mode)](#8-configure-razorpay-test-mode)
9. [Configure Resend (emails)](#9-configure-resend-emails)
10. [Environment variables](#10-environment-variables)
11. [Seed sample products](#11-seed-sample-products)
12. [Run the project](#12-run-the-project)
13. [Make yourself an admin](#13-make-yourself-an-admin)
14. [Tests](#14-tests)
15. [API reference & examples](#15-api-reference--examples)
16. [Manual test checklist](#16-manual-test-checklist)
17. [Troubleshooting](#17-troubleshooting)
18. [Known limitations](#18-known-limitations)
19. [Deploy: Vercel (client) + Render (server)](#19-deploy-vercel-client--render-server)

---

## 1. Features

**Shopping**
- Home page with hero banner, categories, featured products, bestsellers, a promo banner and testimonials (all product data comes from the API).
- Shop page with search, category filter, price range, in-stock filter, sorting and pagination (filters live in the URL).
- Category pages, a search results page and product details with related products.
- 6 categories and 26 seeded products with real, verified product photos (Unsplash).

**Accounts**
- **Google Sign-In only**: no passwords. The Google ID token is verified on the server with `google-auth-library`.
- The session is stored in a signed JWT inside an **HttpOnly cookie** (`SameSite=Lax` locally; `SameSite=None; Secure` in production, where client and API are on different domains).
- Profile page with saved delivery addresses.

**Cart & checkout**
- Server-side cart (embedded in the user document), so it persists across refreshes and devices.
- Stock limits, a maximum of 10 per item, and totals **always calculated by the server**.
- Shipping: flat ₹99, free on orders of ₹999 or more after discount (configurable).
- Checkout with validated delivery address (Indian mobile number and 6-digit PIN code).

**Payments (Razorpay test mode)**
- The server prices the cart, checks stock, creates a pending order and creates the Razorpay order.
- The browser opens Razorpay Checkout. The result is **verified on the server with the HMAC signature**.
- Idempotent payment processing: repeated or concurrent verification requests never double-deduct stock or send duplicate emails.
- Failed payments are recorded (confirmed with the Razorpay API). Customers can retry a pending order.
- Uses MongoDB transactions when available (Atlas), with a safe fallback otherwise.

**Orders**
- My Orders, order details with a status timeline, and a payment result page.
- Customers can cancel orders that are awaiting payment or confirmed. Stock is restored exactly once.
- Admin status workflow with server-validated transitions and a simulated (demo) tracking number.

**Emails (Resend)**
- Emails for: welcome (first sign-in only), order confirmation, payment failure, status update and cancellation.
- Responsive HTML with plain-text versions. User content is HTML-escaped.
- Idempotent: an `EmailEvent` record per email key prevents duplicates.
- Email failures never affect orders or payments.

**Admin panel**
- Dashboard: paid revenue (verified payments only), orders, products, users, orders by status, low stock and recent orders.
- Product CRUD with search, pagination and image preview.
- Order list with search and filters, plus order detail with status updates.
- Every admin API checks the JWT **and** the admin role stored in the database.

**Reviews**
- One review per user per product (enforced by a unique index).
- Average rating is recalculated from the reviews collection.
- A "Verified purchase" badge is decided by the server. Seeded reviews are labelled "Demo review".

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, React Router 7, Axios, Context API, plain CSS, Lucide icons |
| Backend | Node.js 20+, Express 4, Mongoose 8 |
| Database | MongoDB Atlas |
| Auth | Google Identity Services + `google-auth-library`, JWT in an HttpOnly cookie |
| Payments | Razorpay Checkout + Razorpay Node SDK (test mode) |
| Email | Resend Node SDK |
| Security | helmet, cors, express-rate-limit, CSRF header check, input validation |
| Tests | Node's built-in test runner, supertest, mongodb-memory-server |

---

## 3. Folder structure

```
FitStore (this folder)/
├── client/                      React frontend (Vite)
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json              SPA fallback (deep links work on refresh)
│   ├── .env.example
│   └── src/
│       ├── api/                 axios instance + endpoint functions
│       ├── assets/
│       ├── components/          Navbar, Footer, ProductCard, ReviewSection, ...
│       ├── context/             AuthContext, CartContext, ToastContext
│       ├── hooks/               useApi, useDocumentTitle, useRazorpayCheckout
│       ├── layouts/             MainLayout, AdminLayout
│       ├── pages/               all store pages
│       │   └── admin/           admin pages
│       ├── routes/              ProtectedRoute, AdminRoute
│       ├── styles/              global.css, components.css, pages.css, admin.css
│       ├── utils/               formatting, constants, validation, script loader
│       ├── App.jsx              all routes
│       └── main.jsx
├── server/                      Express backend
│   ├── .env.example
│   ├── src/
│   │   ├── config/              env, db (+transactions), constants
│   │   ├── controllers/         auth, product, category, cart, order, admin, review, user
│   │   ├── middleware/          auth, csrf, rate limiters, error handler
│   │   ├── models/              User, Category, Product, Review, Order, EmailEvent
│   │   ├── routes/
│   │   ├── services/            orderService, cartService, emailService, razorpayService, googleAuthService
│   │   ├── templates/           HTML email templates
│   │   ├── utils/               pricing, signatures, validators, helpers
│   │   ├── app.js               Express app (no listen - used by tests)
│   │   └── server.js            entry point
│   ├── scripts/
│   │   ├── seedData.js
│   │   ├── seedProducts.js
│   │   └── promoteAdmin.js
│   └── tests/
├── README.md
├── PROJECT_DOCUMENTATION.md
└── .gitignore
```

---

## 4. Required software

| Software | Version | Check |
|---|---|---|
| Node.js | **20 or newer** (LTS recommended) | `node -v` |
| npm | 10+ (comes with Node) | `npm -v` |
| VS Code | latest | — |
| Git (optional) | any | `git --version` |
| Google Chrome / Edge / Firefox | latest | — |

Accounts needed (all free): **MongoDB Atlas**, **Google Cloud**, **Razorpay** (test mode) and **Resend**.

---

## 5. Setup in VS Code

1. Open VS Code → **File → Open Folder…** and choose this project folder.
2. Open a terminal with **Terminal → New Terminal** (shortcut: `` Ctrl+` ``).
3. Install dependencies for both apps:

```bash
# macOS / Linux / Windows (PowerShell or CMD)
cd server
npm install
cd ../client
npm install
cd ..
```

4. Create the environment files from the examples.

```bash
# macOS / Linux
cp server/.env.example server/.env
cp client/.env.example client/.env
```

```powershell
# Windows PowerShell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

```bat
:: Windows CMD
copy server\.env.example server\.env
copy client\.env.example client\.env
```

Then fill in the values by following the next sections.

---

## 6. Create a MongoDB Atlas database

1. Sign in at <https://www.mongodb.com/cloud/atlas> and create a **free (M0) cluster**.
2. **Database Access → Add New Database User**: choose a username and a strong password. Give it the role *Read and write to any database*.
3. **Network Access → Add IP Address**: add your current IP. For a classroom demo you may use `0.0.0.0/0`; remove it afterwards.
4. **Database → Connect → Drivers**: copy the connection string, which looks like this:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
5. Insert the database name `fitstore` before the `?` and paste it into `server/.env`:

```env
MONGODB_URI=mongodb+srv://fituser:YourPassword@cluster0.xxxxx.mongodb.net/fitstore?retryWrites=true&w=majority
```

> If your password contains special characters (`@ : / ? #`), URL-encode them (for example `@` → `%40`).

Atlas clusters are replica sets, so FitStore uses **MongoDB transactions** for payment and stock updates. The server log shows `Transactions enabled`.

---

## 7. Configure Google Sign-In

1. Go to <https://console.cloud.google.com/> and create (or select) a project, for example "FitStore".
2. **APIs & Services → OAuth consent screen**:
   - User type: **External** → Create.
   - App name: `FitStore`; user support email and developer email: your email.
   - Scopes: the defaults are enough (`email`, `profile`, `openid`).
   - **Test users**: add the Google accounts you will use for the demo (needed while the app is in "Testing" status).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Name: `FitStore Web`
   - **Authorized JavaScript origins** (both are needed for local development):
     - `http://localhost`
     - `http://localhost:5173`
   - Authorized redirect URIs: *leave empty*. FitStore uses the popup flow with ID tokens.
4. Copy the **Client ID** (it ends with `.apps.googleusercontent.com`) into **both** files:

```env
# server/.env
GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
# client/.env
VITE_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
```

> The client ID is public. There is **no client secret** in this flow, and none is needed.
> Changes to authorized origins can take a few minutes to apply.

**How it works:** Google shows its popup → returns an **ID token** → React sends it to `POST /auth/google` → the server verifies the signature, audience, issuer and expiry with `google-auth-library` → finds or creates the user → sets the HttpOnly session cookie. The server never trusts a name, email or role sent by the browser.

---

## 8. Configure Razorpay (test mode)

1. Create an account at <https://dashboard.razorpay.com/signup>. You do **not** need KYC or activation for test mode.
2. Make sure the dashboard toggle at the top shows **Test Mode**.
3. **Account & Settings → API Keys → Generate Test Key**. Copy the **Key ID** (`rzp_test_...`) and the **Key Secret**.

```env
# server/.env  (the secret stays on the server!)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
# client/.env  (public key id only, optional - the server also sends it)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
```

The server **refuses to start** unless the key ID starts with `rzp_test_`, so live payments cannot be enabled by accident.

### Test payment methods

In test mode no money moves, and Razorpay shows a simulated bank page.

| Want to test | What to do in Razorpay Checkout |
|---|---|
| Successful payment | UPI → enter `success@razorpay` |
| Failed payment | UPI → enter `failure@razorpay` |
| Card payment | Use a card from Razorpay's **"Test Card Details"** docs page; on the mock bank page choose *Success* or *Failure* |
| Abandoned payment | Close the Checkout popup |

---

## 9. Configure Resend (emails)

1. Sign up at <https://resend.com> → **API Keys → Create API Key** (Sending access) and paste it into `RESEND_API_KEY`.
2. **Sender verification (important):** Resend only sends from **domains you have verified**.
   - **Quick testing without a domain:** use `RESEND_FROM_EMAIL=FitStore <onboarding@resend.dev>`. Resend's test sender **only delivers to the email address of your own Resend account**. Sign in to FitStore with that same Google account to receive the emails.
   - **To email anyone:** in Resend → **Domains → Add Domain**, add the DNS records (SPF/DKIM) at your domain provider, wait until it shows *Verified*, then use for example `RESEND_FROM_EMAIL=FitStore <orders@yourdomain.com>`.
   - You cannot send from an arbitrary address like `@gmail.com`.
3. **No Resend account?** Leave `RESEND_API_KEY` empty. Emails are then skipped and logged as `[email] Skipped "order-confirmed" - Resend is not configured.` Every other feature keeps working.

Every email attempt is recorded in the `emailevents` collection with status `sent`, `failed` or `skipped`, so you can show it during the viva.

---

## 10. Environment variables

### `server/.env`

| Variable | Required | Example / notes |
|---|---|---|
| `PORT` | no | `5050`. Avoid 5000 on macOS (AirPlay uses it). |
| `NODE_ENV` | no | `development` or `production` (production makes the cookie `Secure`) |
| `CLIENT_URL` | yes | `http://localhost:5173`. Used for CORS and links in emails. |
| `MONGODB_URI` | **yes** | Atlas connection string |
| `GOOGLE_CLIENT_ID` | **yes** | OAuth Web client ID |
| `JWT_SECRET` | **yes** | at least 32 random characters, e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | no | `7d` (session length) |
| `RESEND_API_KEY` | optional | `re_...` |
| `RESEND_FROM_EMAIL` | optional | `FitStore <onboarding@resend.dev>` |
| `RAZORPAY_KEY_ID` | **yes** | must start with `rzp_test_` |
| `RAZORPAY_KEY_SECRET` | **yes** | test key secret. **Never** put it in the client. |
| `SHIPPING_CHARGE` | no | `99` |
| `FREE_SHIPPING_THRESHOLD` | no | `999` |
| `TRUST_PROXY` | no | `0` locally; `1` on Render |
| `COOKIE_SAMESITE` | no | leave unset: `lax` in development, `none` in production (client and API on different domains) |

### `client/.env`

Everything prefixed with `VITE_` ends up in the browser bundle, so it must be **public**.

| Variable | Example |
|---|---|
| `VITE_API_URL` | exact server URL: `http://localhost:5050` locally, `https://<service>.onrender.com` in production |
| `VITE_GOOGLE_CLIENT_ID` | same value as `GOOGLE_CLIENT_ID` |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_...` (public key ID only) |

**Checklist**
- [ ] `server/.env`: `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- [ ] `server/.env` (optional): `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- [ ] `client/.env`: `VITE_GOOGLE_CLIENT_ID` (and optionally `VITE_RAZORPAY_KEY_ID`)
- [ ] No secret appears in `client/.env`
- [ ] `.env` files are **not** committed (`.gitignore` already handles this)

---

## 11. Seed sample products

```bash
cd server
npm run seed
```

This creates **6 categories, 26 products and 12 demo reviews** (written by 3 demo reviewer accounts that cannot sign in).

> ⚠️ Re-running the seed **replaces** all categories, products and reviews and empties carts. Users and orders are kept; orders store their own product snapshots.

---

## 12. Run the project

Use **two terminals** in VS Code (click the **+** / split icon in the terminal panel).

**Terminal 1 — backend**
```bash
cd server
npm run dev        # auto-restarts on changes (node --watch)
```
Expected output:
```
[db] Connected to MongoDB (fitstore). Transactions enabled.
[server] FitStore API running on http://localhost:5050 (development)
```

**Terminal 2 — frontend**
```bash
cd client
npm run dev
```
Open **<http://localhost:5173>**.

The React app calls the server at `VITE_API_URL` (`http://localhost:5050`). `localhost:5173` and `localhost:5050` count as the same *site* for cookies, so the HttpOnly login cookie works locally.

### Production-style run

```bash
cd client && npm run build && npm run preview   # serves the built app on http://localhost:4173
cd server && npm start                         # node src/server.js
```

If you use the preview server, add `http://localhost:4173` to Google's authorized origins and set `CLIENT_URL=http://localhost:4173`.

### npm scripts

| Folder | Script | What it does |
|---|---|---|
| server | `npm run dev` | start API with auto-reload |
| server | `npm start` | start API (production) |
| server | `npm run seed` | seed categories, products, demo reviews |
| server | `npm run promote-admin -- <email>` | make a user admin (`--demote` to undo) |
| server | `npm test` | run the automated tests |
| client | `npm run dev` | Vite dev server on port 5173 |
| client | `npm run build` | production build into `client/dist` |
| client | `npm run preview` | serve the production build on port 4173 |

---

## 13. Make yourself an admin

There is **no API to become admin**, by design. Promote a trusted account locally:

1. Start the app and **sign in once with Google** using the account you want to promote.
2. Run:

```bash
cd server
npm run promote-admin -- yourname@gmail.com
# to undo:
npm run promote-admin -- yourname@gmail.com --demote
```

3. Refresh the website. **Admin** now appears in the navbar and the profile menu (`/admin`).

Alternative: in MongoDB Atlas → **Browse Collections → users**, edit the document and set `"role": "admin"`.

The role is always read from the database on each request, so the change applies immediately and cannot be faked by the browser.

---

## 14. Tests

```bash
cd server
npm test
```

**Current result: 37 tests, 37 passing.**

| File | What it covers |
|---|---|
| `tests/pricing.test.js` | discount handling, subtotal/discount/shipping/total maths, free-shipping threshold after discount, paise conversion |
| `tests/razorpaySignature.test.js` | valid payment signature accepted; wrong payment ID, wrong secret and malformed signatures rejected |
| `tests/authGuards.test.js` | 401 without a cookie, forged token rejected, 403 for non-admins on admin APIs, CSRF header guard, invalid Google credential rejected (no cookie issued) |
| `tests/validators.test.js` | address validation, review validation, HTML escaping in email templates |
| `tests/orders.integration.test.js` | **real MongoDB replica set (transactions):** repeated verification deducts stock once and sends one email; 5 concurrent confirmations processed once; invalid signature never marks paid; failed payment then retry; sold-out after payment → cancel + refund flag; cancel restocks once; users can't see or pay others' orders; cart totals and stock limits; product search/filter/pagination |
| `tests/orders.standalone.test.js` | same idempotency guarantees **without** transactions (standalone MongoDB), including manual rollback |

> The integration tests download a MongoDB binary (~70 MB) on the first run into a local cache. If you are offline they are reported as **skipped** instead of failing.

---

## 15. API reference & examples

All responses use the shape `{ "success": true, "data": ... }` or `{ "success": false, "message": "...", "details": {...} }`.

| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/google` | public (body: `{ credential }`) |
| GET | `/auth/me` | user |
| POST | `/auth/logout` | public |
| GET | `/products` | public: `page, limit, search, category, minPrice, maxPrice, sort, featured, inStock` |
| GET | `/products/:idOrSlug` | public |
| POST / PUT / DELETE | `/products`, `/products/:id` | admin |
| GET / POST | `/products/:id/reviews` | public / user |
| GET | `/categories` | public |
| GET / DELETE | `/cart` | user |
| POST | `/cart/items` | user: `{ productId, quantity }` |
| PATCH / DELETE | `/cart/items/:productId` | user |
| POST | `/orders/checkout` | user: `{ shippingAddress, saveAddress }` |
| GET | `/orders/my` | user |
| GET | `/orders/:id` | owner or admin |
| POST | `/orders/:id/verify-payment` | owner: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` |
| POST | `/orders/:id/payment-failed` | owner: `{ razorpay_payment_id }` (status re-checked with Razorpay) |
| POST | `/orders/:id/retry-payment` | owner |
| POST | `/orders/:id/cancel` | owner |
| GET / POST / DELETE | `/users/addresses[/:addressId]` | user |
| GET | `/admin/dashboard` | admin |
| GET | `/admin/orders` | admin: `page, limit, status, paymentStatus, search` |
| PATCH | `/admin/orders/:id/status` | admin: `{ status, note }` |
| GET | `/health`, `/config` | public |

**Security headers for API clients:** state-changing requests (POST/PUT/PATCH/DELETE) must include `X-FitStore-Client: web`. Authenticated requests need the `fitstore_token` cookie, which the browser receives after Google sign-in.

### curl examples (macOS / Linux / Git Bash)

```bash
# Public endpoints
curl http://localhost:5050/health
curl "http://localhost:5050/products?search=shoes&sort=price_asc&limit=5"
curl "http://localhost:5050/products?category=supplements&minPrice=500&maxPrice=2000"
curl http://localhost:5050/products/whey-protein-isolate-chocolate-1-kg
curl http://localhost:5050/categories

# Guards
curl -i http://localhost:5050/cart                 # 401 - not signed in
curl -i -X POST http://localhost:5050/auth/logout  # 403 - missing X-FitStore-Client header

# Authenticated (copy fitstore_token from DevTools -> Application -> Cookies after signing in)
TOKEN=paste-token-here
curl -b "fitstore_token=$TOKEN" http://localhost:5050/auth/me
curl -b "fitstore_token=$TOKEN" -H "X-FitStore-Client: web" -H "Content-Type: application/json" \
     -d '{"productId":"<PRODUCT_ID>","quantity":2}' http://localhost:5050/cart/items
```

Windows PowerShell example:
```powershell
Invoke-RestMethod "http://localhost:5050/products?search=yoga"
```

**Thunder Client / Postman:** create requests with the URLs above. For protected routes add a header `Cookie: fitstore_token=<token>`, and for POST/PUT/PATCH/DELETE also add `X-FitStore-Client: web`.

---

## 16. Manual test checklist

**Auth**
- [ ] "Sign in with Google" → the Google popup appears → you are signed in and your name and avatar show in the navbar
- [ ] First sign-in sends one welcome email; signing in again does **not**
- [ ] Sign out → protected pages (`/cart`, `/orders`, `/checkout`) redirect to `/login`
- [ ] Delete the `fitstore_token` cookie in DevTools → the next action asks you to sign in again
- [ ] A normal user opening `/admin` sees "403 – Admins only"; `GET http://localhost:5050/admin/dashboard` returns 403

**Catalogue**
- [ ] Home page loads categories, featured products and bestsellers from the API
- [ ] Shop: search, category filter, price filter, in-stock filter, sorting and pagination all work and update the URL
- [ ] Product page shows price, discount, stock status, reviews and related products
- [ ] An unknown product URL shows "Product not found"; an unknown page shows the 404 page

**Cart**
- [ ] Adding to the cart while signed out → asks you to sign in
- [ ] Add/increase/decrease/remove items; you cannot exceed stock or 10 per item
- [ ] Below ₹999 the cart shows ₹99 shipping and "add ₹X more"; at ₹999 or more shipping is FREE
- [ ] "Trail & Gym Backpack" (stock 0) cannot be added
- [ ] Refresh the page → the cart is still there

**Checkout & payment**
- [ ] Invalid phone or PIN code shows field errors (client) and the server rejects them too
- [ ] Pay with `success@razorpay` → result page "Payment successful", order Confirmed/Paid, stock reduced, cart emptied, one confirmation email
- [ ] Pay with `failure@razorpay` → "Payment failed" is recorded and the payment-failure email is sent → **Retry payment** works
- [ ] Close the popup → the order stays "Pending Payment" with a Retry button
- [ ] Refresh the result page or call verify again → no second stock deduction
- [ ] Cancel a confirmed order → status Cancelled, stock restored, simulated refund note, cancellation email

**Admin**
- [ ] Dashboard revenue counts only Paid orders
- [ ] Create / edit / delete a product (validation errors shown; duplicate SKU rejected)
- [ ] Orders list: search by order number or email, filter by status
- [ ] Status flow Confirmed → Processing → Shipped (demo tracking number) → Delivered; invalid jumps are rejected; each change emails the customer

**Reviews**
- [ ] Submit a review (1–5 stars, 10–1000 characters); a second review for the same product is rejected
- [ ] The rating average updates; a buyer's review shows "Verified purchase"

---

## 17. Troubleshooting

| Problem | Fix |
|---|---|
| `Missing required environment variables` on start | Create `server/.env` from `.env.example` and fill in the listed keys. |
| `RAZORPAY_KEY_ID must be a TEST key` | Use the key that starts with `rzp_test_` (Dashboard in Test Mode). |
| API calls return **403** with `server: AirTunes`, or `EADDRINUSE :5000` | macOS uses port 5000 for AirPlay. FitStore defaults to **5050**; keep `PORT=5050` (or turn off System Settings → AirDrop & Handoff → AirPlay Receiver). |
| `EADDRINUSE` on 5050 / 5173 | Another process is using the port. macOS: `lsof -i :5050` then `kill <PID>`. Windows: `netstat -ano \| findstr :5050` then `taskkill /PID <PID> /F`. |
| `MongoServerSelectionError` / timeout | Add your IP in Atlas → Network Access; check the username/password in the URI (URL-encode special characters). |
| Google button shows "not configured" | Set `VITE_GOOGLE_CLIENT_ID` in `client/.env` and **restart** `npm run dev` (Vite reads `.env` only at start-up). |
| Google error "origin is not allowed" / `origin_mismatch` | Add both `http://localhost` and `http://localhost:5173` to Authorized JavaScript origins; wait a few minutes. Open the site on `localhost`, not `127.0.0.1`. |
| Google popup: "access blocked: app has not completed verification" | Add your account under OAuth consent screen → **Test users**. |
| Signed in but immediately signed out | Open the site on `http://localhost:5173` (not `127.0.0.1`), check `VITE_API_URL=http://localhost:5050` and `CLIENT_URL=http://localhost:5173`, and restart Vite after editing `client/.env`. |
| "Missing or invalid client header" | Custom API clients must send `X-FitStore-Client: web` on POST/PUT/PATCH/DELETE. |
| Razorpay popup doesn't open | Check that ad blockers allow `checkout.razorpay.com`; check the keys; see the browser console. |
| "Could not start the payment" | Wrong `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` pair, or no internet on the server. |
| Emails not arriving | With `onboarding@resend.dev` only your Resend account email receives mail. Check spam and the `[email]` lines in the server log, or the `emailevents` collection. |
| Products page empty | Run `npm run seed` in `server/`. |
| Windows: `npm run promote-admin -- email` passes no email | Use `npm run promote-admin -- you@gmail.com` in PowerShell exactly as shown, or run `node scripts/promoteAdmin.js you@gmail.com`. |

---

## 18. Known limitations

- In the deployed version the client (Vercel) and API (Render) are on different domains, so the login cookie is a third-party cookie (`SameSite=None`). Safari, Brave, Firefox strict mode and Incognito windows block it, so sign-in only works in Chrome/Edge there. Hosting both on one domain (e.g. `app.` and `api.` subdomains of a custom domain) removes this.
- Payments are **test mode only**. Refunds are **simulated**: the order is marked "Refunded" with a note, but no Razorpay refund API call is made.
- Shipping/courier tracking is **simulated** (`DEMO-TRK-...` numbers).
- The cart requires sign-in (no guest cart), which keeps cart data on the server and simple.
- Without MongoDB transactions (e.g. a local standalone `mongod`), an extremely unlikely server crash between "order marked paid" and "stock deducted" could leave stock un-deducted. Atlas uses transactions, so this does not apply there.
- There is no Razorpay webhook. Payments are confirmed only when the browser returns from Razorpay Checkout. If a customer pays and closes the tab before that happens, the order stays "Pending Payment" (the payment is visible in the Razorpay Dashboard). Payment retries reuse the same Razorpay order, so the amount cannot change between attempts.
- Product images are external URLs (no image upload).
- The Contact form opens the visitor's email app (`mailto:`); messages are not stored by the server.
- Testimonials on the home page and seeded reviews are **demo content** and are labelled as such.

---

## 19. Deploy: Vercel (client) + Render (server)

No `render.yaml` is needed: Render is configured in its dashboard. Vercel only uses [client/vercel.json](client/vercel.json), which makes page refreshes on routes like `/orders/123` return the app instead of a 404.

### How it fits together

```
Browser ──► https://your-app.vercel.app          (React build, served by Vercel)
   │
   └──── API calls ──► https://your-api.onrender.com/products, /cart, ...   (Express on Render; VITE_API_URL)
                              └──► MongoDB Atlas / Razorpay / Resend / Google
```

The client calls the server at the exact URL in `VITE_API_URL`. Because `vercel.app` and `onrender.com` are **different sites**, the server sends the login cookie as `SameSite=None; Secure` in production (automatically, when `NODE_ENV=production`), and CORS only accepts requests from `CLIENT_URL`.

> ⚠️ **Browser limitation:** this makes the login cookie a *third-party cookie*. Chrome and Edge accept it. **Safari, Brave, Firefox (strict mode) and Incognito/private windows block it**, so Google sign-in fails there (browsing still works). Demo in a normal Chrome or Edge window. Avoiding this needs both apps on one domain, e.g. a custom domain with `app.yoursite.com` and `api.yoursite.com`.

### Step 0 — Push the code to GitHub

Both Vercel and Render deploy from a Git repository.

```bash
cd /path/to/this/project
git init
git add .
git status            # make sure NO .env file is listed (only .env.example)
git commit -m "FitStore initial commit"
# create an empty repository on github.com, then:
git remote add origin https://github.com/<you>/fitstore.git
git branch -M main
git push -u origin main
```

> `.gitignore` already excludes `.env`, `node_modules` and `dist`. To double-check, run `git check-ignore server/.env client/.env`; both paths should be printed.

### Step 1 — MongoDB Atlas: allow Render to connect

Render's free plan has no fixed outgoing IP address. In Atlas → **Network Access → Add IP Address**, add `0.0.0.0/0` (allow from anywhere). Your database is still protected by its username and password.

### Step 2 — Deploy the server on Render

1. <https://dashboard.render.com> → **New → Web Service** → connect your GitHub repository.
2. Settings:

| Setting | Value |
|---|---|
| Name | `fitstore-api` (this becomes `https://fitstore-api.onrender.com`; Render adds a suffix if the name is taken) |
| Region | Singapore (closest to India) |
| Branch | `main` |
| **Root Directory** | `server` |
| Runtime | Node |
| **Build Command** | `npm ci --omit=dev` |
| **Start Command** | `npm start` |
| Instance Type | Free |

3. **Environment Variables**: add these (do **not** add `PORT`; Render sets it automatically):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` (this also makes the cookie `SameSite=None; Secure`) |
| `CLIENT_URL` | `https://your-app.vercel.app`. Use a placeholder for now and update it in Step 4. |
| `MONGODB_URI` | your Atlas connection string |
| `GOOGLE_CLIENT_ID` | your Google OAuth client ID |
| `JWT_SECRET` | a **new** long random string (don't reuse your local one) |
| `JWT_EXPIRES_IN` | `7d` |
| `RAZORPAY_KEY_ID` | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | your Razorpay test secret |
| `RESEND_API_KEY` | `re_...` (optional) |
| `RESEND_FROM_EMAIL` | e.g. `FitStore <onboarding@resend.dev>` (optional) |
| `SHIPPING_CHARGE` | `99` |
| `FREE_SHIPPING_THRESHOLD` | `999` |
| `TRUST_PROXY` | `1` |

4. **Advanced → Health Check Path**: `/health`
5. Click **Create Web Service**. When the log shows `FitStore API running`, open
   `https://fitstore-api.onrender.com/health`. You should see `{"success":true,...}`.
6. The products already exist if you seeded this Atlas database locally. Otherwise run `npm run seed` once from your computer, since it uses the same `MONGODB_URI`.

### Step 3 — Deploy the client on Vercel

1. <https://vercel.com/new> → import the same GitHub repository.
2. Settings:

| Setting | Value |
|---|---|
| **Root Directory** | `client` (click *Edit* and select the folder) |
| Framework Preset | Vite (auto-detected) |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. **Environment Variables** (all public values):

| Key | Value |
|---|---|
| `VITE_API_URL` | your exact Render URL, e.g. `https://fitstore-api.onrender.com` (no trailing slash) |
| `VITE_GOOGLE_CLIENT_ID` | your Google OAuth client ID |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_...` |

4. Click **Deploy** and note your URL, e.g. `https://fitstore-lakshya.vercel.app`.

### Step 4 — Connect the two

1. **Render → Environment**: set `CLIENT_URL` to your exact Vercel URL (https, no trailing slash) and save. Render redeploys automatically. Only this origin may call the API with cookies, and it is also used for links in emails.
2. **Google Cloud Console → APIs & Services → Credentials** → your OAuth client → **Authorized JavaScript origins**: add your Vercel URL, e.g. `https://fitstore-lakshya.vercel.app`. Keep the `localhost` entries for local development. The change can take a few minutes to apply.

### Step 5 — Test the live site (in Chrome or Edge)

- [ ] `https://<render-url>/health` returns `{"success":true,...}`
- [ ] The home page on Vercel shows categories and products
- [ ] Refreshing a deep link such as `/shop` or `/orders/...` does not 404
- [ ] Sign in with Google works and you stay signed in after a refresh
- [ ] Add to cart → checkout → pay with `success@razorpay` → order Confirmed
- [ ] Make yourself admin: run `npm run promote-admin -- you@gmail.com` locally (same Atlas database), then refresh

### Deployment troubleshooting

| Problem | Fix |
|---|---|
| First load is very slow, or API calls fail after a quiet period | Render's free plan **sleeps after ~15 minutes** without traffic, and waking up can take about a minute. Visitors see a centered *"Waking up the server…"* screen meanwhile, and the store opens by itself once the server responds (API requests wait up to 90 s). Before a demo, open `https://<render-url>/health` and wait for it to respond. |
| Products don't load; console shows a **CORS** error | `CLIENT_URL` on Render must exactly match the Vercel URL (https, no trailing slash). Vercel *preview* URLs are different origins, so use the production URL. |
| Products load but API calls go to `localhost:5050` | `VITE_API_URL` wasn't set in Vercel when it built. Set it, then redeploy (Deployments → ⋯ → Redeploy). |
| Sign-in succeeds but you're signed out immediately | Check `NODE_ENV=production` on Render (it sets `SameSite=None; Secure`). In Safari, Brave or Incognito this is expected: those browsers block third-party cookies. Use Chrome or Edge. |
| Google: "origin is not allowed" | Add the exact Vercel URL to Authorized JavaScript origins and wait a few minutes. |
| Render log: `Missing required environment variables` | Add the listed keys in Render → Environment. |
| Render log: `MongoServerSelectionError` | Atlas Network Access doesn't allow `0.0.0.0/0`, or the URI or password is wrong. |
| Changed a `VITE_` variable but nothing changed | `VITE_` values are baked in at build time, so redeploy on Vercel. |
| Email links point to localhost | Update `CLIENT_URL` on Render to the Vercel URL. |
