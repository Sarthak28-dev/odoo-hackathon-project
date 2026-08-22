# Dayflow — Human Resource Management System (HRMS)
## Product Requirements Document (PRD) & Source of Truth

> **Document Status:** Authoritative Requirements  
> **Primary Sources:** `docs/Dayflow - Human Resource Management System.pdf` & `docs/excalidraw stuff/`  
> **Tag Legend:**
> - `[PRD Requirement]` — Directly defined in the primary PDF PRD.
> - `[Wireframe-derived requirement]` — Specified in the design wireframes / Excalidraw diagrams.
> - `[Requires team decision]` — Ambiguity or gap requiring explicit architectural/team consensus.

---

## 1. Project Overview
**Dayflow** is a modern Human Resource Management System (HRMS) designed to digitize and streamline core HR operations for small-to-medium enterprises and corporate teams. It centralizes employee onboarding, profile management, live attendance tracking, time-off/leave approval workflows, and automated payroll visibility based on attendance.

*Tagline:* "Every workday, perfectly aligned."

---

## 2. User Roles & Personas

### 2.1 Admin / HR Officer (`role = 'admin'`)
* **Role Summary:** Management and approval privileges across the organization.
* **Capabilities:**
  * Manage employee records (Create new employee profiles, edit all employee fields).
  * Approve / reject leave and time-off requests with remarks/comments.
  * Oversee daily & monthly attendance records across all employees.
  * Define and manage employee salary structures and view company-wide payroll.
  * View organization-wide reports and analytics.

### 2.2 Employee (`role = 'employee'`)
* **Role Summary:** Regular organizational user with self-service capabilities.
* **Capabilities:**
  * View own personal profile, job details, and read-only salary structure.
  * Edit permitted personal fields (e.g., contact phone, address, profile picture).
  * Perform daily check-in and check-out via the systray widget.
  * View own monthly attendance log, working hours, and extra hours.
  * Submit leave requests (Paid, Sick, Unpaid) with date ranges and remarks.
  * View own payslips and compensation summaries.

---

## 3. Authentication & Authorization

### 3.1 Sign In `[PRD Requirement]` & `[Wireframe-derived requirement]`
* Users can sign in using **Email / Login ID** and **Password**.
* Validation rules:
  * Incorrect credentials display clear inline error messages.
  * Successful authentication securely establishes session and redirects the user to their designated dashboard/home view.
  * Session persists securely across page refreshes.

### 3.2 Sign Up & Onboarding Flow `[Wireframe-derived requirement]`
* **Company Registration (Admin Onboarding):**
  * Allows a new company/organization administrator to register.
  * Required fields: Company Name, Admin Full Name, Email, Phone, Password, Confirm Password, Company Logo (upload).
* **Employee Account Creation:**
  * Regular employees **cannot self-register**.
  * HR Officers/Admins create employee accounts from the Admin Dashboard / Employee Directory.
  * Upon employee creation:
    * System auto-generates a unique **Login ID** (e.g., `OIJODO20220001`).
    * System auto-generates a secure temporary password.
    * Employee can sign in with their Login ID/Email and temporary password, then update their password in the Security settings.

### 3.3 Security & Password Rules `[PRD Requirement]`
* Passwords must enforce minimum security complexity (minimum 8 characters, alphanumeric + symbol).
* Email verification support `[PRD Requirement]`. *(Note: For local hackathon MVP testing, auto-confirm or configurable bypass should be supported in development).*

---

## 4. Company Onboarding `[Wireframe-derived requirement]`
* Admin can register the organization with:
  * Company Name
  * Company Logo (stored and displayed in the global top navigation)
  * Primary Contact Email & Phone
* Company entity establishes multi-tenant isolation context (`company_id`).

---

## 5. Employee Management & Directory

### 5.1 Employee Directory View `[Wireframe-derived requirement]`
* Grid / Kanban view of employee cards.
* **Top Controls:**
  * `NEW` button (accessible to HR/Admin to open the Create Employee modal).
  * Real-time search bar (filters by employee name, login ID, department).
