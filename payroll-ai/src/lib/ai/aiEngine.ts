// src/lib/ai/aiEngine.ts
'use client';
import { runTool, ToolCall, ToolResult } from './tools';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  isStreaming?: boolean;
  timestamp: Date;
}

interface Intent {
  patterns: RegExp[];
  tool: string;
  extractArgs: (input: string) => Record<string, unknown>;
  thinkingMsg: string;
  buildResponse: (result: ToolResult, input: string) => string;
}

const intents: Intent[] = [
  {
    patterns: [/generate payroll/i, /run payroll/i, /process payroll/i, /payroll for (nov|november|all)/i],
    tool: 'generatePayroll',
    extractArgs: () => ({}),
    thinkingMsg: '🔄 Running payroll calculator for all employees...',
    buildResponse: (result) => {
      const { summary } = result.data as { summary: { count: number; totalGross: number; totalNet: number; totalPF: number; totalESI: number } };
      return `✅ **Payroll Generated — November 2025**\n\n- **Total Net Payable:** ₹${summary.totalNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${summary.count} employees)\n- [⬇ Download All Payslips (ZIP)](http://localhost:8000/api/payslip/bulk-zip)`;
    },
  },
  {
    patterns: [/payslip for (.+)/i, /generate payslip(.+)/i, /salary slip for (.+)/i, /payslip of (.+)/i],
    tool: 'generatePayslip',
    extractArgs: (input) => {
      const match = input.match(/(?:payslip for|payslip of|salary slip for|generate payslip for?)\s+(.+)/i);
      return { name: match?.[1]?.trim() ?? input };
    },
    thinkingMsg: '📄 Fetching employee data and computing salary...',
    buildResponse: (result) => {
      if (result.status === 'error') return `❌ ${result.summary}`;
      const { employee, payroll } = result.data as { employee: { name: string; empCode: string; department: string; perDayRate: number }; payroll: { salary: number; extraPay: number; binCardAmount: number; totalEarning: number; eePf: number; esiEe: number; pt: number; otherDeduction: number; netPay: number; totalPayableSalary: number } };
      return `📄 **Payslip PDF ready for ${employee.name}** (${employee.empCode})\n\n- **Net Pay:** ₹${payroll.netPay.toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n- [⬇ Download Payslip PDF](http://localhost:8000/api/payslip/pdf/${employee.empCode})`;
    },
  },
  {
    patterns: [/show.*absent/i, /who.*absent/i, /absent.*employee/i, /employees.*absent/i],
    tool: 'getAbsentEmployees',
    extractArgs: () => ({}),
    thinkingMsg: '📊 Checking attendance records...',
    buildResponse: (result) => {
      const absent = result.data as Array<{ name: string; empCode: string; absent: number; department: string }>;
      const rows = absent.map(a => `| ${a.name} | ${a.empCode} | ${a.department} | ${a.absent} day(s) |`).join('\n');
      return `📋 **Employees with Absences — November 2025**\n\n${result.summary}\n\n| Name | Emp Code | Department | Absent Days |\n|------|----------|------------|-------------|\n${rows}`;
    },
  },
  {
    patterns: [/overtime/i, /extra duty/i, /extra hours/i],
    tool: 'getOvertimeReport',
    extractArgs: (input) => {
      const deptMatch = input.match(/(?:overtime|extra duty|extra hours).*(?:for|in|of)\s+(.+)/i);
      return deptMatch ? { department: deptMatch[1].trim() } : {};
    },
    thinkingMsg: '⏱️ Calculating overtime hours and pay...',
    buildResponse: (result) => {
      const records = result.data as Array<{ name: string; empCode: string; department: string; extraDutyHrs: number; extraPay: number }>;
      const rows = records.slice(0, 10).map(r => `| ${r.name} | ${r.department} | ${r.extraDutyHrs} hrs | ₹${r.extraPay.toFixed(0)} |`).join('\n');
      return `⏱️ **Overtime Report — November 2025**\n\n${result.summary}\n\n| Employee | Department | Extra Hours | Extra Pay |\n|----------|------------|-------------|----------|\n${rows}${records.length > 10 ? `\n\n_...and ${records.length - 10} more_` : ''}`;
    },
  },
  {
    patterns: [/show.*employee/i, /list.*employee/i, /all employee/i, /employee.*list/i, /how many employee/i, /total employee/i],
    tool: 'getAllEmployees',
    extractArgs: () => ({}),
    thinkingMsg: '👥 Fetching employee records...',
    buildResponse: (result) => {
      const emps = result.data as Array<{ name: string; empCode: string; department: string; category: string }>;
      const byDept: Record<string, number> = {};
      emps.forEach(e => { byDept[e.department] = (byDept[e.department] || 0) + 1; });
      const deptRows = Object.entries(byDept).map(([d, c]) => `| ${d} | ${c} |`).join('\n');
      return `👥 **Employee Overview**\n\n**Total: ${emps.length} employees** on payroll for November 2025.\n\n**By Department:**\n| Department | Count |\n|------------|-------|\n${deptRows}\n\nUse the **Employees** page to view detailed records, or ask me about a specific employee.`;
    },
  },
  {
    patterns: [/attendance/i, /present today/i, /attendance summary/i, /who.*present/i],
    tool: 'getAttendanceSummary',
    extractArgs: () => ({}),
    thinkingMsg: '📅 Loading attendance data...',
    buildResponse: (result) => {
      const { present, absent, overtime } = result.data as { present: number; absent: number; overtime: Array<{ empCode: string }> };
      return `📅 **Attendance Summary — November 2025**\n\n${result.summary}\n\n| Status | Count |\n|--------|-------|\n| Present | ${present} |\n| With Absences | ${absent} |\n| Overtime Workers | ${overtime.length} |\n\nAsk me to *"show absent employees"* or *"show overtime report"* for detailed breakdowns.`;
    },
  },
  {
    patterns: [/department.*salary/i, /salary.*department/i, /department.*payroll/i],
    tool: 'getDepartmentSummary',
    extractArgs: () => ({}),
    thinkingMsg: '📊 Aggregating department salary data...',
    buildResponse: (result) => {
      const depts = result.data as Record<string, { count: number; totalNet: number }>;
      const rows = Object.entries(depts).map(([d, v]) => `| ${d} | ${v.count} | ₹${v.totalNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })} |`).join('\n');
      return `📊 **Department Salary Report — November 2025**\n\n${result.summary}\n\n| Department | Employees | Net Payroll |\n|------------|-----------|-------------|\n${rows}`;
    },
  },
  {
    patterns: [
      /register\s+of\s+advance/i, /advance\s+register/i, /form\s+xxii/i, /form\s+22/i,
      /who.*took.*advance/i, /advance\s+deduction/i, /advances?\s+report/i,
    ],
    tool: 'getAdvancesRegister',
    extractArgs: () => ({}),
    thinkingMsg: '📋 Looking up advance deductions...',
    buildResponse: (result) => {
      const { employees: emps, totalAdvance } = result.data as { employees: Array<{ name: string; empCode: string; advance: number; department: string }>; totalAdvance: number };
      const pdfUrl = 'http://localhost:8000/api/payslip/advances-register';
      if (emps.length === 0) {
        return `📋 **Register of Advances — November 2025**\n\nNo employees have advance deductions this month.`;
      }
      return `📋 **Form XXII — Register of Advances PDF ready**\n\n- **Total Advances:** ₹${totalAdvance.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${emps.length} employees)\n- [⬇ Download Form XXII Register of Advances PDF](${pdfUrl})`;
    },
  },
  {
    patterns: [
      /register\s+of\s+overtime/i, /overtime\s+register/i, /overtime\s+report/i, /overtime\s+pdf/i,
      /extra\s+duty\s+register/i, /extra\s+duty\s+report/i,
    ],
    tool: 'getOvertimeRegister',
    extractArgs: () => ({}),
    thinkingMsg: '📋 Looking up overtime register records...',
    buildResponse: (result) => {
      const { employees: emps, totalOtHrs, totalOtPay } = result.data as { employees: Array<{ name: string; empCode: string; otHrs: number; otPay: number; department: string }>; totalOtHrs: number; totalOtPay: number };
      const pdfUrl = 'http://localhost:8000/api/payslip/overtime-register';
      if (emps.length === 0) {
        return `📋 **Register of Overtime — November 2025**\n\nNo employees worked overtime this month.`;
      }
      return `📋 **Register of Overtime PDF ready**\n\n- **Total Overtime:** ${totalOtHrs.toFixed(1)} hrs (₹${totalOtPay.toLocaleString('en-IN', { maximumFractionDigits: 0 })}, ${emps.length} employees)\n- [⬇ Download Register of Overtime PDF](${pdfUrl})`;
    },
  },
  {
    patterns: [
      /register\s+of\s+accidents?/i, /accident\s+register/i, /form\s+29/i, /form\s+no\.\s*29/i,
      /form\s+xxix/i, /dangerous\s+occurrences?/i,
    ],
    tool: 'getAccidentRegister',
    extractArgs: () => ({}),
    thinkingMsg: '📋 Preparing Form No. 29 Register of Accidents...',
    buildResponse: () => {
      const pdfUrl = 'http://localhost:8000/api/payslip/accident-register';
      return `📋 **Form No. 29 — Register of Accidents PDF ready**\n\n- Prescribed under Rule 111 (15 Statutory Columns A to O)\n- [⬇ Download Form No. 29 Register of Accidents PDF](${pdfUrl})`;
    },
  },
];

