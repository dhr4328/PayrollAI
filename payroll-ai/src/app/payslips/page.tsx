'use client';
// src/app/payslips/page.tsx
import { useState, useRef, useMemo, useEffect } from 'react';
import { Search, Printer, Download, Building2, Archive, Loader2 } from 'lucide-react';
import { employees as mockEmployees, DEMO_COMPANY } from '@/lib/data/employees';
import { attendanceData as mockAttendanceData } from '@/lib/data/attendance';
import { calculatePayroll } from '@/lib/payroll/calculator';
import { Employee } from '@/types/employee';
import { AttendanceRecord } from '@/types/payroll';

function PayslipDocument({ emp, company, attendanceList }: { emp: Employee; company: typeof DEMO_COMPANY; attendanceList: AttendanceRecord[] }) {
  const att = useMemo(() => attendanceList.find(a => a.empCode === emp.empCode && a.month === 11 && a.year === 2025), [emp, attendanceList]);
  const payroll = useMemo(() => att ? calculatePayroll(emp, att) : null, [emp, att]);

  if (!att || !payroll) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance data for November 2025</div>;

  const cellStyle: React.CSSProperties = { padding: '4px 8px', fontSize: '11px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' };
  const labelStyle: React.CSSProperties = { ...cellStyle, color: '#374151', fontWeight: 600, whiteSpace: 'nowrap', width: '130px' };
  const valStyle: React.CSSProperties = { ...cellStyle, color: '#111827' };
  const amtLabelStyle: React.CSSProperties = { ...cellStyle, color: '#374151', fontWeight: 600 };
  const amtValStyle: React.CSSProperties = { ...cellStyle, color: '#111827', textAlign: 'right' };

  const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '4px', width: '560px', fontFamily: 'Arial, sans-serif', fontSize: '11px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#1e3a5f', color: 'white', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em' }}>{company.name}</div>
          <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>{company.address}, {company.city} - {company.pincode}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em' }}>PAY SLIP</div>
          <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>November 2025</div>
        </div>
      </div>

      {/* Employee info strip */}
      <div style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{emp.name}</div>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>Emp Code: {emp.empCode} &nbsp;|&nbsp; Category: {emp.category}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '10px', color: '#6b7280' }}>
          <div>Location: {emp.unit}</div>
          <div>Dept: {emp.department} | {emp.floor}</div>
        </div>
      </div>

      {/* 3-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
        {/* Left: Employee details */}
        <div style={{ borderRight: '1px solid #e5e7eb' }}>
          <div style={{ background: '#f3f4f6', padding: '5px 8px', fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Employee Details</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['P.F. No.', emp.uan],
                ['UAN Number', emp.uan],
                ['ESIC Number', emp.esicNo],
                ['Bank A/c No.', emp.accountNo],
                ['IFSC', emp.ifsc],
                ['Bank', emp.bankName],
                ['Present', `${att.present} days`],
                ['Extra Duty', `${att.extraDutyHrs} hrs`],
                ['Absent', `${att.absent} days`],
                ['Per Piece', att.perPiece],
                ['Paid Days', att.paidDays],
                ['Total Days', att.totalDays],
              ].map(([k, v]) => (
                <tr key={String(k)}>
                  <td style={labelStyle}>{k}:</td>
                  <td style={valStyle}>{v || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Middle: Earnings */}
        <div style={{ borderRight: '1px solid #e5e7eb' }}>
          <div style={{ background: '#f3f4f6', padding: '5px 8px', fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
            <span>Earnings</span>
            <span>Rate &nbsp; Amount</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Salary', fmt(emp.perDayRate), fmt(payroll.salary)],
                ['Hours Ded. AMT', '', fmt(payroll.hoursDedAmt)],
                ['Extra Pay', '', fmt(payroll.extraPay)],
                ['Diff. Amount', '', fmt(payroll.differenceAmount)],
                ['Bin Card Amt', '', fmt(payroll.binCardAmount)],
              ].map(([k, r, v]) => (
                <tr key={k}>
                  <td style={amtLabelStyle}>{k}</td>
                  <td style={{ ...amtValStyle, color: '#6b7280' }}>{r}</td>
                  <td style={amtValStyle}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '5px 8px', background: '#eff6ff', borderTop: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '11px', color: '#1d4ed8' }}>Total Earning</span>
            <span style={{ fontWeight: 700, fontSize: '11px', color: '#1d4ed8' }}>₹{fmt(payroll.totalEarning)}</span>
          </div>
        </div>

        {/* Right: Deductions */}
        <div>
          <div style={{ background: '#f3f4f6', padding: '5px 8px', fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
            <span>Deductions</span>
            <span>Amount</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['EE PF (12%)', fmt(payroll.eePf)],
                ['ESI (0.75%)', fmt(payroll.esiEe)],
                ['Prof. Tax', fmt(payroll.pt)],
                ['Other Deduction', fmt(payroll.otherDeduction)],
                ['Mediclaim', fmt(payroll.mediclaimDeduction)],
                ['Shoes + Uniform', fmt(payroll.shoesUniform)],
                ['LWF', fmt(payroll.lwf)],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={amtLabelStyle}>{k}</td>
                  <td style={amtValStyle}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '5px 8px', background: '#fef2f2', borderTop: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '11px', color: '#dc2626' }}>Total Deduction</span>
            <span style={{ fontWeight: 700, fontSize: '11px', color: '#dc2626' }}>₹{fmt(payroll.eePf + payroll.esiEe + payroll.pt + payroll.otherDeduction + payroll.mediclaimDeduction + payroll.shoesUniform + payroll.lwf)}</span>
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
        {[
          { label: 'Wages Earned', value: fmt(payroll.totalEarning), color: '#059669' },
          { label: 'Total Payable', value: fmt(payroll.totalPayableSalary), color: '#2563eb' },
          { label: 'Total Deduction', value: fmt(payroll.eePf + payroll.esiEe + payroll.pt + payroll.otherDeduction + payroll.mediclaimDeduction + payroll.shoesUniform), color: '#dc2626' },
          { label: 'Net Payable', value: fmt(payroll.netPay), color: '#1d4ed8' },
        ].map((s, i) => (
          <div key={s.label} style={{
            padding: '8px 10px', textAlign: 'center', fontWeight: 700,
            borderRight: i < 3 ? '1px solid #e5e7eb' : 'none',
            background: i === 3 ? '#eff6ff' : 'white',
          }}>
            <div style={{ fontSize: '13px', color: s.color }}>₹{s.value}</div>
            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: '#f9fafb' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '16px' }}>Employee Signature</div>
          <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '2px', width: '120px', fontSize: '9px', color: '#9ca3af', textAlign: 'center' }}>Signature</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{company.name}</div>
          <div style={{ fontSize: '9px', color: '#6b7280' }}>Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
}

import EmptyDataPrompt from '@/components/EmptyDataPrompt';
import UploadModal from '@/components/UploadModal';

export default function PayslipsPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

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
      .catch(err => console.error("Error fetching employees in payslips:", err));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employeesList.filter(e =>
      !q || e.name.toLowerCase().includes(q) || e.empCode.toLowerCase().includes(q)
    );
  }, [search, employeesList]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Payslip - ${selected?.name}</title></head><body style="margin:20px">`);
    w.document.write(printRef.current.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.print();
  };

  const handleDownloadPdf = async () => {
    if (!selected || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const response = await fetch(`http://localhost:8000/api/payslip/pdf/${selected.empCode}`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${selected.empCode}_Nov2025.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Failed to download PDF. Make sure the backend is running on http://localhost:8000');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadAllZip = async () => {
    if (downloadingZip) return;
    setDownloadingZip(true);
    try {
      const response = await fetch('http://localhost:8000/api/payslip/bulk-zip');
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Payslips_All_Nov2025.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP download failed:', err);
      alert('Failed to download ZIP. Make sure the backend is running on http://localhost:8000');
    } finally {
      setDownloadingZip(false);
    }
  };

  if (isLoaded && employeesList.length === 0) {
    return (
      <>
        <EmptyDataPrompt pageName="Payslips" onUpload={() => setShowUploadModal(true)} />
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
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', height: 'calc(100vh - 104px)' }}>
      {/* Employee selector */}
      <div style={{ width: '280px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px', borderBottom: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: '7px', background: '#f8fafc' }}>
            <Search size={13} color="var(--text-muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..." style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '12px', color: 'var(--text-primary)' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(emp => (
            <button key={emp.empCode} onClick={() => setSelected(emp)} style={{
              width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px',
              background: selected?.empCode === emp.empCode ? '#eff6ff' : 'transparent',
              border: 'none', borderBottom: '1px solid var(--card-border)',
              cursor: 'pointer', textAlign: 'left',
              borderLeft: selected?.empCode === emp.empCode ? '3px solid #2563eb' : '3px solid transparent',
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `hsl(${(emp.id * 43) % 360}, 60%, 92%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: `hsl(${(emp.id * 43) % 360}, 50%, 35%)`, flexShrink: 0 }}>
                {emp.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{emp.empCode} • {emp.department}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payslip viewer */}
      <div style={{ flex: 1, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selected ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{selected.name} — Nov 2025</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selected.empCode} • {selected.department}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDownloadAllZip}
                  disabled={downloadingZip}
                  title="Download all employee payslips as ZIP"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-secondary)', fontSize: '12px', cursor: downloadingZip ? 'not-allowed' : 'pointer', opacity: downloadingZip ? 0.7 : 1 }}>
                  {downloadingZip ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Archive size={13} />}
                  {downloadingZip ? 'Preparing...' : 'All (ZIP)'}
                </button>
                <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', border: '1px solid var(--border)', background: 'white', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
                  <Printer size={13} /> Print
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', border: 'none', background: '#2563eb', color: 'white', fontSize: '12px', fontWeight: 600, cursor: downloadingPdf ? 'not-allowed' : 'pointer', opacity: downloadingPdf ? 0.7 : 1 }}>
                  {downloadingPdf ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />}
                  {downloadingPdf ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', justifyContent: 'center', background: '#f1f5f9' }}>
              <div ref={printRef}>
                <PayslipDocument emp={selected} company={DEMO_COMPANY} attendanceList={attendanceList} />
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <Building2 size={40} color="#cbd5e1" />
            <div>
              <h3 style={{ textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>Select an employee</h3>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Choose from the left panel to view their payslip</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
