# BULK SHARE — Community-Based Group Grocery Purchasing Platform

[![Milestone](https://img.shields.io/badge/Milestone%201-Completed-emerald)](file:///c:/Users/munag/Desktop/BULK%20SHARE/.planning/ROADMAP.md)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20SQLAlchemy%20%7C%20Alembic-blue)](file:///c:/Users/munag/Desktop/BULK%20SHARE/backend)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-teal)](file:///c:/Users/munag/Desktop/BULK%20SHARE/frontend)
[![Tests](https://img.shields.io/badge/Tests-Pytest%20%26%20Vitest%20Passing-brightgreen)](file:///c:/Users/munag/Desktop/BULK%20SHARE/backend/tests)

> **Public Demonstration Notice:** BULK SHARE is a simulated group grocery purchasing web application configured with sample products, fictional wholesale vendors, and simulated transactions. No real payments, live procurement, or actual deliveries are executed in this MVP release.

---

## 1. Project Overview

**BULK SHARE** enables households in the same neighborhood to combine their grocery requirements and purchase staple items (rice, cooking oil, dal, sugar, and flour) collectively from wholesalers at volume-discounted prices.

### Key Tenets (SRS Baseline):
* **Sealed Retail Packs Only:** Strict manufacturer-sealed retail packages (e.g., 5 kg rice, 5 L oil, 2 kg dal). No repacking or unhygienic loose division.
* **100% Private Household Carts:** Organizers see only aggregated neighborhood demand (e.g., "320 kg Rice"). Individual household grocery lists and exact addresses remain private.
* **Independent Product Eligibility:** Each product qualifies on its own quantity threshold. Non-qualifying products are transparently excluded without silent charges.
* **Democratic Final Confirmation:** Members explicitly approve their final brand, cost allocation, and pickup/delivery fee before atomic group order locking.

---

## 2. Monorepo Architecture

```
BULK SHARE/
├── SRS.md                         # Authoritative Software Requirements Specification
├── README.md                      # Setup & architecture guide
├── .planning/                     # GSD Specification & Roadmap Artifacts
│   ├── config.json
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── ROADMAP.md
│   └── STATE.md
│
├── backend/                       # Python FastAPI Modular Monolith
│   ├── requirements.txt           # Python dependencies (FastAPI, SQLAlchemy, Alembic, Pytest)
│   ├── alembic/                   # Database migration scripts
│   ├── app/
│   │   ├── main.py                # App factory, CORS, lifespan & error handlers
│   │   ├── core/                  # Configuration, database engine, JWT security guards
│   │   ├── models/                # SQLAlchemy models (User, Neighborhood, Role enums)
│   │   ├── schemas/               # Pydantic v2 validation DTOs
│   │   ├── api/v1/                # Modular REST routes (/health, /users/me, /neighborhoods)
│   │   └── db/seed.py             # Database seed script for default neighborhood & demo users
│   └── tests/                     # Automated Pytest suite (health, auth, user endpoints)
│
└── frontend/                      # React 19 + TypeScript + Vite SPA
    ├── package.json
    ├── vite.config.ts             # Vite configuration with @/* path aliases and API proxy
    ├── tailwind.config.js         # Emerald & forest green grocery design system
    ├── src/
    │   ├── components/            # UI primitives (Button, Card, Badge, Modal, Input)
    │   ├── context/               # AuthContext (Supabase Auth + Demo Role Switcher)
    │   ├── services/              # API client and Supabase client
    │   ├── pages/
    │   │   ├── LandingPage.tsx    # Responsive Landing Page with Hero & Savings Calculator
    │   │   └── dashboards/        # Role-based Dashboard Shells
    │   │       ├── CustomerDashboard.tsx
    │   │       ├── OrganizerDashboard.tsx
    │   │       ├── SupplierDashboard.tsx
    │   │       └── AdminDashboard.tsx
    └── src/test/                  # Vitest component test suite
```

---

## 3. Quickstart & Local Setup

### Prerequisites
* **Python:** 3.11+ (Python 3.13 supported)
* **Node.js:** 18+ (Node.js 24 supported)
* **npm:** 9+

---

### Step 1: Start Backend API

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed initial demonstration data
python -m app.db.seed

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
* Backend API will be live at: **http://localhost:8000**
* Interactive Swagger API docs: **http://localhost:8000/docs**
* API Health check: **http://localhost:8000/api/v1/health**

---

### Step 2: Start Frontend Application

In a separate terminal:

```powershell
# Navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```
* Frontend Web App will be live at: **http://localhost:5173**

---

## 4. Evaluator Demo Role Personas

For seamless evaluation without needing live third-party Supabase credentials upfront, click the **"Demo Roles"** button in the top navigation bar to instantaneously switch between the 4 personas:

| Persona | Name | Role | Email | Key Capabilities |
|---|---|---|---|---|
| **Customer** | Priya Sharma | `CUSTOMER` | `priya.customer@bulkshare.com` | Join neighborhood buying groups, manage private household lists, approve quotes, track personal savings. |
| **Group Organizer** | Rahul Verma | `CUSTOMER` (Organizer) | `rahul.organizer@bulkshare.com` | Manage group lifecycle, view aggregated demand (not individual lists), compare and select wholesale quotations. |
| **Wholesaler** | Kisan Wholesale Supplies | `SUPPLIER` | `kisan.wholesaler@bulkshare.com` | Maintain wholesale supplier profile, configure quantity pricing tiers for sealed packs, review submitted quotes. |
| **Admin** | Platform Administrator | `ADMIN` | `admin@bulkshare.com` | Manage catalog & retail reference prices, verify wholesalers, simulate wholesale procurement and fulfillment. |

---

## 5. Running Automated Tests

### Backend Tests (Pytest)
```powershell
cd backend
venv\Scripts\activate
pytest -v
```
*Tests cover health endpoints, JWT auth middleware, role guards, user profile CRUD, and database constraints.*

### Frontend Tests (Vitest)
```powershell
cd frontend
npm run test
```
*Tests verify demo simulation banner, landing page rendering, and interactive savings calculator state updates.*

---

## 6. Development Milestones

* **Milestone 1:** Project foundation, frontend & backend architecture, database schema, authentication & role-based dashboard shells. ✅ **(Completed)**
* **Milestone 2:** Neighborhood groups, membership, grocery catalog, and private grocery lists.
* **Milestone 3:** Demand aggregation engine, wholesale price tiers, savings calculations, supplier quotations.
* **Milestone 4:** Quotation selection, member confirmations, recalculation round, atomic order locking.
* **Milestone 5:** Simulated payments, procurement, fulfillment, notifications, and dispute management.
* **Milestone 6:** Automated testing, UI polish, security audit, and deployment (Vercel + Render + Supabase).
