'use client';
// src/components/layout/Sidebar.tsx
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users, CreditCard, FileText, BarChart3,
  Settings, MessageSquare, Shield, LogOut, Building2,
  Home
} from 'lucide-react';
import { logoutSession } from '@/lib/authSession';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Payroll',
    items: [
      { href: '/dashboard', label: 'Copilot', icon: MessageSquare },
      { href: '/payroll',   label: 'Payroll',  icon: CreditCard },
      { href: '/payslips',  label: 'Payslips', icon: FileText },
    ],
  },
  {
    label: 'Workforce',
    items: [
      { href: '/employees', label: 'Employees', icon: Users },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { href: '/compliance', label: 'Compliance', icon: Shield },
      { href: '/reports',    label: 'Reports',    icon: BarChart3 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(true);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setCollapsed(true), 300);
  };

  const handleLogout = async () => {
    await logoutSession((path) => router.push(path));
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', zIndex: 20, flexShrink: 0 }}
    >
      <div
        style={{
          width: collapsed ? '60px' : '224px',
          minWidth: collapsed ? '60px' : '224px',
          height: '100vh',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.24s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.24s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Logo / Brand */}
        <div
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '0 16px' : '0 16px',
            borderBottom: '1px solid var(--sidebar-border)',
            flexShrink: 0,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={15} color="white" strokeWidth={2} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                PayrollAI
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                HR Management
              </div>
            </div>
          )}
        </div>

        {/* Company badge */}
        {!collapsed && (
          <div
            style={{
              margin: '10px 10px 4px',
              padding: '8px 10px',
              background: '#f9fafb',
              borderRadius: '7px',
              border: '1px solid var(--sidebar-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '5px',
                background: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Home size={12} color="var(--primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                NEXUS GLOBAL PVT LTD
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>UNIT-2</div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: '8px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {navGroups.map((group, gi) => (
            <div key={group.label}>
              {/* Section label */}
              {!collapsed && (
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    padding: gi === 0 ? '8px 8px 4px' : '16px 8px 4px',
                    userSelect: 'none',
                  }}
                >
                  {group.label}
                </div>
              )}
              {collapsed && gi > 0 && (
                <div style={{ height: '1px', background: 'var(--sidebar-border)', margin: '6px 8px' }} />
              )}

              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: collapsed ? '9px 0' : '8px 10px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: active ? 'var(--text-primary)' : 'var(--sidebar-text)',
                      background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      transition: 'background 0.12s ease, color 0.12s ease',
                      fontSize: '13px',
                      fontWeight: active ? 600 : 400,
                      position: 'relative',
                      marginBottom: '1px',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {active && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '2.5px',
                          height: '16px',
                          background: 'var(--primary)',
                          borderRadius: '0 2px 2px 0',
                        }}
                      />
                    )}
                    <Icon
                      size={15}
                      color={active ? 'var(--primary)' : 'var(--sidebar-text)'}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    {!collapsed && (
                      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer: Settings + User */}
        <div
          style={{
            padding: '8px',
            borderTop: '1px solid var(--sidebar-border)',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
          }}
        >
          {/* Settings link */}
          <Link
            href="/settings"
            title={collapsed ? 'Settings' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: collapsed ? '9px 0' : '8px 10px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: isActive('/settings') ? 'var(--text-primary)' : 'var(--sidebar-text)',
              background: isActive('/settings') ? 'var(--sidebar-active-bg)' : 'transparent',
              justifyContent: collapsed ? 'center' : 'flex-start',
              fontSize: '13px',
              fontWeight: isActive('/settings') ? 600 : 400,
              position: 'relative',
              transition: 'background 0.12s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/settings')) e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
            }}
            onMouseLeave={(e) => {
              if (!isActive('/settings')) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Settings size={15} color={isActive('/settings') ? 'var(--primary)' : 'var(--sidebar-text)'} strokeWidth={1.8} />
            {!collapsed && <span>Settings</span>}
          </Link>

          {/* User / Logout */}
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: collapsed ? '9px 0' : '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              width: '100%',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'background 0.12s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-hover-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Avatar */}
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid #c7d2fe',
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--primary)' }}>HR</span>
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>HR Admin</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    admin@payrollai.com
                  </div>
                </div>
                <LogOut size={13} color="var(--sidebar-text)" strokeWidth={1.8} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
