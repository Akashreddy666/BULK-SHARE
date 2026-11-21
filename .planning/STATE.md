# BULK SHARE — Project State

**Current Phase:** Milestone 5 Complete (Awaiting User Review / Approval for Milestone 6)  
**Status:** Ready  
**Completed Milestones:**
- **Milestone 1:** Project setup, monorepo structure, FastAPI backend, SQLite/PostgreSQL configuration, Supabase auth & JWT security, green-and-white React UI, role switcher & initial landing page.
- **Milestone 2:** Neighborhood groups (public & private with token invites), membership management, 5 staple grocery catalog (Rice, Oil, Dal, Sugar, Flour) with sealed pack variants, household grocery lists with exact/flexible brand preference, and strict household privacy isolation (FR-LIST-04).
- **Milestone 3:** Grocery demand aggregation engine (privacy-preserving cumulative sealed pack counts), wholesale volume price tiers (Tier 1/2/3 thresholds per SKU), individual household savings calculation engine vs reference retail prices, immutable demand snapshot triggers, supplier profile & product offers management, and supplier wholesale quotation submission & comparative views.
- **Milestone 4:** Single wholesale quotation acceptance (MVP rule), automated Confirmation Round 1 initiation, individual member allocation review with delivery preference selection (Pickup vs Home Delivery), max 1 recalculation round with automatic dropping of non-confirming members/items, group purchase cancellation on persistent failure, and final order locking into frozen immutable snapshot in `GroupOrder` with full audit logging.
- **Milestone 5:** Simulated household payments (UPI, Card, NetBanking) with itemized invoices, retail reference vs wholesale savings breakdown and official tax receipts; platform admin wholesale procurement placement (PO creation); supplier PO management lifecycle (Acknowledge -> Dispatch to Hub -> Delivered to Hub); neighborhood hub pickup verification (6-digit PIN code passes, e.g. `BS-4829`, and instant handover verification); doorstep home delivery management; real-time in-app notification center; and customer dispute reporting with admin review & simulated refund processing.

**Next Milestone:** Milestone 6 (Automated Testing, UI Improvements, Security Hardening, and Production Deployment Preparation)  
**Blocked by:** Awaiting user approval to begin Milestone 6  
**Last Updated:** 2026-11-21
