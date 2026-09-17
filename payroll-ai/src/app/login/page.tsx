'use client';
// src/app/login/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Bot, ShieldCheck, FileText, FileSpreadsheet,
  Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2
} from 'lucide-react';
import { createNewSession } from '@/lib/authSession';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('admin@payrollai.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    createNewSession(email);
    setTimeout(() => router.push('/dashboard'), 500);
  };

  const handleQuickLogin = () => {
    setIsLoading(true);
    createNewSession('admin@payrollai.com');
    setTimeout(() => router.push('/dashboard'), 600);
  };

  const features = [
    { icon: Bot,            label: 'AI Co-Pilot',           desc: 'Natural language commands for payroll and HR management.' },
    { icon: ShieldCheck,    label: 'Statutory engine',       desc: 'Automated PF (12%/13%), ESI (0.75%/3.25%), PT, and overtime.' },
    { icon: FileText,       label: 'PDF exports',            desc: 'Publication-ready payslips and Form XXII statutory registers.' },
    { icon: FileSpreadsheet, label: 'Smart column mapping', desc: 'Auto-detects Excel and CSV headers using fuzzy matching.' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Left — Company context */}
      <div
        style={{
          flex: '1.1',
          background: '#0f172a',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 52px',
          color: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Very subtle ambient blobs — reduced from original */}
        <div
          style={{
            position: 'absolute', top: '-20%', left: '-15%',
            width: 480, height: 480, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,78,216,0.14) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Brand */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 9,
                background: '#1d4ed8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Building2 size={20} color="white" strokeWidth={2} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
              PayrollAI
            </span>
          </div>

          <h1
            style={{
              fontSize: '28px', fontWeight: 700, lineHeight: 1.3,
              marginBottom: 14, color: '#f8fafc', letterSpacing: '-0.02em',
              maxWidth: 460,
            }}
          >
            Payroll and HR management for Indian enterprises.
          </h1>
          <p
            style={{
              color: '#64748b', fontSize: '14px', lineHeight: 1.65,
              maxWidth: 440, marginBottom: 40,
            }}
          >
            Manage employee records, attendance, statutory deductions, and payslip generation with an integrated AI assistant.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon size={14} color="#94a3b8" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer status */}
        <div
          style={{
            position: 'relative', zIndex: 2,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <CheckCircle2 size={14} color="#16a34a" />
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
            PayrollAI HR Portal · v1.0.0 · India Compliant
          </span>
        </div>
      </div>

      {/* Right — Login form */}
      <div
        style={{
          flex: '0.9',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          background: '#f5f7fa',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: 'white',
            padding: '32px',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
          }}
        >
          {/* Quick access */}
          <div
            style={{
              padding: '14px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', marginBottom: 6 }}>
              Quick access
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 10, lineHeight: 1.4 }}>
              Sign in instantly with full HR Admin access:
            </div>
            <button
              onClick={handleQuickLogin}
              disabled={isLoading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '9px 12px', borderRadius: 7,
                background: isLoading ? '#1d4ed8' : 'white',
                border: '1px solid #d1d5db',
                color: isLoading ? 'white' : '#111827',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.borderColor = '#1d4ed8'; e.currentTarget.style.background = '#eff6ff'; } }}
              onMouseLeave={e => { if (!isLoading) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'white'; } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isLoading ? 'rgba(255,255,255,0.2)' : '#eff6ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '9px', fontWeight: 800, color: isLoading ? 'white' : '#1d4ed8' }}>
                    HR
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: isLoading ? 'white' : '#111827' }}>
                    {isLoading ? 'Signing in…' : 'HR Admin'}
                  </div>
                  <div style={{ fontSize: '10px', color: isLoading ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>
                    admin@payrollai.com · Full access
                  </div>
                </div>
              </div>
              {!isLoading && <ArrowRight size={14} color="#1d4ed8" />}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              or sign in with email
            </span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Work email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} color="#9ca3af" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@payrollai.com"
                  style={{
                    width: '100%', padding: '9px 10px 9px 32px',
                    borderRadius: 7, background: 'white',
                    border: '1px solid #e5e7eb', color: '#111827',
                    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.12s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#1d4ed8')}
                  onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={13} color="#9ca3af" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%', padding: '9px 36px 9px 32px',
                    borderRadius: 7, background: 'white',
                    border: '1px solid #e5e7eb', color: '#111827',
                    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.12s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#1d4ed8')}
                  onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af',
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a
                href="#"
                onClick={e => { e.preventDefault(); alert('Use the quick access button above.'); }}
                style={{ fontSize: '12px', color: '#1d4ed8', textDecoration: 'none', fontWeight: 500 }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', padding: '10px',
                borderRadius: 7, border: 'none',
                background: '#1d4ed8', color: 'white',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.12s',
                opacity: isLoading ? 0.8 : 1,
              }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#1e40af'; }}
              onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#1d4ed8'; }}
            >
              {isLoading ? 'Signing in…' : <>Sign in <ArrowRight size={13} /></>}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>
            Enterprise SSL · PayrollAI © 2026
          </div>
        </div>
      </div>
    </div>
  );
}
