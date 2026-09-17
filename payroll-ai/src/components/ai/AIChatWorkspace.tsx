'use client';
// src/components/ai/AIChatWorkspace.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Paperclip, HardDriveUpload, Trash2, RefreshCw,
  FileSpreadsheet, MessageSquare, X, ChevronDown
} from 'lucide-react';
import { AIMessage } from '@/lib/ai/aiEngine';
import { AIMessageBubble } from './AIMessageBubble';
import { getSessionId, clearSessionChat } from '@/lib/authSession';

const API = 'http://localhost:8000';

const QUICK_ACTIONS = [
  { label: 'Payroll summary',    prompt: 'Show payroll summary' },
  { label: 'Attendance summary', prompt: 'Show attendance summary' },
  { label: 'Overtime report',    prompt: 'Show overtime report' },
  { label: 'Register of Advances', prompt: 'Register of advances' },
  { label: 'Show payslip',       prompt: 'Show payslip for NUC0820' },
  { label: 'Statutory rules',    prompt: 'Statutory rules' },
];

let msgCounter = 0;
function newId() { return `msg-${++msgCounter}-${Date.now()}`; }

const WELCOME_MSG: AIMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `**Payroll Copilot** is ready.\n\nYou can ask questions about payroll calculations, employee records, attendance data, deductions, and statutory compliance.\n\nTo get started, upload your employee Excel or CSV file using the attachment button below, or ask a question directly if data is already loaded.`,
  timestamp: new Date(),
};

