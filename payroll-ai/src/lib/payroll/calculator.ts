// src/lib/payroll/calculator.ts
import { Employee } from '@/types/employee';
import { AttendanceRecord, PayrollEntry } from '@/types/payroll';

const OVERTIME_RATE_DIVISOR = 8; // Extra pay = (extraHrs × perDayRate) / 8
const PF_EMPLOYEE_RATE = 0.12;
const PF_EMPLOYER_RATE = 0.13;
const PF_EE_CAP = 1800;
const PF_ER_CAP = 1950;
const ESI_EE_RATE = 0.0075;
const ESI_ER_RATE = 0.0325;
const PT_THRESHOLD = 12000;
const PT_AMOUNT = 200;

// Piece rates by department (approximate from demo.xlsx: binCard / perPiece)
const PIECE_RATES: Record<string, number> = {
  'Assembly - 01': 1189.3,
  'Assembly - 02': 811.4,
  'Assembly - 04': 1156.5,
  'HV Winding': 1763.0,
  default: 1000,
};

function getPieceRate(department: string): number {
  return PIECE_RATES[department] ?? PIECE_RATES.default;
}

export function calculatePayroll(
  employee: Employee,
  attendance: AttendanceRecord,
  otherDeduction = 0,
  mediclaimDeduction = 0,
  shoesUniform = 0,
  differenceAmount = 0
): PayrollEntry {
  const { perDayRate, department } = employee;
  const { paidDays, extraDutyHrs, hoursDedHr, perPiece, month, year, empCode } = attendance;

  // Earnings
  const salary = perDayRate * paidDays;
  const hoursDedAmt = hoursDedHr > 0 ? (perDayRate / 8) * hoursDedHr : 0;
  const extraPay = extraDutyHrs > 0 ? (extraDutyHrs * perDayRate) / OVERTIME_RATE_DIVISOR : 0;
  const binCardAmount = perPiece > 0 ? perPiece * getPieceRate(department) : 0;
  const totalEarning = salary + extraPay + differenceAmount + binCardAmount - hoursDedAmt;

  // Deductions (before statutory)
  const totalPayableSalary = totalEarning - otherDeduction - mediclaimDeduction - shoesUniform;

  // Statutory — Employee side
  const eePf = Math.min(totalPayableSalary * PF_EMPLOYEE_RATE, PF_EE_CAP);
  const esiEe = totalPayableSalary * ESI_EE_RATE;
  const pt = totalPayableSalary > PT_THRESHOLD ? PT_AMOUNT : 0;
  const lwf = 0;

  // Statutory — Employer side
  const erPf = Math.min(totalPayableSalary * PF_EMPLOYER_RATE, PF_ER_CAP);
  const esiEr = totalPayableSalary * ESI_ER_RATE;

  // Net Pay
  const netPay = totalPayableSalary - eePf - esiEe - pt - lwf;

  return {
    empCode,
    month,
    year,
    salary,
    hoursDedAmt,
    extraPay,
    differenceAmount,
    binCardAmount,
    totalEarning,
    otherDeduction,
    mediclaimDeduction,
    shoesUniform,
    totalPayableSalary,
    eePf,
    esiEe,
    pt,
    erPf,
    esiEr,
    lwf,
    netPay,
    remarks: employee.paymentMode,
    status: 'processed',
  };
}

export function calculateBulkPayroll(
  employees: Employee[],
  attendanceMap: Record<string, AttendanceRecord>
): PayrollEntry[] {
  return employees
    .map((emp) => {
      const att = attendanceMap[emp.empCode];
      if (!att) return null;
      return calculatePayroll(emp, att);
    })
    .filter(Boolean) as PayrollEntry[];
}

export function getPayrollSummary(entries: PayrollEntry[]) {
  const totalGross = entries.reduce((s, e) => s + e.totalEarning, 0);
  const totalDeductions = entries.reduce((s, e) => s + e.eePf + e.esiEe + e.pt + e.otherDeduction + e.mediclaimDeduction + e.shoesUniform, 0);
  const totalNet = entries.reduce((s, e) => s + e.netPay, 0);
  const totalPF = entries.reduce((s, e) => s + e.eePf + e.erPf, 0);
  const totalESI = entries.reduce((s, e) => s + e.esiEe + e.esiEr, 0);
  return { totalGross, totalDeductions, totalNet, totalPF, totalESI, count: entries.length };
}
