'use client';
// src/app/employees/page.tsx
import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Filter, MoreHorizontal, Landmark, Upload, Users, FileSpreadsheet } from 'lucide-react';
import { formatDate, initials } from '@/lib/utils';
import { Employee } from '@/types/employee';
import { UploadMasterModal } from '@/components/employees/UploadMasterModal';
import EmptyDataPrompt from '@/components/EmptyDataPrompt';

// Category badge styles — using neutral palette
const catStyle: Record<string, { bg: string; color: string; border: string }> = {
  Casual:  { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  UP:      { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  Borsad:  { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
};

function getAvatarColors(id: number) {
  const hues = [210, 160, 25, 0, 270, 200, 140, 340];
  const h = hues[id % hues.length];
  return {
    bg: `hsl(${h}, 45%, 93%)`,
    text: `hsl(${h}, 40%, 35%)`,
  };
}

function EmployeeRow({ emp }: { emp: Employee }) {
  const av = getAvatarColors(emp.id);
  return (
    <tr
      style={{ borderBottom: '1px solid var(--card-border)' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Employee */}
      <td style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: 7, flexShrink: 0,
              background: av.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: av.text,
            }}
          >
            {initials(emp.name)}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{emp.empCode}</div>
          </div>
        </div>
      </td>

      {/* Department */}
      <td style={{ padding: '10px 16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{emp.department}</div>
        {emp.floor && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.floor}</div>
        )}
      </td>

      {/* Category */}
      <td style={{ padding: '10px 16px' }}>
        {emp.category ? (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 5,
              fontSize: '11px',
              fontWeight: 500,
              background: catStyle[emp.category]?.bg ?? '#f3f4f6',
              color: catStyle[emp.category]?.color ?? '#4b5563',
              border: `1px solid ${catStyle[emp.category]?.border ?? '#e5e7eb'}`,
            }}
          >
            {emp.category}
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
        )}
      </td>

      {/* Rate */}
      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
          ₹{emp.perDayRate?.toLocaleString('en-IN') ?? '—'}<span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>/day</span>
        </span>
      </td>

      {/* DOJ */}
      <td style={{ padding: '10px 16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(emp.doj)}</span>
      </td>

      {/* Bank */}
      <td style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px', color: 'var(--text-secondary)' }}>
          <Landmark size={11} color="var(--text-muted)" />
          {emp.bankName || '—'}
        </div>
      </td>

      {/* Actions */}
      <td style={{ padding: '10px 16px' }}>
        <button
          style={{
            width: 26, height: 26, borderRadius: 5,
            border: '1px solid var(--border)',
            background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="More options"
        >
          <MoreHorizontal size={13} color="var(--text-muted)" />
        </button>
      </td>
    </tr>
  );
}

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    uploaded: boolean;
    original_filename: string | null;
    upload_date: string | null;
    record_count: number;
  }>({ uploaded: false, original_filename: null, upload_date: null, record_count: 0 });

  const fetchUploadStatus = () => {
    fetch('http://localhost:8000/api/employees/upload-status')
      .then(res => res.json())
      .then(data => { if (data) setUploadStatus(data); })
      .catch(() => {});
  };

  const fetchEmployees = () => {
    fetch('http://localhost:8000/api/employees')
      .then(res => res.json())
      .then(data => {
        setIsLoaded(true);
        if (Array.isArray(data)) {
          const mapped = data.map((e: any) => ({
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
          setEmployeesList(mapped);
          const cats = [...new Set(mapped.map((e: any) => e.category))].filter(Boolean).sort() as string[];
          const depts = [...new Set(mapped.map((e: any) => e.department))].filter(Boolean).sort() as string[];
          setCategoriesList(cats);
          setDepartmentsList(depts);
        }
      })
      .catch(() => setIsLoaded(true));
  };

  useEffect(() => {
    fetchEmployees();
    fetchUploadStatus();
  }, []);

  const handleUploadSuccess = () => {
    fetchEmployees();
    fetchUploadStatus();
  };

  const filtered = useMemo(() => {
    return employeesList.filter(emp => {
      const q = search.toLowerCase();
      const matchSearch = !q || emp.name.toLowerCase().includes(q) || emp.empCode.toLowerCase().includes(q) || emp.department.toLowerCase().includes(q);
      const matchCat = selectedCategory === 'All' || emp.category === selectedCategory;
      const matchDept = selectedDept === 'All' || emp.department === selectedDept;
      return matchSearch && matchCat && matchDept;
    });
  }, [search, selectedCategory, selectedDept, employeesList]);

  if (isLoaded && employeesList.length === 0) {
    return (
      <>
        <EmptyDataPrompt pageName="Employees" onUpload={() => setIsUploadModalOpen(true)} />
        {isUploadModalOpen && (
          <UploadMasterModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadSuccess={handleUploadSuccess}
          />
        )}
      </>
    );
  }

  const totalCount = employeesList.length;
  const categoryCounts = categoriesList.map(c => ({
    label: c,
    count: employeesList.filter(e => e.category === c).length,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Master file status banner */}
      {uploadStatus.uploaded && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--success-light)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius)',
            padding: '10px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={14} color="var(--success)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Using custom master data: <strong style={{ color: 'var(--text-primary)' }}>{uploadStatus.original_filename}</strong>
              {' '}<span style={{ color: 'var(--text-muted)' }}>({uploadStatus.record_count} records)</span>
            </span>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              padding: '4px 10px', borderRadius: 5,
              border: '1px solid var(--success)',
              color: 'var(--success)', background: 'white',
              fontSize: '11px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            Replace file
          </button>
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 10 }}>
        {/* Total */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 0,
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--primary-light)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={13} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
              {totalCount.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 1 }}>Total employees</div>
          </div>
        </div>

        {/* Per-category counts */}
        {categoryCounts.map(c => (
          <div
            key={c.label}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                {c.count}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 1 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Search */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 10px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: '#f9fafb',
              maxWidth: 340,
            }}
          >
            <Search size={13} color="var(--text-muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employees…"
              style={{
                flex: 1, border: 'none', background: 'none',
                outline: 'none', fontSize: '12px', color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={12} color="var(--text-muted)" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                border: '1px solid var(--border)', borderRadius: 6,
                padding: '5px 8px', fontSize: '12px',
                color: 'var(--text-secondary)', background: 'white', cursor: 'pointer',
              }}
            >
              <option>All</option>
              {categoriesList.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              style={{
                border: '1px solid var(--border)', borderRadius: 6,
                padding: '5px 8px', fontSize: '12px',
                color: 'var(--text-secondary)', background: 'white', cursor: 'pointer',
              }}
            >
              <option>All</option>
              {departmentsList.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ flex: 1 }} />

          {/* Actions */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 6,
              border: '1px solid var(--border)', background: 'white',
              color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            <Upload size={12} /> Import Excel
          </button>

          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 6,
              background: 'var(--primary)', border: 'none',
              color: 'white', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            <Plus size={12} /> Add Employee
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--card-border)' }}>
                {['Employee', 'Department', 'Category', 'Rate', 'Date of Joining', 'Bank', ''].map((h, i) => (
                  <th
                    key={h || i}
                    style={{
                      padding: '9px 16px',
                      textAlign: h === 'Rate' ? 'right' : 'left',
                      fontSize: '11px',
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
              {!isLoaded
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
                      {[1, 2, 3, 4, 5, 6, 7].map(j => (
                        <td key={j} style={{ padding: '12px 16px' }}>
                          <div className="shimmer" style={{ height: 14, borderRadius: 4, width: j === 1 ? 140 : 80 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map(emp => <EmployeeRow key={emp.empCode} emp={emp} />)
              }
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--card-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {employeesList.length} employees
          </span>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1, 2, 3].map(p => (
              <button
                key={p}
                style={{
                  width: 28, height: 28, borderRadius: 5,
                  border: '1px solid var(--border)',
                  background: p === 1 ? 'var(--primary)' : 'white',
                  color: p === 1 ? 'white' : 'var(--text-secondary)',
                  fontSize: '12px', cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upload modal */}
      <UploadMasterModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
