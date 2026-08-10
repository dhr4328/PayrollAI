// src/lib/ai/tools.ts
import { employees, getEmployee, searchEmployees } from '@/lib/data/employees';
import { attendanceData, getAttendance, getMonthAttendance } from '@/lib/data/attendance';
import { calculatePayroll, calculateBulkPayroll, getPayrollSummary } from '@/lib/payroll/calculator';
import { formatCurrency } from '@/lib/utils';

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  tool: string;
  status: 'success' | 'error';
  data: unknown;
  summary: string;
}

const DEMO_MONTH = 11;
const DEMO_YEAR = 2025;

export const tools: Record<string, (args: Record<string, unknown>) => ToolResult> = {
  getEmployee: (args) => {
    const query = String(args.query || '');
    const found = searchEmployees(query);
    if (found.length === 0) {
      return { tool: 'getEmployee', status: 'error', data: null, summary: `No employee found matching "${query}".` };
    }
    const emp = found[0];
    const att = getAttendance(emp.empCode, DEMO_MONTH, DEMO_YEAR);
    const payroll = att ? calculatePayroll(emp, att) : null;
    return {
      tool: 'getEmployee', status: 'success',
      data: { employee: emp, attendance: att, payroll },
      summary: `Found: **${emp.name}** (${emp.empCode}) — ${emp.department}, ${emp.floor}. Net Pay: ${payroll ? formatCurrency(payroll.netPay) : 'N/A'}.`,
    };
  },

  getAllEmployees: (_args) => {
    return {
      tool: 'getAllEmployees', status: 'success',
      data: employees,
      summary: `Found **${employees.length} employees** across departments.`,
    };
  },

  generatePayslip: (args) => {
    const query = String(args.empCode || args.name || '');
    const found = searchEmployees(query);
    if (found.length === 0) return { tool: 'generatePayslip', status: 'error', data: null, summary: 'Employee not found.' };
    const emp = found[0];
    const att = getAttendance(emp.empCode, DEMO_MONTH, DEMO_YEAR);
    if (!att) return { tool: 'generatePayslip', status: 'error', data: null, summary: 'No attendance data found.' };
    const payroll = calculatePayroll(emp, att);
    return {
      tool: 'generatePayslip', status: 'success',
      data: { employee: emp, attendance: att, payroll, month: DEMO_MONTH, year: DEMO_YEAR },
      summary: `Payslip generated for **${emp.name}** — Net Pay: **${formatCurrency(payroll.netPay)}**`,
    };
  },

  generatePayroll: (_args) => {
    const attMap: Record<string, import('@/types/payroll').AttendanceRecord> = {};
    attendanceData.filter(a => a.month === DEMO_MONTH && a.year === DEMO_YEAR)
      .forEach(a => { attMap[a.empCode] = a; });
    const entries = calculateBulkPayroll(employees, attMap);
    const summary = getPayrollSummary(entries);
    return {
      tool: 'generatePayroll', status: 'success',
      data: { entries, summary, month: DEMO_MONTH, year: DEMO_YEAR },
      summary: `Payroll processed for **${summary.count} employees**. Total Net: **${formatCurrency(summary.totalNet)}** | Gross: **${formatCurrency(summary.totalGross)}**`,
    };
  },

  getAttendanceSummary: (_args) => {
    const records = getMonthAttendance(DEMO_MONTH, DEMO_YEAR);
    const present = records.filter(r => r.present > 0).length;
    const absent = records.filter(r => r.absent >= r.paidDays && r.paidDays === 0).length;
    const overtime = records.filter(r => r.extraDutyHrs > 0);
    return {
      tool: 'getAttendanceSummary', status: 'success',
      data: { records, present, absent, overtime },
      summary: `Nov 2025 Attendance: **${present} employees present**, **${absent} absent**. **${overtime.length}** employees logged overtime.`,
    };
  },

  getAbsentEmployees: (_args) => {
    const records = getMonthAttendance(DEMO_MONTH, DEMO_YEAR);
    const absent = records.filter(r => r.absent > 0).map(r => {
      const emp = getEmployee(r.empCode);
      return { ...r, name: emp?.name, department: emp?.department };
    });
    return {
      tool: 'getAbsentEmployees', status: 'success',
      data: absent,
      summary: `**${absent.length} employees** had absences in November 2025.`,
    };
  },

  getOvertimeReport: (args) => {
    const dept = args.department ? String(args.department) : undefined;
    const records = getMonthAttendance(DEMO_MONTH, DEMO_YEAR)
      .filter(r => r.extraDutyHrs > 0)
      .map(r => {
        const emp = getEmployee(r.empCode);
        return { empCode: r.empCode, name: emp?.name, department: emp?.department, extraDutyHrs: r.extraDutyHrs, extraPay: (r.extraDutyHrs * 489.5) / 8 };
      })
      .filter(r => !dept || r.department?.toLowerCase().includes(dept.toLowerCase()));
    const totalHrs = records.reduce((s, r) => s + r.extraDutyHrs, 0);
    return {
      tool: 'getOvertimeReport', status: 'success',
      data: records,
      summary: `**${records.length} employees** worked overtime. Total: **${totalHrs.toFixed(1)} hrs** | Pay: **${formatCurrency(records.reduce((s, r) => s + r.extraPay, 0))}**`,
    };
  },

  getDepartmentSummary: (_args) => {
    const depts: Record<string, { count: number; totalNet: number }> = {};
    attendanceData
      .filter(a => a.month === DEMO_MONTH && a.year === DEMO_YEAR)
      .forEach(att => {
        const emp = getEmployee(att.empCode);
        if (!emp) return;
        const payroll = calculatePayroll(emp, att);
        if (!depts[emp.department]) depts[emp.department] = { count: 0, totalNet: 0 };
        depts[emp.department].count++;
        depts[emp.department].totalNet += payroll.netPay;
      });
    return {
      tool: 'getDepartmentSummary', status: 'success',
      data: depts,
      summary: `Department salary summary generated for **${Object.keys(depts).length} departments**.`,
    };
  },

  getAdvancesRegister: (_args) => {
    const empList: Array<{ name: string; empCode: string; advance: number; department: string; category: string }> = [];
    let totalAdvance = 0;
    attendanceData
      .filter(a => a.month === DEMO_MONTH && a.year === DEMO_YEAR)
      .forEach(att => {
        const emp = getEmployee(att.empCode);
        if (!emp) return;
        const payroll = calculatePayroll(emp, att);
        const advance = payroll.otherDeduction || 0;
        if (advance > 0) {
          empList.push({
            name: emp.name,
            empCode: emp.empCode,
            advance,
            department: emp.department,
            category: emp.category,
          });
          totalAdvance += advance;
        }
      });
    return {
      tool: 'getAdvancesRegister', status: 'success',
      data: { employees: empList, totalAdvance },
      summary: `**${empList.length} employee(s)** have advance deductions in November 2025. Total: **₹${totalAdvance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}**.`,
    };
  },

  getOvertimeRegister: (_args) => {
    const empList: Array<{ name: string; empCode: string; otHrs: number; otPay: number; department: string; category: string }> = [];
    let totalOtHrs = 0;
    let totalOtPay = 0;
    attendanceData
      .filter(a => a.month === DEMO_MONTH && a.year === DEMO_YEAR)
      .forEach(att => {
        const emp = getEmployee(att.empCode);
        if (!emp) return;
        const payroll = calculatePayroll(emp, att);
        const otHrs = att.extraDutyHrs || 0;
        const otPay = payroll.extraPay || (otHrs * 60.8);
        if (otHrs > 0) {
          empList.push({
            name: emp.name,
            empCode: emp.empCode,
            otHrs,
            otPay,
            department: emp.department,
            category: emp.category,
          });
          totalOtHrs += otHrs;
          totalOtPay += otPay;
        }
      });
    return {
      tool: 'getOvertimeRegister', status: 'success',
      data: { employees: empList, totalOtHrs, totalOtPay },
      summary: `**${empList.length} employee(s)** worked overtime in November 2025. Total OT Hours: **${totalOtHrs.toFixed(1)} hrs**, Total OT Pay: **₹${totalOtPay.toLocaleString('en-IN', { maximumFractionDigits: 0 })}**.`,
    };
  },
};

export function runTool(toolCall: ToolCall): ToolResult {
  const fn = tools[toolCall.name];
  if (!fn) return { tool: toolCall.name, status: 'error', data: null, summary: `Unknown tool: ${toolCall.name}` };
  try { return fn(toolCall.args); }
  catch (e) { return { tool: toolCall.name, status: 'error', data: null, summary: `Tool error: ${e}` }; }
}
