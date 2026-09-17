'use client';
// src/app/payroll/page.tsx
import { useMemo, useState, useEffect } from 'react';
import {
  Play, Download, Mail, CheckCircle, Loader2,
  DollarSign, TrendingUp, Users, ShieldCheck, AlertCircle
} from 'lucide-react';
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
            paymentMode: e.remarks || 'BANK',
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
            totalDays: e.total_days || 28,
          }));
          setAttendanceList(mappedAtt);
        }
      })
      .catch(err => { console.error('Payroll fetch error:', err); setIsLoaded(true); });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Clean white page header — replaced dark gradient */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              November 2025
            </h2>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: '11px',
                fontWeight: 600,
                background: status === 'done'
                  ? 'var(--success-light)'
                  : status === 'processing'
                  ? 'var(--info-light)'
                  : '#f3f4f6',
                color: status === 'done'
                  ? 'var(--success)'
                  : status === 'processing'
                  ? 'var(--info)'
                  : 'var(--text-secondary)',
                border: `1px solid ${status === 'done' ? 'var(--success-border)' : status === 'processing' ? 'var(--info-border)' : 'var(--border)'}`,
              }}
            >
              {status === 'done' ? 'Processed' : status === 'processing' ? 'Processing…' : 'Draft'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 3 }}>
            {employeesList.length} employees · UNIT-2 · Payroll AI
            {status === 'done' && (
              <span style={{ color: 'var(--success)', marginLeft: 10, fontWeight: 500 }}>
                · Calculation complete
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {status === 'done' && (
            <>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'white',
                  color: 'var(--text-secondary)', fontSize: '12px',
                  fontWeight: 500, cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >
                <Mail size={13} /> Email All
              </button>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'white',
                  color: 'var(--text-secondary)', fontSize: '12px',
                  fontWeight: 500, cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >
                <Download size={13} /> Export CSV
              </button>
            </>
          )}
          <button
            onClick={runPayroll}
            disabled={status === 'processing'}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 18px', borderRadius: 6, border: 'none',
              background: status === 'done' ? 'var(--success)' : 'var(--primary)',
              color: 'white', fontSize: '12px', fontWeight: 600,
              cursor: status === 'processing' ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              opacity: status === 'processing' ? 0.8 : 1,
            }}
          >
            {status === 'processing' ? (
              <><Loader2 size={13} className="spin" /> Processing…</>
            ) : status === 'done' ? (
              <><CheckCircle size={13} /> Rerun Payroll</>
            ) : (
              <><Play size={13} /> Run Payroll</>
            )}
          </button>
        </div>
      </div>

      {/* KPI summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Employees Processed', value: String(summary.count), icon: Users },
            { label: 'Total Gross', value: formatCurrency(summary.totalGross), icon: TrendingUp },
            { label: 'Total Net Pay', value: formatCurrency(summary.totalNet), icon: DollarSign },
            { label: 'Statutory (PF + ESI)', value: formatCurrency(summary.totalPF + summary.totalESI), icon: ShieldCheck },
          ].map(card => (
            <div
              key={card.label}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <card.icon size={13} color="var(--text-muted)" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {card.label}
                </span>
              </div>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Idle state — professional empty state */}
      {status === 'idle' && (
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius)',
            padding: '48px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#f3f4f6',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 4,
            }}
          >
            <Play size={18} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            No payroll has been run yet
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 360 }}>
            Click <strong>Run Payroll</strong> above to calculate salaries for all {employeesList.length} employees based on attendance and rate data.
          </div>
        </div>
      )}

      {/* Processing skeleton */}
      {status === 'processing' && (
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={14} color="var(--primary)" className="spin" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Calculating payroll…
            </span>
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: 12 }}>
              <div className="shimmer" style={{ width: 28, height: 28, borderRadius: 7 }} />
              <div className="shimmer" style={{ flex: 1, height: 14, borderRadius: 4 }} />
              <div className="shimmer" style={{ width: 80, height: 14, borderRadius: 4 }} />
              <div className="shimmer" style={{ width: 80, height: 14, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {/* Payroll results table */}
      {status === 'done' && entries.length > 0 && (
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Payroll details — {entries.length} employees
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle size={13} color="var(--success)" />
              <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 500 }}>
                All records processed
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--card-border)' }}>
                  {['Employee', 'Paid Days', 'Base Pay', 'Extra Pay', 'Gross', 'PF (EE)', 'ESI', 'PT', 'Other Ded.', 'Net Pay', 'Status'].map((h, idx) => (
                    <th
                      key={h}
                      style={{
                        padding: '9px 12px',
                        textAlign: idx === 0 ? 'left' : 'right',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => {
                  const emp = employeesList.find(e => e.empCode === entry.empCode);
                  const att = attMap[entry.empCode];
                  const avatarHue = ((emp?.id ?? 0) * 43) % 360;
                  return (
                    <tr
                      key={entry.empCode}
                      style={{ borderBottom: '1px solid var(--card-border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '9px 12px', minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                              background: `hsl(${avatarHue}, 45%, 93%)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '9px', fontWeight: 700,
                              color: `hsl(${avatarHue}, 40%, 35%)`,
                            }}
                          >
                            {initials(emp?.name ?? '')}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {emp?.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {entry.empCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      {[
                        att?.paidDays ?? 0,
                        entry.salary,
                        entry.extraPay + entry.binCardAmount,
                        entry.totalEarning,
                        entry.eePf,
                        entry.esiEe,
                        entry.pt,
                        entry.otherDeduction + entry.mediclaimDeduction + entry.shoesUniform,
                      ].map((v, i) => (
                        <td
                          key={i}
                          style={{
                            padding: '9px 12px', textAlign: 'right',
                            fontSize: '12px', color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {i === 0
                            ? v
                            : `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                          }
                        </td>
                      ))}
                      <td
                        style={{
                          padding: '9px 12px', textAlign: 'right',
                          fontSize: '12px', fontWeight: 700,
                          color: entry.netPay >= 0 ? 'var(--success)' : 'var(--danger)',
                          whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatCurrency(entry.netPay)}
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                        <span
                          style={{
                            padding: '2px 8px', borderRadius: 20,
                            fontSize: '10px', fontWeight: 600,
                            background: 'var(--success-light)',
                            color: 'var(--success)',
                            border: '1px solid var(--success-border)',
                          }}
                        >
                          Processed
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
