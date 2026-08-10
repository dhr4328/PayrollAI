'use client';
// src/components/UploadBanner.tsx
import { useState } from 'react';
import { CheckCircle2, X, Upload } from 'lucide-react';

interface UploadBannerProps {
  rowCount: number;
  filename?: string;
  onReUpload?: () => void;
}

export default function UploadBanner({ rowCount, filename, onReUpload }: UploadBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px',
      background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      border: '1px solid #bbf7d0',
      borderRadius: '10px',
      marginBottom: '16px',
      gap: 12,
      animation: 'slideDown 0.3s ease',
    }}>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: '#bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle2 size={15} color="#059669" />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#14532d' }}>
            Data loaded successfully — {rowCount} employee records
          </div>
          {filename && (
            <div style={{ fontSize: '11px', color: '#16a34a', marginTop: 1 }}>
              From: <strong>{filename}</strong>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onReUpload && (
          <button
            onClick={onReUpload}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6,
              border: '1px solid #86efac', background: 'white',
              color: '#16a34a', fontSize: '11px', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Upload size={11} /> Replace file
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#16a34a', padding: 4 }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
