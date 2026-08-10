'use client';
// src/components/ai/AIPanel.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, Paperclip, Sparkles } from 'lucide-react';
import { AIMessage } from '@/lib/ai/aiEngine';
import { AIMessageBubble } from './AIMessageBubble';
import { getSessionId } from '@/lib/authSession';

const SUGGESTED = [
  '👋 Hi, how can you help me?',
  '📄 Show payslip for NUC0820',
  '📊 Attendance summary',
  '⏰ Show overtime report',
  '💼 Payroll summary',
  '📋 Form XXII Register of Advances',
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
      content: "👋 **Hello & Welcome!** I'm your **PayrollAI Assistant** 😊\n\nI'm your friendly co-pilot for employee master records, salary registers, attendance, statutory calculations (PF, ESI, PT), and automated PDF reports.\n\nHow can I help you today? Feel free to ask me any question or choose one of the suggestions below! ✨",
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
        .catch(err => console.error('Failed to fetch session history in AIPanel:', err));
    }
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setInput('');
    setIsProcessing(true);

    const userMsg: AIMessage = { id: newId(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    // Add thinking indicator
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
          const chunk = decoder.decode(value, { stream: !done });
          streamedText += chunk;
          setMessages(prev => prev.map(m => m.id === thinkingId
            ? { ...m, content: streamedText, isStreaming: true }
            : m
          ));
        }
      }
    } catch (err) {
      console.error(err);
      streamedText = "⚠️ Error communicating with the AI backend. Make sure it is running on http://localhost:8000";
    }

    // Finalize
    setMessages(prev => prev.map(m => m.id === thinkingId
      ? { ...m, content: streamedText, isStreaming: false }
      : m
    ));
    setIsProcessing(false);
  }, [isProcessing]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: '420px',
      background: 'var(--card-bg)',
      borderLeft: '1px solid var(--card-border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
    }}
      className="slide-in-right"
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'white',
        flexShrink: 0,
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Bot size={18} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>PayrollAI Assistant</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Online • Powered by AI</span>
          </div>
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px' }}>
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map(msg => <AIMessageBubble key={msg.id} message={msg} />)}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={11} /> Try asking
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {SUGGESTED.map(s => (
              <button key={s} onClick={() => sendMessage(s)} style={{
                padding: '5px 10px', borderRadius: '20px',
                border: '1px solid var(--border)', background: '#f8fafc',
                fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--card-border)',
        background: 'white',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: '8px',
          padding: '8px 12px',
          border: '1.5px solid var(--border)',
          borderRadius: '12px',
          background: '#f8fafc',
          transition: 'border-color 0.15s ease',
        }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', paddingBottom: '2px' }}>
            <Paperclip size={15} />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask anything about payroll, employees, attendance..."
            disabled={isProcessing}
            style={{
              flex: 1, border: 'none', background: 'none', outline: 'none',
              fontSize: '13px', color: 'var(--text-primary)', resize: 'none',
              lineHeight: 1.5, padding: '2px 0',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isProcessing}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: input.trim() && !isProcessing ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : '#e2e8f0',
              border: 'none', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease', flexShrink: 0,
            }}
          >
            <Send size={13} color={input.trim() && !isProcessing ? 'white' : '#94a3b8'} />
          </button>
        </div>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
          AI responses are based on your company&apos;s data only
        </p>
      </div>
    </div>
  );
}
