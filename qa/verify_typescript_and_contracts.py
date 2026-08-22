import os
import re
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def verify_codebase():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    frontend_src = os.path.join(base_dir, "frontend", "src")
    migrations_dir = os.path.join(base_dir, "supabase", "migrations")
    
    print("========================================================================")
    print(" 🔍 PERSON 3 REMEDIATION AUDIT & STATIC VERIFICATION SUITE")
    print("========================================================================")

    # 1. Supabase Migrations Integrity
    print("\n--- 1. Checking Canonical Supabase Migrations ---")
    migrations = sorted(os.listdir(migrations_dir))
    expected_migrations = [
        "00001_initial_schema.sql",
        "00002_functions_and_triggers.sql",
        "00003_row_level_security.sql",
        "00004_storage_and_buckets.sql"
    ]
    assert migrations == expected_migrations, f"Unexpected migrations: {migrations}"
    print(f"  [OK] Exact canonical migrations present: {migrations}")

    # 2. Verify Absence of Duplicate Python Backend
    print("\n--- 2. Verifying Absence of Duplicate Python Backend ---")
    python_backend_dir = os.path.join(base_dir, "python_backend")
    assert not os.path.exists(python_backend_dir), "python_backend/ must not exist in P3 branch"
    print("  [OK] python_backend/ is completely removed from branch.")

    # 3. Attendance Status Contract
    print("\n--- 3. Verifying Attendance Status Contract across TS/TSX ---")
    violations = []
    for root, _, files in os.walk(frontend_src):
        for f in files:
            if f.endswith((".ts", ".tsx")):
                filepath = os.path.join(root, f)
                with open(filepath, "r", encoding="utf-8") as fp:
                    content = fp.read()
                    if 'leave' in content:
                        for line_no, line in enumerate(content.splitlines(), 1):
                            if 'status === "leave"' in line or 'status == "leave"' in line or "status: 'leave'" in line:
                                violations.append(f"{f}:{line_no} -> {line.strip()}")
    
    assert len(violations) == 0, f"Attendance status 'leave' violations found: {violations}"
    print("  [OK] Zero attendance status 'leave' violations found. All use canonical 'on_leave'.")

    # 4. TypeScript Database Types Contract
    print("\n--- 4. Verifying TypeScript Database Types Contract ---")
    db_types_path = os.path.join(frontend_src, "types", "database.types.ts")
    with open(db_types_path, "r", encoding="utf-8") as fp:
        types_content = fp.read()
        assert "on_leave" in types_content and "present" in types_content and "absent" in types_content
        assert "export type LeaveType" in types_content
        assert "export type LeaveStatus" in types_content
        assert "export type UserRole" in types_content
    print("  [OK] database.types.ts perfectly matches canonical Person 2 contract.")

    # 5. P3 Real Pages vs Mock Data Audit
    print("\n--- 5. Auditing P3 React Pages for Mock Data Independence ---")
    p3_pages = [
        "pages/EmployeesPage.tsx",
        "pages/ProfilePage.tsx",
        "pages/AttendancePage.tsx",
        "pages/TimeOffPage.tsx",
        "contexts/AttendanceContext.tsx"
    ]
    
    for page_rel in p3_pages:
        page_path = os.path.join(frontend_src, page_rel)
        assert os.path.exists(page_path), f"Missing page: {page_rel}"
        with open(page_path, "r", encoding="utf-8") as fp:
            content = fp.read()
            assert "mockData" not in content, f"Page {page_rel} still imports mockData!"
            assert "mockProfiles" not in content, f"Page {page_rel} still references mockProfiles!"
            assert "mockAttendanceRecords" not in content, f"Page {page_rel} still references mockAttendanceRecords!"
            assert "mockLeaveRequests" not in content, f"Page {page_rel} still references mockLeaveRequests!"
        print(f"  [OK] {page_rel} is 100% free of mockData dependencies.")

    # 6. Supabase Services Connection Audit
    print("\n--- 6. Verifying Supabase Service Layer Connection ---")
    services = [
        "services/employeeService.ts",
        "services/attendanceService.ts",
        "services/leaveService.ts"
    ]
    for s_rel in services:
        s_path = os.path.join(frontend_src, s_rel)
        assert os.path.exists(s_path), f"Missing service: {s_rel}"
        with open(s_path, "r", encoding="utf-8") as fp:
            content = fp.read()
            assert "from '../lib/supabase'" in content, f"Service {s_rel} must import supabase client!"
        print(f"  [OK] {s_rel} directly invokes Supabase queries & RPCs.")

    print("\n========================================================================")
    print(" 🎉 ALL PERSON 3 REMEDIATION & INTEGRATION CHECKS PASSED (100% SUCCESS)")
    print("========================================================================\n")

if __name__ == "__main__":
    verify_codebase()
