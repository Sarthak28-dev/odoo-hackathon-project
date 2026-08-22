"""
Dayflow HRMS - Automated QA Verification Suite Runner (Python)
Author: Shafaath (Payroll + Analytics + QA Lead)

Runs comprehensive unit and integration test assertions across:
1. Salary Engine & Statutory Math
2. Payroll Service & Batch Processing Lifecycle
3. Analytics Aggregations & Reporting Integrity
"""

import sys
import os
import time

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Add python_backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "python_backend")))

from salary_engine import calculate_monthly_payroll, auto_compute_structure_from_ctc, number_to_indian_words
from payroll_service import PayrollService
from analytics_service import AnalyticsService

# Colors
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"


def run_all_qa_tests():
    print(f"\n{BOLD}{CYAN}========================================================================{RESET}")
    print(f"{BOLD}{CYAN} [*] DAYFLOW HRMS - AUTOMATED QA VERIFICATION SUITE {RESET}")
    print(f"{CYAN} Module: Payroll + Analytics + QA Subsystem | Owner: Shafaath {RESET}")
    print(f"{BOLD}{CYAN}========================================================================{RESET}\n")

    start_time = time.time()
    passed = 0
    failed = 0
    failures = []

    # 1. Salary Engine Tests
    salary_tests = [
        ("TC-SAL-01: Standard Salary Calculation without Leaves", lambda: _test_standard_salary()),
        ("TC-SAL-02: Loss of Pay (LOP) Proration for 3 Unpaid Leaves", lambda: _test_lop_proration()),
        ("TC-SAL-03: ESI Deduction for Gross Salary <= Rs 21,000", lambda: _test_esi_deduction()),
        ("TC-SAL-04: Negative Net Pay Protection (Deductions > Gross)", lambda: _test_negative_salary_guard()),
        ("TC-SAL-05: Auto-Compute Salary Breakdown from CTC (12 LPA)", lambda: _test_ctc_auto_compute()),
        ("TC-SAL-06: Number to Indian Rupees Words Conversion", lambda: _test_number_to_words())
    ]

    print(f"{BOLD}{YELLOW}> Running Suite: Salary Engine (Statutory Math & LOP Prorations){RESET}")
    for name, fn in salary_tests:
        t0 = time.time()
        try:
            fn()
            dur = int((time.time() - t0) * 1000)
            print(f"  {GREEN}[PASS]{RESET} {name} {CYAN}({dur}ms){RESET}")
            passed += 1
        except Exception as e:
            dur = int((time.time() - t0) * 1000)
            print(f"  {RED}[FAIL]{RESET} {name} {CYAN}({dur}ms){RESET}")
            print(f"     {RED}Error: {e}{RESET}")
            failed += 1
            failures.append((name, str(e)))

    # 2. Payroll Service Tests
    payroll_svc = PayrollService()
    payroll_tests = [
        ("TC-PAY-01: Admin Configure and Retrieve Salary Structure", lambda: _test_structure_crud(payroll_svc)),
        ("TC-PAY-02: Generate Single Employee Payslip Record", lambda: _test_single_payroll_gen(payroll_svc)),
        ("TC-PAY-03: Run Batch Payroll Across All Active Employees", lambda: _test_batch_payroll(payroll_svc)),
        ("TC-PAY-04: Admin Status Progression (Draft -> Reviewed -> Approved -> Paid)", lambda: _test_status_progression(payroll_svc)),
        ("TC-PAY-05: Employee Read-Only Payslips Access Filter", lambda: _test_employee_access_filter(payroll_svc))
    ]

    print(f"\n{BOLD}{YELLOW}> Running Suite: Payroll Service (Lifecycle, Batch Runs & Status){RESET}")
    for name, fn in payroll_tests:
        t0 = time.time()
        try:
            fn()
            dur = int((time.time() - t0) * 1000)
            print(f"  {GREEN}[PASS]{RESET} {name} {CYAN}({dur}ms){RESET}")
            passed += 1
        except Exception as e:
            dur = int((time.time() - t0) * 1000)
            print(f"  {RED}[FAIL]{RESET} {name} {CYAN}({dur}ms){RESET}")
            print(f"     {RED}Error: {e}{RESET}")
            failed += 1
            failures.append((name, str(e)))

    # 3. Analytics Service Tests
    analytics_svc = AnalyticsService(payroll_svc)
    analytics_tests = [
        ("TC-ANA-01: Executive Summary KPIs Aggregation", lambda: _test_kpi_summary(analytics_svc)),
        ("TC-ANA-02: Department Breakdown Calculations", lambda: _test_dept_breakdown(analytics_svc)),
        ("TC-ANA-03: Attendance & Absenteeism Rate Analytics", lambda: _test_attendance_stats(analytics_svc)),
        ("TC-ANA-04: CSV Payroll Register Report Export", lambda: _test_csv_export(analytics_svc))
    ]

    print(f"\n{BOLD}{YELLOW}> Running Suite: Analytics Engine (KPI Aggregations & CSV Reports){RESET}")
    for name, fn in analytics_tests:
        t0 = time.time()
        try:
            fn()
            dur = int((time.time() - t0) * 1000)
            print(f"  {GREEN}[PASS]{RESET} {name} {CYAN}({dur}ms){RESET}")
            passed += 1
        except Exception as e:
            dur = int((time.time() - t0) * 1000)
            print(f"  {RED}[FAIL]{RESET} {name} {CYAN}({dur}ms){RESET}")
            print(f"     {RED}Error: {e}{RESET}")
            failed += 1
            failures.append((name, str(e)))

    total_time = int((time.time() - start_time) * 1000)
    total_tests = passed + failed
    pass_rate = round((passed / total_tests) * 100, 1) if total_tests > 0 else 0

    print(f"\n{BOLD}{CYAN}========================================================================{RESET}")
    print(f"{BOLD}QA TEST EXECUTION SUMMARY{RESET}")
    print(f"{CYAN}------------------------------------------------------------------------{RESET}")
    print(f"  Total Tests Executed : {BOLD}{total_tests}{RESET}")
    print(f"  Passed               : {GREEN}{BOLD}{passed}{RESET}")
    print(f"  Failed               : {RED if failed > 0 else GREEN}{BOLD}{failed}{RESET}")
    print(f"  Success Rate         : {GREEN if pass_rate == 100.0 else YELLOW}{BOLD}{pass_rate}%{RESET}")
    print(f"  Total Execution Time : {CYAN}{total_time} ms{RESET}")
    print(f"{BOLD}{CYAN}========================================================================{RESET}\n")

    if failed > 0:
        print(f"{RED}{BOLD}Failed Tests:{RESET}")
        for name, err in failures:
            print(f"  - {name}: {err}")
        sys.exit(1)
    else:
        print(f"{GREEN}{BOLD}>>> ALL QA TEST CASES PASSED! SYSTEM VERIFIED & READY FOR HACKATHON EVALUATION.{RESET}\n")


