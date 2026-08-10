'use client';
// src/app/reports/page.tsx
import { useMemo, useState, useEffect } from 'react';
import { Download, FileText, BarChart2, Users, Calendar, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { employees as mockEmployees } from '@/lib/data/employees';
import { attendanceData as mockAttendanceData } from '@/lib/data/attendance';
import { calculateBulkPayroll, getPayrollSummary } from '@/lib/payroll/calculator';
import { formatCurrency } from '@/lib/utils';
import { AttendanceRecord } from '@/types/payroll';
import { Employee } from '@/types/employee';

import EmptyDataPrompt from '@/components/EmptyDataPrompt';
import UploadModal from '@/components/UploadModal';

const COLORS = ['#2563eb', '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];

// localStorage keys for advance header settings
const LS_CONTRACTOR    = 'adv_contractor';
const LS_WORK_LOCATION = 'adv_work_location';
const LS_PRINCIPAL_EMP = 'adv_principal_employer';

export default function ReportsPage() {
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Advance header settings from localStorage
  const [advContractor,   setAdvContractor]   = useState('');
  const [advWorkLocation, setAdvWorkLocation] = useState('');
  const [advPrincipalEmp, setAdvPrincipalEmp] = useState('');

  useEffect(() => {
    setAdvContractor(localStorage.getItem(LS_CONTRACTOR)    || 'Payroll AI Solutions, Plot 45, Tech Park Phase 2, Industrial Zone, Mumbai');
    setAdvWorkLocation(localStorage.getItem(LS_WORK_LOCATION) || 'Block 4, Tech Park Phase 2, Industrial Zone, Navi Mumbai');
    setAdvPrincipalEmp(localStorage.getItem(LS_PRINCIPAL_EMP)  || 'Vanguard Industries Ltd.');
  }, []);

  // Raw advance data from backend (other_deduction > 0)
  const [rawAdvances, setRawAdvances] = useState<Array<{ empCode: string; empName: string; category: string; department: string; salary: number; otherDeduction: number }>>([]);
  // Raw overtime data from backend (extra_duty_hrs > 0)
  const [rawOvertime, setRawOvertime] = useState<Array<{ empCode: string; empName: string; category: string; department: string; perDayRate: number; paidDays: number; extraDutyHrs: number; extraPay: number; salary: number; totalEarning: number; netPay: number }>>([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/employees')
      .then(res => res.json())
      .then(data => {
        setIsLoaded(true);

        if (Array.isArray(data)) {
          const mappedEmps = data.map((e: any) => ({
            id: e.id || 0,
            empCode: e.emp_code,
            category: e.category,
            name: e.employee_name,
            unit: e.unit,
            floor: e.floor,
            department: e.department,
            contractor: e.contractor,
            doj: e.doj,
            bankName: e.bank_name,
            accountNo: e.account_no,
            ifsc: e.ifsc,
            uan: e.uan,
            esicNo: e.esic,
            aadhar: e.aadhar,
            salaryType: e.salary_type,
            perDayRate: e.per_day_rate,
            fixedPay: e.fixed_pay,
            paymentMode: e.remarks || 'BANK'
          }));
          setEmployeesList(mappedEmps);

          const mappedAtt = data.map((e: any) => ({
            empCode: e.emp_code,
            month: 11,
            year: 2025,
            present: e.present || 0,
            hoursDedHr: e.hours_ded_hr || 0,
            extraDutyHrs: e.extra_duty_hrs || 0,
            absent: e.absent || 0,
            ph: e.ph || 0,
            weeklyOff: e.weekly_off || 0,
            perPiece: e.per_piece || 0,
            paidDays: e.paid_days || 0,
            totalDays: e.total_days || 28
          }));
          setAttendanceList(mappedAtt);

          // Build advance entries directly from backend data (other_deduction is real DB value)
          const advances = data
            .filter((e: any) => (e.other_deduction || 0) > 0)
            .map((e: any) => ({
              empCode: e.emp_code,
              empName: e.employee_name || e.emp_code,
              category: e.category || '',
              department: e.department || '',
              salary: (e.per_day_rate || 0) * (e.paid_days || 0),
              otherDeduction: e.other_deduction || 0,
            }));
          setRawAdvances(advances);

          // Build overtime entries directly from backend data
          const overtimes = data
            .filter((e: any) => (e.extra_duty_hrs || 0) > 0)
            .map((e: any) => ({
              empCode: e.emp_code,
              empName: e.employee_name || e.emp_code,
              category: e.category || '',
              department: e.department || '',
              perDayRate: e.per_day_rate || 0,
              paidDays: e.paid_days || 0,
              extraDutyHrs: e.extra_duty_hrs || 0,
              extraPay: e.extra_pay || 0,
              salary: e.salary || ((e.per_day_rate || 0) * (e.paid_days || 0)),
              totalEarning: e.total_earning || 0,
              netPay: e.net_pay || 0,
            }));
          setRawOvertime(overtimes);
        }
      })
      .catch(err => console.error("Error fetching employees in reports:", err));
  }, []);

  const attMap = useMemo(() => {
    const m: Record<string, typeof attendanceList[0]> = {};
    attendanceList.filter(a => a.month === 11 && a.year === 2025).forEach(a => { m[a.empCode] = a; });
    return m;
  }, [attendanceList]);

  const entries = useMemo(() => calculateBulkPayroll(employeesList, attMap), [employeesList, attMap]);
  const summary = useMemo(() => getPayrollSummary(entries), [entries]);

  const deptData = useMemo(() => {
    const depts: Record<string, { gross: number; net: number; count: number; eePf: number; esi: number }> = {};
    entries.forEach(e => {
      const emp = employeesList.find(x => x.empCode === e.empCode);
      if (!emp) return;
      if (!depts[emp.department]) depts[emp.department] = { gross: 0, net: 0, count: 0, eePf: 0, esi: 0 };
      depts[emp.department].gross += e.totalEarning;
      depts[emp.department].net += e.netPay;
      depts[emp.department].count++;
      depts[emp.department].eePf += e.eePf;
      depts[emp.department].esi += e.esiEe;
    });
    return Object.entries(depts).map(([name, v]) => ({ name: name.length > 16 ? name.slice(0, 16) + '…' : name, fullName: name, ...v })).sort((a, b) => b.net - a.net);
  }, [entries, employeesList]);

  const overtimeData = useMemo(() =>
    attendanceList.filter(a => a.month === 11 && a.year === 2025 && a.extraDutyHrs > 0).map(a => {
      const emp = employeesList.find(e => e.empCode === a.empCode);
      return { name: emp?.name.split(' ')[0] ?? a.empCode, hrs: a.extraDutyHrs };
    }).sort((a, b) => b.hrs - a.hrs).slice(0, 8), [attendanceList, employeesList]);

  // advanceEntries comes from rawAdvances (real backend data, not recalculated)
  const advanceEntries = rawAdvances;

  // Build advance PDF download URL with localStorage header params
  const advancePdfUrl = useMemo(() => {
    const base = 'http://localhost:8000/api/payslip/advances-register';
    if (!advContractor) return base;
    const p = new URLSearchParams({
      contractor:         advContractor,
      work_location:      advWorkLocation,
      principal_employer: advPrincipalEmp,
      month:              'November 2025',
    });
    return `${base}?${p.toString()}`;
  }, [advContractor, advWorkLocation, advPrincipalEmp]);

  // Build overtime PDF download URL with localStorage header params
  const overtimePdfUrl = useMemo(() => {
    const base = 'http://localhost:8000/api/payslip/overtime-register';
    if (!advContractor) return base;
    const p = new URLSearchParams({
      contractor:         advContractor,
      work_location:      advWorkLocation,
      principal_employer: advPrincipalEmp,
      month:              'November 2025',
    });
    return `${base}?${p.toString()}`;
  }, [advContractor, advWorkLocation, advPrincipalEmp]);

  const reportCards = [
    { title: 'Payroll Summary Report',   desc: 'Complete salary register with all components',   icon: FileText,      color: '#2563eb', bg: '#eff6ff' },
    { title: 'Department Salary Report', desc: 'Department-wise salary aggregation',               icon: BarChart2,     color: '#4f46e5', bg: '#eef2ff' },
    { title: 'Attendance Report',        desc: 'Monthly attendance for all employees',             icon: Calendar,      color: '#0891b2', bg: '#f0f9ff' },
    { title: 'Employee Report',          desc: 'Complete employee master data export',             icon: Users,         color: '#059669', bg: '#f0fdf4' },
    { title: 'Register of Advances',     desc: 'Form XXII — Official advance deduction register', icon: ClipboardList, color: '#d97706', bg: '#fffbeb', isAdvance: true },
    { title: 'Register of Overtime',     desc: 'Statutory 16-column overtime register',           icon: ClipboardList, color: '#2563eb', bg: '#eff6ff', isOvertime: true },
  ];

  if (isLoaded && employeesList.length === 0) {
    return (
      <>
        <EmptyDataPrompt pageName="Reports & Analytics" onUpload={() => setShowUploadModal(true)} />
        {showUploadModal && (
          <UploadModal
            onSuccess={() => { setShowUploadModal(false); window.location.reload(); }}
            onClose={() => setShowUploadModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Quick exports */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {reportCards.map((r: any) => (
          <div key={r.title} style={{
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius)', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer',
            transition: 'box-shadow 0.15s ease', boxShadow: 'var(--shadow-sm)',
          }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <r.icon size={17} color={r.color} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{r.desc}</div>
            </div>
            {r.isAdvance ? (
              <a
                href={advancePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                  borderRadius: '6px', border: `1px solid ${r.color}30`, background: r.bg,
                  color: r.color, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  alignSelf: 'flex-start', textDecoration: 'none',
                }}
              >
                <Download size={12} /> Download PDF
              </a>
            ) : r.isOvertime ? (
              <a
                href={overtimePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                  borderRadius: '6px', border: `1px solid ${r.color}30`, background: r.bg,
                  color: r.color, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  alignSelf: 'flex-start', textDecoration: 'none',
                }}
              >
                <Download size={12} /> Download PDF
              </a>
            ) : (
              <button style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                borderRadius: '6px', border: `1px solid ${r.color}30`, background: r.bg,
                color: r.color, fontSize: '11px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
              }}>
                <Download size={12} /> Export
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Summary banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f, #1e1b4b)',
        borderRadius: 'var(--radius-lg)', padding: '20px 24px',
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px',
      }}>
        {[
          { label: 'Employees', value: summary.count },
          { label: 'Total Gross', value: formatCurrency(summary.totalGross) },
          { label: 'Total Net', value: formatCurrency(summary.totalNet) },
          { label: 'Total PF', value: formatCurrency(summary.totalPF) },
          { label: 'Total ESI', value: formatCurrency(summary.totalESI) },
        ].map(s => (
          <div key={s.label}>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* Dept bar chart */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', padding: '18px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Net Payroll by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l: string) => deptData.find(d => d.name === l)?.fullName ?? l} />
              <Bar dataKey="net" fill="#2563eb" radius={[0, 4, 4, 0]}>
                {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Overtime bar */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', padding: '18px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Top Overtime Workers (Hours)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={overtimeData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="hrs" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department detail table */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--card-border)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Department Payroll Details</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Department', 'Employees', 'Gross Earnings', 'EE PF', 'ESI', 'Net Pay', 'Avg Net/Employee'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Department' ? 'left' : 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deptData.map((dept, i) => (
              <tr key={dept.fullName} style={{ borderBottom: '1px solid var(--card-border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{dept.fullName}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>{dept.count}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>{formatCurrency(dept.gross)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>{formatCurrency(dept.eePf)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>{formatCurrency(dept.esi)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#059669' }}>{formatCurrency(dept.net)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>{formatCurrency(dept.net / dept.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ══ Register of Advances Preview ══ */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {/* Header bar */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--card-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={16} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Form XXII — Register of Advances</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>November 2025 · Advance deductions register</div>
            </div>
          </div>
          <a
            href={advancePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              background: '#d97706', color: 'white',
              fontSize: '12px', fontWeight: 600,
              textDecoration: 'none', cursor: 'pointer',
            }}
          >
            <Download size={13} /> Download Form XXII PDF
          </a>
        </div>

        {advanceEntries.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <ClipboardList size={32} color="#d1d5db" style={{ marginBottom: 10 }} />
            <div>No employees with advance deductions in November 2025.</div>
            <div style={{ fontSize: '11px', marginTop: 4 }}>Advances are recorded under the &ldquo;Other Deduction&rdquo; column in payroll data.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fef3c7' }}>
                  {['SR NO.', 'Card No.', 'Employee Name', 'Category / Department', 'Wage (Nov 2025)', 'Advance Amount', 'Purpose', 'Instalments', 'Date of Last Instalment'].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 12px',
                      textAlign: i <= 1 ? 'center' : i >= 4 ? 'right' : 'left',
                      fontSize: '10px', fontWeight: 700,
                      color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '2px solid #fde68a', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {advanceEntries.map((entry, idx) => (
                  <tr key={entry.empCode}
                    style={{ borderBottom: '1px solid var(--card-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fffbeb')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#d97706' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{entry.empCode}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{entry.empName}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span style={{ padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', marginRight: 4 }}>{entry.category}</span>
                      {entry.department}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>{formatCurrency(entry.salary ?? 0)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#d97706' }}>{formatCurrency(entry.otherDeduction ?? 0)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 20, background: '#fef3c7', color: '#d97706', fontWeight: 600, fontSize: '10px' }}>PERSONAL</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>1</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>Nov 2025</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#fef3c7', borderTop: '2px solid #fde68a' }}>
                  <td colSpan={5} style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 700, color: '#92400e' }}>Total Advances</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#d97706' }}>
                    {formatCurrency(advanceEntries.reduce((s, e) => s + (e.otherDeduction ?? 0), 0))}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ══ Register of Overtime Preview ══ */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {/* Header bar */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--card-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={16} color="#1d4ed8" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Register of Overtime</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>November 2025 · 16 Statutory Columns (Overtime rate: ₹60.8/hr)</div>
            </div>
          </div>
          <a
            href={overtimePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              background: '#2563eb', color: 'white',
              fontSize: '12px', fontWeight: 600,
              textDecoration: 'none', cursor: 'pointer',
            }}
          >
            <Download size={13} /> Download Register of Overtime PDF
          </a>
        </div>

        {rawOvertime.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <ClipboardList size={32} color="#d1d5db" style={{ marginBottom: 10 }} />
            <div>No employees worked overtime in November 2025.</div>
            <div style={{ fontSize: '11px', marginTop: 4 }}>Overtime is recorded under the &ldquo;Extra Duty Hours&rdquo; column in payroll data.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#dbeafe' }}>
                  {[
                    'SR NO.', 'Card No.', 'Name', 'Designation & Dept', 'OT Worked Date',
                    'Total OT (HRS)', 'Normal Hours', 'Normal Rate', 'Over Time Rate',
                    'Normal Earning', 'Over Time Earning', 'Total Earning', 'Net Amount',
                    'Payment Date', 'Signature', 'Initials'
                  ].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 10px',
                      textAlign: i <= 1 ? 'center' : i >= 5 && i <= 12 ? 'right' : 'left',
                      fontSize: '10px', fontWeight: 700,
                      color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '2px solid #bfdbfe', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawOvertime.map((entry, idx) => {
                  const normalHrs = entry.paidDays > 0 ? entry.paidDays * 8 : 208;
                  const normalRate = entry.perDayRate > 0 ? entry.perDayRate / 8 : 60.8;
                  const otRate = 60.8;
                  const otEarning = entry.extraPay || (entry.extraDutyHrs * otRate);

                  return (
                    <tr key={entry.empCode}
                      style={{ borderBottom: '1px solid var(--card-border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{entry.empCode}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{entry.empName}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                        <span style={{ padding: '1px 5px', borderRadius: 4, background: '#e0f2fe', color: '#0369a1', marginRight: 4, fontSize: '10px' }}>{entry.category}</span>
                        {entry.department}
                      </td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Nov 2025</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{entry.extraDutyHrs.toFixed(1)} hrs</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>{normalHrs.toFixed(0)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>₹{normalRate.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#1e40af' }}>₹{otRate.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatCurrency(entry.salary)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{formatCurrency(otEarning)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(entry.totalEarning || (entry.salary + otEarning))}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{formatCurrency(entry.netPay || entry.totalEarning)}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Nov 2025</td>
                      <td style={{ padding: '8px 10px', color: '#cbd5e1', textAlign: 'center' }}>—</td>
                      <td style={{ padding: '8px 10px', color: '#cbd5e1', textAlign: 'center' }}>—</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#dbeafe', borderTop: '2px solid #bfdbfe' }}>
                  <td colSpan={5} style={{ padding: '10px 10px', fontWeight: 700, color: '#1e40af' }}>Total Overtime Summary</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                    {rawOvertime.reduce((s, e) => s + e.extraDutyHrs, 0).toFixed(1)} hrs
                  </td>
                  <td colSpan={4} />
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                    {formatCurrency(rawOvertime.reduce((s, e) => s + (e.extraPay || (e.extraDutyHrs * 60.8)), 0))}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(rawOvertime.reduce((s, e) => s + e.totalEarning, 0))}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                    {formatCurrency(rawOvertime.reduce((s, e) => s + e.netPay, 0))}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
