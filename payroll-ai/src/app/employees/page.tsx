'use client';
// src/app/employees/page.tsx
import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Filter, MoreHorizontal, Building, Calendar, Landmark, Upload, Database, FileSpreadsheet } from 'lucide-react';
import { employees as mockEmployees, categories as mockCategories, departments as mockDepartments } from '@/lib/data/employees';
import { formatDate, initials } from '@/lib/utils';
import { Employee } from '@/types/employee';
import { UploadMasterModal } from '@/components/employees/UploadMasterModal';

const catColors: Record<string, { bg: string; text: string }> = {
  Casual: { bg: '#fef3c7', text: '#92400e' },
  UP: { bg: '#ede9fe', text: '#5b21b6' },
  Borsad: { bg: '#d1fae5', text: '#065f46' },
};

function EmployeeRow({ emp }: { emp: Employee }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
            background: `hsl(${(emp.id * 43) % 360}, 60%, 92%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: `hsl(${(emp.id * 43) % 360}, 50%, 35%)`,
          }}>
            {initials(emp.name)}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.empCode}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{emp.department}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.floor}</div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{
          padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
          background: catColors[emp.category]?.bg ?? '#f1f5f9',
          color: catColors[emp.category]?.text ?? '#475569',
        }}>{emp.category}</span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        ₹{emp.perDayRate}/day
      </td>
      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        {formatDate(emp.doj)}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <Landmark size={12} /> {emp.bankName}
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <button style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '28px', height: '28px', borderRadius: '6px',
          border: '1px solid var(--border)', background: 'white', cursor: 'pointer',
        }}>
          <MoreHorizontal size={14} color="var(--text-secondary)" />
        </button>
      </td>
    </tr>
  );
}

import EmptyDataPrompt from '@/components/EmptyDataPrompt';

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Custom master Excel state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    uploaded: boolean;
    original_filename: string | null;
    upload_date: string | null;
    record_count: number;
  }>({
    uploaded: false,
    original_filename: null,
    upload_date: null,
    record_count: 0
  });

  const fetchUploadStatus = () => {
    fetch('http://localhost:8000/api/employees/upload-status')
      .then(res => res.json())
      .then(data => {
        if (data) setUploadStatus(data);
      })
      .catch(err => console.error("Error fetching upload status:", err));
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
            paymentMode: e.remarks || 'BANK'
          }));
          setEmployeesList(mapped);
          
          const cats = [...new Set(mapped.map((e: any) => e.category))].filter(Boolean).sort() as string[];
          const depts = [...new Set(mapped.map((e: any) => e.department))].filter(Boolean).sort() as string[];
          setCategoriesList(cats);
          setDepartmentsList(depts);
        }
      })
      .catch(err => {
        setIsLoaded(true);
        console.error("Error loading employees from backend:", err);
      });
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Upload Master Excel Status Banner */}
      {uploadStatus.uploaded && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--success-light)',
          border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius)',
          padding: '12px 18px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center' }}>
              <FileSpreadsheet size={18} />
            </div>
            <div style={{ fontSize: '13px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Using Custom Master Data:</span>{' '}
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{uploadStatus.original_filename}</span>{' '}
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>({uploadStatus.record_count} records)</span>
            </div>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              background: 'white',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Upload New File
          </button>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {[
          { label: 'Total', value: employeesList.length, icon: '👥' },
          { label: 'Casual', value: employeesList.filter(e => e.category === 'Casual').length, icon: '🟡' },
          { label: 'UP', value: employeesList.filter(e => e.category === 'UP').length, icon: '🟣' },
          { label: 'Borsad', value: employeesList.filter(e => e.category === 'Borsad').length, icon: '🟢' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius)', padding: '12px 20px', flex: 1,
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '20px' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: '#f8fafc' }}>
            <Search size={13} color="var(--text-muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code or department..." style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-primary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={12} color="var(--text-muted)" />
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: '7px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)', background: 'white', cursor: 'pointer' }}>
              <option>All</option>
              {categoriesList.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: '7px', padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)', background: 'white', cursor: 'pointer' }}>
              <option>All</option>
              {departmentsList.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <button 
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: 'white',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <Upload size={13} /> Import Excel
          </button>

          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
            borderRadius: '8px', background: '#2563eb', border: 'none',
            color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={13} /> Add Employee
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--card-border)' }}>
                {['Employee', 'Department / Floor', 'Category', 'Rate', 'Date of Joining', 'Bank', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => <EmployeeRow key={emp.empCode} emp={emp} />)}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Showing {filtered.length} of {employeesList.length} employees</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map(p => (
              <button key={p} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: p === 1 ? '#2563eb' : 'white', color: p === 1 ? 'white' : 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Master Modal */}
      <UploadMasterModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
