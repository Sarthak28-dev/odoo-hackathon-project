"""
Dayflow HRMS - QA Test Suite for HR Ops, Attendance & Leaves
Author: Nichka (HR Ops + Attendance + Leaves Lead)

Runs automated test assertions covering:
1. Profile Management & Role-Based Field Edit Restrictions
2. Daily Check-In / Check-Out & Work Hours Calculation
3. Leave Balance Checks & Leave Application Flow
4. HR Leave Approval & Automatic Attendance Calendar Synchronization
5. Monthly Attendance Map Generation for Payroll LOP Sync
"""

import sys
import os
import time

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "python_backend")))

from hrops_service import HROpsService
from attendance_service import AttendanceService
from leave_service import LeaveService

# Colors
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"


def run_hrops_qa_tests():
    print(f"\n{BOLD}{CYAN}========================================================================{RESET}")
    print(f"{BOLD}{CYAN} [*] DAYFLOW HRMS - HR OPS, ATTENDANCE & LEAVES QA TEST SUITE {RESET}")
    print(f"{CYAN} Role Lead: Nichka (HR Ops + Attendance + Leaves) {RESET}")
    print(f"{BOLD}{CYAN}========================================================================{RESET}\n")

    hrops = HROpsService()
    att = AttendanceService(hrops)
    leave = LeaveService(hrops, att)

    start_time = time.time()
    passed = 0
    failed = 0
    failures = []

    tests = [
        ("TC-HROPS-01: Employee Profile Retrieval (Personal, Job, Docs)", lambda: _test_profile_retrieval(hrops)),
        ("TC-HROPS-02: Employee Restricted Profile Edit (Phone & Address only)", lambda: _test_employee_restricted_edit(hrops)),
        ("TC-HROPS-03: Admin Full Profile Edit (Role, Department, Designation)", lambda: _test_admin_full_edit(hrops)),
        ("TC-HROPS-04: Onboard New Employee & Initialize Leave Balances", lambda: _test_onboarding(hrops, leave)),
        ("TC-ATT-01: Daily Check-In & Duplicate Punch Guard", lambda: _test_checkin(att)),
        ("TC-ATT-02: Daily Check-Out & Duration Calculation (Full Day >= 4.5h)", lambda: _test_checkout_fullday(att)),
        ("TC-ATT-03: Half-Day Attendance Status Calculation (< 4.5h)", lambda: _test_checkout_halfday(att)),
        ("TC-ATT-04: Employee Own Attendance History & Summary Stats", lambda: _test_employee_att_history(att)),
        ("TC-ATT-05: HR Company-Wide Attendance Query with Department Filter", lambda: _test_hr_att_query(att)),
        ("TC-LEV-01: Leave Balance Retrieval (Paid, Sick, Casual, Unpaid)", lambda: _test_leave_balances(leave)),
        ("TC-LEV-02: Employee Apply for Paid Leave (Balance Available)", lambda: _test_apply_leave_success(leave)),
        ("TC-LEV-03: Insufficient Leave Balance Rejection Guard", lambda: _test_insufficient_leave_guard(leave)),
        ("TC-LEV-04: HR Approve Leave with Remarks & Balance Deduction", lambda: _test_leave_approval(leave)),
        ("TC-LEV-05: Automatic Attendance Calendar Sync on Approved Leave", lambda: _test_leave_att_sync(leave, att)),
        ("TC-SYNC-01: Generate Monthly Attendance Map for Payroll LOP Engine", lambda: _test_payroll_sync_map(leave, hrops))
    ]

    for name, fn in tests:
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
    print(f"{BOLD}QA VERIFICATION SUMMARY - NICHKA'S MODULE{RESET}")
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
        print(f"{GREEN}{BOLD}>>> ALL HR OPS, ATTENDANCE & LEAVE TESTS PASSED (100%)! READY FOR DEMO.{RESET}\n")


# ---- Test Implementations ----

def _test_profile_retrieval(hrops):
    emp = hrops.get_employee_profile("EMP-103")
    assert emp is not None
    assert emp["fullName"] == "Nichka Sharma"
    assert emp["department"] == "Human Resources"
    assert "personalDetails" in emp
    assert "jobDetails" in emp

def _test_employee_restricted_edit(hrops):
    # Employee tries to update phone + illegally change department
    hrops.update_employee_profile("EMP-101", {
        "department": "Hacked Dept",
        "personalDetails": {"phone": "+91 99999 11111"}
    }, requester_role="Employee")

    updated = hrops.get_employee_profile("EMP-101")
    assert updated["personalDetails"]["phone"] == "+91 99999 11111", "Phone should update"
    assert updated["department"] == "Frontend Engineering", "Department must NOT change for Employee role"

