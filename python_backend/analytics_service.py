"""
Dayflow HRMS - Python Analytics & Reporting Service
Author: Shafaath (Payroll + Analytics + QA)
"""

class AnalyticsService:
    def __init__(self, payroll_service):
        self.payroll_service = payroll_service

    def get_dashboard_summary(self):
        structures = self.payroll_service.get_all_salary_structures()
        records = list(self.payroll_service.payroll_records.values())

        total_employees = len(structures)
        total_annual_ctc = sum(float(s.get("ctc", 0)) for s in structures)
        avg_monthly = round((total_annual_ctc / 12) / total_employees) if total_employees > 0 else 0

        latest_disbursed = sum(r.get("netPayable", 0) for r in records)
        latest_lop = sum(r.get("deductions", {}).get("lossOfPayDeduction", 0) for r in records)
        latest_tds = sum(r.get("deductions", {}).get("tds", 0) for r in records)

        return {
            "kpis": {
                "totalEmployees": total_employees,
                "totalAnnualPayrollCost": total_annual_ctc,
                "avgMonthlyGrossSalary": avg_monthly,
                "latestTotalNetDisbursed": latest_disbursed,
                "totalLossOfPaySavings": latest_lop,
                "totalTaxDeductions": latest_tds
            },
            "departmentDistribution": self.get_department_breakdown(structures),
            "salaryBands": self.get_salary_bands(structures)
        }

    def get_department_breakdown(self, structures):
        dept_map = {}
        for emp in structures:
            dept = emp.get("department", "General")
            if dept not in dept_map:
                dept_map[dept] = {
                    "department": dept,
                    "headcount": 0,
                    "totalAnnualCTC": 0,
                    "avgSalary": 0
                }
            dept_map[dept]["headcount"] += 1
            dept_map[dept]["totalAnnualCTC"] += float(emp.get("ctc", 0))

        result = []
        for d in dept_map.values():
            d["avgSalary"] = round(d["totalAnnualCTC"] / d["headcount"])
            result.append(d)
        return result

    def get_salary_bands(self, structures):
        bands = {
            "< 5 LPA": 0,
            "5 - 10 LPA": 0,
            "10 - 15 LPA": 0,
            "15 - 25 LPA": 0,
            "> 25 LPA": 0
        }
        for s in structures:
            lpa = float(s.get("ctc", 0)) / 100000
            if lpa < 5:
                bands["< 5 LPA"] += 1
            elif lpa <= 10:
                bands["5 - 10 LPA"] += 1
            elif lpa <= 15:
                bands["10 - 15 LPA"] += 1
            elif lpa <= 25:
                bands["15 - 25 LPA"] += 1
            else:
                bands["> 25 LPA"] += 1

        return [{"range": k, "count": v} for k, v in bands.items()]

    def get_attendance_analytics(self):
        records = list(self.payroll_service.payroll_records.values())
        total_working = sum(r.get("totalWorkingDays", 30) for r in records)
        total_present = sum(r.get("daysPresent", 30) for r in records)
        total_unpaid = sum(r.get("unpaidLeaves", 0) for r in records)

        rate = round((total_present / total_working) * 100, 2) if total_working > 0 else 100.0

        return {
            "overallAttendanceRate": rate,
            "totalWorkingDaysTracked": total_working,
            "totalPresentDays": total_present,
            "totalUnpaidAbsences": total_unpaid,
            "absenteeismRate": round(100.0 - rate, 2),
            "leaveBreakdown": [
                {"type": "Paid Vacation", "count": 18, "percentage": 55},
                {"type": "Sick Leave", "count": 10, "percentage": 30},
                {"type": "Unpaid Leave (LOP)", "count": total_unpaid or 5, "percentage": 15}
            ]
        }

    def export_payroll_report_csv(self, month=None):
        records = list(self.payroll_service.payroll_records.values())
        if month:
            records = [r for r in records if r.get("month", "").lower() == month.lower()]

        headers = [
            "Payroll ID", "Employee ID", "Employee Name", "Department", "Designation",
            "Month", "Days Present", "Unpaid Leaves", "Gross Earnings", "PF",
            "ESI", "Prof Tax", "TDS", "LOP Deduction", "Total Deductions", "Net Payable", "Status"
        ]

        rows = []
        for r in records:
            earn = r.get("earnings", {})
            ded = r.get("deductions", {})
            rows.append([
                str(r.get("payrollId")),
                str(r.get("employeeId")),
                f'"{r.get("employeeName")}"',
                f'"{r.get("department")}"',
                f'"{r.get("designation")}"',
                str(r.get("month")),
                str(r.get("daysPresent")),
                str(r.get("unpaidLeaves")),
                str(earn.get("grossEarnings")),
                str(ded.get("providentFund")),
                str(ded.get("esi")),
                str(ded.get("professionalTax")),
                str(ded.get("tds")),
                str(ded.get("lossOfPayDeduction")),
                str(ded.get("totalDeductions")),
                str(r.get("netPayable")),
                str(r.get("status"))
            ])

        csv_lines = [",".join(headers)] + [",".join(row) for row in rows]
        return "\n".join(csv_lines)
