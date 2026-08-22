"""
Dayflow HRMS - Python Attendance Management Service
Author: Nichka (HR Ops + Attendance + Leaves Lead)
"""

from datetime import datetime

class AttendanceService:
    def __init__(self, hrops_service):
        self.hrops_service = hrops_service
        self.attendance_records = {}
        self._seed_recent_attendance()

    def _seed_recent_attendance(self):
        today = datetime.now()
        for i in range(5, -1, -1):
            d_str = datetime.fromtimestamp(today.timestamp() - i * 86400).strftime("%Y-%m-%d")
            for emp_id, emp in self.hrops_service.employees.items():
                att_id = f"ATT-{emp_id}-{d_str}"
                self.attendance_records[att_id] = {
                    "attendanceId": att_id,
                    "employeeId": emp_id,
                    "employeeName": emp["fullName"],
                    "department": emp["department"],
                    "date": d_str,
                    "checkIn": "09:15:00",
                    "checkOut": "18:00:00",
                    "workHours": 8.75,
                    "status": "Present",
                    "notes": "Verified workday"
                }

    def check_in(self, employee_id, options=None):
        options = options or {}
        emp = self.hrops_service.get_employee_profile(employee_id)
        if not emp:
            raise ValueError(f"Employee {employee_id} not found")

        date_str = options.get("date") or datetime.now().strftime("%Y-%m-%d")
        att_id = f"ATT-{employee_id}-{date_str}"

        existing = self.attendance_records.get(att_id)
        if existing and existing.get("checkIn"):
            raise ValueError(f"Already checked in at {existing['checkIn']}")

        time_str = options.get("time") or datetime.now().strftime("%H:%M:%S")

        record = {
            "attendanceId": att_id,
            "employeeId": employee_id,
            "employeeName": emp["fullName"],
            "department": emp["department"],
            "date": date_str,
            "checkIn": time_str,
            "checkOut": None,
            "workHours": 0,
            "status": "Present",
            "notes": options.get("notes", "Web check-in")
        }
        self.attendance_records[att_id] = record
        return record

    def check_out(self, employee_id, options=None):
        options = options or {}
        date_str = options.get("date") or datetime.now().strftime("%Y-%m-%d")
        att_id = f"ATT-{employee_id}-{date_str}"

        record = self.attendance_records.get(att_id)
        if not record or not record.get("checkIn"):
            raise ValueError("No active check-in record found for today.")

        time_str = options.get("time") or datetime.now().strftime("%H:%M:%S")
        record["checkOut"] = time_str

        # Duration math
        in_parts = [int(p) for p in record["checkIn"].split(":")]
        out_parts = [int(p) for p in time_str.split(":")]
        diff_secs = (out_parts[0] * 3600 + out_parts[1] * 60 + out_parts[2]) - (in_parts[0] * 3600 + in_parts[1] * 60 + in_parts[2])
        hours = round(max(0, diff_secs / 3600), 2)
        record["workHours"] = hours

        if hours < 4.5:
            record["status"] = "Half-day"
        else:
            record["status"] = "Present"

        self.attendance_records[att_id] = record
        return record

    def get_employee_attendance(self, employee_id):
        recs = [r for r in self.attendance_records.values() if r["employeeId"] == employee_id]
        recs.sort(key=lambda x: x["date"], reverse=True)
        present = sum(1 for r in recs if r["status"] == "Present")
        half = sum(1 for r in recs if r["status"] == "Half-day")
        leaves = sum(1 for r in recs if r["status"] == "Leave")
        total_hrs = round(sum(r.get("workHours", 0) for r in recs), 1)

        return {
            "employeeId": employee_id,
            "records": recs,
            "summary": {
                "totalDaysTracked": len(recs),
                "presentDays": present,
                "halfDays": half,
                "leaveDays": leaves,
                "totalWorkHours": total_hrs
            }
        }

    def get_all_attendance_records(self, query=None):
        query = query or {}
        recs = list(self.attendance_records.values())
        if "date" in query and query["date"]:
            recs = [r for r in recs if r["date"] == query["date"]]
        if "department" in query and query["department"]:
            recs = [r for r in recs if r["department"].lower() == query["department"].lower()]
        recs.sort(key=lambda x: x["date"], reverse=True)
        return recs
