'use client';
// src/components/layout/Header.tsx
import { Bell, Bot, Search, Calendar, ChevronDown, Upload } from 'lucide-react';
import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/dashboard': 'AI Assistant Workspace',
  '/employees': 'Employee Management',
  '/payroll': 'Payroll Processing',
  '/payslips': 'Payslips',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
  '/compliance': 'Compliance',
};


interface HeaderProps {
  onAIToggle: () => void;
  aiOpen: boolean;
  onUploadClick: () => void;
}

export function Header({ onAIToggle, aiOpen, onUploadClick }: HeaderProps) {
  const pathname = usePathname();
  const title = titles[pathname] ?? 'PayrollAI';

  return (
    <header style={{
      height: '56px',
      background: 'var(--card-bg)',
      borderBottom: '1px solid var(--card-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '12px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 5,
    }}>
      {/* Title */}
      <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
        {title}
      </h1>

      {/* Upload File Button */}
      <button
        onClick={onUploadClick}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
          color: 'white', boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
        }}
      >
        <Upload size={13} />
        Upload File
      </button>

      {/* Period selector */}
      <button style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 10px', borderRadius: '7px',
        border: '1px solid var(--border)', background: 'white',
        cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500,
      }}>
        <Calendar size={13} />
        November 2025
        <ChevronDown size={12} />
      </button>

      {/* Notifications */}
      <button style={{
        position: 'relative', width: '34px', height: '34px', borderRadius: '8px',
        border: '1px solid var(--border)', background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        <Bell size={15} color="var(--text-secondary)" />
        <span style={{
          position: 'absolute', top: '6px', right: '6px',
          width: '7px', height: '7px', borderRadius: '50%',
          background: '#ef4444', border: '1.5px solid white',
        }} />
      </button>

      {/* AI toggle button */}
      <button
        onClick={onAIToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '7px 14px', borderRadius: '8px',
          background: aiOpen
            ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
            : 'linear-gradient(135deg, #eff6ff, #eef2ff)',
          border: `1px solid ${aiOpen ? 'transparent' : '#bfdbfe'}`,
          cursor: 'pointer', fontSize: '12px', fontWeight: 600,
          color: aiOpen ? 'white' : '#2563eb',
          transition: 'all 0.2s ease',
          boxShadow: aiOpen ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
        }}
      >
        <Bot size={14} />
        {aiOpen ? 'Close AI' : 'Ask AI'}
      </button>
    </header>
  );
}

