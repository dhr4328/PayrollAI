// src/types/employee.ts
import { PayrollEntry } from './payroll';

export type SalaryType = 'PER DAY' | 'FIXED SALARY';
export type Category = 'Casual' | 'UP' | 'Borsad';
export type PaymentMode = 'BANK' | 'CASH';

export interface Employee {
  id: number;
  empCode: string;
  category: Category;
  name: string;
  unit: string;
  floor: string;
  department: string;
  contractor: string;
  doj: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  uan: string;
  esicNo: string;
  aadhar: string;
  salaryType: SalaryType;
  perDayRate: number;
  fixedPay: number;
  paymentMode: PaymentMode;
}

export interface EmployeeWithPayroll extends Employee {
  currentPayroll?: PayrollEntry;
}
