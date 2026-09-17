// src/app/settings/page.tsx
'use client';
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

  const companyFields = [
    { label: 'Company Name', value: 'Payroll AI' },
    { label: 'Address',      value: 'Plot No. 45, Tech Park Phase 2, Industrial Zone' },
    { label: 'City',         value: 'Mumbai' },
    { label: 'State',        value: 'Maharashtra' },
    { label: 'Pincode',      value: '400001' },
  ];

  const [contractor,   setContractor]   = useState(DEFAULT_CONTRACTOR);
  const [workLocation, setWorkLocation] = useState(DEFAULT_WORK_LOCATION);
  const [principalEmp, setPrincipalEmp] = useState(DEFAULT_PRINCIPAL_EMP);

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
    padding: '8px 11px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    color: 'var(--text-primary)',
    outline: 'none',
    background: 'white',
    transition: 'border-color 0.12s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: 5,
  };

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Company settings */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        {/* Section header */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Building2 size={14} color="var(--text-secondary)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Company settings
          </span>
        </div>

        <div style={{ padding: '20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
              marginBottom: 20,
            }}
          >
            {companyFields.map(f => (
              <div key={f.label} style={f.label === 'Address' ? { gridColumn: '1 / -1' } : {}}>
                <label style={labelStyle}>{f.label}</label>
                <input
                  defaultValue={f.value}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
              style={{
                padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
                background: 'var(--primary)', color: 'white',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary)')}
            >
              Save changes
            </button>
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px', color: 'var(--success)', fontWeight: 500 }}>
                <CheckCircle size={13} /> Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Register of Advances header */}
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
            padding: '12px 20px',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={14} color="var(--text-secondary)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Form XXII — Register of Advances header
            </span>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 16 }}>
            These details appear in the header of the official Form XXII PDF. Values are saved locally in your browser.
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Name and address of contractor</label>
            <textarea
              value={contractor}
              onChange={e => setContractor(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nature and location of work</label>
            <textarea
              value={workLocation}
              onChange={e => setWorkLocation(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Name and address of principal employer</label>
            <textarea
              value={principalEmp}
              onChange={e => setPrincipalEmp(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={saveAdvanceSettings}
              style={{
                padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
                background: 'var(--primary)', color: 'white',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary)')}
            >
              Save settings
            </button>
            <button
              onClick={() => {
                setContractor(DEFAULT_CONTRACTOR);
                setWorkLocation(DEFAULT_WORK_LOCATION);
                setPrincipalEmp(DEFAULT_PRINCIPAL_EMP);
              }}
              style={{
                padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'white',
                color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              Reset to default
            </button>
            {advSaved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px', color: 'var(--success)', fontWeight: 500 }}>
                <CheckCircle size={13} /> Saved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
