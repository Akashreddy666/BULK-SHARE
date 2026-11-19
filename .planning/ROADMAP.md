# BULK SHARE — Execution Roadmap

## Milestone 1: Project Setup, Foundation, Auth & Dashboard Shells (IN PROGRESS)
- [ ] Initialize monorepo directory structure (`frontend/`, `backend/`, `.planning/`).
- [ ] Backend foundation: FastAPI application, modular architecture, Pydantic v2 schemas, SQLAlchemy 2.0 models, Alembic migrations, health & profile endpoints.
- [ ] Authentication: Supabase Auth integration, JWT verification backend dependency, role assignment (`CUSTOMER`, `SUPPLIER`, `ADMIN`), demo one-click auth switchers for evaluation.
- [ ] Database baseline: Initial schema for `users` and `neighborhoods` with UUID primary keys and audit timestamps.
- [ ] Frontend foundation: Vite + React + TypeScript + Tailwind CSS with modern grocery theme (green/white palette), reusable UI components (shadcn/ui style).
- [ ] Public Landing Page: Hero, value proposition, how it works, sample wholesale savings calculator preview, demo simulation banner.
- [ ] Role-based Dashboard Shells: Customer, Organizer, Supplier, and Admin dashboard layouts with navigation and route guards.
- [ ] Testing & Validation: Backend Pytest suite (health, auth, user endpoints), Frontend Vitest smoke tests.

## Milestone 2: Neighborhood Groups, Membership, Catalog & Grocery Lists
- [ ] Neighborhood model & public group discovery.
- [ ] Private invitation-only groups with cryptographic tokens.
- [ ] Group lifecycle states (`OPEN`, `CLOSED`, etc.).
- [ ] Product catalog: Categories (rice, oil, dal, sugar, flour), SKUs, sealed packs, reference retail prices.
- [ ] Private grocery lists with exact vs. flexible brand preferences.

## Milestone 3: Demand Aggregation, Wholesale Tiers, Savings & Quotes
- [ ] Privacy-preserving demand aggregation engine (sealed packs, brand compatibility).
- [ ] Wholesaler supplier dashboard, profiles, and product offer price tiers.
- [ ] Supplier quotation submission (versioned, immutable snapshots).
- [ ] Reference retail price comparison and individual household savings calculation.

## Milestone 4: Quotation Selection, Member Confirmations & Atomic Lock
- [ ] Organizer quote comparison and selection.
- [ ] Household cost and substitution breakdown generation.
- [ ] Member confirmation flow (Accept / Reject).
- [ ] Single revised confirmation round on rejection / departure.
- [ ] Atomic, idempotent order locking with concurrency safety.

## Milestone 5: Simulated Operations, Fulfillment, Notifications & Disputes
- [ ] Simulated procurement and simulated payment state machine.
- [ ] Pickup vs. doorstep delivery fee allocation and tracking.
- [ ] In-app and notification service.
- [ ] Customer dispute creation and admin resolution workflow.
- [ ] Audit logs and demo data reset utilities.

## Milestone 6: Automated Testing, UI Polish, Security Audit & Deployment
- [ ] Comprehensive unit, integration, and Playwright E2E tests.
- [ ] Accessibility (WCAG 2.2 AA) and responsive UI polish.
- [ ] Security audit: JWT validation, object-level authorization, rate limiting.
- [ ] Deployment scripts and configs for Vercel, Render, and Supabase.
