# BULK SHARE — Software Requirements Specification (SRS)

**Project:** BULK SHARE — Community-Based Group Grocery Purchasing Platform  
**Document version:** 1.0 (MVP baseline)  
**Status:** Approved functional baseline from requirements interviews (Rounds 1–3 and final decisions)  
**Date:** 19 November 2026  
**Product type:** Responsive web application  
**Initial release:** Public demonstration with fictional/sample data and simulated transactions; **no real payments, procurement, or deliveries**

---

## 1. Introduction

### 1.1 Purpose

This document specifies the MVP requirements for BULK SHARE. It serves as the source of truth for implementation, review, testing, and acceptance by developers and AI coding agents such as Google Antigravity or Codex.

### 1.2 Product overview

Households frequently buy small grocery quantities at retail prices. BULK SHARE enables households in a neighborhood to create or join buying groups, submit their own grocery requirements, aggregate compatible demand, compare wholesale offers, confirm their individual totals, and coordinate a group purchase through a platform administrator.

The public MVP demonstrates this process using sample suppliers, products, quotations, payments, and fulfillment events. It must not represent simulated prices as actual live retailer or wholesale offers.

### 1.3 Goals

1. Demonstrate genuine group-buying logic and quantity-based wholesale pricing.
2. Maintain separate private household lists and transparent household-level costs.
3. Support a reliable end-to-end simulated purchase flow, including exceptions.
4. Provide role-appropriate customer, organizer, supplier, and admin experiences.
5. Establish a modular foundation for a future real neighborhood pilot.

### 1.4 Intended audience

Product owner, college evaluators, developers, testers, UI/UX designers, database designers, and coding agents.

### 1.5 Terminology

- **Customer:** A household user who creates or joins groups.
- **Organizer:** A customer granted authority over one buying group; not a separate global role.
- **Supplier/Wholesaler:** A business user submitting sample offers and quotations.
- **Admin:** Platform operator who moderates users and groups and simulates procurement.
- **SKU / Variant:** An exact sellable product (brand, pack size, unit, specifications).
- **Flexible preference:** Customer accepts a compatible alternative rather than requiring an exact brand; substitution needs final approval.
- **Price tier:** Supplier-defined price per sealed pack applicable after a minimum quantity.
- **Demand snapshot:** Immutable aggregate of a group's household requests at a point in time.
- **Quotation version:** Immutable supplier proposal for a particular demand snapshot, including validity and charges.
- **Order lock:** Atomic commitment of all confirmed eligible household orders to one final quotation version.
- **Reference retail price:** Displayed comparison value, tagged with source and time; not guaranteed to match local shop prices.

---

## 2. Scope and constraints

### 2.1 In-scope MVP

- Responsive public website with landing page, sample demonstration data, and clear simulation banners.
- Authentication with email/password and Google through Supabase Auth.
- Customer, supplier, and admin account roles; organizer as group-scoped customer permissions.
- One initial neighborhood/community, represented by a configurable neighborhood model.
- Public neighborhood buying groups and private invitation-only groups.
- Grocery essentials: rice, cooking oil, dal, sugar, and flour.
- Exact-brand and flexible-brand requirements.
- Catalog managed by admin and verified suppliers.
- Only **sealed retail-sized supplier packs**; no repacking or fractional packs.
- Product-level aggregate demand, supplier quantity tiers, and quotations.
- One chosen supplier per group purchase.
- Group closure, quote selection, member confirmation, one recalculation/reconfirmation round, order lock, cancellation paths.
- Admin-coordinated simulated purchasing, pickup and delivery.
- Admin-configured delivery charges by method and area; allocated shared charges.
- In-app and email notifications (subject to configured email service, with demo-safe fallback).
- Supplier document review workflow; fictional/safe demonstration documents only on public demo.
- Structured disputes, audit logs, and basic dashboards.

### 2.2 Out of scope for v1

- Payment gateway or movement of real money; real invoices/settlement/refunds.
- Placement of live purchase orders with real suppliers.
- Real delivery/driver dispatch, live tracking, or logistics integrations.
- Handling or repacking bulk sacks into smaller quantities.
- Multiple suppliers within one group purchase.
- Supplier or group rating system.
- AI recommendations, demand forecasting, subscriptions, or automatic recurring orders.
- SMS/phone OTP authentication (phone number may be a profile field).
- Monetization, platform commissions, paid subscriptions, or service charges as platform revenue.
- Native Android/iOS applications.

### 2.3 Business assumptions and decisions

- First users are residents of a single neighborhood. Future expansion to multiple areas is possible.
- Any customer may create a group; admin may create or moderate groups.
- A creator becomes the group's organizer. Admin has oversight and exceptional intervention powers.
- Public groups are searchable by neighborhood. Private groups require an invitation token.
- Group members may not see each other's individual lists or home addresses; organizers see only aggregated demand and necessary confirmation progress.
- For the MVP, all purchases, inventory, prices, delivery fees, and payment statuses are simulated.
- The platform initially earns no revenue.
- Customer-selected pickup or home delivery is fulfilled/updated by admin.
- The group closes when its configured deadline or configured completion condition is met, whichever occurs first; closure does not itself lock an order.
- Exact threshold definitions and timeout values are configurable rather than hidden hard-coded constants.

