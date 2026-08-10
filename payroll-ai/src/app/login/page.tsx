'use client';
// src/app/login/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Bot, Sparkles, ShieldCheck, FileSpreadsheet, FileText,
  Mail, Lock, Eye, EyeOff, ArrowRight, Zap, CheckCircle2, UserCheck, KeyRound
} from 'lucide-react';
import { createNewSession } from '@/lib/authSession';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('admin@payrollai.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    createNewSession(email);
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  const handleQuickHRLogin = () => {
    setIsQuickLoggingIn(true);
    setEmail('admin@payrollai.com');
    setPassword('adminPass123!');
    setIsLoading(true);
    createNewSession('admin@payrollai.com');

    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* LEFT PARTITION — Company Branding, Info & Feature Showcase   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div style={{
        flex: '1.1',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        color: '#ffffff',
        overflow: 'hidden',
      }}>
        {/* Decorative ambient lighting blobs */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.22) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.2) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }} />

        {/* Top Branding Section */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
            }}>
              <Building2 size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                PAYROLL AI
              </div>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            color: '#c7d2fe',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '20px',
          }}>
            <Sparkles size={14} color="#818cf8" />
            AI-First Payroll & HR Management Platform
          </div>

          <h1 style={{
            fontSize: '34px',
            fontWeight: 800,
            lineHeight: 1.25,
            marginBottom: '16px',
            color: '#ffffff',
            letterSpacing: '-0.03em',
          }}>
            Intelligent Payroll Automation & Statutory Compliance.
          </h1>

          <p style={{
            color: '#94a3b8',
            fontSize: '14px',
            lineHeight: 1.65,
            maxWidth: '520px',
            marginBottom: '32px',
          }}>
            Welcome to **PayrollAI**. Effortlessly manage employee master records, attendance logs, statutory deductions (PF, ESI, PT), ReportLab PDF payslip generation, and Form XXII compliance with our hybrid AI Co-pilot assistant.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '14px',
          position: 'relative',
          zIndex: 2,
          marginBottom: '32px',
        }}>
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="#60a5fa" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>AI Co-Pilot Assistant</div>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.45 }}>
              Natural language chat commands for Whole-Company & employee updates.
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={16} color="#34d399" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Statutory Engine</div>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.45 }}>
              Real-time calculation of PF (12%/13%), ESI (0.75%/3.25%), PT, and Overtime.
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} color="#fbbf24" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>PDF & Form XXII Export</div>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.45 }}>
              Publication-ready PDF payslips, bulk ZIP downloads, and Form XXII reports.
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={16} color="#c084fc" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Smart Column Mapper</div>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.45 }}>
              Intelligent fuzzy matching (`difflib`) to auto-detect Excel/CSV headers.
            </div>
          </div>
        </div>

        {/* Bottom Status Card */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          padding: '12px 18px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} color="#10b981" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>Payroll AI HR Portal Active</span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>v1.0.0 • 100% Compliant</span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RIGHT PARTITION — Login Form & Single HR Quick Access Login   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div style={{
        flex: '0.9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 60px',
        background: 'var(--content-bg)',
        position: 'relative',
        overflowY: 'auto',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '430px',
          background: 'var(--card-bg)',
          padding: '36px 32px',
          borderRadius: '16px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        }}>

          {/* Welcome Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
              Welcome Back 👋
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.4 }}>
              Sign in to manage your **Payroll AI** workspace.
            </p>
          </div>

          {/* ⚡ SINGLE HR QUICK ACCESS LOGIN ACTION */}
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
            border: '1px solid #bfdbfe',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>
                <Zap size={15} color="#2563eb" />
                Quick Access Demo Login
              </div>
              <span style={{ fontSize: '10px', background: '#2563eb', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                1-Click Access
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px', lineHeight: 1.4 }}>
              Click below to sign in instantly with full HR Admin privileges:
            </div>

            {/* Single HR Admin Quick Action Card */}
            <button
              type="button"
              onClick={handleQuickHRLogin}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                background: isQuickLoggingIn ? '#2563eb' : '#ffffff',
                border: '1px solid #93c5fd',
                color: isQuickLoggingIn ? 'white' : '#0f172a',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '11px', fontWeight: 800, flexShrink: 0,
                }}>
                  HR
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: isQuickLoggingIn ? 'white' : '#0f172a' }}>
                    HR Admin Login
                  </div>
                  <div style={{ fontSize: '10px', color: isQuickLoggingIn ? '#dbeafe' : '#64748b' }}>
                    admin@payrollai.com • Full Access
                  </div>
                </div>
              </div>
              <ArrowRight size={15} color={isQuickLoggingIn ? 'white' : '#2563eb'} />
            </button>
          </div>

          {/* Form Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Or Sign In With Email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Standard Credentials Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email Field */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Work Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@payrollai.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 38px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={15} color="var(--text-secondary)" /> : <Eye size={15} color="var(--text-secondary)" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ borderRadius: '4px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                Remember me
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Use the 1-Click Quick Access button above to sign in as HR Admin.'); }} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                border: 'none',
                color: 'white',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease',
                marginTop: '4px',
              }}
            >
              {isLoading ? (
                <>⏳ Signing in to Payroll AI...</>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
            Enterprise SSL Encryption • Payroll AI © 2026
          </div>
        </div>
      </div>
    </div>
  );
}
