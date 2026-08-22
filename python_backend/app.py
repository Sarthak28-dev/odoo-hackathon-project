"""
Dayflow HRMS - Master Standalone Python REST API Server
Authors: Nichka (HR Ops + Attendance + Leaves) & Shafaath (Payroll + Analytics + QA)

Zero-dependency standard library HTTP server delivering full REST API:
- Profile & HR Ops: /api/profile/...
- Attendance Tracking: /api/attendance/...
- Leave Management: /api/leaves/...
- Payroll & Salary: /api/payroll/...
- Analytics & Reports: /api/analytics/...
"""

import sys
import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

from hrops_service import HROpsService
from attendance_service import AttendanceService
from leave_service import LeaveService
from payroll_service import PayrollService
from analytics_service import AnalyticsService

# Initialize Subsystems
hrops_svc = HROpsService()
attendance_svc = AttendanceService(hrops_svc)
leave_svc = LeaveService(hrops_svc, attendance_svc)
payroll_svc = PayrollService()
analytics_svc = AnalyticsService(payroll_svc)


class DayflowMasterAPIHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-role")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        try:
            if path == "/" or path == "/health":
                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "project": "Dayflow HRMS",
                    "status": "Operational",
                    "modules": {
                        "HR Ops & Profile": "/api/profile/directory/all",
                        "Attendance Tracking": "/api/attendance/records",
                        "Leaves & Time-Off": "/api/leaves/all-requests",
                        "Payroll & Salary": "/api/payroll/structures",
                        "Analytics": "/api/analytics/summary"
                    }
                }).encode("utf-8"))

            # --- Profile Endpoints ---
            elif path == "/api/profile/directory/all":
                q_dict = {k: v[0] for k, v in query.items()}
                emps = hrops_svc.get_all_employees(q_dict)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "count": len(emps), "data": emps}).encode("utf-8"))

            elif path.startswith("/api/profile/"):
                emp_id = path.split("/")[-1]
                emp = hrops_svc.get_employee_profile(emp_id)
                if not emp:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({"success": False, "message": "Employee not found"}).encode("utf-8"))
                else:
                    self._set_headers(200)
                    self.wfile.write(json.dumps({"success": True, "data": emp}).encode("utf-8"))

            # --- Attendance Endpoints ---
            elif path == "/api/attendance/records":
                q_dict = {k: v[0] for k, v in query.items()}
                records = attendance_svc.get_all_attendance_records(q_dict)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "count": len(records), "data": records}).encode("utf-8"))

            elif path.startswith("/api/attendance/my-history/"):
                emp_id = path.split("/")[-1]
                history = attendance_svc.get_employee_attendance(emp_id)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "data": history}).encode("utf-8"))

            # --- Leave Endpoints ---
            elif path == "/api/leaves/all-requests":
                q_dict = {k: v[0] for k, v in query.items()}
                reqs = leave_svc.get_all_leave_requests(q_dict)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "count": len(reqs), "data": reqs}).encode("utf-8"))

            elif path.startswith("/api/leaves/balances/"):
                emp_id = path.split("/")[-1]
                balances = leave_svc.get_leave_balances(emp_id)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "data": balances}).encode("utf-8"))

            elif path.startswith("/api/leaves/my-leaves/"):
                emp_id = path.split("/")[-1]
                myleaves = leave_svc.get_employee_leaves(emp_id)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "count": len(myleaves), "data": myleaves}).encode("utf-8"))

            # --- Payroll & Analytics Endpoints ---
            elif path == "/api/payroll/structures":
                structures = payroll_svc.get_all_salary_structures()
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "count": len(structures), "data": structures}).encode("utf-8"))

            elif path == "/api/payroll/my-payslips":
                emp_id = query.get("employeeId", ["EMP-103"])[0]
                payslips = payroll_svc.get_employee_payslips(emp_id)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "count": len(payslips), "data": payslips}).encode("utf-8"))

            elif path == "/api/payroll/records":
                records = list(payroll_svc.payroll_records.values())
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "count": len(records), "data": records}).encode("utf-8"))

            elif path == "/api/analytics/summary":
                summary = analytics_svc.get_dashboard_summary()
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "data": summary}).encode("utf-8"))

            elif path == "/api/analytics/attendance-stats":
                stats = analytics_svc.get_attendance_analytics()
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "data": stats}).encode("utf-8"))

            elif path == "/api/analytics/export/payroll-csv":
                month = query.get("month", [None])[0]
                csv_data = analytics_svc.export_payroll_report_csv(month)
                self._set_headers(200, "text/csv")
                self.wfile.write(csv_data.encode("utf-8"))

            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"success": False, "message": f"Path {path} not found"}).encode("utf-8"))

        except Exception as err:
            self._set_headers(500)
            self.wfile.write(json.dumps({"success": False, "error": str(err)}).encode("utf-8"))

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        data = json.loads(body.decode("utf-8")) if body else {}

        try:
            if path == "/api/attendance/check-in":
                rec = attendance_svc.check_in(data.get("employeeId"), data)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "data": rec}).encode("utf-8"))

            elif path == "/api/attendance/check-out":
                rec = attendance_svc.check_out(data.get("employeeId"), data)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "data": rec}).encode("utf-8"))

            elif path == "/api/leaves/apply":
                req = leave_svc.apply_for_leave(data.get("employeeId"), data)
                self._set_headers(201)
                self.wfile.write(json.dumps({"success": True, "data": req}).encode("utf-8"))

            elif path == "/api/profile/onboard":
                emp = hrops_svc.onboard_employee(data)
                self._set_headers(201)
                self.wfile.write(json.dumps({"success": True, "data": emp}).encode("utf-8"))

            elif path == "/api/payroll/batch-run":
                res = payroll_svc.run_monthly_batch_payroll(data.get("month", "March 2026"), data.get("attendanceMap"))
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "data": res}).encode("utf-8"))

            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"success": False, "message": "Not found"}).encode("utf-8"))

        except Exception as err:
            self._set_headers(400)
            self.wfile.write(json.dumps({"success": False, "error": str(err)}).encode("utf-8"))

    def do_PUT(self):
        path = urllib.parse.urlparse(self.path).path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        data = json.loads(body.decode("utf-8")) if body else {}

        try:
            if path.startswith("/api/profile/"):
                emp_id = path.split("/")[-1]
                role = self.headers.get("x-user-role", "Employee")
                updated = hrops_svc.update_employee_profile(emp_id, data, role)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "data": updated}).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"success": False, "message": "Not found"}).encode("utf-8"))
        except Exception as err:
            self._set_headers(400)
            self.wfile.write(json.dumps({"success": False, "error": str(err)}).encode("utf-8"))

    def do_PATCH(self):
        path = urllib.parse.urlparse(self.path).path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        data = json.loads(body.decode("utf-8")) if body else {}

        try:
            if path.startswith("/api/leaves/review/"):
                leave_id = path.split("/")[-1]
                updated = leave_svc.review_leave_request(leave_id, data.get("status"), data.get("adminComments", ""))
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "data": updated}).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"success": False, "message": "Not found"}).encode("utf-8"))
        except Exception as err:
            self._set_headers(400)
            self.wfile.write(json.dumps({"success": False, "error": str(err)}).encode("utf-8"))


def run_master_server(port=5000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, DayflowMasterAPIHandler)
    print("====================================================")
    print(f"🚀 Dayflow HRMS Master Server listening on port {port}")
    print(f"👉 Directory:   http://localhost:{port}/api/profile/directory/all")
    print(f"👉 Attendance:  http://localhost:{port}/api/attendance/records")
    print(f"👉 Leaves:      http://localhost:{port}/api/leaves/all-requests")
    print("====================================================")
    httpd.serve_forever()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    run_master_server(port)
