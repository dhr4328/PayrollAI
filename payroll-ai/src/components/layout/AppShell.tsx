'use client';
// src/components/layout/AppShell.tsx
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIPanel } from '@/components/ai/AIPanel';
import UploadModal from '@/components/UploadModal';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
    window.location.reload();
  };

  if (pathname === '/login') {
    return (
      <main style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        {children}
      </main>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--content-bg)',
      }}
    >
      <Sidebar />

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'margin-right 0.22s ease',
          marginRight: aiPanelOpen ? '420px' : '0',
        }}
      >
        <Header
          onAIToggle={() => setAiPanelOpen(!aiPanelOpen)}
          aiOpen={aiPanelOpen}
          onUploadClick={() => setUploadModalOpen(true)}
        />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
          }}
        >
          {children}
        </main>
      </div>

      {/* AI Side Panel */}
      <AIPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />

      {/* Global Upload Modal */}
      {uploadModalOpen && (
        <UploadModal
          onSuccess={handleUploadSuccess}
          onClose={() => setUploadModalOpen(false)}
        />
      )}
    </div>
  );
}