* **Employee Card Elements:**
  * Profile photo / avatar.
  * Full Name & Job Title / Department.
  * Basic contact info.
  * **Presence Status Dot (Top-Right):**
    * 🟢 **Green Dot:** Employee is present in the office (checked in today).
    * ✈️ **Airplane Icon:** Employee is on approved leave today.
    * 🟡 **Yellow Dot:** Employee is absent (has not checked in and has not applied for approved time off).
* Clicking an employee card navigates to their Employee Profile in view-only mode for peer employees, or full editable mode for Admin/HR.

---

## 6. Employee Profile Management

### 6.1 Profile Header `[Wireframe-derived requirement]`
* Profile Picture (with editable upload action).
* Employee Full Name.
* Login ID (Read-only, auto-generated).
* Email & Mobile Number.
* Company, Department, Manager, Location / Work Space.

### 6.2 Profile Tabs `[Wireframe-derived requirement]`

#### Tab 1: Resume
* **About:** Short biography / professional summary.
* **What I love about my job:** Personal motivation statement.
* **My interests and hobbies:** Personal hobbies.
* **Skills:** Tagged skill list with a `+ Add Skills` action.
* **Certifications:** Professional certification records.

#### Tab 2: Private Info
* **Personal Details (Left Column):**
  * Date of Birth (DOB)
  * Residential Address
  * Nationality
  * Personal Email
  * Gender
  * Marital Status
  * Date of Joining
* **Bank & Identification Details (Right Column):**
  * Bank Name
  * Bank Account Number
  * IFSC Code
  * PAN Number
  * UAN Number
  * Employee Code (`emp_code` / badge number)

#### Tab 3: Salary Info `[PRD Requirement]` & `[Wireframe-derived requirement]`
* *Access Rule:* Editable by Admin/HR only; Read-only for the respective Employee; Hidden from other employees.
* Detailed in **Section 10**.

#### Tab 4: Security `[Wireframe-derived requirement]`
* Allows the authenticated user to update their account password.

### 6.3 Edit Permissions `[PRD Requirement]`
* **Employees:** Can edit limited personal fields (residential address, mobile phone, profile picture, resume bio/interests).
* **Admins/HR:** Can edit all employee fields, including job details, department, manager, dates, bank info, and salary structure.

---

## 7. Attendance Tracking & Systray

### 7.1 Systray Widget (Top Navigation Bar) `[Wireframe-derived requirement]`
* Global indicator visible on all authenticated pages.
* **Live Status Dot:**
  * 🔴 **Red Dot:** Employee is currently checked out.
  * 🟢 **Green Dot:** Employee is currently checked in.
* **Systray Dropdown / Popup:**
  * When checked out: Displays `Check IN ->` button.
  * When checked in: Displays `Since HH:MM AM/PM` timer/timestamp and `Check Out ->` button.

### 7.2 Attendance Status Types `[PRD Requirement]`
* `present` — Employee checked in and completed normal working hours.
* `half_day` — Employee worked partial hours (e.g. < 4.5 hours or half shift).
* `absent` — Employee did not check in and is not on leave.
* `on_leave` — Employee is on approved leave.

### 7.3 Employee Attendance View `[Wireframe-derived requirement]`
* Default view displays the day-wise attendance log for the current ongoing month.
* **Summary KPI Cards:**
  * Count of days present in the month.
  * Leaves count in the month.
  * Total working days in the month.
* **Navigation:** `<-` Previous Month, `->` Next Month, Month/Year selector dropdown.
* **Table Columns:** Date, Check In Time, Check Out Time, Work Hours (HH:MM), Extra / Overtime Hours (HH:MM).

### 7.4 Admin / HR Attendance View `[Wireframe-derived requirement]`
* Admin can inspect attendance records across all employees.
* Daily & Monthly view toggles with date picker.
* **Table Columns:** Employee Name / Code, Date, Check In, Check Out, Work Hours, Extra Hours.

---

## 8. Time Off & Leave Management

