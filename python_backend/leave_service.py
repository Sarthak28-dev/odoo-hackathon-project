"""
Dayflow HRMS - Python Leave Management Service
Author: Nichka (HR Ops + Attendance + Leaves Lead)
"""

from datetime import datetime

class LeaveService:
    def __init__(self, hrops_service, attendance_service):
        self.hrops_service = hrops_service
        self.attendance_service = attendance_service
        self.leave_requests = {}
        self.leave_balances = {}
        self._seed_initial_leaves()

    def _seed_initial_leaves(self):
        for emp_id in self.hrops_service.employees.keys():
            self.leave_balances[emp_id] = {
                "paid": 12,
                "sick": 8,
                "casual": 6,
                "unpaidTaken": 0
            }

        seed = [
            {
                "leaveId": "LEV-1001",
                "employeeId": "EMP-101",
                "employeeName": "Sarthak Verma",
                "department": "Frontend Engineering",
                "leaveType": "Sick",
                "startDate": "2026-03-25",
                "endDate": "2026-03-26",
                "numberOfDays": 2,
                "reason": "Seasonal viral fever",
                "status": "Pending",
                "appliedAt": datetime.now().isoformat()
            },
            {
                "leaveId": "LEV-1002",
                "employeeId": "EMP-102",
                "employeeName": "Samrudh Rao",
                "department": "Backend & Platform",
                "leaveType": "Paid",
                "startDate": "2026-04-02",
                "endDate": "2026-04-04",
                "numberOfDays": 3,
                "reason": "Family wedding event",
                "status": "Approved",
                "adminComments": "Approved. Have fun!",
                "appliedAt": datetime.now().isoformat()
            }
        ]
        for l in seed:
            self.leave_requests[l["leaveId"]] = l

    def get_leave_balances(self, employee_id):
        return self.leave_balances.get(employee_id, {"paid": 12, "sick": 8, "casual": 6, "unpaidTaken": 0})

    def apply_for_leave(self, employee_id, data):
        emp = self.hrops_service.get_employee_profile(employee_id)
        if not emp:
            raise ValueError(f"Employee {employee_id} not found")

        leave_type = data.get("leaveType")
        start_date = data.get("startDate")
        end_date = data.get("endDate")
        reason = data.get("reason")
        num_days = float(data.get("numberOfDays", 1))

        if not leave_type or not start_date or not end_date or not reason:
            raise ValueError("leaveType, startDate, endDate, and reason are required")

        balances = self.get_leave_balances(employee_id)
        if leave_type == "Paid" and balances["paid"] < num_days:
            raise ValueError(f"Insufficient Paid Leave balance. Available: {balances['paid']}")
        if leave_type == "Sick" and balances["sick"] < num_days:
            raise ValueError(f"Insufficient Sick Leave balance. Available: {balances['sick']}")

        leave_id = f"LEV-{1000 + len(self.leave_requests) + 1}"
        new_req = {
            "leaveId": leave_id,
            "employeeId": employee_id,
            "employeeName": emp["fullName"],
            "department": emp["department"],
            "leaveType": leave_type,
            "startDate": start_date,
            "endDate": end_date,
            "numberOfDays": num_days,
            "reason": reason,
            "status": "Pending",
            "appliedAt": datetime.now().isoformat(),
            "adminComments": ""
        }
        self.leave_requests[leave_id] = new_req
        return new_req

    def get_employee_leaves(self, employee_id):
        return [l for l in self.leave_requests.values() if l["employeeId"] == employee_id]

    def get_all_leave_requests(self, query=None):
        query = query or {}
        reqs = list(self.leave_requests.values())
        if "status" in query and query["status"]:
            reqs = [r for r in reqs if r["status"].lower() == query["status"].lower()]
        return reqs

    def review_leave_request(self, leave_id, status, admin_comments="", reviewer="Nichka Sharma (HR Lead)"):
        req = self.leave_requests.get(leave_id)
        if not req:
            raise ValueError(f"Leave request {leave_id} not found")
        if status not in ["Approved", "Rejected"]:
            raise ValueError("Status must be 'Approved' or 'Rejected'")

        req["status"] = status
        req["adminComments"] = admin_comments
        req["reviewedBy"] = reviewer
        req["reviewedAt"] = datetime.now().isoformat()

        if status == "Approved":
            # Deduct balance
            b = self.get_leave_balances(req["employeeId"])
            ltype = req["leaveType"]
            if ltype == "Paid": b["paid"] = max(0, b["paid"] - req["numberOfDays"])
            elif ltype == "Sick": b["sick"] = max(0, b["sick"] - req["numberOfDays"])
            elif ltype == "Casual": b["casual"] = max(0, b["casual"] - req["numberOfDays"])
            elif ltype == "Unpaid": b["unpaidTaken"] += req["numberOfDays"]
            self.leave_balances[req["employeeId"]] = b

            # Sync attendance record
            att_id = f"ATT-{req['employeeId']}-{req['startDate']}"
            self.attendance_service.attendance_records[att_id] = {
                "attendanceId": att_id,
                "employeeId": req["employeeId"],
                "employeeName": req["employeeName"],
                "department": req["department"],
                "date": req["startDate"],
                "checkIn": None,
                "checkOut": None,
                "workHours": 0,
                "status": "on_leave",
                "notes": f"Approved {req['leaveType']} Leave: {req['reason']}"
            }

        self.leave_requests[leave_id] = req
        return req
