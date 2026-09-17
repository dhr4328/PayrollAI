'use client';
// src/app/compliance/page.tsx
export default function CompliancePage() {
  const items = [
    {
      label: 'Provident Fund (EE)',
      shortLabel: 'PF (Employee)',
      value: '12%',
      note: 'Capped at ₹1,800/month',
      status: 'Configured',
      category: 'PF',
    },
    {
      label: 'Provident Fund (ER)',
      shortLabel: 'PF (Employer)',
      value: '13%',
      note: 'Capped at ₹1,950/month',
      status: 'Configured',
      category: 'PF',
    },
    {
      label: 'Employee State Insurance (EE)',
      shortLabel: 'ESI (Employee)',
      value: '0.75%',
      note: 'Of gross wages',
      status: 'Configured',
      category: 'ESI',
    },
    {
      label: 'Employee State Insurance (ER)',
      shortLabel: 'ESI (Employer)',
      value: '3.25%',
      note: 'Of gross wages',
      status: 'Configured',
      category: 'ESI',
    },
    {
      label: 'Professional Tax',
      shortLabel: 'PT',
      value: '₹200',
      note: 'Applicable if salary > ₹12,000',
      status: 'Configured',
      category: 'PT',
    },
    {
      label: 'Labour Welfare Fund',
      shortLabel: 'LWF',
      value: '₹0',
      note: 'Not applicable in this state',
      status: 'Not applicable',
      category: 'LWF',
    },
  ];

  const statusStyle = (s: string): React.CSSProperties => {
    if (s === 'Configured') return {
      padding: '2px 8px', borderRadius: 20, fontSize: '11px', fontWeight: 500,
      background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success-border)',
    };
    if (s === 'Review Required') return {
      padding: '2px 8px', borderRadius: 20, fontSize: '11px', fontWeight: 500,
      background: 'var(--warning-light)', color: 'var(--warning)', border: '1px solid var(--warning-border)',
    };
    return {
      padding: '2px 8px', borderRadius: 20, fontSize: '11px', fontWeight: 500,
      background: '#f3f4f6', color: 'var(--text-muted)', border: '1px solid var(--border)',
    };
  };

  const categoryGroups = ['PF', 'ESI', 'PT', 'LWF'];

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Overview card */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
            Statutory Compliance — India
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Gujarat · FY 2025-26 · Last verified: 15 Sep 2026
          </div>
        </div>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: '12px',
            fontWeight: 600,
            background: 'var(--success-light)',
            color: 'var(--success)',
            border: '1px solid var(--success-border)',
          }}
        >
          All configured
        </span>
      </div>

      {/* Rates table */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '11px 16px',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Applicable Rates
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Read-only — contact admin to modify</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--card-border)' }}>
              {['Component', 'Category', 'Rate', 'Note', 'Status'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '9px 16px',
                    textAlign: i >= 2 && i !== 3 ? 'right' : 'left',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr
                key={item.label}
                style={{ borderBottom: '1px solid var(--card-border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {item.shortLabel}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.label}</div>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span
                    style={{
                      padding: '2px 7px',
                      borderRadius: 4,
                      fontSize: '11px',
                      fontWeight: 600,
                      background: '#f3f4f6',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {item.category}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {item.value}
                  </span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.note}</span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                  <span style={statusStyle(item.status)}>{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