---

## 3. Stakeholders and user roles

### 3.1 Customer

May create/join groups, manage *own* grocery requirements, view eligible prices and personal cost breakdown, approve/reject selected quotation, select fulfillment method, view own orders, and open disputes.

### 3.2 Organizer (group-scoped customer permission)

May configure/manage own group within platform limits, review aggregate demand (not individual lists), compare valid supplier quotes, select a quote, propose action when minimums fail, view group-level confirmation progress, and request lock when all checks pass.

### 3.3 Supplier

May maintain own supplier profile, submit verification information (demonstration data only in the public release), manage product offerings/price tiers, submit sample quotations, and view own quotation status. Supplier actions must be limited to their own business and authorized group requests.

### 3.4 Admin

May manage catalog and users, review supplier applications, moderate groups, configure price-reference sources and delivery fees, oversee quotations, make exceptional decisions, simulate purchase/payment/fulfillment events, and resolve disputes. Admin must have appropriately audited access to sensitive information.

### 3.5 Permissions matrix

| Action | Customer | Organizer of group | Supplier | Admin |
|---|---|---|---|---|
| Register, log in, edit own profile | Yes | Yes | Yes | Yes |
| Create group | Yes | Yes | No | Yes |
| Join eligible group | Yes | Yes | No | Override by policy |
| Edit own list before final lock | Yes, subject to group phase | Yes, own only | No | Support action (audited) |
| View other's individual list/address | No | No | No | Authorized operational access |
| View aggregate group demand | Member-level aggregate only | Yes | Authorized quotation scope | Yes |
| Submit supplier quote | No | No | Yes, own supplier | Admin sample management |
| Choose supplier quote | No | Yes | No | Audited exception |
| Confirm own household cost | Yes | Yes | No | Not on behalf of user by default |
| Lock qualifying order | No | Request only | No | Authorized action; server validates |
| Simulate procurement/payment | No | No | No | Yes |
| Manage fulfillment | Own selection/status | Group status only | Own supply status (limited) | Yes |
| Resolve disputes | Raise | No privileged resolution | Respond | Yes |

**Mandatory:** Every API checks the authenticated user, global role, resource ownership, and group-specific permission server-side.

---

## 4. Functional requirements

Requirement language: **MUST** is mandatory for MVP; **SHOULD** is desirable where practical.

### 4.1 Authentication and profiles

- **FR-AUTH-01:** Users MUST sign up/sign in using email/password or Google via Supabase Auth.
- **FR-AUTH-02:** The backend MUST validate JWTs, not trust role identifiers supplied by the browser.
- **FR-AUTH-03:** The system MUST create a local application profile linked to the auth provider's user ID.
- **FR-AUTH-04:** Customers MUST be able to edit their own name and neighborhood; delivery addresses MUST be private.
- **FR-AUTH-05:** The system MUST protect role-specific routes and data.
- **FR-AUTH-06:** Admin privileges MUST be provisioned securely; ordinary registration cannot self-assign admin role.

### 4.2 Neighborhoods and buying groups

- **FR-GRP-01:** Eligible customers and admins MUST be able to create a buying group with name, neighborhood, visibility, deadline, and closing rules.
- **FR-GRP-02:** Group creation MUST assign the creator as the organizer.
- **FR-GRP-03:** Customers MUST be able to discover public groups within their neighborhood.
- **FR-GRP-04:** Private groups MUST accept joining only through authorized, expiring/revocable invitation tokens.
- **FR-GRP-05:** Membership MUST be unique per group and customer.
- **FR-GRP-06:** Members MUST be able to leave before lock; the system MUST recompute demand as needed.
- **FR-GRP-07:** Organizers MUST be able to manage group descriptions/deadlines within allowed lifecycle states and admin constraints.
- **FR-GRP-08:** The system MUST support closing at deadline or when configured completion conditions are met, whichever is first.
- **FR-GRP-09:** Group closure MUST create or reference a versioned demand snapshot and prevent silent mutation of that snapshot.
- **FR-GRP-10:** Admin MUST be able to moderate inappropriate groups and record reasons.

### 4.3 Products, variants, and lists

