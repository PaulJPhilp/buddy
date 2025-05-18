// A totally isolated test with no dependencies on existing components
// This is just to test Tailwind styling
import React, { useState } from 'react';
import '../src/styles/globals.css';

const IsolatedTest: React.FC = () => {
    const [message, setMessage] = useState('');

    return (
        <div className="h-screen w-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="bg-blue-500 text-white p-2 flex justify-between items-center">
                <h1 className="text-xl font-bold">Isolated Test Header</h1>
                <button type="button" className="px-3 py-1 bg-blue-600 rounded-md">Menu</button>
            </div>

            {/* Messages area */}
            <div className="flex-1 p-4 overflow-auto space-y-4 bg-gray-50 dark:bg-gray-800">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg max-w-[80%]">
                    <p className="text-blue-800 dark:text-blue-100">This is a test message</p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[80%] ml-auto">
                    <p className="text-gray-800 dark:text-gray-100">This is a response</p>
                </div>
            </div>

            {/* Input area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="Type a message..."
                    />
                    {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                    <button
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
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

export default IsolatedTest;
