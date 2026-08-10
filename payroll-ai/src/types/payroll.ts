// src/types/payroll.ts

export interface AttendanceRecord {
  empCode: string;
  month: number;
  year: number;
  present: number;
  hoursDedHr: number;
  extraDutyHrs: number;
  absent: number;
  ph: number;
  weeklyOff: number;
  perPiece: number;
  paidDays: number;
  totalDays: number;
}

export interface PayrollEntry {
  empCode: string;
  month: number;
  year: number;
  // Earnings
  salary: number;
  hoursDedAmt: number;
  extraPay: number;
  differenceAmount: number;
  binCardAmount: number;
  totalEarning: number;
  // Deductions
  otherDeduction: number;
  mediclaimDeduction: number;
  shoesUniform: number;
  totalPayableSalary: number;
  // Statutory
  eePf: number;
  esiEe: number;
  pt: number;
  erPf: number;
  esiEr: number;
  lwf: number;
  // Net
  netPay: number;
  remarks: string;
  status: 'pending' | 'processed' | 'paid';
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: 'pending' | 'processing' | 'processed' | 'paid';
  totalEmployees: number;
  totalNetPay: number;
  processedAt?: string;
  processedBy?: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  logoUrl?: string;
  primaryColor?: string;
}
