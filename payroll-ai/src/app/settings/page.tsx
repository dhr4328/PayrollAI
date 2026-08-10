'use client';
// src/app/settings/page.tsx
import { useState, useEffect } from 'react';
import { CheckCircle, Building2, FileText } from 'lucide-react';

const LS_CONTRACTOR    = 'adv_contractor';
const LS_WORK_LOCATION = 'adv_work_location';
const LS_PRINCIPAL_EMP = 'adv_principal_employer';

const DEFAULT_CONTRACTOR    = 'Payroll AI Solutions, Plot 45, Tech Park Phase 2, Industrial Zone, Mumbai';
const DEFAULT_WORK_LOCATION = 'Block 4, Tech Park Phase 2, Industrial Zone, Navi Mumbai';
const DEFAULT_PRINCIPAL_EMP = 'Vanguard Industries Ltd.';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [advSaved, setAdvSaved] = useState(false);

  // Company fields (static for now)
  const companyFields = [
    { label: 'Company Name',  value: 'Payroll AI' },
    { label: 'Address',       value: 'Plot No. 45, Tech Park Phase 2, Industrial Zone' },
    { label: 'City',          value: 'Mumbai' },
    { label: 'State',         value: 'Maharashtra' },
    { label: 'Pincode',       value: '400001' },
  ];

  // Register of Advances header fields (localStorage-backed)
  const [contractor,   setContractor]   = useState(DEFAULT_CONTRACTOR);
  const [workLocation, setWorkLocation] = useState(DEFAULT_WORK_LOCATION);
  const [principalEmp, setPrincipalEmp] = useState(DEFAULT_PRINCIPAL_EMP);

  // Load from localStorage on mount
  useEffect(() => {
    const c = localStorage.getItem(LS_CONTRACTOR);
    const w = localStorage.getItem(LS_WORK_LOCATION);
    const p = localStorage.getItem(LS_PRINCIPAL_EMP);
    if (c) setContractor(c);
    if (w) setWorkLocation(w);
    if (p) setPrincipalEmp(p);
  }, []);

  const saveAdvanceSettings = () => {
    localStorage.setItem(LS_CONTRACTOR,    contractor);
    localStorage.setItem(LS_WORK_LOCATION, workLocation);
    localStorage.setItem(LS_PRINCIPAL_EMP, principalEmp);
    setAdvSaved(true);
    setTimeout(() => setAdvSaved(false), 2500);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    outline: 'none',
    background: 'white',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '5px',
  };

  const sectionHeadStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '18px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--card-border)',
  };

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Company Settings (existing) ── */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius)', padding: '24px',
      }}>
        <div style={sectionHeadStyle}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={15} color="#2563eb" />
          </div>
          Company Settings
        </div>

        {companyFields.map(f => (
          <div key={f.label} style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>{f.label}</label>
            <input
              defaultValue={f.value}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#2563eb')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
            style={{
              padding: '9px 20px', borderRadius: '8px', border: 'none',
              background: '#2563eb', color: 'white', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Save Changes
          </button>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#059669', fontWeight: 600 }}>
              <CheckCircle size={14} /> Saved successfully
            </span>
          )}
        </div>
      </div>

      {/* ── Register of Advances Header ── */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius)', padding: '24px',
      }}>
        <div style={sectionHeadStyle}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={15} color="#059669" />
          </div>
          Register of Advances — Form XXII Header
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px', marginTop: '-8px' }}>
          These details appear in the header of the official Form XXII (Register of Advances) PDF.
          They are saved locally in your browser.
        </p>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Name and Address of Contractor</label>
          <textarea
            value={contractor}
            onChange={e => setContractor(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            onFocus={e => (e.target.style.borderColor = '#059669')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Nature and Location of Work</label>
          <textarea
            value={workLocation}
            onChange={e => setWorkLocation(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            onFocus={e => (e.target.style.borderColor = '#059669')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Name and Address of Principal Employer</label>
          <textarea
            value={principalEmp}
            onChange={e => setPrincipalEmp(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            onFocus={e => (e.target.style.borderColor = '#059669')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={saveAdvanceSettings}
            style={{
              padding: '9px 20px', borderRadius: '8px', border: 'none',
              background: '#059669', color: 'white', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Save Register Settings
          </button>
          <button
            onClick={() => {
              setContractor(DEFAULT_CONTRACTOR);
              setWorkLocation(DEFAULT_WORK_LOCATION);
              setPrincipalEmp(DEFAULT_PRINCIPAL_EMP);
            }}
            style={{
              padding: '9px 16px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'white',
              color: 'var(--text-secondary)', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer',
            }}
          >
            Reset to Default
          </button>
          {advSaved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#059669', fontWeight: 600 }}>
              <CheckCircle size={14} /> Saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