### 8.1 Leave Types `[PRD Requirement]`
1. `paid` — Paid Leave / Casual Leave.
2. `sick` — Sick Leave / Medical Leave.
3. `unpaid` — Unpaid Leave / Loss of Pay (LOP).

### 8.2 Employee Leave Application `[PRD Requirement]`
* Form fields:
  * Leave Type (`paid`, `sick`, `unpaid`).
  * Date Range: Start Date to End Date (and computed total days).
  * Reason / Remarks.
* Initial status after submission: `pending`.

### 8.3 Leave Statuses `[PRD Requirement]`
* `pending` — Awaiting HR review.
* `approved` — Approved by HR; automatically sets presence status to `on_leave` for the requested date range.
* `rejected` — Rejected by HR with feedback comments.

### 8.4 HR Leave Approval Workflow `[PRD Requirement]`
* HR Officers can view a unified list of all pending, approved, and rejected leave requests.
* Action buttons: `Approve`, `Reject`.
* HR can provide approval/rejection comments.
* Status update immediately syncs to employee records and reflects in the employee dashboard and attendance calendar.

---

## 9. Salary Structure Specification `[Wireframe-derived requirement]`

The system implements automated salary structure computation based on defined Monthly Wage:

### 9.1 Base Wage Inputs
* **Monthly Wage ($W$):** Base monthly gross fixed wage (e.g., ₹50,000 / month).
* **Yearly Wage:** Auto-calculated as $W \times 12$ (e.g., ₹600,000 / year).
* **Working Schedule:** Working days per week (e.g., 5 days), Working hours per day (e.g., 8 hrs/day), Break time (e.g., 1 hr).

### 9.2 Salary Components & Computation Formulas
| Component | Computation Formula | Example ($W = \text{₹}50,000$) | Notes |
| :--- | :--- | :--- | :--- |
| **Basic Salary** | $50.00\%$ of Monthly Wage ($W \times 0.50$) | ₹25,000.00 | Primary taxable base |
| **House Rent Allowance (HRA)** | $50.00\%$ of Basic Salary ($\text{Basic} \times 0.50$) | ₹12,500.00 | Housing benefit |
| **Standard Allowance** | $16.67\%$ of Basic Salary (or ₹4,167 fixed) | ₹4,167.00 | Standard statutory allowance |
| **Performance Bonus** | $8.33\%$ of Basic Salary ($\text{Basic} \times 0.0833$) | ₹2,082.50 | Performance-linked component |
| **Leave Travel Allowance (LTA)** | $8.33\%$ of Basic Salary ($\text{Basic} \times 0.0833$) | ₹2,082.50 | Travel allowance |
| **Fixed Allowance** | $W - (\text{Basic} + \text{HRA} + \text{Standard} + \text{Bonus} + \text{LTA})$ | ₹4,168.00 | Balancing component |
| **Gross Salary** | Sum of all above components | ₹50,000.00 | Equals Monthly Wage |

### 9.3 Deductions & Statutory Contributions
| Deduction Item | Rate / Formula | Example ($W = \text{₹}50,000$) |
| :--- | :--- | :--- |
| **Employee Provident Fund (PF)** | $12.00\%$ of Basic Salary | ₹3,000.00 (deducted from employee pay) |
| **Employer Provident Fund (PF)** | $12.00\%$ of Basic Salary | ₹3,000.00 (employer contribution) |
| **Professional Tax (PT)** | ₹200.00 fixed monthly | ₹200.00 |
| **Total Employee Deductions** | $\text{PF (Employee)} + \text{PT}$ | ₹3,200.00 |
| **Net In-Hand Salary** | $\text{Gross Salary} - \text{Total Employee Deductions}$ | ₹46,800.00 (before unpaid leave LOP adjustments) |

---

## 10. Payroll & Payslip Generation

### 10.1 Attendance → Payroll Integration Rule `[Wireframe-derived requirement]`
* Attendance data serves as the direct calculation foundation for monthly payslip generation.
* **Payable Days Formula:**
  $$\text{Payable Days} = \text{Total Working Days in Month} - \text{Unpaid Leaves} - \text{Unexcused Absent Days}$$
