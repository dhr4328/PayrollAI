'use client';
// src/components/ai/AIChatWorkspace.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, Paperclip, Sparkles, FileSpreadsheet, Trash2, HardDriveUpload,
  Users, CheckCircle2, CreditCard, Clock, Layers, ArrowRight, RefreshCw, FileText, BarChart2
} from 'lucide-react';
import { AIMessage } from '@/lib/ai/aiEngine';
import { AIMessageBubble } from './AIMessageBubble';
import { formatCurrencyShort } from '@/lib/utils';
import { getSessionId, clearSessionChat } from '@/lib/authSession';

const API = 'http://localhost:8000';

const QUICK_PROMPTS = [
  { label: '⚙️ Company Settings', prompt: 'Update setting in chat' },
  { label: '💰 Update Rate for All', prompt: 'Update rate to 600 for all' },
  { label: '📄 Show Payslip', prompt: 'Show payslip for NUC0820' },
  { label: '📊 Attendance Summary', prompt: 'Show attendance summary' },
  { label: '⏰ Overtime Report', prompt: 'Show overtime report' },
  { label: '💼 Payroll Summary', prompt: 'Show payroll summary' },
  { label: '📋 Form XXII Advances', prompt: 'Register of advances' },
  { label: '📋 Overtime Register', prompt: 'Register of overtime' },
  { label: '⚙️ Statutory Rules', prompt: 'Statutory rules' },
];

let msgCounter = 0;
function newId() { return `msg-${++msgCounter}-${Date.now()}`; }

const WELCOME_MSG: AIMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "👋 **Hello & Welcome to PayrollAI!** 😊\n\nI'm your **AI Payroll Co-Pilot**. I handle employee master records, attendance logs, salary registers, statutory deductions (PF, ESI, PT), and report generation.\n\n📎 **You can upload your Excel (.xlsx) or CSV file directly in this chat box below!** Simply click the paperclip icon or drag-and-drop your spreadsheet into the input area.",
  timestamp: new Date(),
};

