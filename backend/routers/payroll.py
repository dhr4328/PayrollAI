from fastapi import APIRouter, HTTPException
import database

router = APIRouter()

@router.get("/summary")
def get_payroll_summary():
    try:
        return database.get_payroll_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/department-summary")
def get_department_summary():
    try:
        return database.get_department_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payslip/{emp_code}")
def get_payslip(emp_code: str):
    try:
        emp = database.get_employee(emp_code)
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        # Format similar to frontend's expected format
        return {
            "employee": {
                "name": emp["employee_name"],
                "empCode": emp["emp_code"],
                "department": emp["department"],
                "floor": emp["floor"],
                "category": emp["category"],
                "unit": emp["unit"],
                "uan": emp["uan"],
                "esicNo": emp["esic"],
                "accountNo": emp["account_no"],
                "ifsc": emp["ifsc"],
                "bankName": emp["bank_name"],
                "perDayRate": emp["per_day_rate"],
                "fixedPay": emp["fixed_pay"]
            },
            "attendance": {
                "present": emp["present"],
                "absent": emp["absent"],
                "extraDutyHrs": emp["extra_duty_hrs"],
                "weeklyOff": emp["weekly_off"],
                "perPiece": emp["per_piece"],
                "paidDays": emp["paid_days"],
                "totalDays": emp["total_days"]
            },
            "payroll": {
                "salary": emp["salary"],
                "extraPay": emp["extra_pay"],
                "binCardAmount": emp["bin_card_amount"],
                "totalEarning": emp["total_earning"],
                "eePf": emp["ee_pf"],
                "esiEe": emp["esi_ee"],
                "pt": emp["pt"],
                "otherDeduction": emp["other_deduction"],
                "mediclaimDeduction": emp["mediclaim_deduction"],
                "shoesUniform": emp["shoes_uniform"],
                "totalPayableSalary": emp["total_payable_salary"],
                "netPay": emp["net_pay"],
                "lwf": emp["lwf"],
                "erPf": emp["er_pf"],
                "esiEr": emp["esi_er"]
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