- **FR-CAT-01:** The catalog MUST include rice, cooking oil, dal, sugar, and flour as sample categories/products.
- **FR-CAT-02:** Products MUST have defined variants with brand, sealed pack quantity/unit, product details, and active status.
- **FR-CAT-03:** Admin and approved supplier accounts MUST be able to add/update authorized catalog entries; unapproved suppliers cannot publish them.
- **FR-LIST-01:** Customers MUST be able to add, edit, and remove their own grocery list items in permitted pre-lock phases.
- **FR-LIST-02:** Each request MUST capture product, requested number of sealed packs, and exact or flexible brand preference.
- **FR-LIST-03:** Quantities MUST be positive integers of packs. Unsupported fractional/split quantities MUST be rejected.
- **FR-LIST-04:** Individual grocery lists MUST be visible only to their owners and authorized admins.
- **FR-LIST-05:** If a post-closure edit is permitted before final lock, the backend MUST create a new snapshot/quote cycle and invalidate affected prior confirmations rather than mutate a quoted snapshot silently.

### 4.4 Demand aggregation and wholesale pricing

- **FR-PRC-01:** The system MUST aggregate only compatible sellable variants and permitted substitutions.
- **FR-PRC-02:** Exact-brand requests MUST not be combined with incompatible brands or pack sizes.
- **FR-PRC-03:** Flexible-brand requests MAY be matched to a compatible variant but MUST require final member approval of chosen variant before lock.
- **FR-PRC-04:** Each supplier offer MUST define one or more minimum-pack quantity tiers and per-pack prices.
- **FR-PRC-05:** Each quoted product MUST independently meet its applicable minimum threshold to be eligible.
- **FR-PRC-06:** Non-qualifying products MUST be excluded from the proposed bulk purchase, with transparent per-household impact and approval.
- **FR-PRC-07:** Shared procurement/handling charges MUST be allocated by a documented proportional rule based on order value or quantity, depending on charge type; rounding differences MUST reconcile exactly to the total charge.
- **FR-PRC-08:** Pickup/delivery fees MUST be derived from admin-configured method and area rules and shown before confirmation.
- **FR-PRC-09:** The system MUST display per-member item subtotal, allocated charges, fulfillment fee, final total, and estimated savings against a timestamped reference retail price.
- **FR-PRC-10:** If total savings are zero or negative, the system MUST display that fact without misleading discount claims.

### 4.5 Supplier offers and quotations

- **FR-SUP-01:** Supplier applicants MUST provide business information and verification documents; admin MUST approve/reject with an auditable reason.
- **FR-SUP-02:** Only verified suppliers MUST be able to publish active offers or submit eligible quotations.
- **FR-SUP-03:** A quotation MUST identify the supplier, group, immutable demand snapshot, line items, unit prices, charges, validity period, and version.
- **FR-SUP-04:** Organizers MUST be able to compare valid quotes and select one supplier for the entire group purchase.
- **FR-SUP-05:** Suppliers MAY request rejection/withdrawal of an order with a stated reason; admin approval and audit are required.
- **FR-SUP-06:** Expired, withdrawn, or materially changed quotations MUST NOT be locked. A new quotation and renewed member confirmation are required.
- **FR-SUP-07:** A basic supplier dashboard MUST show own profile, offers, quotation submission, and quotation history using sample data.

### 4.6 Confirmation, locking, and cancellation

- **FR-ORD-01:** After quote selection, the system MUST generate a complete household cost/proposed item breakdown tied to a quotation version.
- **FR-ORD-02:** Members MUST explicitly accept or reject their own final proposed order; lack of response is not acceptance.
- **FR-ORD-03:** A rejection MUST remove that household's commitment from the prospective purchase and trigger recalculation of quantities, tiers, allocations, and eligibility.
- **FR-ORD-04:** Following the initial confirmation round, the system MUST allow **at most one** revised confirmation round if a rejection or material recalculation occurs.
- **FR-ORD-05:** If the revised confirmation round fails to yield a valid fully confirmed purchase by its deadline, the group purchase MUST be cancelled.
- **FR-ORD-06:** A group order MUST be locked only if its quotation remains valid, all included households approved the same final version, all included products qualify, and all totals reconcile.
- **FR-ORD-07:** Lock MUST be atomic and idempotent: duplicate/concurrent requests cannot produce duplicate purchase or household orders.
- **FR-ORD-08:** Prior to lock, normal cancellation MUST be supported subject to stage rules. After lock, cancellation MUST require an admin exception recorded in an audit trail.
- **FR-ORD-09:** Group status and each household's order/fulfillment status MUST be tracked independently.

### 4.7 Simulated payment, procurement, and fulfillment

- **FR-PAY-01:** MVP payment records MUST be explicitly marked simulated and must never initiate real payment collection.
- **FR-PROC-01:** Only authorized admin MUST initiate simulated procurement after successful lock.
- **FR-PROC-02:** The system MUST create one logical supplier purchase order for the group and one household order per participating household.
- **FR-FUL-01:** Customers MUST be able to select pickup or delivery and review the associated fee before confirming.
- **FR-FUL-02:** Admin MUST be able to update simulated packed, ready-for-pickup, out-for-delivery, delivered/collected, and failure statuses as appropriate.
- **FR-FUL-03:** Members MUST be able to view their own order and fulfillment history and acknowledge simulated receipt.

### 4.8 Notifications, disputes, and audit

