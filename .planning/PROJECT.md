# BULK SHARE — Project Context & Vision

## 1. Overview
BULK SHARE is a community-based group grocery purchasing web application that allows households in the same neighborhood to pool their grocery demand and purchase sealed retail-sized staples (rice, oil, dal, sugar, flour) directly from wholesalers at quantity-discounted prices.

## 2. Core Tenets
- **Sealed Packs Only:** Strictly sealed manufacturer retail packs (e.g. 1 kg, 5 kg, 5 L); no repacking or fractional loose quantities.
- **Independent Eligibility:** Each product must qualify independently for its wholesale tier minimum pack threshold.
- **Privacy First:** Individual grocery lists, exact delivery addresses, and household cart details are strictly private to that household and authorized admins. Organizers see aggregate demand quantities only.
- **One Supplier Per Purchase:** In the MVP, one supplier quotation is selected for a group purchase order.
- **Simulated Operations:** For MVP demo release, all procurement, payments, deliveries, and supplier documents are simulated with sample data.
- **Deterministic Economics:** Strict non-negative fees, exact allocation of shared charges with paise reconciliation, signed savings vs. reference retail prices.

## 3. Technology Baseline
- **Frontend:** React 19 / TypeScript / Vite / Tailwind CSS / Lucide Icons / shadcn/ui patterns
- **Backend:** Python 3.13 / FastAPI / SQLAlchemy 2.0 / Alembic / Pydantic v2
- **Database:** PostgreSQL (Supabase / local PostgreSQL or SQLite fallback for offline unit tests)
- **Auth:** Supabase Auth (JWT verification on FastAPI backend with demo fallback)
- **Storage:** Supabase Storage (private buckets for supplier verification documents)
- **Testing:** Pytest (backend), Vitest (frontend), Playwright (E2E)
- **Deployment:** Vercel (frontend), Render (backend), Supabase (PostgreSQL + Auth)
