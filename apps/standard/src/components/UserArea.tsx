import React, { useState } from 'react';

interface UserAreaProps {
    onSendMessage: (message: string) => void;
    isDisabled?: boolean;
}

export function UserArea({ onSendMessage, isDisabled = false }: UserAreaProps) {
    const [inputValue, setInputValue] = useState('');

    const handleSend = () => {
        if (inputValue.trim() && !isDisabled) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none resize-none"
                    rows={1}
                    disabled={isDisabled}
                />
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isDisabled}
                    className={`px-4 py-2 rounded-lg ${!inputValue.trim() || isDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
