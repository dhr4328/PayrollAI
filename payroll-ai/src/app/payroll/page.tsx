'use client';
// src/app/payroll/page.tsx
import { useMemo, useState, useEffect } from 'react';
import { Play, Download, Mail, CheckCircle, Clock, DollarSign, TrendingUp, Users } from 'lucide-react';
import { employees as mockEmployees } from '@/lib/data/employees';
import { attendanceData as mockAttendanceData } from '@/lib/data/attendance';
import { calculateBulkPayroll, getPayrollSummary } from '@/lib/payroll/calculator';
import { formatCurrency, initials } from '@/lib/utils';
import { PayrollEntry, AttendanceRecord } from '@/types/payroll';
import { Employee } from '@/types/employee';

import EmptyDataPrompt from '@/components/EmptyDataPrompt';
import UploadModal from '@/components/UploadModal';

export default function PayrollPage() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

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
        }
      })
      .catch(err => console.error("Error fetching employees in payroll:", err));
  }, []);

  const attMap = useMemo(() => {
    const m: Record<string, typeof attendanceList[0]> = {};
    attendanceList.filter(a => a.month === 11 && a.year === 2025).forEach(a => { m[a.empCode] = a; });
    return m;
  }, [attendanceList]);

  const summary = useMemo(() => entries.length ? getPayrollSummary(entries) : null, [entries]);

  const runPayroll = async () => {
    setStatus('processing');
    await new Promise(r => setTimeout(r, 1800));
    const result = calculateBulkPayroll(employeesList, attMap);
    setEntries(result);
    setStatus('done');
  };

  if (isLoaded && employeesList.length === 0) {
    return (
      <>
        <EmptyDataPrompt pageName="Payroll Processing" onUpload={() => setShowUploadModal(true)} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header card */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        borderRadius: 'var(--radius-lg)', padding: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>November 2025 Payroll</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>{employeesList.length} employees • UNIT-2 • Payroll AI</p>
          {status === 'done' && <p style={{ color: '#4ade80', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Payroll processed successfully</p>}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {status === 'done' && (
            <>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                <Mail size={13} /> Email All
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                <Download size={13} /> Export CSV
              </button>
            </>
          )}
          <button
            onClick={runPayroll}
            disabled={status === 'processing'}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px',
              borderRadius: '8px', border: 'none',
              background: status === 'done' ? '#059669' : '#2563eb',
              color: 'white', fontSize: '13px', fontWeight: 600, cursor: status === 'processing' ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}>
            {status === 'processing' ? (
              <><Clock size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
            ) : status === 'done' ? (
              <><CheckCircle size={14} /> Rerun Payroll</>
            ) : (
              <><Play size={14} /> Run Payroll</>
            )}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'Employees Processed', value: summary.count, icon: Users, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Total Gross', value: formatCurrency(summary.totalGross), icon: TrendingUp, color: '#059669', bg: '#f0fdf4' },
            { label: 'Total Net Pay', value: formatCurrency(summary.totalNet), icon: DollarSign, color: '#4f46e5', bg: '#eef2ff' },
            { label: 'PF + ESI (ER)', value: formatCurrency(summary.totalPF + summary.totalESI), icon: CheckCircle, color: '#0891b2', bg: '#f0f9ff' },
          ].map(card => (
            <div key={card.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon size={15} color={card.color} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{card.label}</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Payroll table */}
      {status !== 'idle' && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--card-border)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {status === 'processing' ? '⟳ Processing payroll...' : `Payroll Details — ${entries.length} employees`}
            </h3>
          </div>
          {status === 'done' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Employee', 'Paid Days', 'Base Salary', 'Extra Pay', 'Total Earning', 'EE PF', 'ESI', 'PT', 'Deductions', 'Net Pay', 'Status'].map((h, idx) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: idx === 0 ? 'left' : 'right', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => {
                    const emp = employeesList.find(e => e.empCode === entry.empCode);
                    const att = attMap[entry.empCode];
                    return (
                      <tr key={entry.empCode} style={{ borderBottom: '1px solid var(--card-border)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '10px 12px', minWidth: '160px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `hsl(${(emp?.id ?? 0) * 43 % 360}, 60%, 92%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: `hsl(${(emp?.id ?? 0) * 43 % 360}, 50%, 35%)`, flexShrink: 0 }}>
                              {initials(emp?.name ?? '')}
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{emp?.name}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{entry.empCode}</div>
                            </div>
                          </div>
                        </td>
                        {[att?.paidDays ?? 0, entry.salary, entry.extraPay + entry.binCardAmount, entry.totalEarning, entry.eePf, entry.esiEe, entry.pt, entry.otherDeduction + entry.mediclaimDeduction + entry.shoesUniform].map((v, i) => (
                          <td key={i} style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {i === 0 ? v : `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                          </td>
                        ))}
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: entry.netPay >= 0 ? '#059669' : '#dc2626', whiteSpace: 'nowrap' }}>
                          {formatCurrency(entry.netPay)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: '#f0fdf4', color: '#059669' }}>Processed</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {status === 'idle' && (
        <div style={{ background: 'var(--card-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center' }}>
          <Play size={32} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>Ready to process payroll</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Click &ldquo;Run Payroll&rdquo; to calculate salaries for all {employeesList.length} employees</p>
        </div>
      )}
    </div>
  );
}
