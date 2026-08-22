# Dayflow — Human Resource Management System (HRMS)

> *Every workday, perfectly aligned.*

Dayflow is a modern, full-stack Human Resource Management System (HRMS) built for fast-moving organizations. It streamlines employee onboarding, live presence tracking with an integrated systray check-in widget, multi-tier leave approval workflows, and automated payroll generation with loss-of-pay (LOP) deductions tied directly to attendance records.

---

## 📚 Project Documentation & Contracts

All architectural and development specifications are documented under [`docs/`](file:///c:/Users/Sarthak/OneDrive/Desktop/Programs/odoo-hackathon-project/docs):

* **[`docs/PROJECT_CONTEXT.md`](file:///c:/Users/Sarthak/OneDrive/Desktop/Programs/odoo-hackathon-project/docs/PROJECT_CONTEXT.md):** Authoritative Product Requirements Document (PRD) synthesizing the hackathon requirements and Excalidraw wireframe specifications.
* **[`docs/ARCHITECTURE.md`](file:///c:/Users/Sarthak/OneDrive/Desktop/Programs/odoo-hackathon-project/docs/ARCHITECTURE.md):** Technical architecture, technology choices, repository layout, and cross-layer data flows.
* **[`docs/DATABASE.md`](file:///c:/Users/Sarthak/OneDrive/Desktop/Programs/odoo-hackathon-project/docs/DATABASE.md):** Relational PostgreSQL schema, field definitions, attendance-to-payroll calculation rules, and Row Level Security (RLS) matrix.
* **[`docs/OWNERSHIP.md`](file:///c:/Users/Sarthak/OneDrive/Desktop/Programs/odoo-hackathon-project/docs/OWNERSHIP.md):** 4-person team ownership matrix, Git branch strategy, shared data contracts, and implementation roadmap.
* **[`docs/DECISIONS.md`](file:///c:/Users/Sarthak/OneDrive/Desktop/Programs/odoo-hackathon-project/docs/DECISIONS.md):** Architecture Decision Records (ADRs) tracking key technical choices.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
* **Backend / Database:** Supabase (PostgreSQL 15+, GoTrue Auth, Supabase Storage, Edge Functions)
* **Security:** Strict PostgreSQL Row Level Security (RLS), zero client-side secret exposure

---

## 👥 Four-Person Team Ownership

| Developer | Responsibility Area | Git Branch |
| :--- | :--- | :--- |
| **Person 1 — Frontend Lead** | Global UI, Layout, Navigation, Routing, Auth & Dashboard UI | `feature/frontend` |
| **Person 2 — Backend Lead** | Supabase, PostgreSQL, Schema Migrations, Auth, RLS, Storage | `feature/backend` |
| **Person 3 — Employee Operations** | Employee Directory, Profiles, Systray Check-in/out, Leave Flow | `feature/employee-operations` |
| **Person 4 — Payroll / QA** | Salary Configuration, Payslips, Reports, Analytics, E2E QA | `feature/payroll` |

---

## 🚀 Development Roadmap

1. **Phase 1:** Foundation Documentation & Data Contracts *(Completed)*
2. **Phase 2:** Supabase Schema, Auth & RLS
3. **Phase 3:** Frontend Foundation & Authentication UI
4. **Phase 4:** Employee Profile & Directory
5. **Phase 5:** Attendance Tracking & Systray
6. **Phase 6:** Leave & Time-Off Management
7. **Phase 7:** Salary Structure & Payslips
8. **Phase 8:** Reports, Analytics & Notifications
9. **Phase 9:** Integration, Security Verification & End-to-End QA
