# Dayflow HRMS — Backend Verification & Test Suite

This directory houses backend-level validation scripts, test fixtures, and security verification tools for the Dayflow HRMS PostgreSQL/Supabase foundation.

> **Note on Architecture Boundary (`docs/ARCHITECTURE.md` Section 2.1):**
> * All database migrations live strictly in `supabase/migrations/`.
> * All seed fixtures live in `supabase/seed.sql`.
> * All edge functions live in `supabase/functions/`.
> * This directory (`backend/`) contains local SQL test suites and developer utilities.

---

## 🧪 Security & Verification Test Matrix (Step 17)

The test script `backend/test_security.sql` verifies the 10 cardinal security vectors:

1. **Employee Own Data Access:** Employee can read own profile, attendance, leave, salary, payslips.
2. **Peer Private Data Protection:** Employee cannot read other employees' sensitive fields (Bank, PAN, UAN, DOB).
3. **Salary Structure Protection:** Employee cannot read or modify another employee's salary structure.
4. **Salary Structure Mutation Lock:** Non-admin employee has ZERO write/insert/update/delete privileges on `salary_structures`.
5. **Attendance Protection:** Employee cannot insert or modify another employee's attendance records.
6. **Leave Approval Security:** Employee cannot approve or reject leave requests.
7. **Admin Privilege Verification:** Admin can access and manage organization-level attendance, leaves, and salary structures.
8. **Multi-Tenant Company Isolation:** Users in Company A cannot view or mutate any data belonging to Company B.
9. **Anonymous Access Block:** Unauthenticated/anon requests cannot read protected tables.
10. **Zero Service Role in Frontend:** Verified that `SUPABASE_SERVICE_ROLE_KEY` is not present in frontend code.

---

## 🚀 Running Verification Tests

To execute the test suite in PostgreSQL:

```bash
psql -h localhost -p 54322 -U postgres -d postgres -f backend/test_security.sql
```

Or using Supabase CLI:

```bash
npx supabase db test
```
