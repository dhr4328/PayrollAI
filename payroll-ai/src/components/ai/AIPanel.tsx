'use client';
// src/components/ai/AIPanel.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, MessageSquare, Paperclip } from 'lucide-react';
import { AIMessage } from '@/lib/ai/aiEngine';
import { AIMessageBubble } from './AIMessageBubble';
import { getSessionId } from '@/lib/authSession';

const SUGGESTED = [
  'Show payroll summary',
  'Show payslip for NUC0820',
  'Attendance summary',
  'Show overtime report',
  'Register of Advances',
];

let msgCounter = 0;
function newId() { return `msg-${++msgCounter}-${Date.now()}`; }

interface AIPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AIPanel({ open, onClose }: AIPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '**Payroll Copilot** is ready.\n\nAsk questions about payroll calculations, employee records, attendance data, deductions, and statutory compliance.',
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      const sessionId = getSessionId();
      fetch(`http://localhost:8000/api/ai/chat/history?session_id=${encodeURIComponent(sessionId)}`)
        .then(r => r.json())
        .then(d => {
          if (d && Array.isArray(d.messages) && d.messages.length > 0) {
            setMessages(d.messages.map((m: any) => ({
              id: m.id || newId(),
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            })));
          }
        })
        .catch(() => {});
    }
  }, [open]);

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
      const response = await fetch('http://localhost:8000/api/ai/chat', {
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
      streamedText = 'Unable to reach the AI backend. Please ensure the server is running on http://localhost:8000 and try again.';
    }

    setMessages(prev => prev.map(m =>
      m.id === thinkingId ? { ...m, content: streamedText, isStreaming: false } : m
    ));
    setIsProcessing(false);
  }, [isProcessing]);

  if (!open) return null;

  return (
    <div
      className="slide-in-right"
      style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: '420px',
        background: 'var(--card-bg)',
        borderLeft: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        boxShadow: '-2px 0 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--card-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'white',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MessageSquare size={14} color="var(--primary)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
            Payroll Copilot
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Ask about payroll, employees, or reports
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            border: 'none', background: 'none', cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1, overflowY: 'auto',
          padding: '16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        {messages.map(msg => (
          <AIMessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts — shown only on first load */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 16px 10px', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
            Suggested
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {SUGGESTED.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                style={{
                  padding: '4px 10px', borderRadius: 5,
                  border: '1px solid var(--border)', background: 'white',
                  fontSize: '11px', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: 500,
                  transition: 'background 0.1s, border-color 0.1s',
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
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--card-border)',
          background: 'white',
          flexShrink: 0,
        }}
      >
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          style={{ display: 'flex', alignItems: 'center', gap: 7 }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about payroll, employees…"
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '8px 11px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: '12px',
              color: 'var(--text-primary)',
              outline: 'none',
              background: '#f9fafb',
              transition: 'border-color 0.12s',
              fontFamily: 'inherit',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            style={{
              width: 34, height: 34, borderRadius: 6,
              border: 'none',
              background: input.trim() && !isProcessing ? 'var(--primary)' : '#e5e7eb',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed',
              transition: 'background 0.12s',
              flexShrink: 0,
            }}
          >
            <Send size={14} />
          </button>
        </form>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
          Responses are based on your company data only
        </p>
      </div>
    </div>
  );
}
