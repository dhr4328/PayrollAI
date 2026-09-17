'use client';
// src/components/ai/AIMessageBubble.tsx
import { MessageSquare, User, CheckCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AIMessage } from '@/lib/ai/aiEngine';

interface Props {
  message: AIMessage;
}

export function AIMessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const showTyping = message.isStreaming && !message.content;

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: '10px',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '6px',
          flexShrink: 0,
          background: isUser ? 'var(--primary)' : '#f3f4f6',
          border: isUser ? 'none' : '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '2px',
        }}
      >
        {isUser
          ? <User size={13} color="white" />
          : <MessageSquare size={13} color="var(--text-secondary)" />
        }
      </div>

      {/* Bubble + meta */}
      <div
        style={{
          maxWidth: '82%',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Tool call indicator */}
        {message.toolCall && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 8px',
              borderRadius: 5,
              background: 'var(--info-light)',
              border: '1px solid var(--info-border)',
              fontSize: '11px',
              color: 'var(--info)',
              fontWeight: 500,
              alignSelf: 'flex-start',
            }}
          >
            {message.toolResult
              ? <CheckCircle size={11} color="var(--success)" />
              : <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
            }
            {message.toolResult ? 'Retrieved' : 'Retrieving…'}: {message.toolCall.name}
            {message.toolResult?.summary && (
              <span style={{ color: 'var(--text-muted)', marginLeft: 2 }}>
                — {message.toolResult.summary}
              </span>
            )}
          </div>
        )}

        {/* Typing indicator */}
        {showTyping && (
          <div
            style={{
              padding: '10px 14px',
              background: '#f9fafb',
              border: '1px solid var(--border)',
              borderRadius: isUser ? '8px 2px 8px 8px' : '2px 8px 8px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#d1d5db', display: 'inline-block' }} />
            <span className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#d1d5db', display: 'inline-block' }} />
            <span className="typing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#d1d5db', display: 'inline-block' }} />
          </div>
        )}

        {/* Main content bubble */}
        {message.content && (
          <div
            style={{
              padding: '10px 14px',
              background: isUser ? 'var(--primary)' : 'white',
              border: isUser ? 'none' : '1px solid var(--card-border)',
              borderRadius: isUser ? '8px 2px 8px 8px' : '2px 8px 8px 8px',
              fontSize: '13px',
              color: isUser ? 'white' : 'var(--text-primary)',
              lineHeight: 1.65,
            }}
          >
            {isUser ? (
              <span>{message.content}</span>
            ) : (
              <div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div style={{ overflowX: 'auto', margin: '8px 0' }}>
                        <table style={{
                          borderCollapse: 'collapse', width: '100%',
                          fontSize: '12px', border: '1px solid var(--border)',
                          borderRadius: 6,
                        }}>
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th style={{
                        padding: '6px 10px',
                        background: '#f9fafb',
                        borderBottom: '1px solid var(--border)',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        fontSize: '11px',
                      }}>
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td style={{
                        padding: '6px 10px',
                        borderBottom: '1px solid #f3f4f6',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}>
                        {children}
                      </td>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote style={{
                        borderLeft: '3px solid var(--border-strong)',
                        paddingLeft: '10px',
                        margin: '6px 0',
                        color: 'var(--text-secondary)',
                        fontStyle: 'normal',
                      }}>
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code style={{
                        background: '#f3f4f6',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontFamily: 'ui-monospace, monospace',
                        color: 'var(--text-primary)',
                      }}>
                        {children}
                      </code>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {children}
                      </strong>
                    ),
                    p: ({ children }) => (
                      <p style={{ margin: '4px 0' }}>{children}</p>
                    ),
                    h3: ({ children }) => (
                      <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '10px 0 4px' }}>
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: '8px 0 3px' }}>
                        {children}
                      </h4>
                    ),
                    ul: ({ children }) => (
                      <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol style={{ paddingLeft: '16px', margin: '4px 0' }}>{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li style={{ marginBottom: '2px', color: 'var(--text-primary)' }}>{children}</li>
                    ),
                    hr: () => (
                      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '2px',
                      height: '13px',
                      background: 'var(--primary)',
                      borderRadius: '1px',
                      animation: 'blink 1s ease infinite',
                      verticalAlign: 'middle',
                      marginLeft: '2px',
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