- **FR-NOT-01:** In-app notifications MUST support group closing, quotation selection, confirmation deadline, price changes, order status, and dispute updates.
- **FR-NOT-02:** Configured email delivery SHOULD mirror critical notifications; failures MUST be logged safely without blocking core order transactions.
- **FR-DSP-01:** Customers MUST be able to create a dispute for missing, damaged, or incorrect items associated with their own orders.
- **FR-DSP-02:** Suppliers MUST be able to respond to authorized disputes; admin MUST be able to resolve them with a reason and resolution status.
- **FR-AUD-01:** Critical changes to quantity, quotation/price, supplier approval, permissions, locking, cancellation, and order state MUST have actor, timestamp, old/new values where appropriate, and reason.
- **FR-AUD-02:** Sensitive secrets and document contents MUST NOT be logged.

### 4.9 Demonstration and administration

- **FR-DEMO-01:** Public pages MUST clearly state **Demo — sample data and simulated orders, no real purchases or payments**.
- **FR-DEMO-02:** Seed data MUST use fictional suppliers, fictitious contact details, and sample catalog prices.
- **FR-DEMO-03:** Admin MUST have controls to manage sample records and safely reset demonstration data as designed.
- **FR-DEMO-04:** Regular users MUST NOT be allowed to impersonate admin or suppliers by changing client-side role fields.

---

## 5. Business workflow and lifecycle

### 5.1 Normal path

1. Customer signs in and selects the neighborhood.
2. Customer creates or joins an eligible public/private buying group.
3. Members add sealed-pack grocery requirements and exact/flexible preferences.
4. System shows aggregate demand and quantity-tier progress without exposing private lists.
5. Group closes on deadline or configured early-close condition; immutable demand snapshot is recorded.
6. Verified suppliers submit sample quotations against that snapshot.
7. Organizer selects a valid quotation from **one supplier**.
8. System calculates per-household eligible items, substitutions, charges, fulfillment fees, and savings.
9. Members individually review and accept/reject the selected quotation version.
10. If all included households approve and eligibility still holds, the group locks atomically.
11. Admin simulates payment status and procurement.
12. Admin coordinates simulated packing, pickup/delivery, and order updates.
13. Households acknowledge receipt; any discrepancies become disputes.
14. Group purchase reaches completed state once all requisite simulated operations are complete.

### 5.2 Rejection path

1. At least one household rejects or cancels before lock.
2. Exclude its proposed commitment; recalculate quantities, eligibility, shared charges, and all affected household totals.
3. Produce a **new version** and obtain confirmations from remaining participating households in **one final revised round**.
4. If all required confirmations are obtained, supplier quotation is still valid, and product thresholds remain satisfied, lock.
5. Otherwise cancel the group purchase and notify participants.
6. A further rejection is **not** an unlimited retry loop.

### 5.3 Minimum quantities not achieved

- Organizer can propose extending the open period, dropping ineligible items, or accepting a separately quoted higher price if available.
- Members explicitly confirm the revised proposal. No non-qualifying item may be silently charged at an undisclosed price.
- If no acceptable valid proposal is confirmed within group rules, cancel the affected proposed purchase.
- The **single revised confirmation-round limit** still applies once final quote confirmation has begun.

### 5.4 State models