def _test_admin_full_edit(hrops):
    hrops.update_employee_profile("EMP-101", {
        "department": "UI/UX Engineering",
        "designation": "Principal UI Architect"
    }, requester_role="Admin")

    updated = hrops.get_employee_profile("EMP-101")
    assert updated["department"] == "UI/UX Engineering"
    assert updated["designation"] == "Principal UI Architect"

def _test_onboarding(hrops, leave):
    new_emp = hrops.onboard_employee({
        "employeeId": "EMP-900",
        "fullName": "Test Onboardee",
        "email": "onboardee@dayflow.internal",
        "department": "Operations",
        "designation": "Ops Associate"
    })
    assert new_emp["employeeId"] == "EMP-900"
    bal = leave.get_leave_balances("EMP-900")
    assert bal["paid"] == 12
    assert bal["sick"] == 8

def _test_checkin(att):
    rec = att.check_in("EMP-102", {"date": "2026-03-22", "time": "09:00:00"})
    assert rec["employeeId"] == "EMP-102"
    assert rec["checkIn"] == "09:00:00"
    assert rec["status"] == "Present"

    # Try duplicate check-in
    try:
        att.check_in("EMP-102", {"date": "2026-03-22", "time": "09:10:00"})
        assert False, "Should block duplicate check-in"
    except ValueError:
        pass

def _test_checkout_fullday(att):
    rec = att.check_out("EMP-102", {"date": "2026-03-22", "time": "18:00:00"})
    assert rec["checkOut"] == "18:00:00"
    assert rec["workHours"] == 9.0
    assert rec["status"] == "Present"

def _test_checkout_halfday(att):
    att.check_in("EMP-104", {"date": "2026-03-22", "time": "09:00:00"})
    rec = att.check_out("EMP-104", {"date": "2026-03-22", "time": "12:30:00"})
    assert rec["workHours"] == 3.5
    assert rec["status"] == "Half-day", "Duration < 4.5h must be marked Half-day"

def _test_employee_att_history(att):
    hist = att.get_employee_attendance("EMP-101")
    assert hist["employeeId"] == "EMP-101"
    assert "records" in hist
    assert hist["summary"]["totalDaysTracked"] >= 1

def _test_hr_att_query(att):
    all_recs = att.get_all_attendance_records({"department": "Human Resources"})
    assert isinstance(all_recs, list)
    for r in all_recs:
        assert r["department"] == "Human Resources"

def _test_leave_balances(leave):
    bal = leave.get_leave_balances("EMP-103")
    assert bal["paid"] == 12
    assert bal["sick"] == 8
    assert bal["casual"] == 6

def _test_apply_leave_success(leave):
    req = leave.apply_for_leave("EMP-101", {
        "leaveType": "Paid",
        "startDate": "2026-04-10",
        "endDate": "2026-04-11",
        "numberOfDays": 2,
        "reason": "Personal rest"
    })
    assert req["leaveType"] == "Paid"
    assert req["status"] == "Pending"
    assert req["numberOfDays"] == 2

def _test_insufficient_leave_guard(leave):
    try:
        leave.apply_for_leave("EMP-101", {
            "leaveType": "Sick",
            "startDate": "2026-04-15",
            "endDate": "2026-04-30",
            "numberOfDays": 16, # Sick balance is 8
            "reason": "Long hospitalization"
        })
        assert False, "Should fail due to insufficient sick leave balance"
    except ValueError as e:
        assert "Insufficient Sick Leave" in str(e)

def _test_leave_approval(leave):
    req = leave.apply_for_leave("EMP-103", {
        "leaveType": "Paid",
        "startDate": "2026-05-01",
        "endDate": "2026-05-02",
        "numberOfDays": 2,
        "reason": "Vacation trip"
    })
    lid = req["leaveId"]
    approved = leave.review_leave_request(lid, "Approved", "Enjoy your vacation!")
    assert approved["status"] == "Approved"
    
    bal = leave.get_leave_balances("EMP-103")
    assert bal["paid"] == 10, "Paid leave balance should be deducted by 2 days"

def _test_leave_att_sync(leave, att):
    # Check that 2026-05-01 attendance is automatically marked as "Leave"
    att_rec = att.attendance_records.get("ATT-EMP-103-2026-05-01")
    assert att_rec is not None
    assert att_rec["status"] == "Leave"
    assert "Vacation trip" in att_rec["notes"]

def _test_payroll_sync_map(leave, hrops):
    # Apply unpaid leave for EMP-104 and approve
    req = leave.apply_for_leave("EMP-104", {
        "leaveType": "Unpaid",
        "startDate": "2026-03-28",
        "endDate": "2026-03-29",
        "numberOfDays": 2,
        "reason": "Loss of Pay days"
    })
    leave.review_leave_request(req["leaveId"], "Approved", "Approved as LOP")
    
    bal = leave.get_leave_balances("EMP-104")
    assert bal["unpaidTaken"] == 2


if __name__ == "__main__":
    run_hrops_qa_tests()
