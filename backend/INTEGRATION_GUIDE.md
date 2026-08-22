# Dayflow HRMS — Backend Integration Guide for Frontend (Person 1 & Team)

> **Document Version:** 1.0.0  
> **Target Audience:** Person 1 (Lead Frontend), Person 3 (Employee Ops), Person 4 (Payroll/QA)  
> **Source Schema:** `supabase/migrations/` & `frontend/src/types/database.types.ts`

---

## 1. Environment Configuration

The frontend interacts with Supabase exclusively using the public **Anonymous Key** and **Supabase URL**.

Create `frontend/.env`:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase-status
```

> [!CAUTION]
> **Zero Service Role Key in Frontend:**
> Never import or expose `SUPABASE_SERVICE_ROLE_KEY` in `frontend/`. All security and multi-tenant authorization is enforced natively by PostgreSQL Row Level Security (RLS).

---

## 2. Table Names & Canonical Schema

All queries should query public tables and import types from [`frontend/src/types/database.types.ts`](file:///c:/Users/sbambore/Documents/GitHub/backend/odoo-hackathon-project/frontend/src/types/database.types.ts):

| Table Name | Primary Key | Foreign Keys | RLS Behavior |
| :--- | :--- | :--- | :--- |
| `companies` | `id` (UUID) | — | Read own company; Admin update |
| `profiles` | `id` (UUID) | `company_id -> companies(id)` | Read colleagues; Admin edit all; Employee edit personal |
| `attendance_records` | `id` (UUID) | `user_id -> profiles(id)` | Employee view/log own; Admin manage all in company |
| `leave_requests` | `id` (UUID) | `user_id -> profiles(id)` | Employee view/submit own; Admin approve/reject |
| `salary_structures` | `id` (UUID) | `user_id -> profiles(id)` (UNIQUE) | Employee read-only own; Admin full CRUD |
| `payslips` | `id` (UUID) | `user_id -> profiles(id)` | Employee read-only own; Admin full CRUD |

---

## 3. Authentication & Sign In with Email OR Login ID

The application supports login with either **Email** or **Login ID** (e.g. `OIJODO20220001`):

```typescript
import { supabase } from '../lib/supabase';

export async function loginWithIdentifier(identifier: string, password: string) {
  let emailToUse = identifier.trim();

  // If the identifier is a Login ID (e.g. OIJODO20220001), resolve to email via backend RPC
  if (!emailToUse.includes('@')) {
    const { data: resolvedEmail, error: lookupErr } = await supabase.rpc('get_email_by_login_id', {
      p_login_id: identifier.trim(),
    });

    if (lookupErr || !resolvedEmail) {
      throw new Error('Invalid Login ID or user not found');
    }
    emailToUse = resolvedEmail;
  }

  // Authenticate using standard Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  if (error) throw error;
  return data;
}
```

---

## 4. Fetching Active User Profile & Role

After successful authentication, fetch the current user's role and company context:

```typescript
const { data: profile, error } = await supabase
  .from('profiles')
  .select(`
    *,
    companies:company_id (
      id,
      name,
      logo_url
    )
  `)
  .eq('id', user.id)
  .single();
```

---

## 5. Attendance Operations (Systray Widget)

### 5.1 Check-In (Systray Widget)
```typescript
const today = new Date().toISOString().split('T')[0];

const { data, error } = await supabase
  .from('attendance_records')
  .insert({
    user_id: user.id,
    company_id: profile.company_id,
    date: today,
    check_in: new Date().toISOString(),
    status: 'present',
  })
  .select()
  .single();
```

### 5.2 Check-Out (Systray Widget)
Updating `check_out` automatically triggers the PostgreSQL engine to compute `work_hours`, `extra_hours`, and determine `present` vs `half_day` status:
```typescript
const { data, error } = await supabase
  .from('attendance_records')
  .update({
    check_out: new Date().toISOString(),
  })
  .eq('user_id', user.id)
  .eq('date', today)
  .select()
  .single();
```

---

## 6. Time Off & Leave Workflows

### 6.1 Employee Submits Leave Request
```typescript
const { data, error } = await supabase
  .from('leave_requests')
  .insert({
    user_id: user.id,
    company_id: profile.company_id,
    leave_type: 'paid', // 'paid' | 'sick' | 'unpaid'
    start_date: '2026-09-01',
    end_date: '2026-09-03',
    total_days: 3,
    remarks: 'Attending family wedding',
  });
```

### 6.2 HR Admin Approves Leave Request
Approving a leave request automatically executes the database trigger to create/update `attendance_records` for those dates with `status = 'on_leave'`:
```typescript
const { data, error } = await supabase
  .from('leave_requests')
  .update({
    status: 'approved', // 'approved' | 'rejected'
    hr_comments: 'Approved by HR Director',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  })
  .eq('id', leaveRequestId);
```

---

## 7. Automated Payroll Generation (Admin Only)

To generate monthly payslips with backend-enforced Loss of Pay (LOP) calculations:

```typescript
const { data: payslips, error } = await supabase.rpc('generate_monthly_payslips', {
  p_company_id: profile.company_id,
  p_payroll_period: '2026-08', // YYYY-MM
});
```

---

## 8. Demo Seed Accounts for Testing

| Role | Email | Login ID | Password | Company |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@dayflow.com` | `OIADMI20220001` | `Password@123` | Odoo India |
| **Employee (Eng)** | `john.doe@dayflow.com` | `OIJODO20220001` | `Password@123` | Odoo India |
| **Employee (HR)** | `jane.smith@dayflow.com` | `OIJASM20230002` | `Password@123` | Odoo India |
| **Employee (Design)**| `alex.jones@dayflow.com` | `OIALJO20240003` | `Password@123` | Odoo India |
| **Acme Employee** | `acme.user@acme.com` | `ACACEM20240001` | `Password@123` | Acme Corp (Isolation Test) |
