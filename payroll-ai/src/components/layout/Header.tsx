'use client';
// src/components/layout/Header.tsx
import { Bell, MessageSquare, Search, ChevronDown, Upload } from 'lucide-react';
import { usePathname } from 'next/navigation';

const titles: Record<string, { label: string; desc?: string }> = {
  '/dashboard':  { label: 'Copilot',    desc: 'Ask questions about payroll, employees, and reports' },
  '/employees':  { label: 'Employees',  desc: 'Manage your workforce directory' },
  '/payroll':    { label: 'Payroll',    desc: 'Process and review monthly payroll' },
  '/payslips':   { label: 'Payslips',   desc: 'View and download employee payslips' },
  '/reports':    { label: 'Reports',    desc: 'Analytics and statutory registers' },
  '/settings':   { label: 'Settings',   desc: 'Configure your organisation and preferences' },
  '/compliance': { label: 'Compliance', desc: 'Statutory rates and configuration' },
};

interface HeaderProps {
  onAIToggle: () => void;
  aiOpen: boolean;
  onUploadClick: () => void;
}

export function Header({ onAIToggle, aiOpen, onUploadClick }: HeaderProps) {
  const pathname = usePathname();
  const page = titles[pathname] ?? { label: 'PayrollAI' };

  return (
    <header
      style={{
        height: '52px',
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '10px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Page title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {page.label}
        </span>
        {page.desc && (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginLeft: '10px',
            }}
          >
            {page.desc}
          </span>
        )}
      </div>

      {/* Period pill */}
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 10px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: 'white',
          cursor: 'pointer',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}
      >
        November 2025
        <ChevronDown size={11} color="var(--text-muted)" />
      </button>

      {/* Upload File */}
      <button
        onClick={onUploadClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: 'white',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          transition: 'background 0.12s ease, border-color 0.12s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f9fafb';
          e.currentTarget.style.borderColor = 'var(--border-strong)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        <Upload size={13} />
        Upload
      </button>

      {/* Notifications */}
      <button
        style={{
          position: 'relative',
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.12s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
        title="Notifications"
      >
        <Bell size={14} color="var(--text-secondary)" />
        <span
          style={{
            position: 'absolute',
            top: '7px',
            right: '7px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--danger)',
            border: '1.5px solid white',
          }}
        />
      </button>

      {/* AI Copilot toggle */}
      <button
        onClick={onAIToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '6px',
          border: `1px solid ${aiOpen ? 'var(--primary)' : 'var(--border)'}`,
          background: aiOpen ? 'var(--primary-light)' : 'white',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          color: aiOpen ? 'var(--primary)' : 'var(--text-secondary)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!aiOpen) {
            e.currentTarget.style.background = '#f9fafb';
            e.currentTarget.style.borderColor = 'var(--border-strong)';
          }
        }}
        onMouseLeave={(e) => {
          if (!aiOpen) {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = 'var(--border)';
          }
        }}
      >
        <MessageSquare size={13} />
        {aiOpen ? 'Close Copilot' : 'Copilot'}
      </button>
    </header>
  );
}
