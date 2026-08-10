'use client';
// src/components/layout/Sidebar.tsx
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles, Users, CreditCard, FileText,
  BarChart3, Settings, Bot, Building2, LogOut, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutSession } from '@/lib/authSession';

const nav = [
  { href: '/dashboard', label: 'AI Workspace', icon: Sparkles },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/payroll', label: 'Payroll', icon: CreditCard },
  { href: '/payslips', label: 'Payslips', icon: FileText },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Mouse hover state: collapsed by default (64px width)
  const [collapsed, setCollapsed] = useState(true);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setCollapsed(false);
  };

  const handleMouseLeave = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    // Slight delay (350ms) before closing sidebar on mouse exit
    closeTimerRef.current = setTimeout(() => {
      setCollapsed(true);
    }, 350);
  };

  const handleLogout = async () => {
    await logoutSession((path) => router.push(path));
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Sidebar Container */}
      <div
        style={{
          width: collapsed ? '64px' : '228px',
          minWidth: collapsed ? '64px' : '228px',
          height: '100vh',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          boxShadow: collapsed ? 'none' : '4px 0 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Logo Header */}
        <div
          style={{
            padding: collapsed ? '20px 0' : '20px 16px',
            borderBottom: '1px solid var(--sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bot size={18} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '14px', letterSpacing: '-0.02em' }}>
                PayrollAI
              </div>
              <div style={{ color: 'var(--sidebar-text)', fontSize: '10px' }}>HR Management</div>
            </div>
          )}
        </div>

        {/* Company Badge */}
        {!collapsed && (
          <div
            style={{
              margin: '12px 12px 0',
              padding: '8px 10px',
              background: 'var(--sidebar-active-bg)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid var(--sidebar-border)',
              flexShrink: 0,
            }}
          >
            <Building2 size={14} color="#4f46e5" />
            <div>
              <div style={{ color: '#e2e8f0', fontSize: '11px', fontWeight: 600 }}>NEXUS GLOBAL PVT LTD</div>
              <div style={{ color: 'var(--sidebar-text)', fontSize: '10px' }}>UNIT-2 • Nov 2025</div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {!collapsed && (
            <div
              style={{
                color: 'var(--sidebar-text)',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '6px 8px 4px',
                marginTop: '4px',
              }}
            >
              Main Menu
            </div>
          )}
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: collapsed ? '9px' : '9px 10px',
                  borderRadius: '7px',
                  textDecoration: 'none',
                  color: active ? '#f1f5f9' : 'var(--sidebar-text)',
                  background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all 0.15s ease',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  position: 'relative',
                }}
                className={cn('sidebar-link', active && 'active')}
              >
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '18px',
                      background: '#2563eb',
                      borderRadius: '0 3px 3px 0',
                    }}
                  />
                )}
                <Icon size={16} color={active ? '#60a5fa' : 'var(--sidebar-text)'} strokeWidth={active ? 2 : 1.5} />
                {!collapsed && label}
              </Link>
            );
          })}

          {!collapsed && (
            <div
              style={{
                color: 'var(--sidebar-text)',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '10px 8px 4px',
                marginTop: '8px',
                borderTop: '1px solid var(--sidebar-border)',
              }}
            >
              System
            </div>
          )}
          {collapsed && <div style={{ height: '1px', background: 'var(--sidebar-border)', margin: '8px 0' }} />}

          <Link
            href="/settings"
            title={collapsed ? 'Settings' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '9px' : '9px 10px',
              borderRadius: '7px',
              textDecoration: 'none',
              color: 'var(--sidebar-text)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              fontSize: '13px',
            }}
          >
            <Settings size={16} strokeWidth={1.5} />
            {!collapsed && 'Settings'}
          </Link>
          <Link
            href="/compliance"
            title={collapsed ? 'Compliance' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '9px' : '9px 10px',
              borderRadius: '7px',
              textDecoration: 'none',
              color: 'var(--sidebar-text)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              fontSize: '13px',
            }}
          >
            <Shield size={16} strokeWidth={1.5} />
            {!collapsed && 'Compliance'}
          </Link>
        </nav>

        {/* User Account / Logout */}
        <div
          style={{
            padding: collapsed ? '12px 8px' : '12px',
            borderTop: '1px solid var(--sidebar-border)',
            flexShrink: 0,
          }}
        >
          {!collapsed ? (
            <div
              onClick={handleLogout}
              title="Sign out of active session"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                HR
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>HR Admin</div>
                <div style={{ color: 'var(--sidebar-text)', fontSize: '10px' }}>admin@payrollai.com</div>
              </div>
              <LogOut size={14} color="var(--sidebar-text)" />
            </div>
          ) : (
            <div
              onClick={handleLogout}
              title="Sign out of active session"
              style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', padding: '4px 0' }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                HR
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
