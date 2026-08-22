"""
Dayflow HRMS - Python HR Operations & Profile Service
Author: Nichka (HR Ops + Attendance + Leaves Lead)
"""

from datetime import datetime

class HROpsService:
    def __init__(self):
        self.employees = {}
        self.documents = {}
        self._seed_initial_data()

    def _seed_initial_data(self):
        seed = [
            {
                "employeeId": "EMP-101",
                "fullName": "Sarthak Verma",
                "email": "sarthak@dayflow.internal",
                "role": "Employee",
                "department": "Frontend Engineering",
                "designation": "Senior UI/UX Engineer",
                "joiningDate": "2024-02-15",
                "status": "Active",
                "personalDetails": {
                    "phone": "+91 98765 43210",
                    "address": "402, Green Glen Layout, Bellandur, Bangalore",
                    "dateOfBirth": "1998-05-14",
                    "gender": "Male",
                    "emergencyContact": "+91 98765 00001",
                    "profilePicture": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
                },
                "jobDetails": {
                    "workType": "Full-Time",
                    "workLocation": "Bangalore HQ (Hybrid)",
                    "reportingManager": "Nichka Sharma (HR Lead)",
                    "workEmail": "sarthak@dayflow.internal"
                },
                "documents": [
                    {"docId": "DOC-01", "title": "National ID Proof (Aadhaar)", "type": "ID Proof", "url": "/docs/aadhaar.pdf"}
                ]
            },
            {
                "employeeId": "EMP-102",
                "fullName": "Samrudh Rao",
                "email": "samrudh@dayflow.internal",
                "role": "Employee",
                "department": "Backend & Platform",
                "designation": "Lead Backend Architect",
                "joiningDate": "2023-11-01",
                "status": "Active",
                "personalDetails": {
                    "phone": "+91 98765 43211",
                    "address": "12A, Indiranagar 100ft Road, Bangalore",
                    "dateOfBirth": "1997-09-20",
                    "gender": "Male",
                    "emergencyContact": "+91 98765 00002",
                    "profilePicture": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150"
                },
                "jobDetails": {
                    "workType": "Full-Time",
                    "workLocation": "Bangalore HQ (Hybrid)",
                    "reportingManager": "Nichka Sharma (HR Lead)",
                    "workEmail": "samrudh@dayflow.internal"
                },
                "documents": []
            },
            {
                "employeeId": "EMP-103",
                "fullName": "Nichka Sharma",
                "email": "nichka@dayflow.internal",
                "role": "HR",
                "department": "Human Resources",
                "designation": "HR Operations Lead",
                "joiningDate": "2023-08-10",
                "status": "Active",
                "personalDetails": {
                    "phone": "+91 98765 43212",
                    "address": "78, Koramangala 4th Block, Bangalore",
                    "dateOfBirth": "1996-03-12",
                    "gender": "Female",
                    "emergencyContact": "+91 98765 00003",
                    "profilePicture": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                },
                "jobDetails": {
                    "workType": "Full-Time",
                    "workLocation": "Bangalore HQ (On-site)",
                    "reportingManager": "Executive Director",
                    "workEmail": "nichka@dayflow.internal"
                },
                "documents": []
            },
            {
                "employeeId": "EMP-104",
                "fullName": "Shafaath Ahmed",
                "email": "shafaath@dayflow.internal",
                "role": "Employee",
                "department": "Finance & QA",
                "designation": "Payroll & Analytics Specialist",
                "joiningDate": "2024-01-10",
                "status": "Active",
                "personalDetails": {
                    "phone": "+91 98765 43213",
                    "address": "55, HSR Layout Sector 2, Bangalore",
                    "dateOfBirth": "1997-12-05",
                    "gender": "Male",
                    "emergencyContact": "+91 98765 00004",
                    "profilePicture": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                },
                "jobDetails": {
                    "workType": "Full-Time",
                    "workLocation": "Bangalore HQ (Hybrid)",
                    "reportingManager": "Nichka Sharma (HR Lead)",
                    "workEmail": "shafaath@dayflow.internal"
                },
                "documents": []
            }
        ]
        for e in seed:
            self.employees[e["employeeId"]] = e

    def get_employee_profile(self, employee_id):
        return self.employees.get(employee_id)

    def get_all_employees(self, query=None):
        query = query or {}
        emp_list = list(self.employees.values())

        if "department" in query and query["department"]:
            emp_list = [e for e in emp_list if e["department"].lower() == query["department"].lower()]
        if "status" in query and query["status"]:
            emp_list = [e for e in emp_list if e["status"].lower() == query["status"].lower()]
        if "search" in query and query["search"]:
            s = query["search"].lower()
            emp_list = [e for e in emp_list if s in e["fullName"].lower() or s in e["employeeId"].lower() or s in e["department"].lower()]

        return emp_list

    def update_employee_profile(self, employee_id, update_data, requester_role="Employee"):
        emp = self.employees.get(employee_id)
        if not emp:
            raise ValueError(f"Employee {employee_id} not found")

        is_admin = requester_role in ["Admin", "HR"]

        if not is_admin:
            # Restricted: only phone, address, emergencyContact, profilePicture
            allowed = update_data.get("personalDetails", {})
            cur_pers = emp.get("personalDetails", {})
            for field in ["phone", "address", "emergencyContact", "profilePicture"]:
                if field in allowed:
                    cur_pers[field] = allowed[field]
            emp["personalDetails"] = cur_pers
        else:
            # Full edit
            for k, v in update_data.items():
                if isinstance(v, dict) and k in emp and isinstance(emp[k], dict):
                    emp[k].update(v)
                else:
                    emp[k] = v

        self.employees[employee_id] = emp
        return emp

    def onboard_employee(self, data):
        emp_id = data.get("employeeId")
        if not emp_id or not data.get("fullName") or not data.get("email"):
            raise ValueError("employeeId, fullName, and email are required")
        if emp_id in self.employees:
            raise ValueError(f"Employee ID {emp_id} already exists")

        new_emp = {
            "employeeId": emp_id,
            "fullName": data.get("fullName"),
            "email": data.get("email"),
            "role": data.get("role", "Employee"),
            "department": data.get("department", "General"),
            "designation": data.get("designation", "Associate"),
            "joiningDate": data.get("joiningDate", datetime.now().strftime("%Y-%m-%d")),
            "status": data.get("status", "Active"),
            "personalDetails": {
                "phone": data.get("phone", ""),
                "address": data.get("address", ""),
                "dateOfBirth": data.get("dateOfBirth", ""),
                "gender": data.get("gender", "Not Specified"),
                "emergencyContact": data.get("emergencyContact", ""),
                "profilePicture": data.get("profilePicture", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150")
            },
            "jobDetails": {
                "workType": data.get("workType", "Full-Time"),
                "workLocation": data.get("workLocation", "Bangalore HQ"),
                "reportingManager": data.get("reportingManager", "Nichka Sharma (HR Lead)"),
                "workEmail": data.get("email")
            },
            "documents": []
        }
        self.employees[emp_id] = new_emp
        return new_emp