const fallbackResponses = [
  "I can help you with payroll processing, employee data, attendance analysis, and more. Try asking:\n- **\"Generate payroll for November\"**\n- **\"Show absent employees\"**\n- **\"Payslip for Divan Mayudinsha\"**\n- **\"Show overtime report\"**\n- **\"Register of advances\"**\n- **\"Department salary summary\"**",
  "I'm your PayrollAI assistant. I have access to employee records, attendance data, and can run payroll calculations. What would you like to know?",
  "I didn't quite understand that. I can help with:\n- 📄 Generating payslips\n- 💰 Running payroll\n- 📋 Register of Advances (Form XXII)\n- 📊 Department analysis\n- 👥 Employee lookup",
];

let fallbackIndex = 0;

export function matchIntent(input: string): Intent | null {
  for (const intent of intents) {
    if (intent.patterns.some((p) => p.test(input))) return intent;
  }
  return null;
}

export async function processMessage(
  input: string,
  onThinking: (msg: string, toolCall: ToolCall) => void,
  onResult: (result: ToolResult) => void,
  onStream: (chunk: string) => void
): Promise<void> {
  const intent = matchIntent(input);

  if (!intent) {
    // Simulate typing for fallback
    const response = fallbackResponses[fallbackIndex % fallbackResponses.length];
    fallbackIndex++;
    await streamText(response, onStream);
    return;
  }

  const args = intent.extractArgs(input);
  const toolCall: ToolCall = { name: intent.tool, args };

  // Show thinking state
  await new Promise((r) => setTimeout(r, 400));
  onThinking(intent.thinkingMsg, toolCall);

  // Simulate tool execution delay
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

  // Run tool
  const result = runTool(toolCall);
  onResult(result);

  await new Promise((r) => setTimeout(r, 200));

  // Stream response
  const response = intent.buildResponse(result, input);
  await streamText(response, onStream);
}

async function streamText(text: string, onChunk: (chunk: string) => void): Promise<void> {
  const words = text.split(' ');
  for (const word of words) {
    onChunk(word + ' ');
    await new Promise((r) => setTimeout(r, 18 + Math.random() * 25));
  }
}
