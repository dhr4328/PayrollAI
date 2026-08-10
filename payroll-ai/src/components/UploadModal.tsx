'use client';
// src/components/UploadModal.tsx
import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle,
  ChevronDown, X, Loader2, ArrowRight, RefreshCw,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface ColumnMapping {
  source_col: string;
  mapped_field: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  score: number;
  alternatives: string[];
}

interface PreviewResponse {
  filename: string;
  totalRows: number;
  headers: string[];
  mapping: ColumnMapping[];
  sample: string[][];
}

interface UploadModalProps {
  onSuccess: (rowCount: number) => void;
  onClose?: () => void;
}

// ── All canonical field labels ─────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
  emp_code: 'Employee Code',
  category: 'Category',
  employee_name: 'Employee Name',
  unit: 'Unit',
  floor: 'Floor',
  department: 'Department',
  contractor: 'Contractor',
  doj: 'Date of Joining',
  bank_name: 'Bank Name',
  account_no: 'Account No.',
  ifsc: 'IFSC Code',
  uan: 'UAN No.',
  esic: 'ESIC No.',
  aadhar: 'Aadhar No.',
  salary_type: 'Salary Type',
  per_day_rate: 'Per Day Rate',
  fixed_pay: 'Fixed Pay',
  present: 'Days Present',
  hours_ded_hr: 'Hours Deducted (Hr)',
  extra_duty_hrs: 'Extra Duty Hours',
  absent: 'Days Absent',
  ph: 'Public Holidays',
  weekly_off: 'Weekly Off',
  per_piece: 'Per Piece',
  paid_days: 'Paid Days',
  total_days: 'Total Days',
  salary: 'Salary',
  hours_ded_amt: 'Hours Deducted (Amt)',
  extra_pay: 'Extra Pay',
  difference_amount: 'Difference Amount',
  bin_card_amount: 'Bin Card Amount',
  total_earning: 'Total Earning',
  other_deduction: 'Other Deduction (Advance)',
  mediclaim_deduction: 'Mediclaim Deduction',
  shoes_uniform: 'Shoes / Uniform',
  total_payable_salary: 'Total Payable Salary',
  ee_pf: 'EE PF',
  esi_ee: 'ESI (Employee)',
  pt: 'Professional Tax',
  er_pf: 'ER PF',
  esi_er: 'ESI (Employer)',
  net_pay: 'Net Pay',
  remarks: 'Remarks',
  lwf: 'LWF',
  '': '— Skip this column —',
};

const ALL_FIELDS = Object.keys(FIELD_LABELS).filter(f => f !== '');
const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH:   '#059669',
  MEDIUM: '#d97706',
  LOW:    '#dc2626',
  NONE:   '#6b7280',
};

const API = 'http://localhost:8000/api/upload';

