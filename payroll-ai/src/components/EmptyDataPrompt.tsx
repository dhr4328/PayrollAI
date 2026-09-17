'use client';
// src/components/EmptyDataPrompt.tsx
import { Upload, Database } from 'lucide-react';

interface EmptyDataPromptProps {
  pageName: string;
  onUpload: () => void;
}

export default function EmptyDataPrompt({ pageName, onUpload }: EmptyDataPromptProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        width: '100%',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          padding: '40px 36px',
          textAlign: 'center',
          maxWidth: 480,
          width: '100%',
        }}
      >
        <div
          style={{
            width: 48, height: 48,
            borderRadius: 10,
            background: '#f3f4f6',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Database size={22} color="var(--text-muted)" />
        </div>

        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}
        >
          No data loaded
        </h2>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: 24,
            lineHeight: 1.55,
          }}
        >
          {pageName} requires employee data to display records. Upload an Excel (.xlsx) or CSV file to get started.
        </p>

        <button
          onClick={onUpload}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 20px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.12s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary)')}
        >
          <Upload size={14} /> Upload file
        </button>

        <div
          style={{
            marginTop: 16,
            padding: '10px 12px',
            borderRadius: 6,
            background: '#f9fafb',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Supports any column layout. Headers like <em>Card No</em>, <em>Name</em>,{' '}
            <em>Per Day Rate</em>, <em>Present</em> are automatically recognized.
          </div>
        </div>
      </div>
    </div>
  );
}
