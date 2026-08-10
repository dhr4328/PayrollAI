// src/app/compliance/page.tsx
export default function CompliancePage() {
  const items = [
    { label: 'PF (EE) Rate', value: '12%', note: 'Capped at ₹1,800/month', color: '#2563eb' },
    { label: 'PF (ER) Rate', value: '13%', note: 'Capped at ₹1,950/month', color: '#4f46e5' },
    { label: 'ESI (EE) Rate', value: '0.75%', note: 'Of gross salary', color: '#0891b2' },
    { label: 'ESI (ER) Rate', value: '3.25%', note: 'Of gross salary', color: '#059669' },
    { label: 'Professional Tax', value: '₹200', note: 'If salary > ₹12,000', color: '#d97706' },
    { label: 'LWF', value: '₹0', note: 'Labour Welfare Fund', color: '#94a3b8' },
  ];
  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius)', padding: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>India Statutory Compliance</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Applicable rates for Gujarat — FY 2025-26</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {items.map(i => (
            <div key={i.label} style={{ padding: '14px 16px', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${i.color}` }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: i.color }}>{i.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{i.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{i.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
