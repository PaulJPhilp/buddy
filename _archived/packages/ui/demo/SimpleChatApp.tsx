// A minimal implementation of ChatApp without relying on external styles
// This will help us identify if the issue is with the styles or the components themselves
import React, { useState } from 'react';

// Simplified version of HeaderBar with inline styles
const SimpleHeaderBar: React.FC<{ title: string }> = ({ title }) => {
    return (
        <header style={{
            backgroundColor: '#3b82f6',
            padding: '0.5rem 1rem',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }}>
            <h1 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{title}</h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                }}>Options</button>
            </div>
        </header>
    );
};

// Simplified version of MessageArea with inline styles
const SimpleMessageArea: React.FC = () => {
    return (
        <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            backgroundColor: '#f9fafb',
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
            }}>
                <div style={{
                    backgroundColor: '#dbeafe',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    maxWidth: '80%',
                }}>
                    <p style={{ color: '#1e40af' }}>This is a sample message</p>
                </div>
                <div style={{
                    backgroundColor: '#f3f4f6',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    maxWidth: '80%',
                    alignSelf: 'flex-end',
                }}>
                    <p style={{ color: '#1f2937' }}>This is a response</p>
                </div>
            </div>
        </div>
    );
};

// Simplified version of UserArea with inline styles
const SimpleUserArea: React.FC = () => {
    const [message, setMessage] = useState('');

    return (
        <div style={{
            borderTop: '1px solid #e5e7eb',
            padding: '0.75rem',
            backgroundColor: '#ffffff',
        }}>
            {/* Attachment row example */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.5rem',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    backgroundColor: '#f3f4f6',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                }}>
                    <span>📄</span>
                    <span>document.pdf</span>
                    {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                    <button style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: '#6b7280',
                    }}>×</button>
                </div>
            </div>

            {/* Input area */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
            }}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        outline: 'none',
                    }}
                />
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: message.trim() ? '#3b82f6' : '#93c5fd',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: message.trim() ? 'pointer' : 'not-allowed',
                    }}
                    disabled={!message.trim()}
                    onClick={() => {
                        console.log("Message sent:", message);
                        setMessage('');
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

// Full ChatApp with all components using inline styles
const SimpleChatApp: React.FC = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100%',
        }}>
            <SimpleHeaderBar title="Simple Chat Test" />
            <SimpleMessageArea />
            <SimpleUserArea />
        </div>
    );
};

export default SimpleChatApp;
