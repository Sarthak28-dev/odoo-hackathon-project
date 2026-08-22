# Dayflow HRMS - QA Test Plan & Verification Report
**Author / QA Lead:** Shafaath (Payroll + Analytics + QA)  
**Date:** Hackathon Final Build  
**Test Automation Status:** 15 / 15 Tests Passed (100% Pass Rate)

---

## 1. Test Matrix & Edge Case Coverage

| Test ID | Subsystem | Test Description | Target Logic / Edge Case | Result |
|---|---|---|---|---|
| `TC-SAL-01` | Salary Engine | Standard Salary Calculation without Leaves | Basic, HRA, Allowances, PF 12%, TDS, PT | **PASS** |
| `TC-SAL-02` | Salary Engine | Loss of Pay (LOP) Proration for 3 Unpaid Leaves | `LOP = (Gross / 30) * 3` deducted from Net | **PASS** |
| `TC-SAL-03` | Salary Engine | ESI Statutory Deduction for Gross <= ₹21,000 | 0.75% ESI auto-deducted | **PASS** |
| `TC-SAL-04` | Salary Engine | Negative Net Pay Floor Protection | Floor net pay at ₹0 if deductions > Gross | **PASS** |
| `TC-SAL-05` | Salary Engine | Auto-Compute Structure from Annual CTC (12 LPA) | 50% Basic, 40% HRA, Special Allowance balance | **PASS** |
| `TC-SAL-06` | Salary Engine | Number to Indian Currency Words Conversion | ₹87,650 -> "Eighty-Seven Thousand Six Hundred..." | **PASS** |
| `TC-PAY-01` | Payroll Service | Admin Configure & Retrieve Salary Structure | Persistence & retrieval of employee CTC profile | **PASS** |
| `TC-PAY-02` | Payroll Service | Generate Single Employee Payslip Record | Line-item calculation and document record creation | **PASS** |
| `TC-PAY-03` | Payroll Service | Batch Run Across All Active Employees | Automated multi-employee monthly payroll cycle | **PASS** |
| `TC-PAY-04` | Payroll Service | Status Workflow Transitions | `Draft` -> `Reviewed` -> `Approved` -> `Paid` | **PASS** |
| `TC-PAY-05` | Payroll Service | Employee Read-Only Access Filter | Security isolation for employee's own payslips | **PASS** |
| `TC-ANA-01` | Analytics Engine | Executive Summary KPIs Aggregation | Total annual payroll, average gross, employee count | **PASS** |
| `TC-ANA-02` | Analytics Engine | Department Breakdown Calculations | Headcount and average spend per department | **PASS** |
| `TC-ANA-03` | Analytics Engine | Attendance & Absenteeism Rate Analytics | Aggregated attendance percentage & leave mix | **PASS** |
| `TC-ANA-04` | Analytics Engine | CSV Payroll Register Export | Formats headers and rows for spreadsheet download | **PASS** |

---

## 2. Test Execution Command
Run the test runner anytime:
```bash
python qa/qa_runner.py
```
Expected output:
```text
========================================================================
 [*] DAYFLOW HRMS - AUTOMATED QA VERIFICATION SUITE 
 Module: Payroll + Analytics + QA Subsystem | Owner: Shafaath 
========================================================================
> Running Suite: Salary Engine (Statutory Math & LOP Prorations)
  [PASS] TC-SAL-01: Standard Salary Calculation without Leaves (0ms)
  [PASS] TC-SAL-02: Loss of Pay (LOP) Proration for 3 Unpaid Leaves (0ms)
  [PASS] TC-SAL-03: ESI Deduction for Gross Salary <= Rs 21,000 (0ms)
  [PASS] TC-SAL-04: Negative Net Pay Protection (Deductions > Gross) (0ms)
  [PASS] TC-SAL-05: Auto-Compute Salary Breakdown from CTC (12 LPA) (0ms)
  [PASS] TC-SAL-06: Number to Indian Rupees Words Conversion (0ms)

> Running Suite: Payroll Service (Lifecycle, Batch Runs & Status)
  [PASS] TC-PAY-01: Admin Configure and Retrieve Salary Structure (0ms)
  [PASS] TC-PAY-02: Generate Single Employee Payslip Record (0ms)
  [PASS] TC-PAY-03: Run Batch Payroll Across All Active Employees (0ms)
  [PASS] TC-PAY-04: Admin Status Progression (Draft -> Reviewed -> Approved -> Paid) (0ms)
  [PASS] TC-PAY-05: Employee Read-Only Payslips Access Filter (0ms)

> Running Suite: Analytics Engine (KPI Aggregations & CSV Reports)
  [PASS] TC-ANA-01: Executive Summary KPIs Aggregation (0ms)
  [PASS] TC-ANA-02: Department Breakdown Calculations (0ms)
  [PASS] TC-ANA-03: Attendance & Absenteeism Rate Analytics (0ms)
  [PASS] TC-ANA-04: CSV Payroll Register Report Export (0ms)

========================================================================
QA TEST EXECUTION SUMMARY
------------------------------------------------------------------------
  Total Tests Executed : 15
  Passed               : 15
  Failed               : 0
  Success Rate         : 100.0%
========================================================================
>>> ALL QA TEST CASES PASSED! SYSTEM VERIFIED & READY FOR HACKATHON EVALUATION.
```