export default function AIChatWorkspace() {
  const [uploadStatus, setUploadStatus] = useState<{
    checked: boolean; hasData: boolean; rowCount: number; uploadedFile: string | null;
  }>({ checked: false, hasData: false, rowCount: 0, uploadedFile: null });

  const [messages, setMessages] = useState<AIMessage[]>([WELCOME_MSG]);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active session vector DB history on mount
  useEffect(() => {
    const sessionId = getSessionId();
    fetch(`${API}/api/ai/chat/history?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.messages) && d.messages.length > 0) {
          const loadedMsgs: AIMessage[] = d.messages.map((m: any) => ({
            id: m.id || newId(),
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }));
          setMessages(loadedMsgs);
        }
      })
      .catch(err => console.error('Failed to load session chat history:', err));
  }, []);

  // Check upload status
  const checkStatus = useCallback(() => {
    fetch(`${API}/api/upload/status`)
      .then(r => r.json())
      .then(d => setUploadStatus({ checked: true, hasData: d.hasData, rowCount: d.rowCount, uploadedFile: d.uploadedFile }))
      .catch(() => setUploadStatus({ checked: true, hasData: false, rowCount: 0, uploadedFile: null }));
  }, []);


  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle direct file upload in chat
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
      content: `📎 Uploading spreadsheet: **${file.name}** (${(file.size / 1024).toFixed(1)} KB)`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    const thinkingId = newId();
    setMessages(prev => [...prev, {
      id: thinkingId, role: 'assistant', content: '⏳ Processing and auto-detecting columns from uploaded file…', isStreaming: true, timestamp: new Date(),
    }]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/api/upload/direct-import`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');

      const mappedList = (data.mappedColumns || []).map((m: string) => `- \`${m}\``).join('\n');

      const responseMarkdown = `🎉 **File Upload & Import Complete!**\n\n` +
        `Successfully imported **${data.filename}** with **${data.rowCount} employee records**.\n\n` +
        `### ⚡ Auto-Mapped Columns:\n${mappedList || '- Smart column mapping applied'}\n\n` +
        `---\n\n` +
        `### 🚀 What would you like to do now?\n` +
        `- 📄 *\"Show payslip for NUC0820\"*\n` +
        `- ✏️ *\"Update per day rate for NUC0820 to 550\"*\n` +
        `- 📊 *\"Show attendance summary\"*\n` +
        `- ⏰ *\"Show overtime report\"*\n` +
        `- 📋 *\"Form XXII Register of Advances\"*\n` +
        `- 📦 *\"Download all payslips\"*`;

      setMessages(prev => prev.map(m => m.id === thinkingId
        ? { ...m, content: responseMarkdown, isStreaming: false }
        : m
      ));

      checkStatus();
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === thinkingId
        ? { ...m, content: `❌ **Upload Error:** ${err.message || 'Could not process spreadsheet.'}`, isStreaming: false }
        : m
      ));
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Send message
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
          const chunk = decoder.decode(value, { stream: !done });
          streamedText += chunk;
          setMessages(prev => prev.map(m => m.id === thinkingId
            ? { ...m, content: streamedText, isStreaming: true }
            : m
          ));
        }
      }
    } catch (err) {
      streamedText = "⚠️ Error communicating with the AI backend. Make sure it is running on http://localhost:8000";
    }

    setMessages(prev => prev.map(m => m.id === thinkingId
      ? { ...m, content: streamedText, isStreaming: false }
      : m
    ));
    setIsProcessing(false);
    checkStatus();
  }, [isProcessing, checkStatus]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFileInChat(e.dataTransfer.files[0]);
    }
  };

  const handleResetData = () => {
    if (!confirm('Are you sure you want to clear all loaded data?')) return;
    fetch(`${API}/api/upload/reset`, { method: 'POST' })
      .then(r => r.json())
      .then(() => {
        checkStatus();
        setMessages(prev => [...prev, {
          id: newId(),
          role: 'assistant',
          content: '🗑️ **Database reset successfully!** All employee records have been cleared. Upload a new Excel or CSV file in the chat below to begin.',
          timestamp: new Date(),
        }]);
      });
  };

  const handleClearChatHistory = async () => {
    if (!confirm('Are you sure you want to clear your active session chat history?')) return;
    const ok = await clearSessionChat();
    if (ok) {
      setMessages([WELCOME_MSG]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)', gap: 14 }}>
      {/* Top AI Workspace Header Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        padding: '14px 20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              PayrollAI Assistant Workspace
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {uploadStatus.hasData ? (
                <>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600 }}>
                    <FileSpreadsheet size={13} /> Loaded: {uploadStatus.uploadedFile || 'Master File'}
                  </span>
                  <span>•</span>
                  <span><strong>{uploadStatus.rowCount}</strong> Records Active</span>
                </>
              ) : (
                <span style={{ color: '#d97706', fontWeight: 600 }}>
                  ⚠️ No File Loaded — Attach your Excel/CSV file below
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleClearChatHistory}
            title="Clear active session chat history"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 8,
              background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Trash2 size={13} /> Clear Chat
          </button>
          {uploadStatus.hasData && (
            <button
              onClick={handleResetData}
              title="Clear loaded database"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 8,
                background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} /> Reset Data
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Stream & Workspace Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: '16px', overflow: 'hidden', position: 'relative',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Drag Overlay indicator */}
        {isDragging && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: 'rgba(37, 99, 235, 0.92)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', gap: 14, backdropFilter: 'blur(4px)',
          }}>
            <HardDriveUpload size={54} />
            <div style={{ fontSize: '20px', fontWeight: 800 }}>Drop Excel or CSV File to Import</div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>File will be auto-mapped & loaded into PayrollAI immediately</div>
          </div>
        )}

        {/* Message Trajectory */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map(msg => (
            <AIMessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Pills */}
        <div style={{
          padding: '10px 16px', borderTop: '1px solid var(--card-border)', background: '#f8fafc',
          display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', flexShrink: 0 }}>
            Quick Actions:
          </span>
          {QUICK_PROMPTS.map(p => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.prompt)}
              disabled={isProcessing || isUploadingFile}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 12px', borderRadius: '20px',
                background: 'white', border: '1px solid #cbd5e1',
                fontSize: '12px', color: '#334155', fontWeight: 600,
                cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chat Input & File Attachment Dropzone */}
        <div style={{ padding: '14px 16px', background: 'white', borderTop: '1px solid var(--card-border)' }}>
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  uploadFileInChat(e.target.files[0]);
                }
              }}
            />

            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach Excel / CSV File"
              disabled={isUploadingFile}
              style={{
                width: 42, height: 42, borderRadius: 12,
                border: '1px solid #cbd5e1', background: '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#2563eb', transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
            >
              <Paperclip size={19} />
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask AI anything or drag & drop Excel/CSV spreadsheet here..."
              disabled={isProcessing || isUploadingFile}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 12,
                border: '1px solid #cbd5e1', fontSize: '13.5px',
                color: 'var(--text-primary)', outline: 'none', background: '#f8fafc',
              }}
              onFocus={e => (e.target.style.borderColor = '#2563eb')}
              onBlur={e => (e.target.style.borderColor = '#cbd5e1')}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isProcessing || isUploadingFile}
              style={{
                width: 42, height: 42, borderRadius: 12,
                border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                opacity: input.trim() && !isProcessing ? 1 : 0.6,
                boxShadow: input.trim() ? '0 3px 10px rgba(37,99,235,0.3)' : 'none',
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
