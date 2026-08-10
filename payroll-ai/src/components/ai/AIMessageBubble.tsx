'use client';
// src/components/ai/AIMessageBubble.tsx
import { Bot, User, CheckCircle, Loader2, Wrench } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AIMessage } from '@/lib/ai/aiEngine';

interface Props {
  message: AIMessage;
}

export function AIMessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isThinkingOnly = message.isStreaming && !message.content && message.toolCall;

  return (
    <div className="fade-in" style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: '8px',
      alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <div style={{
        width: '28px', height: '28px', borderRadius: isUser ? '8px' : '8px',
        flexShrink: 0,
        background: isUser
          ? 'linear-gradient(135deg, #0f172a, #1e293b)'
          : 'linear-gradient(135deg, #2563eb, #4f46e5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser ? <User size={14} color="white" /> : <Bot size={14} color="white" />}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Tool call card */}
        {message.toolCall && (
          <div style={{
            padding: '8px 12px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            fontSize: '11px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
              <Wrench size={11} color="#0284c7" />
              <span style={{ color: '#0284c7', fontWeight: 600 }}>Tool call: {message.toolCall.name}()</span>
              {message.toolResult
                ? <CheckCircle size={11} color="#16a34a" />
                : <Loader2 size={11} color="#0284c7" style={{ animation: 'spin 1s linear infinite' }} />
              }
            </div>
            {message.toolResult && (
              <div style={{ color: '#0369a1', marginTop: '2px' }}>{message.toolResult.summary}</div>
            )}
          </div>
        )}

        {/* Typing indicator */}
        {isThinkingOnly && !message.content && (
          <div style={{
            padding: '10px 14px', background: '#f1f5f9', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
            <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
            <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
          </div>
        )}

        {/* Message bubble */}
        {message.content && (
          <div style={{
            padding: '10px 14px',
            background: isUser ? '#0f172a' : '#f8fafc',
            border: isUser ? 'none' : '1px solid var(--card-border)',
            borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
            fontSize: '13px',
            color: isUser ? 'white' : 'var(--text-primary)',
            lineHeight: 1.6,
          }}>
            {isUser ? (
              <span>{message.content}</span>
            ) : (
              <div className="ai-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div style={{ overflowX: 'auto', margin: '8px 0' }}>
                        <table style={{
                          borderCollapse: 'collapse', width: '100%',
                          fontSize: '12px', border: '1px solid var(--border)',
                          borderRadius: '6px', overflow: 'hidden',
                        }}>{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th style={{
                        padding: '6px 10px', background: '#f1f5f9',
                        borderBottom: '1px solid var(--border)',
                        textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}>{children}</th>
                    ),
                    td: ({ children }) => (
                      <td style={{
                        padding: '6px 10px', borderBottom: '1px solid #f1f5f9',
                        color: 'var(--text-primary)',
                      }}>{children}</td>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote style={{
                        borderLeft: '3px solid #2563eb', paddingLeft: '10px',
                        margin: '8px 0', color: '#1d4ed8', fontWeight: 600,
                      }}>{children}</blockquote>
                    ),
                    code: ({ children }) => (
                      <code style={{
                        background: '#f1f5f9', padding: '1px 5px',
                        borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace',
                      }}>{children}</code>
                    ),
                    strong: ({ children }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{children}</strong>,
                    p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>{children}</ul>,
                    li: ({ children }) => <li style={{ marginBottom: '2px' }}>{children}</li>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span style={{
                    display: 'inline-block', width: '2px', height: '14px',
                    background: '#2563eb', borderRadius: '1px',
                    animation: 'blink 1s ease infinite', verticalAlign: 'middle', marginLeft: '2px',
                  }} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div style={{
          fontSize: '10px', color: 'var(--text-muted)',
          paddingLeft: isUser ? 0 : '2px',
          textAlign: isUser ? 'right' : 'left',
        }}>
          {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