export default function AIChatWorkspace() {
  const [uploadStatus, setUploadStatus] = useState<{
    checked: boolean;
    hasData: boolean;
    rowCount: number;
    uploadedFile: string | null;
  }>({ checked: false, hasData: false, rowCount: 0, uploadedFile: null });

  const [messages, setMessages] = useState<AIMessage[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load session chat history
  useEffect(() => {
    const sessionId = getSessionId();
    fetch(`${API}/api/ai/chat/history?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.messages) && d.messages.length > 0) {
          const loaded: AIMessage[] = d.messages.map((m: any) => ({
            id: m.id || newId(),
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }));
          setMessages(loaded);
        }
      })
      .catch(() => {});
  }, []);

  const checkStatus = useCallback(() => {
    fetch(`${API}/api/upload/status`)
      .then(r => r.json())
      .then(d => setUploadStatus({ checked: true, hasData: d.hasData, rowCount: d.rowCount, uploadedFile: d.uploadedFile }))
      .catch(() => setUploadStatus({ checked: true, hasData: false, rowCount: 0, uploadedFile: null }));
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const uploadFileInChat = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      alert('Please upload an Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setIsUploadingFile(true);
    const userMsg: AIMessage = {
      id: newId(),
      role: 'user',
      content: `Uploading file: **${file.name}** (${(file.size / 1024).toFixed(1)} KB)`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    const thinkingId = newId();
    setMessages(prev => [...prev, {
      id: thinkingId, role: 'assistant',
      content: 'Processing file and detecting column structure…',
      isStreaming: true, timestamp: new Date(),
    }]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/api/upload/direct-import`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');

      const mappedList = (data.mappedColumns || []).map((m: string) => `- \`${m}\``).join('\n');
      const response = `**File imported successfully.**\n\n**${data.filename}** — ${data.rowCount} employee records loaded.\n\n**Columns mapped:**\n${mappedList || '- Auto-mapping applied'}\n\nYou can now ask questions about payroll, attendance, or request reports.`;

      setMessages(prev => prev.map(m =>
        m.id === thinkingId ? { ...m, content: response, isStreaming: false } : m
      ));
      checkStatus();
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? { ...m, content: `Upload failed: ${err.message || 'Could not process file.'}`, isStreaming: false }
          : m
      ));
    } finally {
      setIsUploadingFile(false);
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setInput('');
    setIsProcessing(true);

    const userMsg: AIMessage = { id: newId(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    const thinkingId = newId();
    setMessages(prev => [...prev, {
      id: thinkingId, role: 'assistant', content: '', isStreaming: true, timestamp: new Date(),
    }]);

    let streamedText = '';

    try {
      const response = await fetch(`${API}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: getSessionId() }),
      });

      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          streamedText += decoder.decode(value, { stream: !done });
          setMessages(prev => prev.map(m =>
            m.id === thinkingId ? { ...m, content: streamedText, isStreaming: true } : m
          ));
        }
      }
    } catch {
      streamedText = 'Unable to reach the AI backend. Please ensure the backend server is running on http://localhost:8000 and try again.';
    }

    setMessages(prev => prev.map(m =>
      m.id === thinkingId ? { ...m, content: streamedText, isStreaming: false } : m
    ));
    setIsProcessing(false);
    checkStatus();
  }, [isProcessing, checkStatus]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) uploadFileInChat(e.dataTransfer.files[0]);
  };

  const handleResetData = () => {
    if (!confirm('This will clear all loaded employee records. Continue?')) return;
    fetch(`${API}/api/upload/reset`, { method: 'POST' })
      .then(r => r.json())
      .then(() => {
        checkStatus();
        setMessages(prev => [...prev, {
          id: newId(), role: 'assistant',
          content: 'All employee records have been cleared. Upload a new file to begin.',
          timestamp: new Date(),
        }]);
      });
  };

  const handleClearChat = async () => {
    if (!confirm('Clear the current chat session?')) return;
    const ok = await clearSessionChat();
    if (ok) setMessages([WELCOME_MSG]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 92px)', gap: 12 }}>

      {/* Workspace header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MessageSquare size={15} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Payroll Copilot
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 1 }}>
              {uploadStatus.hasData ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                  <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                    {uploadStatus.uploadedFile || 'Data loaded'} — {uploadStatus.rowCount} records
                  </span>
                </span>
              ) : (
                <span style={{ color: 'var(--warning)' }}>No data loaded — upload a file to begin</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {uploadStatus.hasData && (
            <button
              onClick={handleResetData}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 6,
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                border: '1px solid var(--danger-border)',
                fontSize: '11px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              <RefreshCw size={11} />
              Reset data
            </button>
          )}
          <button
            onClick={handleClearChat}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 6,
              background: 'white', color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              fontSize: '11px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            <Trash2 size={11} />
            Clear chat
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 50,
              background: 'rgba(29, 78, 216, 0.06)',
              border: '2px dashed var(--primary)',
              borderRadius: 'var(--radius)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8,
            }}
          >
            <HardDriveUpload size={36} color="var(--primary)" />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
              Drop Excel or CSV file to import
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Columns will be auto-detected
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {messages.map(msg => (
            <AIMessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions bar */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--card-border)',
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
            Quick:
          </span>
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.label}
              onClick={() => sendMessage(a.prompt)}
              disabled={isProcessing || isUploadingFile}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                border: '1px solid var(--border)',
                background: 'white',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background 0.1s ease, border-color 0.1s ease',
                opacity: isProcessing ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--primary-light)';
                e.currentTarget.style.borderColor = 'var(--primary-border)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div
          style={{
            padding: '12px 16px',
            background: 'white',
            borderTop: '1px solid var(--card-border)',
          }}
        >
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files?.length) uploadFileInChat(e.target.files[0]);
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile}
              title="Attach Excel or CSV file"
              style={{
                width: 36, height: 36, borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)',
                transition: 'background 0.1s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
            >
              <Paperclip size={15} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about payroll, employees, reports, or compliance…"
              disabled={isProcessing || isUploadingFile}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                background: '#f9fafb',
                transition: 'border-color 0.12s ease',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />

            <button
              type="submit"
              disabled={!input.trim() || isProcessing || isUploadingFile}
              style={{
                width: 36, height: 36, borderRadius: 6,
                border: 'none',
                background: input.trim() && !isProcessing ? 'var(--primary)' : 'var(--border)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                transition: 'background 0.12s ease',
                flexShrink: 0,
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