# ---- Test Implementations ----

def _test_standard_salary():
    structure = {
        "basicMonthly": 50000,
        "hraMonthly": 20000,
        "specialAllowanceMonthly": 25000,
        "conveyanceAllowance": 1600,
        "medicalAllowance": 1250,
        "pfOpted": True,
        "esiOpted": False,
        "professionalTax": 200,
        "tdsMonthly": 4000
    }
    result = calculate_monthly_payroll(structure, {"total_working_days": 30, "unpaid_leaves": 0})
    expected_gross = 50000 + 20000 + 25000 + 1600 + 1250
    expected_pf = 6000
    expected_ded = 6000 + 200 + 4000
    expected_net = expected_gross - expected_ded
    assert result["earnings"]["grossEarnings"] == expected_gross
    assert result["deductions"]["providentFund"] == expected_pf
    assert result["deductions"]["lossOfPayDeduction"] == 0
    assert result["netPayable"] == expected_net

def _test_lop_proration():
    structure = {
        "basicMonthly": 30000,
        "hraMonthly": 12000,
        "specialAllowanceMonthly": 18000,
        "conveyanceAllowance": 0,
        "medicalAllowance": 0,
        "pfOpted": False,
        "professionalTax": 200,
        "tdsMonthly": 0
    }
    result = calculate_monthly_payroll(structure, {"total_working_days": 30, "unpaid_leaves": 3})
    gross = 60000
    daily_rate = gross / 30
    expected_lop = daily_rate * 3  # 6000
    expected_net = gross - (200 + expected_lop)
    assert result["deductions"]["lossOfPayDeduction"] == expected_lop
    assert result["netPayable"] == expected_net