**Group states:** `OPEN`, `CLOSED`, `QUOTING`, `CONFIRMING`, `LOCKED`, `PROCUREMENT`, `FULFILLMENT`, `COMPLETED`, `CANCELLED`.  
**Quotation states:** `DRAFT`, `SUBMITTED`, `SELECTED`, `EXPIRED`, `WITHDRAWN`, `SUPERSEDED`.  
**Member confirmation states:** `PENDING`, `ACCEPTED`, `REJECTED`, `INVALIDATED`.  
**Household order states:** `CONFIRMED`, `SIMULATED_PAYMENT_PENDING`, `SIMULATED_PAID`, `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `RECEIVED`, `EXCEPTION`, `CANCELLED`.  
**Dispute states:** `OPEN`, `UNDER_REVIEW`, `AWAITING_SUPPLIER`, `RESOLVED`, `REJECTED`.

Status transitions MUST be validated by the backend; frontends must not update a state directly without an authorized domain action.

---

## 6. Calculation and allocation requirements

### 6.1 Units

Store quantity as number of sealed SKU packs. Example: `20 × 1 kg rice packs`. Different brands and pack sizes are distinct variants unless a user explicitly agrees to a compatible substitution. Kilograms alone do not prove that different SKUs can be aggregated.

### 6.2 Tier eligibility

For each quoted variant, identify total committed pack count and the highest applicable tier whose minimum-packs threshold is met. Recompute when participants leave or quantities change.

### 6.3 Household totals

`final_total = item_subtotal + allocated_shared_charges + fulfillment_fee`

`reference_total = sum(reference_retail_unit_price × chosen_packs)`

`estimated_savings = reference_total - final_total`

`estimated_savings_pct = 100 × estimated_savings / reference_total` only if `reference_total > 0`; otherwise display unavailable.

Currency is INR for the MVP. Store money in `NUMERIC/DECIMAL` or integer minor units; do not use binary floating-point arithmetic. Use a deterministic rounding policy and distribute residual paise so household charge shares sum exactly to the supplier/shared charge total.

### 6.4 Comparison transparency

Every retail comparison price SHOULD store source, observation date/time, and unit/pack identity. Show an **estimate** label and disclose sample/demo data. Do not guarantee savings or hide a negative result.

---

## 7. Data requirements

### 7.1 Proposed data entities

| Entity/table | Core attributes / intent |
|---|---|
| `users` | UUID, auth user ID, name, email, phone (optional), role, neighborhood ID, timestamps |
| `neighborhoods` | UUID, name, city, postal code, active flag |
| `delivery_addresses` | UUID, user ID, private address, neighborhood ID |
| `suppliers` | UUID, owner user ID, business name, verification status, review notes |
| `supplier_documents` | UUID, supplier ID, type, private storage path, review state |
| `products` | UUID, name, category, base unit, active flag |
| `product_variants` | UUID, product ID, brand, pack quantity/unit, SKU, active flag |
| `retail_reference_prices` | UUID, variant ID, price, source, observation time |
| `supplier_offers` | UUID, supplier ID, variant ID, availability, status |
| `offer_price_tiers` | UUID, offer ID, minimum packs, pack price |
| `buying_groups` | UUID, organizer ID, neighborhood ID, visibility, deadline, close rule, status, version |
| `group_members` | UUID, group ID, user ID, membership status |
| `group_invitations` | UUID, group ID, hashed token, expiry, revocation/usage rules |
| `grocery_list_items` | UUID, group ID, user ID, requested product/variant, pack count, brand flexibility |
| `demand_snapshots` | UUID, group ID, version, creation time, immutable payload hash |
| `demand_snapshot_items` | UUID, snapshot ID, product/variant ID, aggregated packs |
| `supplier_quotes` | UUID, group ID, supplier ID, snapshot ID, version, valid-until, status, charges |
| `quote_items` | UUID, quote ID, variant ID, packs, unit price, line total |
| `quote_household_allocations` | UUID, quote ID, user ID, variant ID, packs, selected substitution, costs |
| `member_confirmations` | UUID, quote ID, user ID, round, decision, decided-at |
| `purchase_orders` | UUID, group ID, supplier ID, quote ID, status, total, simulated flag |
| `household_orders` | UUID, purchase order ID, user ID, total, status |
| `household_order_items` | UUID, household order ID, variant ID, packs, locked unit price |
| `payment_records` | UUID, household order ID, amount, simulated status, timestamp |
| `fulfillments` | UUID, household order ID, method, fee, private delivery address reference, status |
| `delivery_fee_rules` | UUID, neighborhood/area, method, fee, validity |
| `disputes` | UUID, household order ID, raised-by, type, description, status, resolution |
| `notifications` | UUID, user ID, kind, payload, read-at, delivery state |
| `audit_logs` | UUID, actor ID, entity, action, old/new values metadata, time |
| `idempotency_keys` | Request scope/key, operation status/result identity |

### 7.2 Data constraints

- All primary keys are UUIDs (except where external IDs are unavoidable).
- Foreign keys are enforced; indexes cover group memberships, statuses, user orders, quote lookups, and products.
- Unique `(group_id, user_id)` membership; quote version unique per relevant group/snapshot; idempotency uniqueness per operation key.
- Positive integer pack counts, nonnegative fees, controlled status values, and logical expiration timestamps.
- Locking, quote approval, and purchase-order creation use database transactions and version checks.
- Old quotations and confirmation decisions remain available for audit rather than being overwritten.
- Delivery addresses and supplier documents are access-restricted and never exposed in group aggregates.

### 7.3 Data retention and demo handling

- Use entirely fictional sample suppliers and contacts on the publicly accessible demo.
- Do not solicit real supplier tax documents through public demo flows; use synthetic demonstration attachments.
- Data reset must not accidentally delete operational or admin configuration outside demo scope.
- Before real-world launch, define lawful retention, deletion requests, privacy notices, and required verification handling.

---

## 8. API requirements

**Style:** REST, JSON, `/api/v1`; FastAPI OpenAPI docs; Pydantic validation; error responses with stable codes.

| Area | Representative endpoints |
|---|---|
| Profile | `GET /users/me`, `PATCH /users/me` |
| Neighborhoods | `GET /neighborhoods` |
| Groups | `POST /groups`, `GET /groups`, `GET /groups/{group_id}`, `PATCH /groups/{group_id}` |
| Join/invite | `POST /groups/{group_id}/join`, `POST /groups/{group_id}/leave`, `POST /groups/{group_id}/invitations`, `POST /invitations/redeem` |
| Catalog | `GET /products`, `GET /products/{product_id}/variants` |
| Personal list | `GET /groups/{group_id}/my-items`, `POST /groups/{group_id}/my-items`, `PATCH /groups/{group_id}/my-items/{item_id}`, `DELETE /groups/{group_id}/my-items/{item_id}` |
| Demand | `GET /groups/{group_id}/demand`, `POST /groups/{group_id}/close` |
| Suppliers/offers | `GET /suppliers`, `POST /suppliers`, `GET /supplier/offers`, `POST /supplier/offers` |
| Quotes | `GET /groups/{group_id}/quotes`, `POST /supplier/quotes`, `POST /groups/{group_id}/select-quote` |
| Confirmation | `GET /groups/{group_id}/my-proposal`, `POST /groups/{group_id}/confirmations` |
| Lock | `POST /groups/{group_id}/lock` |
| Orders | `GET /orders/me`, `GET /orders/{order_id}` |
| Admin | `GET /admin/suppliers/pending`, `POST /admin/suppliers/{supplier_id}/review`, `POST /admin/purchase-orders/{id}/simulate`, `PATCH /admin/fulfillments/{id}` |
| Disputes | `POST /orders/{order_id}/disputes`, `GET /admin/disputes`, `PATCH /admin/disputes/{id}` |
| Notifications | `GET /notifications`, `PATCH /notifications/{id}/read` |

**API rules:**

- All private endpoints MUST validate bearer token and object-level authorization.
- Create/lock/payment-simulation endpoints MUST be idempotent or guarded against duplication.
- Conflicting version updates MUST return a conflict status and current version, not silently overwrite changes.
- Pagination and filtering SHOULD be available for groups, products, quotations, and audit listings.
- Define full request/response DTOs and error scenarios before implementing each feature.

---

## 9. User interface requirements

### 9.1 Public screens

1. Landing page explaining community group buying and the demo nature of transactions.
2. How it works / FAQ page.
3. Registration, login, and authentication callback pages.

### 9.2 Customer screens

1. Customer dashboard with active groups, invitations, estimated savings, and orders.
2. Neighborhood group directory and filters.
3. Create group wizard and private invite flows.
4. Group details, eligibility progress, membership, and aggregate demand.
5. Product catalog and variant/brand selection.
6. My grocery list and editable quantities.
7. Quote proposal with substitutions, fee breakdown, and accept/reject actions.
8. My orders, pickup/delivery choices, and status history.
9. Notifications, private addresses, profile, and dispute submission.

### 9.3 Organizer screens

1. Group settings and deadline management.
2. Aggregated demand and threshold progress.
3. Quote comparison and selection.
4. Confirmation status overview without exposing individual private lists.
5. Group-level order progress and exception notices.

### 9.4 Supplier screens

1. Supplier profile and demo verification status.
2. Own products/offers and price tiers.
3. Sample quotation creation and history.

### 9.5 Admin screens

1. Overview of groups, orders, suppliers, and exceptions.
2. Product catalog and retail reference price management.
3. Supplier verification review.
4. Group moderation and quote oversight.
5. Simulated procurement and payment status.
6. Pickup/delivery fee configuration and fulfillment updates.
7. Dispute queue, notifications, and audit records.

### 9.6 UX/accessibility

- Mobile-first responsive layouts with clear desktop support.
- Consistent navigation, forms, validation, and status indicators.
- Loading states, empty states, permission-denied states, and recoverable errors.
- Keyboard functionality, accessible labels, semantic controls, sufficient contrast, and visible focus states.
- Show exact item, pack size, selected brand, totals, fees, and savings before confirmation.
- No misleading “guaranteed savings” or real-purchase UI in a simulated demo.

---

## 10. Non-functional requirements

| ID | Quality area | Requirement / verification target |
|---|---|---|
| NFR-01 | Security | Enforce JWT verification, authorization per resource, input validation, and rate limits on sensitive endpoints. |
| NFR-02 | Privacy | Hide personal lists and precise delivery addresses from ordinary members and organizers. |
| NFR-03 | Integrity | Use database transactions for locking, versions for quotations, and idempotency for critical actions. |
| NFR-04 | Performance | Target p95 common read API latency < 500 ms under a documented small demo load; measure in staging. |
| NFR-05 | Availability | Support a publicly accessible demo; no production SLA is promised for MVP. |
| NFR-06 | Responsiveness | Support mobile, tablet, and desktop viewports without broken primary workflows. |
| NFR-07 | Accessibility | Aim for WCAG 2.2 AA on core user journeys and test keyboard navigation. |
| NFR-08 | Maintainability | Typed TypeScript frontend, organized FastAPI modules, migrations, linting, and automated tests. |
| NFR-09 | Observability | Structured backend logs, exception reporting, and correlation/request IDs without secrets. |
| NFR-10 | Resilience | Safe retry/timeout handling for email and external services; failures do not corrupt order records. |
| NFR-11 | Data safety | Prevent public access to private storage; keep secrets only in server environment settings. |
| NFR-12 | Compatibility | Latest stable versions of mainstream Chromium, Firefox, and Safari at release testing. |

---

## 11. Architecture and technology baseline

- **Frontend:** React + TypeScript + Vite; Tailwind CSS; shadcn/ui.
- **Backend:** Python FastAPI; Pydantic; SQLAlchemy 2.x; Alembic.
- **Database:** Supabase-hosted PostgreSQL.
- **Authentication:** Supabase Auth (email/password + Google).
- **Private files:** Supabase Storage.
- **Testing:** Pytest, Vitest, Playwright.
- **Hosting:** Vercel frontend; Render backend; Supabase database/auth/storage.
- **Versioning:** GitHub repository; `AGENTS.md` and `PROJECT_CONTEXT.md` recommended.

Architecture pattern: **modular monolith** with a REST interface. Recommended backend modules: auth/users, neighborhoods/groups, catalog/suppliers, lists/aggregation, quotes/pricing, confirmations/orders, fulfillment/disputes, notifications/audit.

Authentication is delegated to Supabase, but **authorization lives in the backend domain services**, including group ownership and supplier approval checks.

---

## 12. Security, compliance, and trust

1. Verify JWT signature, issuer, audience, and expiration server-side.
2. Keep admin provisioning controlled and separate from customer self-registration.
3. Enforce object-level access for each group's membership, lists, quotes, documents, orders, and disputes.
4. Store sensitive documents in private storage with short-lived authorized access.
5. Avoid logging full addresses, identity documents, passwords, or tokens.
6. Apply CSRF protections where cookie-based credentials are used; otherwise use secure bearer-token handling with appropriate CORS configuration.
7. Use request validation, SQL parameterization via ORM, safe UI escaping, and rate limits.
8. Treat sample quotes, delivery events, and payments as simulated; never call real financial or procurement endpoints in v1.
9. Before real-world launch, perform a separate legal/compliance review covering applicable Indian privacy, consumer, taxation, food distribution/packaging, supplier verification, and payment rules. This specification does **not** assert the real-world product is compliant by itself.

---

## 13. Acceptance criteria and minimum test scenarios

| ID | Scenario | Pass condition |
|---|---|---|
| AC-01 | Sign up using email/password and Google | User can authenticate and reach appropriate profile/dashboard. |
| AC-02 | Create a public group | Creator becomes organizer; eligible neighborhood users can find it. |
| AC-03 | Join private group | Valid invitation succeeds; invalid/expired token fails. |
| AC-04 | Add individual groceries | Owner can manage own items; other members cannot read them. |
| AC-05 | Add compatible SKUs across households | Correct total sealed-pack count; incompatible packs remain separate. |
| AC-06 | Apply price tiers | Correct tier selected only after applicable pack minimum is reached. |
| AC-07 | Supplier quotes | Verified supplier submits quote with version/expiry; organizer can compare. |
| AC-08 | Flexible-brand order | Final selected brand/pack is visible and explicitly approved. |
| AC-09 | Non-qualifying grocery item | Excluded from proposed purchase without silent charges. |
| AC-10 | Household breakdown | Items, shared charges, delivery/pickup fee, total, and signed savings reconcile. |
| AC-11 | Initial rejection | Member removed; quote re-evaluated and one revised confirmation round starts. |
| AC-12 | Revised-round rejection or timeout | Group purchase cancels; no third round. |
| AC-13 | Successful confirmation | All included members confirm same valid quote before lock. |
| AC-14 | Concurrent lock requests | Exactly one logical purchase order and correct household orders created. |
| AC-15 | Quote expiration | Lock refused; new quote/confirmation required. |
| AC-16 | Cancel after lock | Ordinary customer action refused; audited admin exception workflow available. |
| AC-17 | Simulated admin procurement | Records update without real payment or supplier transaction. |
| AC-18 | Pickup vs delivery | Correct configurable charge and fulfillment state for each household. |
| AC-19 | Dispute | Customer can open; supplier responds where authorized; admin resolves. |
| AC-20 | Security/privacy | Unauthorized users cannot see another household's list/address. |
| AC-21 | Audit history | Critical price, state, quantity, permission, and approval events recorded. |
| AC-22 | Public demo | Prominent simulated-data notice; no real checkout/payment. |
| AC-23 | Responsive UX | Core customer flows usable on representative phone and desktop widths. |

### Essential automated tests

- Unit tests for aggregation, tier boundaries, rounding/remainder allocation, missing retail comparison price, negative savings, flexible-brand matching, and invalid packs.
- State-machine tests for group closure, quote expiration, rejection, revised confirmation, and lock.
- Integration tests for database transactions, JWT/role authorization, duplicate membership, stale versions, and idempotent order creation.
- End-to-end browser tests for customer/organizer/supplier/admin demo paths.

---

## 14. Milestones and delivery plan

### M1 — Foundation and authentication

Set up repository; frontend/backend; local and hosted development environment; PostgreSQL migrations; Supabase authentication; role checks; landing/login/register and basic role-based dashboards; smoke tests. **Do not implement subsequent modules yet.**

**Definition of done:** App runs locally; frontend talks to backend; authenticated `/api/v1/users/me` works; unauthorized access is blocked; required tests execute and outcomes are recorded.

### M2 — Neighborhood groups and grocery lists

Implement neighborhoods, public/private groups, invitations, role-scoped organizer functions, catalog and variants, sample supplier records, and personal grocery list CRUD.

### M3 — Demand, tiers, and quotations

Implement privacy-preserving aggregation, price tiers, sample supplier dashboard, supplier verification, quotations, reference retail prices, and savings calculations.

### M4 — Confirmation and atomic lock

Implement immutable quote snapshots, per-household allocation, accept/reject, a single revised confirmation round, cancellation, concurrency protection, and order generation.

### M5 — Simulated operations

Implement simulated payment/procurement, pickup/delivery status, configurable fees, notifications, disputes, audit review, and demo reset controls.

### M6 — Validation and deployment

Run automated and manual security/UX checks; validate end-to-end scenarios; seed fictional demo data; deploy Vercel + Render + Supabase; verify public demo disclaimer.

Milestone ordering is mandatory unless a documented architecture decision approves a change. Each milestone ends with a code review, executed test report, and Git commit.

---

## 15. Risks, dependencies, and mitigations

| Risk | Mitigation |
|---|---|
| Aggregate demand does not match supplier pack constraints | Model sealed SKU packs and reject incompatible substitutions. |
| Apparent discount vanishes after fees | Show final signed savings after all charges. |
| Quote expires or changes while members confirm | Immutable versioned quotes and mandatory reconfirmation. |
| Member departure breaks minimum threshold | Recalculate; one final confirmation round, then cancel if unsuccessful. |
| Two users lock the same group concurrently | Database transaction, version checks, idempotency key, uniqueness constraints. |
| Organizer sees private details | Expose dedicated aggregate-only API/DTOs. |
| Supplier verification data leaks in public demo | Synthetic documents, private storage, authorization. |
| Simulated purchases are mistaken for live transactions | Clear global demo banner, explicit simulated status naming, no payment gateways. |
| Scope creep delays completion | Freeze MVP, backlog Phase 2/3 enhancements. |

---

## 16. Future enhancements (not MVP commitments)

- Multiple suppliers within one group order and per-item optimized supplier selection.
- Real supplier onboarding, compliance checks, and price feeds.
- Live payment collection, settlement, refunds, and invoicing.
- Delivery partner integration and actual logistics tracking.
- Allow repacking large wholesale sacks with food safety and accountability processes.
- Recurring monthly buying groups and smart group matching.
- Verified local reference prices, personalized savings reports, and price history.
- AI recommendations, demand forecasting, and supplier reliability scoring.
- Android/iOS app and multi-city support.
- Monetization options after validating customer savings and willingness to use the service.

---

## 17. Implementation rules for Antigravity / Codex

1. Read this SRS before designing database tables, endpoints, or UI flows.
2. Treat **Sections 2–6 and 13** as authoritative product behavior; do not silently modify them.
3. Keep the demo safe: synthetic products/suppliers and simulated transactions only.
4. Maintain a traceability map from requirements to APIs, services, UI components, and tests.
5. Propose and document any technical assumption that is not specified here; use simple configurable defaults instead of inventing new product features.
6. Enforce all authorization and business validation in the backend.
7. Implement milestone by milestone, starting with **M1 only**.
8. Run tests, report what actually passed/failed, and do not claim unexecuted work is complete.
9. Keep `.env.example` free of real secrets and provide local setup instructions.
10. Request product-owner approval before expanding scope or moving to the next milestone.

### First instruction to the coding agent

> Read `SRS.md` completely. Inspect the repository. Create a concise milestone-1 implementation plan and a file/folder plan. Then implement **M1 only** using React + TypeScript + Vite, FastAPI, PostgreSQL, and Supabase Auth, with a responsive landing page, login/register flow, role-based dashboard shells, and authenticated `/api/v1/users/me`. Include database migrations, `.env.example`, README setup commands, and smoke tests. Keep payment and procurement strictly simulated and do not begin M2 without approval.

---

## 18. Requirements baseline and change control

This SRS incorporates all confirmed decisions from:

- Round 1: group creation/joining, wholesale participation, fulfillment, payment deferral, neighborhood focus.
- Round 2: grocery catalog, pricing/quotations, privacy-aware aggregation, order closure and organizer permissions.
- Round 3: free initial service, admin procurement, quote expiry, rejection handling, sealed packs, fulfillment, disputes, security, phased prototype.
- Final decisions: one reconfirmation round, one supplier per purchase, basic supplier dashboard, email/password + Google auth, public demo without real transactions.

New features or changed requirements should be recorded in a change log and approved before implementation. Defects that violate the documented behavior should be fixed without changing this baseline.

**End of SRS — Version 1.0**