// ── Component ──────────────────────────────────────────────────
export default function UploadModal({ onSuccess, onClose }: UploadModalProps) {
  const [stage, setStage] = useState<'drop' | 'loading' | 'mapping' | 'importing' | 'done' | 'error'>('drop');
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── File handling ──────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setErrorMsg('Please upload a .xlsx or .csv file.');
      setStage('error');
      return;
    }
    setUploadedFile(file);
    setStage('loading');
    setErrorMsg('');

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch(`${API}/preview`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed.' }));
        throw new Error(err.detail || 'Upload failed.');
      }
      const data: PreviewResponse = await res.json();
      setPreview(data);
      setMapping(data.mapping);
      setStage('mapping');
    } catch (e: any) {
      setErrorMsg(e.message || 'Could not analyse the file.');
      setStage('error');
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Confirm import ─────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!uploadedFile) return;
    setStage('importing');

    const form = new FormData();
    form.append('file', uploadedFile);
    form.append('mapping_json', JSON.stringify(mapping));

    try {
      const res = await fetch(`${API}/confirm`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Import failed.' }));
        throw new Error(err.detail || 'Import failed.');
      }
      const data = await res.json();
      setImportedCount(data.rowCount);
      setStage('done');
    } catch (e: any) {
      setErrorMsg(e.message || 'Import failed.');
      setStage('error');
    }
  };

  const updateMapping = (idx: number, field: string | null) => {
    setMapping(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], mapped_field: field || null };
      return next;
    });
  };

  // ── Styles ─────────────────────────────────────────────────────
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  };
  const modal: React.CSSProperties = {
    background: 'var(--card-bg, #fff)',
    border: '1px solid var(--card-border, #e5e7eb)',
    borderRadius: '16px',
    width: '100%', maxWidth: '780px',
    maxHeight: '90vh', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
  };

  // ══════════════════════════════════════════════════════════════
  // STAGE: DROP ZONE
  // ══════════════════════════════════════════════════════════════
  if (stage === 'drop') return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #111)' }}>Upload Payroll Data</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #6b7280)', marginTop: 2 }}>Upload your Excel or CSV payroll file to load all data</div>
          </div>
          {onClose && <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>}
        </div>
        <div style={{ padding: '32px 24px' }}>
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#2563eb' : '#d1d5db'}`,
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? '#eff6ff' : '#f9fafb',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Upload size={24} color="#2563eb" />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111', marginBottom: 6 }}>
              Drag & drop your file here
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 16 }}>
              Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, background: '#2563eb', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
              <Upload size={14} /> Browse File
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '12px', color: '#15803d', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <CheckCircle2 size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>Columns are <strong>auto-detected</strong> — any naming or column order is supported. You can review and fix the mapping before importing.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // STAGE: LOADING
  // ══════════════════════════════════════════════════════════════
  if (stage === 'loading') return (
    <div style={overlay}>
      <div style={{ ...modal, alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
        <Loader2 size={40} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: 16, fontSize: '15px', fontWeight: 600, color: '#111' }}>Analysing your file…</div>
        <div style={{ marginTop: 6, fontSize: '12px', color: '#6b7280' }}>Detecting column headers and mapping them to payroll fields</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // STAGE: COLUMN MAPPING CONFIRMATION
  // ══════════════════════════════════════════════════════════════
  if (stage === 'mapping' && preview) {
    const highCount = mapping.filter(m => m.confidence === 'HIGH').length;
    const warnCount = mapping.filter(m => m.confidence === 'MEDIUM' || m.confidence === 'LOW').length;
    const skipCount = mapping.filter(m => !m.mapped_field).length;

    return (
      <div style={overlay}>
        <div style={modal}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={16} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>Review Column Mapping</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{preview.filename} · {preview.totalRows} rows</div>
              </div>
            </div>
            {onClose && <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>}
          </div>

          {/* Stats */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', gap: 20, flexShrink: 0 }}>
            {[
              { label: 'Auto-matched', val: highCount, color: '#059669', bg: '#f0fdf4' },
              { label: 'Uncertain', val: warnCount, color: '#d97706', bg: '#fffbeb' },
              { label: 'Unmapped', val: skipCount, color: '#6b7280', bg: '#f3f4f6' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.val}</span>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Mapping table */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  {['Column in your file', 'Maps to payroll field', 'Confidence'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mapping.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#111', fontFamily: 'monospace' }}>{m.source_col}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                        <select
                          value={m.mapped_field || ''}
                          onChange={e => updateMapping(i, e.target.value || null)}
                          style={{
                            padding: '5px 28px 5px 10px',
                            borderRadius: 6,
                            border: `1px solid ${m.confidence === 'HIGH' ? '#d1fae5' : m.confidence === 'NONE' ? '#e5e7eb' : '#fde68a'}`,
                            background: m.confidence === 'HIGH' ? '#f0fdf4' : m.confidence === 'NONE' ? '#f9fafb' : '#fffbeb',
                            fontSize: '12px', color: '#111',
                            appearance: 'none', cursor: 'pointer',
                            minWidth: 200,
                          }}
                        >
                          <option value="">— Skip this column —</option>
                          {ALL_FIELDS.map(f => (
                            <option key={f} value={f}>{FIELD_LABELS[f] || f}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: '#6b7280' }} />
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: '10px', fontWeight: 700,
                        color: CONFIDENCE_COLORS[m.confidence],
                        background: m.confidence === 'HIGH' ? '#f0fdf4' : m.confidence === 'MEDIUM' ? '#fffbeb' : m.confidence === 'LOW' ? '#fef2f2' : '#f3f4f6',
                      }}>{m.confidence}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => setStage('drop')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', fontSize: '13px', cursor: 'pointer', color: '#374151' }}>
              <RefreshCw size={13} /> Choose different file
            </button>
            <button onClick={handleConfirm} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', border: 'none', borderRadius: 8, background: '#2563eb', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Import Data <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // STAGE: IMPORTING
  // ══════════════════════════════════════════════════════════════
  if (stage === 'importing') return (
    <div style={overlay}>
      <div style={{ ...modal, alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
        <Loader2 size={40} color="#059669" style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: 16, fontSize: '15px', fontWeight: 600, color: '#111' }}>Importing data…</div>
        <div style={{ marginTop: 6, fontSize: '12px', color: '#6b7280' }}>Writing records to the database. This may take a moment.</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // STAGE: DONE
  // ══════════════════════════════════════════════════════════════
  if (stage === 'done') return (
    <div style={overlay}>
      <div style={{ ...modal, alignItems: 'center', justifyContent: 'center', padding: '64px 32px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <CheckCircle2 size={32} color="#059669" />
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#111', marginBottom: 8 }}>Import Successful!</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 24 }}>
          <strong>{importedCount}</strong> employee records loaded successfully.
        </div>
        <button
          onClick={() => onSuccess(importedCount)}
          style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // STAGE: ERROR
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={overlay}>
      <div style={{ ...modal, alignItems: 'center', justifyContent: 'center', padding: '64px 32px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertCircle size={32} color="#dc2626" />
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: 8 }}>Upload Failed</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 24, maxWidth: 400 }}>{errorMsg}</div>
        <button
          onClick={() => { setStage('drop'); setErrorMsg(''); }}
          style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