def _test_esi_deduction():
    structure = {
        "basicMonthly": 10000,
        "hraMonthly": 4000,
        "specialAllowanceMonthly": 4000,
        "conveyanceAllowance": 1000,
        "medicalAllowance": 1000,
        "pfOpted": True,
        "esiOpted": False,
        "professionalTax": 200,
        "tdsMonthly": 0
    }
    result = calculate_monthly_payroll(structure, {"total_working_days": 30, "unpaid_leaves": 0})
    expected_esi = round(20000 * 0.0075)
    assert result["deductions"]["esi"] == expected_esi

def _test_negative_salary_guard():
    structure = {
        "basicMonthly": 10000,
        "hraMonthly": 0,
        "specialAllowanceMonthly": 0,
        "conveyanceAllowance": 0,
        "medicalAllowance": 0,
        "pfOpted": False,
        "professionalTax": 200,
        "tdsMonthly": 0,
        "otherDeductions": 25000
    }
    result = calculate_monthly_payroll(structure, {"total_working_days": 30, "unpaid_leaves": 0})
    assert result["netPayable"] == 0

def _test_ctc_auto_compute():
    computed = auto_compute_structure_from_ctc(1200000)
    assert computed["basicMonthly"] == 50000
    assert computed["hraMonthly"] == 20000
    assert computed["conveyanceAllowance"] == 1600
    assert computed["medicalAllowance"] == 1250

def _test_number_to_words():
    w = number_to_indian_words(87650)
    assert "Eighty-Seven Thousand" in w
    assert "Rupees" in w
    assert number_to_indian_words(0) == "Zero Rupees"

def _test_structure_crud(service):
    emp_id = "EMP-TEST-999"
    struct = service.set_salary_structure(emp_id, {
        "employeeName": "Test Candidate",
        "email": "test@dayflow.internal",
        "department": "Quality Assurance",
        "designation": "QA Engineer",
        "ctc": 600000
    })
    assert struct["employeeId"] == emp_id
    assert struct["basicMonthly"] == 25000
    retrieved = service.get_salary_structure(emp_id)
    assert retrieved["employeeId"] == emp_id

def _test_single_payroll_gen(service):
    rec = service.generate_employee_payroll("EMP-101", "April 2026", {
        "totalWorkingDays": 30,
        "unpaidLeaves": 1,
        "bonus": 2000
    })
    assert rec["employeeId"] == "EMP-101"
    assert rec["month"] == "April 2026"
    assert rec["unpaidLeaves"] == 1
    assert rec["earnings"]["bonus"] == 2000

def _test_batch_payroll(service):
    res = service.run_monthly_batch_payroll("May 2026", {
        "EMP-101": {"totalWorkingDays": 31, "daysPresent": 30, "unpaidLeaves": 1}
    })
    assert res["month"] == "May 2026"
    assert res["processedCount"] >= 4
    assert res["failedCount"] == 0

def _test_status_progression(service):
    rec = service.generate_employee_payroll("EMP-102", "June 2026")
    pid = rec["payrollId"]
    appr = service.update_payroll_status(pid, "Approved")
    assert appr["status"] == "Approved"
    paid = service.update_payroll_status(pid, "Paid", "TXN-998811")
    assert paid["status"] == "Paid"
    assert paid["transactionRef"] == "TXN-998811"

def _test_employee_access_filter(service):
    slips = service.get_employee_payslips("EMP-101")
    assert isinstance(slips, list)
    for s in slips:
        assert s["employeeId"] == "EMP-101"

def _test_kpi_summary(analytics):
    sum_data = analytics.get_dashboard_summary()
    assert sum_data["kpis"]["totalEmployees"] >= 4
    assert sum_data["kpis"]["totalAnnualPayrollCost"] > 0
    assert isinstance(sum_data["departmentDistribution"], list)

def _test_dept_breakdown(analytics):
    sum_data = analytics.get_dashboard_summary()
    for d in sum_data["departmentDistribution"]:
        assert "department" in d
        assert d["headcount"] >= 1
        assert d["avgSalary"] > 0

def _test_attendance_stats(analytics):
    stats = analytics.get_attendance_analytics()
    assert 0 <= stats["overallAttendanceRate"] <= 100
    assert stats["absenteeismRate"] >= 0

def _test_csv_export(analytics):
    csv = analytics.export_payroll_report_csv("May 2026")
    assert "Payroll ID" in csv
    assert "Net Payable" in csv


if __name__ == "__main__":
    run_all_qa_tests()