* **Loss of Pay (LOP) Deduction:**
  $$\text{Per Day Salary} = \frac{\text{Monthly Wage}}{\text{Total Working Days in Month}}$$
  $$\text{LOP Deduction} = (\text{Unpaid Leaves} + \text{Absent Days}) \times \text{Per Day Salary}$$
* **Final Net Payable:**
  $$\text{Net Pay} = (\text{Gross Salary} - \text{LOP Deduction}) - \text{PF (Employee)} - \text{Professional Tax}$$

### 10.2 Payslip Records & Visibility `[PRD Requirement]`
* Payslip records are generated monthly per employee.
* Employees have read-only access to their own payslips (with breakdown of earnings, deductions, payable days, and net pay).
* Admin/HR can review company-wide payroll summaries, adjust corrections, and finalize monthly pay runs.

---

## 11. Notifications & Status Indicators

### 11.1 Real-Time Status Indicators `[Wireframe-derived requirement]`
* Real-time systray dot (Red/Green) indicating active check-in session.
* Employee directory presence badges (Present / On Leave / Absent).

### 11.2 In-App Alerts & Notifications `[PRD Requirement]`
* Toast alerts for successful actions (Check-in confirmed, leave request submitted, profile updated).
* Leave approval/rejection notifications sent to the employee.

---

## 12. Reports & Analytics Dashboard `[PRD Requirement]`

* **Attendance Analytics:** Monthly presence percentage, absenteeism trends, average working hours.
* **Leave Analytics:** Approved leaves vs pending leaves by department.
* **Payroll Reports:** Monthly gross payroll payout, total statutory deductions (PF/PT), and LOP summaries.

---

## 13. UI/UX Design System Guidelines `[Wireframe-derived requirement]`
* **Dark / Clean Modern Aesthetic:** Dark-mode/neutral high-contrast surfaces matching the Excalidraw wireframe specifications.
* **Global Navigation:** Fixed top navbar with Company Logo, Tab Navigation (`Employees`, `Attendance`, `Time Off`), Systray widget, and User Avatar dropdown (`My Profile`, `Log Out`).
* **Visual Status Codes:**
  * 🟢 `#10B981` (Emerald Green): Present / Approved / Checked In.
  * 🟡 `#F59E0B` (Amber Yellow): Absent without notice / Pending Review.
  * 🔵 `#3B82F6` (Sky Blue): On Leave / Informational.
  * 🔴 `#EF4444` (Rose Red): Checked Out / Rejected / Urgent.

---

## 14. Security & Compliance Requirements `[PRD Requirement]`
1. **Zero Client Trust:** All authorization rules must be enforced in PostgreSQL Row Level Security (RLS) policies; UI guards are for navigation UX only.
2. **Data Isolation:** Employees can never read or mutate other employees' salary structures, payslips, private identification (PAN/Bank details), or unapproved records.
3. **No Service Key Exposure:** The Supabase Service Role Key is strictly forbidden from client/browser code.

---

## 15. Unclear Requirements & Team Decisions

| Topic | Context | Recommendation / Default | Status |
| :--- | :--- | :--- | :--- |
| **Login ID Format** | Wireframe specifies `OI` + first 2 letters of first/last name + Year + 4-digit serial (e.g. `OIJODO20220001`). | Use PostgreSQL sequence/function triggered on employee creation. Company prefix defaults to `OI` or company acronym. | `[Decision Log ADR-001]` |
| **Email Verification** | PRD mentions email verification. For rapid hackathon demo/testing, email confirmation delays manual sign-up testing. | Auto-confirm emails in local/dev Supabase config or support direct credential login. | `[Decision Log ADR-002]` |
| **Half-Day Calculation** | Attendance defines `half_day` status. | Check-ins with < 4.5 recorded hours automatically compute as 0.5 payable day. | `[Decision Log ADR-003]` |
