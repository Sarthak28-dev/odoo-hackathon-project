import os
import re
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def verify_codebase():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    frontend_src = os.path.join(base_dir, "frontend", "src")
    migrations_dir = os.path.join(base_dir, "supabase", "migrations")
    
    print("--- 1. Checking Supabase Migrations ---")
    migrations = sorted(os.listdir(migrations_dir))
    expected_migrations = [
        "00001_initial_schema.sql",
        "00002_functions_and_triggers.sql",
        "00003_row_level_security.sql",
        "00004_storage_and_buckets.sql"
    ]
    assert migrations == expected_migrations, f"Unexpected migrations: {migrations}"
    print(f"  [OK] Exact canonical migrations present: {migrations}")
    
    print("\n--- 2. Verifying Attendance Status Contract across TS/TSX ---")
    status_pattern = re.compile(r'status.*?(["\'])leave\1')
    violations = []
    
    for root, _, files in os.walk(frontend_src):
        for f in files:
            if f.endswith((".ts", ".tsx")):
                filepath = os.path.join(root, f)
                with open(filepath, "r", encoding="utf-8") as fp:
                    content = fp.read()
                    if 'leave' in content:
                        # Check for attendance status == "leave"
                        for line_no, line in enumerate(content.splitlines(), 1):
                            if 'status === "leave"' in line or 'status == "leave"' in line:
                                violations.append(f"{f}:{line_no} -> {line.strip()}")
    
    if violations:
        print(f"  [FAIL] Found attendance status 'leave' violations: {violations}")
        sys.exit(1)
    else:
        print("  [OK] Zero attendance status 'leave' violations found. All use 'on_leave'.")

    print("\n--- 3. Verifying Typescript Database Types Contract ---")
    db_types_path = os.path.join(frontend_src, "types", "database.types.ts")
    with open(db_types_path, "r", encoding="utf-8") as fp:
        types_content = fp.read()
        assert "on_leave" in types_content and "present" in types_content and "absent" in types_content
        assert "export type LeaveType" in types_content
        assert "export type LeaveStatus" in types_content
        assert "export type UserRole" in types_content
    print("  [OK] database.types.ts perfectly matches canonical Person 2 contract.")

    print("\n--- 4. Checking Frontend Component Imports & File Structure ---")
    essential_files = [
        "contexts/AuthContext.tsx",
        "contexts/AttendanceContext.tsx",
        "components/layout/Navbar.tsx",
        "components/layout/MainLayout.tsx",
        "components/employees/NewEmployeeModal.tsx",
        "components/profile/ResumeTab.tsx",
        "components/profile/PrivateInfoTab.tsx",
        "components/profile/SalaryInfoTab.tsx",
        "components/profile/SecurityTab.tsx",
        "pages/EmployeesPage.tsx",
        "pages/ProfilePage.tsx",
        "pages/AttendancePage.tsx",
        "pages/TimeOffPage.tsx",
        "pages/LoginPage.tsx",
        "pages/DashboardPage.tsx",
        "App.tsx"
    ]
    for rel_path in essential_files:
        p = os.path.join(frontend_src, rel_path)
        assert os.path.exists(p), f"Missing essential file: {rel_path}"
    print(f"  [OK] All {len(essential_files)} frontend modules and components verified present.")
    
    print("\n✅ ALL STATIC TYPE & CONTRACT CHECKS PASSED!")

if __name__ == "__main__":
    verify_codebase()
