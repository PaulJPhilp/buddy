// A completely standalone component with no external styling dependencies
import React, { useState } from 'react';

// This will test if styling works without any external dependencies
const StandaloneTest: React.FC = () => {
    const [message, setMessage] = useState('');

    // Inline styles to completely avoid Tailwind
    const styles = {
        container: {
            height: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            backgroundColor: '#f9fafb',
        },
        header: {
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        heading: {
            fontSize: '1.25rem',
            fontWeight: 'bold',
        },
        button: {
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
        },
        messagesArea: {
            flex: 1,
            padding: '1rem',
            overflowY: 'auto' as const,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1rem',
        },
        message: {
            backgroundColor: '#dbeafe',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            maxWidth: '80%',
        },
        messageText: {
            color: '#1e40af',
        },
        response: {
            backgroundColor: '#f3f4f6',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            maxWidth: '80%',
            alignSelf: 'flex-end',
        },
        responseText: {
            color: '#1f2937',
        },
        inputArea: {
            borderTop: '1px solid #e5e7eb',
            padding: '0.75rem',
        },
        inputContainer: {
            display: 'flex',
            gap: '0.5rem',
        },
        input: {
            flex: 1,
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            outline: 'none',
        },
        sendButton: {
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
        },
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.heading}>Standalone Test - No Tailwind</h1>
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button style={styles.button}>Menu</button>
            </div>

            {/* Messages area */}
            <div style={styles.messagesArea}>
                <div style={styles.message}>
                    <p style={styles.messageText}>This is a test message</p>
                </div>

                <div style={styles.response}>
                    <p style={styles.responseText}>This is a response</p>
                </div>
            </div>

            {/* Input area */}
            <div style={styles.inputArea}>
                <div style={styles.inputContainer}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        style={styles.input}
                        placeholder="Type a message..."
                    />
                    {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                    <button
                        style={styles.sendButton}
                        onClick={() => {
                            console.log("Message:", message);
                            setMessage('');
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StandaloneTest;
