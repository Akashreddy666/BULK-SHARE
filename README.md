# BULK SHARE — Community-Based Group Grocery Purchasing Platform

[![Milestone](https://img.shields.io/badge/Milestones%201--6-Completed-emerald?style=flat-square)](file:///c:/Users/munag/Desktop/BULK%20SHARE/.planning/STATE.md)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20SQLAlchemy%202.0%20%7C%20Alembic-blue?style=flat-square)](file:///c:/Users/munag/Desktop/BULK%20SHARE/backend)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-teal?style=flat-square)](file:///c:/Users/munag/Desktop/BULK%20SHARE/frontend)
[![Tests](https://img.shields.io/badge/Tests-Pytest%20(25)%20%7C%20Vitest%20(16)%20%7C%20Playwright-brightgreen?style=flat-square)](file:///c:/Users/munag/Desktop/BULK%20SHARE/backend/tests)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel%20%2B%20Render%20%2B%20Supabase-purple?style=flat-square)](file:///c:/Users/munag/Desktop/BULK%20SHARE/frontend/vercel.json)

> **Public Demonstration Notice:** BULK SHARE is an enterprise-grade group grocery purchasing web application designed with sample products, fictional wholesale vendors, and simulated transactions. No real bank accounts are billed, and all wholesale procurement, payments, and deliveries in this release are simulated for evaluation.

---

## 1. Project Overview

**BULK SHARE** enables households in the same neighborhood to pool their grocery demand and purchase staple products (rice, cooking oil, dal, sugar, and flour) collectively from certified wholesalers at volume-discounted prices.

### Core Architectural Tenets (SRS Baseline):
* **Sealed Retail Packs Only:** Strict manufacturer-sealed retail packages (e.g., 5 kg rice, 5 L oil, 2 kg dal, 10 kg flour). Zero repacking or unhygienic loose division.
* **100% Private Household Grocery Lists (FR-LIST-04):** Organizers see only privacy-preserving cumulative neighborhood demand (e.g., "120 kg Sona Masoori Rice"). Individual household carts and delivery addresses remain private.
* **Independent Tier Qualification:** Each product SKU independently qualifies for wholesale pricing tiers. Non-qualifying products are transparently excluded without silent charges.
* **Democratic Final Confirmation (Max 1 Recalculation):** Members explicitly approve their final brand allocations, itemized costs, and savings before atomic order locking. Non-confirming members are dropped in Round 2.
* **Platform Admin Procurement:** The group organizer selects the winning quotation, but the Platform Admin issues the official wholesale purchase order (PO).
* **PIN-Verified Distribution:** Contactless verification PINs (e.g., `BS-4829`) ensure tamper-proof package releases at the local hub.

---

## 2. Monorepo Architecture

```
BULK SHARE/
├── SRS.md                         # Full Software Requirements Specification
├── README.md                      # Architecture, local setup & deployment guide
├── .env.example                   # Full-stack root environment template
├── .planning/                     # GSD Specification & Roadmap Artifacts
│   ├── config.json
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── ROADMAP.md
│   └── STATE.md
│
├── backend/                       # Python FastAPI Modular Monolith
│   ├── requirements.txt           # FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, Pytest
│   ├── render.yaml                # Render Web Service blueprint
│   ├── Dockerfile                 # Production container setup
│   ├── entrypoint.sh              # Container startup & migration script
│   ├── .env.example
│   ├── alembic/                   # Database migrations (0001 through 0005)
│   ├── app/
│   │   ├── main.py                # App factory, security headers middleware, CORS, lifespan
│   │   ├── core/                  # Database engine, JWT authentication, settings
│   │   ├── models/                # SQLAlchemy models (User, Group, Catalog, Quotation, Order, Payment, Procurement, Fulfillment, Notification, Dispute, Audit)
│   │   ├── schemas/               # Pydantic v2 validation DTOs
│   │   ├── services/              # Business logic (Aggregation, Savings, Quotations, Confirmations, Payments, Procurement, Fulfillment, Notifications, Disputes)
│   │   ├── api/v1/                # 11 RESTful router modules
│   │   └── db/seed.py             # Realistic database seed (neighborhoods, staples catalog, sample suppliers)
│   └── tests/                     # 25 automated pytest tests across 6 test suites
│
└── frontend/                      # React 19 + TypeScript + Vite SPA
    ├── package.json
    ├── vercel.json                # Vercel SPA routing and security caching headers
    ├── playwright.config.ts       # Playwright E2E test configuration
    ├── vite.config.ts             # Vite configuration with @/* path aliases and dev proxy
    ├── tailwind.config.js         # Emerald & forest green grocery design system
    ├── .env.example
    ├── e2e/                       # Playwright end-to-end user journeys
    │   └── bulkshare.spec.ts
    ├── src/
    │   ├── components/            # UI components (Groups, Catalog, Grocery, Savings, Quotation, Confirmation, Order, Payment, Fulfillment, Notifications, Dispute)
    │   ├── context/               # AuthContext (Supabase Auth + Demo Role Switcher)
    │   ├── services/              # Type-safe API client
    │   ├── pages/                 # Responsive Landing Page & 4 Role Dashboards
    │   └── test/                  # 16 Vitest component unit tests across 5 test suites
```

---

## 3. Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.13, FastAPI, SQLAlchemy 2.0 (ORM), Alembic, Pydantic v2 |
| **Database** | PostgreSQL (Supabase / Render) with SQLite zero-config local fallback |
| **Authentication** | Supabase Auth (JWT) + Evaluator Persona Demo Switcher |
| **Testing** | Pytest (Backend API), Vitest (Frontend Components), Playwright (E2E) |
| **Deployment** | Vercel (Frontend), Render (Backend Web Service), Supabase (PostgreSQL & Storage) |

---

## 4. Local Quickstart Guide

### Prerequisites
* **Python:** 3.11+ (Python 3.13 recommended)
* **Node.js:** 18+ (Node.js 24 recommended)
* **Git**

### Step 1: Clone Repository
```bash
git clone https://github.com/Akashreddy666/BULK-SHARE.git
cd BULK-SHARE
```

### Step 2: Setup & Run Backend API
```powershell
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Windows (or 'source venv/bin/activate' on Linux/macOS)

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed initial catalog and demo users
python -m app.db.seed

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
* **API Documentation (Swagger):** `http://localhost:8000/docs`
* **Alternative Docs (ReDoc):** `http://localhost:8000/redoc`
* **Health Check Endpoint:** `http://localhost:8000/api/v1/health`

### Step 3: Setup & Run Frontend
In a new terminal window:
```powershell
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```
* **Web Application:** `http://localhost:5173`

---

## 5. Automated Test Suites

### Backend Unit & Integration Tests (Pytest)
```powershell
cd backend
.\venv\Scripts\pytest.exe -v
```
* **25 / 25 Passing Tests:**
  * `test_health.py`: Health check and root endpoint
  * `test_auth_users.py`: Supabase token authentication, profile management, demo role switcher
  * `test_groups_catalog_list.py`: Neighborhood groups, private invite codes, grocery catalog, private household lists (FR-LIST-04)
  * `test_wholesale_quotations.py`: Privacy-preserving demand aggregation, volume price tiers, savings calculations, supplier quotes
  * `test_confirmations_orders.py`: Single quotation selection, member approval rounds, max 1 recalculation, atomic order locking
  * `test_milestone5_lifecycle.py`: Simulated payments & receipts, admin PO placement, supplier dispatch, hub PIN verification, disputes & refunds

### Frontend Unit & Component Tests (Vitest)
```powershell
cd frontend
npm run test
```
* **16 / 16 Passing Tests:**
  * `LandingPage.test.tsx`: Landing page rendering, hero headline, interactive savings calculator
  * `Milestone2.test.tsx`: Group card thresholds, invitation code redemption, catalog browsing
  * `Milestone3.test.tsx`: Aggregated demand summary, volume price tiers, quotation comparisons
  * `Milestone4.test.tsx`: Member confirmation modal, confirmation round panel, locked frozen order card
  * `Milestone5.test.tsx`: Payment invoice modal, digital pickup pass, hub distribution desk, dispute modal, notification bell

### Frontend Production Build Check
```powershell
cd frontend
npm run build
```
* **0 Errors:** TypeScript strict type checking and Vite production bundling.

### End-to-End Tests (Playwright)
```powershell
cd frontend
npm run test:e2e
```

---

## 6. Pre-Configured Demo Personas

BULK SHARE includes a 1-click **Demo Persona Switcher** in the top navigation bar to evaluate each user role without entering passwords:

| Persona | Role | Features Demonstrated |
| :--- | :--- | :--- |
| **Priya Sharma** | Customer | Browse groups, manage private cart, view wholesale discounts, approve allocations, pay share, view digital pickup pass |
| **Rahul Verma** | Organizer | Create neighborhood pool, monitor aggregated demand (sealed packs only), review bids, select quotation, manage hub distribution |
| **Kisan Wholesale Mart** | Wholesaler | Manage supplier profile, view RFQs, submit competitive wholesale bids, acknowledge purchase orders, dispatch to hub |
| **Platform Administrator** | Admin | System moderation, issue wholesale procurement POs, review customer disputes, issue simulated refunds |

---

## 7. Cloud Deployment Guide

### Frontend Deployment (Vercel)
1. Push repository to GitHub.
2. Import project into Vercel and set the **Root Directory** to `frontend`.
3. Set the Framework Preset to **Vite**.
4. Configure Environment Variables:
   * `VITE_API_BASE_URL`: `https://bulk-share-backend.onrender.com/api/v1`
   * `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   * `VITE_SUPABASE_ANON_KEY`: `your-supabase-anon-key`
5. Deploy. `vercel.json` automatically manages single-page application routing and defensive HTTP headers.

### Backend Deployment (Render)
1. In the Render Dashboard, create a new **Web Service** connected to this repository.
2. Set the **Root Directory** to `backend`.
3. Build Command: `pip install -r requirements.txt && alembic upgrade head`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Health Check Path: `/api/v1/health`
6. Add Environment Variables:
   * `ENVIRONMENT`: `production`
   * `DATABASE_URL`: `postgresql+asyncpg://postgres:...@db...supabase.co:5432/postgres`
   * `CORS_ORIGINS`: `https://bulk-share.vercel.app`
   * `DEMO_MODE`: `true`
   * `DEMO_JWT_SECRET`: `[random-secure-string]`

### Database & Authentication (Supabase)
1. Create a new Supabase project in the desired region (e.g., AWS Mumbai `ap-south-1`).
2. Copy the PostgreSQL connection URI from **Project Settings -> Database** and set it as `DATABASE_URL` in Render.
3. Under **Authentication -> URL Configuration**, add your Vercel URL (`https://bulk-share.vercel.app`) as an allowed redirect URL.

---

## 8. Security & Privacy Architecture

* **Defensive HTTP Headers:** Injected by backend middleware on every request (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`).
* **Cryptographic PIN Verification:** Random 6-character alphanumeric pickup codes (`BS-XXXX`) authenticate physical handover and prevent duplicate claims.
* **Audit Trail:** Critical lifecycle events (`QUOTATION_SELECTED`, `MEMBER_ACCEPTED`, `ORDER_RECALCULATED`, `ORDER_LOCKED`, `PAYMENT_COMPLETED`, `WHOLESALE_PO_PLACED`, `PICKUP_VERIFIED`, `DISPUTE_RESOLVED`) are permanently logged with timestamps and actor IDs.
* **Strict Privacy Isolation (FR-LIST-04):** Database queries and API serialization enforce that organizers receive only cumulative quantities (`SUM(pack_quantity)`) without revealing household names or addresses.

---

## 9. License

Developed for the community grocery pooling initiative. Released under the MIT License.
