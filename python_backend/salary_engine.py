"""
Dayflow HRMS - Python Salary & Payroll Engine
Author: Shafaath (Payroll + Analytics + QA)
"""

def number_to_indian_words(num):
    if num == 0:
        return "Zero Rupees"
    if num is None or num < 0:
        return ""

    ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ]
    tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ]

    def convert_two_digits(n):
        if n < 20:
            return ones[n]
        unit = ones[n % 10]
        ten = tens[n // 10]
        return f"{ten}-{unit}" if unit else ten

    def convert_three_digits(n):
        if n == 0:
            return ""
        s = ""
        hundreds = n // 100
        rem = n % 100
        if hundreds > 0:
            s += f"{ones[hundreds]} Hundred"
            if rem != 0:
                s += " and "
        if rem != 0:
            s += convert_two_digits(rem)
        return s

    amount = int(abs(num))
    words = ""

    crore = amount // 10000000
    amount %= 10000000

    lakh = amount // 100000
    amount %= 100000

    thousand = amount // 1000
    amount %= 1000

    remainder = amount

    if crore > 0:
        words += f"{convert_two_digits(crore)} Crore "
    if lakh > 0:
        words += f"{convert_two_digits(lakh)} Lakh "
    if thousand > 0:
        words += f"{convert_two_digits(thousand)} Thousand "
    if remainder > 0:
        words += f"{convert_three_digits(remainder)} "

    return words.strip() + " Rupees"


def calculate_monthly_payroll(structure, attendance_summary=None, bonus=0):
    if not structure:
        raise ValueError("Salary structure is required")

    attendance_summary = attendance_summary or {}
    total_working_days = int(attendance_summary.get("total_working_days") or 30)
    unpaid_leaves = int(attendance_summary.get("unpaid_leaves") or 0)
    
    days_present_val = attendance_summary.get("days_present")
    if days_present_val is not None:
        days_present = int(days_present_val)
    else:
        days_present = max(0, total_working_days - unpaid_leaves)

    # 1. Earnings Breakdown
    basic = round(float(structure.get("basicMonthly", 0)))
    hra = round(float(structure.get("hraMonthly", 0)))
    special_allowance = round(float(structure.get("specialAllowanceMonthly", 0)))
    conveyance = round(float(structure.get("conveyanceAllowance", 1600)))
    medical = round(float(structure.get("medicalAllowance", 1250)))
    bonus = max(0, round(float(bonus or 0)))

    standard_gross = basic + hra + special_allowance + conveyance + medical
    total_gross_earnings = standard_gross + bonus

    # 2. Loss of Pay (LOP)
    loss_of_pay_deduction = 0
    if unpaid_leaves > 0 and total_working_days > 0:
        daily_rate = standard_gross / total_working_days
        loss_of_pay_deduction = round(daily_rate * min(unpaid_leaves, total_working_days))

    # 3. Deductions
    provident_fund = 0
    if structure.get("pfOpted", True):
        provident_fund = round(basic * 0.12)

    esi = 0
    if structure.get("esiOpted", False) or standard_gross <= 21000:
        esi = round(standard_gross * 0.0075)

    professional_tax = structure.get("professionalTax")
    if professional_tax is None:
        professional_tax = 200 if standard_gross >= 15000 else 0
    else:
        professional_tax = int(professional_tax)

    tds = round(float(structure.get("tdsMonthly", 0)))
    other_deductions = round(float(structure.get("otherDeductions", 0)))

    total_deductions = (
        provident_fund + esi + professional_tax + tds + loss_of_pay_deduction + other_deductions
    )

    # 4. Net Salary
    raw_net = total_gross_earnings - total_deductions
    net_payable = max(0, raw_net)

    return {
        "earnings": {
            "basic": basic,
            "hra": hra,
            "specialAllowance": special_allowance,
            "conveyanceAllowance": conveyance,
            "medicalAllowance": medical,
            "bonus": bonus,
            "grossEarnings": total_gross_earnings
        },
        "deductions": {
            "providentFund": provident_fund,
            "esi": esi,
            "professionalTax": professional_tax,
            "tds": tds,
            "lossOfPayDeduction": loss_of_pay_deduction,
            "otherDeductions": other_deductions,
            "totalDeductions": total_deductions
        },
        "netPayable": net_payable,
        "netPayableInWords": number_to_indian_words(net_payable) + " Only",
        "attendanceSummary": {
            "totalWorkingDays": total_working_days,
            "daysPresent": days_present,
            "unpaidLeaves": unpaid_leaves,
            "lossOfPayDays": unpaid_leaves
        }
    }


def auto_compute_structure_from_ctc(annual_ctc):
    ctc = float(annual_ctc)
    if ctc <= 0:
        raise ValueError("Annual CTC must be positive")

    monthly_ctc = round(ctc / 12)
    basic_monthly = round(monthly_ctc * 0.50)
    hra_monthly = round(basic_monthly * 0.40)
    conveyance = 1600
    medical = 1250

    allocated = basic_monthly + hra_monthly + conveyance + medical
    special_allowance_monthly = max(0, monthly_ctc - allocated)

    estimated_tax = 0
    if ctc > 700000:
        taxable = ctc - 75000
        if taxable > 1500000:
            estimated_tax = 150000 + (taxable - 1500000) * 0.30
        elif taxable > 1200000:
            estimated_tax = 90000 + (taxable - 1200000) * 0.20
        elif taxable > 1000000:
            estimated_tax = 60000 + (taxable - 1000000) * 0.15
        elif taxable > 700000:
            estimated_tax = 30000 + (taxable - 700000) * 0.10

    estimated_tds = round(estimated_tax / 12)

    return {
        "ctc": ctc,
        "basicMonthly": basic_monthly,
        "hraMonthly": hra_monthly,
        "conveyanceAllowance": conveyance,
        "medicalAllowance": medical,
        "specialAllowanceMonthly": special_allowance_monthly,
        "pfOpted": True,
        "esiOpted": monthly_ctc <= 21000,
        "professionalTax": 200 if monthly_ctc >= 15000 else 0,
        "tdsMonthly": estimated_tds
    }
