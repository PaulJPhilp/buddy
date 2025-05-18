import React from 'react';
import ReactDOM from 'react-dom/client';
import '../src/styles/globals.css';
import './new-index.css';
// import App from './App'
// import SimpleTest from './SimpleTest'
// import SimpleChatTest from './SimpleChatTest'
// import IsolatedTest from './IsolatedTest'
// import StandaloneTest from './StandaloneTest'
// import SimpleChatApp from './SimpleChatApp'
// import TailwindChatApp from './TailwindChatApp'
// import RealisticChatApp from './RealisticChatApp';
import SimplifiedChatApp from './SimplifiedChatApp';

try {
    console.log("Attempting to render SimplifiedChatApp...");
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error("Root element not found in the DOM");
    }

    console.log("Creating React root...");
    const root = ReactDOM.createRoot(rootElement);

    console.log("Rendering SimplifiedChatApp...");
    root.render(
        <React.StrictMode>
            <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                <SimplifiedChatApp />
            </div>
        </React.StrictMode>
    );
    console.log("Render attempted successfully");
} catch (error) {
    console.error("Error rendering SimplifiedChatApp:", error);
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = `<div style="padding: 20px; color: red;">
            <h1>Error Rendering Component</h1>
            <pre>${error instanceof Error ? `${error.message}\n\n${error.stack}` : String(error)}</pre>
            <p>Check browser console for more details</p>
        </div>`;
    }
} 