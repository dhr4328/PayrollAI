// src/lib/data/attendance.ts
import { AttendanceRecord } from '@/types/payroll';

// November 2025 attendance data (matching demo.xlsx)
export const attendanceData: AttendanceRecord[] = [
  { empCode: 'NUC0744', month: 11, year: 2025, present: 23, hoursDedHr: 0, extraDutyHrs: 2,    absent: 1, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 23, totalDays: 28 },
  { empCode: 'NUC0854', month: 11, year: 2025, present: 1,  hoursDedHr: 0, extraDutyHrs: 1,    absent: 26,ph: 0, weeklyOff: 1, perPiece: 0,  paidDays: 1,  totalDays: 28 },
  { empCode: 'NUC0820', month: 11, year: 2025, present: 3,  hoursDedHr: 0, extraDutyHrs: 7.5,  absent: 0, ph: 0, weeklyOff: 2, perPiece: 23, paidDays: 3,  totalDays: 28 },
  { empCode: 'NUC0959', month: 11, year: 2025, present: 10, hoursDedHr: 0, extraDutyHrs: 21.5, absent: 2, ph: 0, weeklyOff: 2, perPiece: 14, paidDays: 10, totalDays: 28 },
  { empCode: 'NUC0117', month: 11, year: 2025, present: 0,  hoursDedHr: 0, extraDutyHrs: 0,    absent: 0, ph: 0, weeklyOff: 4, perPiece: 24, paidDays: 0,  totalDays: 28 },
  { empCode: 'SHE203',  month: 11, year: 2025, present: 20, hoursDedHr: 0, extraDutyHrs: 1,    absent: 4, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 20, totalDays: 28 },
  { empCode: 'SHE235',  month: 11, year: 2025, present: 22, hoursDedHr: 0, extraDutyHrs: 4.5,  absent: 2, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 22, totalDays: 28 },
  { empCode: 'NPH09',   month: 11, year: 2025, present: 22, hoursDedHr: 0, extraDutyHrs: 25,   absent: 2, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 22, totalDays: 28 },
  { empCode: 'SHE309',  month: 11, year: 2025, present: 23, hoursDedHr: 0, extraDutyHrs: 0,    absent: 1, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 23, totalDays: 28 },
  { empCode: 'SHE344',  month: 11, year: 2025, present: 22, hoursDedHr: 0, extraDutyHrs: 2.5,  absent: 2, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 22, totalDays: 28 },
  { empCode: 'SHE349',  month: 11, year: 2025, present: 24, hoursDedHr: 0, extraDutyHrs: 66,   absent: 0, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 24, totalDays: 28 },
  { empCode: 'SHE350',  month: 11, year: 2025, present: 23.5, hoursDedHr: 0, extraDutyHrs: 9.5, absent: 0.5, ph: 0, weeklyOff: 4, perPiece: 0, paidDays: 23.5, totalDays: 28 },
  { empCode: 'SHE351',  month: 11, year: 2025, present: 23, hoursDedHr: 0, extraDutyHrs: 47.5, absent: 1, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 23, totalDays: 28 },
  { empCode: 'SHE354',  month: 11, year: 2025, present: 8,  hoursDedHr: 0, extraDutyHrs: 21.5, absent: 0, ph: 0, weeklyOff: 3, perPiece: 17, paidDays: 8,  totalDays: 28 },
  { empCode: 'SHE360',  month: 11, year: 2025, present: 24, hoursDedHr: 0, extraDutyHrs: 51.5, absent: 0, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 24, totalDays: 28 },
  { empCode: 'SHE362',  month: 11, year: 2025, present: 23, hoursDedHr: 0, extraDutyHrs: 10,   absent: 1, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 23, totalDays: 28 },
  { empCode: 'SHE369',  month: 11, year: 2025, present: 23, hoursDedHr: 0, extraDutyHrs: 15.5, absent: 1, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 23, totalDays: 28 },
  { empCode: 'SHE371',  month: 11, year: 2025, present: 22, hoursDedHr: 0, extraDutyHrs: 6,    absent: 2, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 22, totalDays: 28 },
  { empCode: 'SHE373',  month: 11, year: 2025, present: 21, hoursDedHr: 0, extraDutyHrs: 2.5,  absent: 3, ph: 0, weeklyOff: 4, perPiece: 0,  paidDays: 21, totalDays: 28 },
  { empCode: 'MK0045',  month: 11, year: 2025, present: 18, hoursDedHr: 0, extraDutyHrs: 0,    absent: 7, ph: 0, weeklyOff: 3, perPiece: 0,  paidDays: 18, totalDays: 28 },
];

export function getAttendance(empCode: string, month: number, year: number): AttendanceRecord | undefined {
  return attendanceData.find((a) => a.empCode === empCode && a.month === month && a.year === year);
}

export function getMonthAttendance(month: number, year: number): AttendanceRecord[] {
  return attendanceData.filter((a) => a.month === month && a.year === year);
}

export function getTodayPresent(month: number, year: number): number {
  const records = getMonthAttendance(month, year);
  return records.filter((r) => r.present > 0).length;
}

export function getAbsentToday(month: number, year: number): number {
  const records = getMonthAttendance(month, year);
  return records.filter((r) => r.absent > 0).length;
}
