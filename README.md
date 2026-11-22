# CraftNest 🪔 — Handmade Ornaments Store

A full-stack e-commerce website for selling handmade crafts/ornaments:

- **Customers register and log in** — only registered users can place orders
- **Stripe Checkout** for secure payments (with a dev mode that simulates payment when no key is set)
- **Owner gets notified on every order** — an email alert (via SMTP) plus a **one-tap WhatsApp message link** (`wa.me`) with full order details, so you know who to pack for
- **Owner email on every new registration** too
- **Owner dashboard** — pending orders, packed/shipped/delivered counts, paid revenue, customers, low-stock warnings, order status updates, customer WhatsApp buttons, and product management

## Install on a phone (PWA 📱)

Once the site is hosted, it is an installable Progressive Web App: open the URL in the phone browser → **Android**: tap **"Add to Home screen" / "Install app"** in the browser menu → **iPhone**: tap **Share → Add to Home Screen**. CraftNest then opens full-screen with its own diya app icon, without any app store.

## Deploy online (free, ~5 minutes)

1. Push this repo to GitHub (done).
2. Go to [render.com](https://render.com) → **New Web Service** → connect this repo.
3. Build command: `npm install && npm run build:client`  •  Start command: `npm start`  •  Instance type: Free.
4. Add the environment variables from `.env.example` in Render's dashboard (set `CLIENT_URL` to your Render URL, e.g. `https://craftnest.onrender.com`). Render's free tier gives you a live HTTPS URL + persistent disk for SQLite if attached.
5. Create a Stripe webhook pointing to `https://YOUR-RENDER-URL/api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET`.

Alternatives: Railway, Fly.io, or any VPS — the app is a single Node process serving both API and the built frontend.

## Tech stack

| Layer | Choice |
| --- | --- |
| Backend | Node.js + Express + SQLite (better-sqlite3) |
| Frontend | React (Vite) + react-router |
| Payments | Stripe Checkout + webhook |
| Email | Nodemailer (any SMTP: Gmail, Zoho, etc.) |
| WhatsApp | `wa.me` click-to-chat links (no API key needed) |

## Quick start

```bash
npm install          # installs server + client deps
npm run build:client # build the React app
npm start            # serves API + website on http://localhost:4000
```

Development mode (auto-reload, two terminals):

```bash
npm run dev:server   # API on :4000
npm run dev:client   # website on :5173 (proxies /api to :4000)
```

## Configuration

Copy `.env.example` to `.env` and fill in:

1. **`OWNER_WHATSAPP`** — your number in international format, digits only (e.g. `919876543210`). Order alert messages are generated with full details; the dashboard and order record expose the pre-filled `wa.me` link, one tap sends it to your WhatsApp.
2. **`OWNER_EMAIL` + SMTP settings** — for automatic email alerts on new orders and new registrations (Gmail: use an App Password with `smtp.gmail.com:587`).
3. **`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`** — from [Stripe dashboard](https://dashboard.stripe.com/apikeys). Without a key the app runs in **dev mode** where payment is simulated so you can test the full flow.
4. **Stripe webhook**: point a `checkout.session.completed` endpoint at `https://YOUR-DOMAIN/api/webhooks/stripe` and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Admin (owner) dashboard

Login with the seeded admin account (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, default `admin@craftnest.local` / `admin123` — change it!) and open `/admin`.

- **Overview** — orders per status, paid revenue, customer count, low-stock list, recent orders
- **Orders** — filter by status, update status (paid → packed → shipped → delivered / cancelled), WhatsApp button per customer
- **Products** — add, hide/show, restock ornaments
- **Customers** — everyone who registered

## Order lifecycle

```
cart → checkout → Stripe payment → paid → packed → shipped → delivered
                 ↘ cancel ↙
```

When an order becomes **paid** (Stripe webhook confirms real payment), the owner email is sent and the WhatsApp alert message is prepared.

## API overview

| Method & path | Purpose |
| --- | --- |
| `POST /api/auth/register` | Register (email + password + phone) |
| `POST /api/auth/login` | Log in |
| `GET /api/products` | List active products |
| `POST /api/orders` | Create order (auth) → Stripe checkout URL |
| `POST /api/orders/:id/simulate-payment` | Dev-mode payment (only when Stripe is unset) |
| `GET /api/admin/stats` | Dashboard stats (admin) |
| `GET/PATCH /api/admin/orders...` | Manage orders (admin) |
| `POST/PATCH/DELETE /api/products/...` | Product management (admin) |
