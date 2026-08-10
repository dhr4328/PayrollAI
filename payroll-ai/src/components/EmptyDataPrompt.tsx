'use client';
// src/components/EmptyDataPrompt.tsx
import { Upload, FileSpreadsheet, HardDriveUpload } from 'lucide-react';

interface EmptyDataPromptProps {
  pageName: string;
  onUpload: () => void;
}

export default function EmptyDataPrompt({ pageName, onUpload }: EmptyDataPromptProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', width: '100%', padding: '24px'
    }}>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: '24px', padding: '48px 40px', textAlign: 'center',
        maxWidth: 540, width: '100%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: '#eff6ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
        }}>
          <HardDriveUpload size={34} color="#2563eb" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          No Data Loaded for {pageName}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
          Please upload your Excel (<strong>.xlsx</strong>) or CSV file to process and display records for {pageName}.
        </p>

        <button
          onClick={onUpload}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white', border: 'none', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            transition: 'transform 0.15s ease', width: '100%', justifyContent: 'center',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Upload size={16} /> Upload Excel / CSV File
        </button>

        <div style={{ marginTop: 20, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e5e7eb', textAlign: 'left' }}>
          <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.5 }}>
            ✨ Supports any column layout. Headers like <em>Card No</em>, <em>Name</em>, <em>Per Day Rate</em>, <em>Present</em>, etc. are automatically recognized.
          </div>
        </div>
      </div>
    </div>
  );
}
