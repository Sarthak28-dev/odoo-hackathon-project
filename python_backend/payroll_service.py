"""
Dayflow HRMS - Python Payroll Service
Author: Shafaath (Payroll + Analytics + QA)
"""

from datetime import datetime
from salary_engine import calculate_monthly_payroll, auto_compute_structure_from_ctc

class PayrollService:
    def __init__(self):
        self.salary_structures = {}
        self.payroll_records = {}
        self._seed_initial_data()

    def _seed_initial_data(self):
        seed = [
            {
                "employeeId": "EMP-101",
                "employeeName": "Sarthak Verma",
                "email": "sarthak@dayflow.internal",
                "department": "Frontend Engineering",
                "designation": "Senior UI/UX Engineer",
                "ctc": 1200000,
                "basicMonthly": 50000,
                "hraMonthly": 20000,
                "specialAllowanceMonthly": 25000,
                "conveyanceAllowance": 1600,
                "medicalAllowance": 1250,
                "pfOpted": True,
                "esiOpted": False,
                "professionalTax": 200,
                "tdsMonthly": 4500,
                "bankDetails": {
                    "accountNumber": "98765432101",
                    "bankName": "ICICI Bank",
                    "ifscCode": "ICIC0002341",
                    "panNumber": "ABCDE1234F"
                }
            },
            {
                "employeeId": "EMP-102",
                "employeeName": "Samrudh Rao",
                "email": "samrudh@dayflow.internal",
                "department": "Backend & Platform",
                "designation": "Lead Backend Architect",
                "ctc": 1440000,
                "basicMonthly": 60000,
                "hraMonthly": 24000,
                "specialAllowanceMonthly": 30000,
                "conveyanceAllowance": 1600,
                "medicalAllowance": 1250,
                "pfOpted": True,
                "esiOpted": False,
                "professionalTax": 200,
                "tdsMonthly": 6200,
                "bankDetails": {
                    "accountNumber": "98765432102",
                    "bankName": "HDFC Bank",
                    "ifscCode": "HDFC0004567",
                    "panNumber": "BCDEF2345G"
                }
            },
            {
                "employeeId": "EMP-103",
                "employeeName": "Nichka Sharma",
                "email": "nichka@dayflow.internal",
                "department": "Human Resources",
                "designation": "HR Operations Lead",
                "ctc": 960000,
                "basicMonthly": 40000,
                "hraMonthly": 16000,
                "specialAllowanceMonthly": 20000,
                "conveyanceAllowance": 1600,
                "medicalAllowance": 1250,
                "pfOpted": True,
                "esiOpted": False,
                "professionalTax": 200,
                "tdsMonthly": 2800,
                "bankDetails": {
                    "accountNumber": "98765432103",
                    "bankName": "State Bank of India",
                    "ifscCode": "SBIN0008910",
                    "panNumber": "CDEFG3456H"
                }
            },
            {
                "employeeId": "EMP-104",
                "employeeName": "Shafaath Ahmed",
                "email": "shafaath@dayflow.internal",
                "department": "Finance & QA",
                "designation": "Payroll & Analytics Specialist",
                "ctc": 1320000,
                "basicMonthly": 55000,
                "hraMonthly": 22000,
                "specialAllowanceMonthly": 28000,
                "conveyanceAllowance": 1600,
                "medicalAllowance": 1250,
                "pfOpted": True,
                "esiOpted": False,
                "professionalTax": 200,
                "tdsMonthly": 5400,
                "bankDetails": {
                    "accountNumber": "98765432104",
                    "bankName": "Axis Bank",
                    "ifscCode": "UTIB0001122",
                    "panNumber": "DEFGH4567I"
                }
            }
        ]
        for s in seed:
            self.salary_structures[s["employeeId"]] = s

    def get_salary_structure(self, employee_id):
        return self.salary_structures.get(employee_id)

    def set_salary_structure(self, employee_id, data):
        structure = dict(data)
        if "ctc" in data and ("basicMonthly" not in data or "hraMonthly" not in data):
            computed = auto_compute_structure_from_ctc(data["ctc"])
            structure.update(computed)

        existing = self.salary_structures.get(employee_id, {})
        merged = {**existing, **structure, "employeeId": employee_id, "updatedAt": datetime.now().isoformat()}
        self.salary_structures[employee_id] = merged
        return merged

    def get_all_salary_structures(self):
        return list(self.salary_structures.values())

    def generate_employee_payroll(self, employee_id, month, options=None):
        options = options or {}
        structure = self.get_salary_structure(employee_id)
        if not structure:
            raise ValueError(f"No salary structure found for Employee ID: {employee_id}")

        calculated = calculate_monthly_payroll(
            structure,
            {
                "total_working_days": options.get("totalWorkingDays", 30),
                "unpaid_leaves": options.get("unpaidLeaves", 0),
                "days_present": options.get("daysPresent")
            },
            options.get("bonus", 0)
        )

        payroll_id = f"PAY-{employee_id}-{month.replace(' ', '-')}"
        record = {
            "payrollId": payroll_id,
            "employeeId": structure["employeeId"],
            "employeeName": structure["employeeName"],
            "department": structure["department"],
            "designation": structure["designation"],
            "month": month,
            "year": options.get("year", datetime.now().year),
            "totalWorkingDays": calculated["attendanceSummary"]["totalWorkingDays"],
            "daysPresent": calculated["attendanceSummary"]["daysPresent"],
            "unpaidLeaves": calculated["attendanceSummary"]["unpaidLeaves"],
            "lossOfPayDays": calculated["attendanceSummary"]["lossOfPayDays"],
            "earnings": calculated["earnings"],
            "deductions": calculated["deductions"],
            "netPayable": calculated["netPayable"],
            "netPayableInWords": calculated["netPayableInWords"],
            "status": options.get("status", "Draft"),
            "bankDetails": structure.get("bankDetails", {}),
            "paymentMethod": options.get("paymentMethod", "Direct Bank Transfer"),
            "paymentDate": options.get("paymentDate"),
            "transactionRef": options.get("transactionRef", f"TXN-DAYFLOW-{int(datetime.now().timestamp())}"),
            "generatedBy": options.get("generatedBy", "Admin"),
            "generatedAt": datetime.now().isoformat(),
            "remarks": options.get("remarks", "Regular monthly payroll run")
        }

        self.payroll_records[payroll_id] = record
        return record

    def run_monthly_batch_payroll(self, month, attendance_map=None):
        attendance_map = attendance_map or {}
        structures = self.get_all_salary_structures()
        results = []
        errors = []

        for struct in structures:
            emp_id = struct["employeeId"]
            att = attendance_map.get(emp_id, {"totalWorkingDays": 30, "unpaidLeaves": 0, "daysPresent": 30})
            try:
                rec = self.generate_employee_payroll(emp_id, month, {
                    "totalWorkingDays": att.get("totalWorkingDays", 30),
                    "unpaidLeaves": att.get("unpaidLeaves", 0),
                    "daysPresent": att.get("daysPresent", 30),
                    "bonus": att.get("bonus", 0),
                    "status": "Draft"
                })
                results.append(rec)
            except Exception as e:
                errors.append({"employeeId": emp_id, "error": str(e)})

        return {
            "month": month,
            "processedCount": len(results),
            "failedCount": len(errors),
            "records": results,
            "errors": errors
        }

    def get_employee_payslips(self, employee_id):
        return [r for r in self.payroll_records.values() if r["employeeId"] == employee_id]

    def get_payslip(self, payroll_id):
        return self.payroll_records.get(payroll_id)

    def update_payroll_status(self, payroll_id, status, transaction_ref=None):
        record = self.payroll_records.get(payroll_id)
        if not record:
            raise ValueError(f"Payroll record {payroll_id} not found")
        record["status"] = status
        if status == "Paid":
            record["paymentDate"] = datetime.now().isoformat()
            if transaction_ref:
                record["transactionRef"] = transaction_ref
        self.payroll_records[payroll_id] = record
        return record
