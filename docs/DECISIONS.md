# Dayflow HRMS — Architecture Decision Records (ADR)

> **Document Status:** Active Record of Architectural Decisions  
> **Maintained by:** Technical Orchestrator & Team Leads  

---

## ADR-001: Automatic Employee Login ID Format and Generation Strategy

* **Date:** 2026-08-22
* **Status:** Accepted
* **Decision:**
  Adopt the standardized format `[CompanyPrefix][First2First][First2Last][Year][4DigitSerial]` (e.g. `OIJODO20220001` for John Doe joining Odoo India in 2022). Generation will be managed in PostgreSQL via a stored procedure/trigger or within the `create-employee` Supabase Edge Function using row-locking (`FOR UPDATE`) to guarantee atomicity and avoid race conditions.
* **Reason:**
  The Excalidraw wireframe specifications explicitly require this format for employee sign-in and identification. Generating this in the database or backend ensures uniqueness and prevents client tampering.
* **Alternatives Considered:**
  1. *Client-side generation:* Rejected due to high risk of ID collisions during concurrent user creation and security vulnerabilities.
  2. *Standard UUID only:* Rejected because human-readable employee IDs are explicitly mandated in the design and login wireframes.
* **Impact:**
  Guarantees consistent, collision-free login IDs across all employee records.

---

## ADR-002: Supabase Auth & Email Verification Strategy for Hackathon MVP

* **Date:** 2026-08-22
* **Status:** Accepted
* **Decision:**
  Support standard Supabase Auth with email confirmation disabled (auto-confirm enabled) for local and staging development environments, while keeping the architecture and schema compatible with verified emails.
* **Reason:**
  While the PDF PRD mentions email verification, requiring manual inbox verification during rapid hackathon live demonstrations and multi-persona testing introduces external SMTP latency and friction.
* **Alternatives Considered:**
  1. *Strict SMTP verification required for all signups:* Rejected for hackathon demo agility.
  2. *Custom mock authentication without Supabase GoTrue:* Rejected because it would violate the single-source-of-truth security principle and make RLS impossible.
* **Impact:**
  Streamlined developer and judge testing without sacrificing production authentication architecture.

---

## ADR-003: Backend-Enforced Attendance → Payroll Computation Engine

* **Date:** 2026-08-22
* **Status:** Accepted
* **Decision:**
  All Loss of Pay (LOP) calculations, payable days formulas, and net salary deductions must be computed exclusively on the backend (PostgreSQL RPC / Supabase Edge Function), storing deterministic monthly `payslips` records.
* **Reason:**
  Payroll calculations must be tamper-proof. Calculating payable days or deductions in the browser would allow malicious users to spoof their attendance counts or salary slips.
* **Alternatives Considered:**
  1. *Client-side calculation on the fly in React:* Rejected because it lacks auditability, cannot be securely queried across admin reports, and violates zero-trust principles.
* **Impact:**
  Consistent, mathematically sound payslip generation linked directly to logged attendance and approved leave requests.

---

## ADR-004: Row Level Security (RLS) as the Single Authoritative Security Boundary

* **Date:** 2026-08-22
* **Status:** Accepted
* **Decision:**
  Enable RLS on 100% of public database tables (`companies`, `profiles`, `attendance_records`, `leave_requests`, `salary_structures`, `payslips`). UI route guards in React Router are treated strictly as user experience navigation helpers and never as security mechanisms.
* **Reason:**
  Supabase clients connect directly to PostgREST with the anonymous key. RLS is the only mechanism that prevents employees from fetching peer salary data or approving their own leave requests.
* **Alternatives Considered:**
  1. *Backend proxy layer for all queries:* Unnecessary boilerplate when PostgreSQL RLS natively delivers sub-millisecond query authorization.
* **Impact:**
  Rock-solid data isolation between employees and administrators.

---

## ADR-005: Frontend Tech Stack & Repository Structure Separation

* **Date:** 2026-08-22
* **Status:** Accepted
* **Decision:**
  Standardize on React 19 + TypeScript + Vite + Tailwind CSS v4 in `frontend/`, with Supabase migrations in `supabase/migrations/` and shared docs in `docs/`. The `backend/` directory will not duplicate Supabase code and will only house verification/seed utilities if needed.
* **Reason:**
  Provides instant HMR, high productivity for the 4-person team, zero unnecessary abstraction, and clean component isolation.
* **Alternatives Considered:**
  1. *Next.js / SSR framework:* Rejected due to unnecessary SSR complexity for an internal HRMS application and higher deployment overhead during a hackathon.
  2. *Plain JavaScript:* Rejected due to high risk of cross-module data contract regressions without TypeScript interfaces.
* **Impact:**
  Fast build times, reliable type sharing, and clear separation of concerns.
