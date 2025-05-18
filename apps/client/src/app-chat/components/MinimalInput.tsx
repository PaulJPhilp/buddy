// MinimalInput: Expanding, controlled text input for message composition
import React from "react";

export interface MinimalInputProps {
  text: string;
  onTextChange: (newText: string) => void;
  onSubmitEffect: (text: string) => void; // Effect-TS integration later
  placeholder?: string;
  theme?: string;
  isDisabled?: boolean;
  trailingAccessoryElements?: any[]; // Placeholder for UIBarElementConfig[]
}

export function MinimalInput({
  text,
  onTextChange,
  onSubmitEffect,
  placeholder = "Type your message...",
  theme = "blue",
  isDisabled = false,
  trailingAccessoryElements = [],
}: MinimalInputProps) {
  // Placeholder: no expanding textarea logic yet
  return (
    <div className="flex items-center gap-2">
      <textarea
        value={text}
        onChange={e => onTextChange(e.target.value)}
        placeholder={placeholder}
        disabled={isDisabled}
        className="flex-1 min-h-8 max-h-20 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
        rows={1}
      />
      {/* Placeholder for trailing accessory elements */}
      {trailingAccessoryElements.length > 0 && (
        <span className="text-xs text-gray-400">[UIBar placeholder]</span>
      )}
      <button
        onClick={() => onSubmitEffect(text)}
        disabled={isDisabled || !text.trim()}
        className={`ml-1 px-3 py-2 rounded-md font-medium text-xs ${theme === "blue" ? "bg-blue-500" : "bg-rose-700"} text-white disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        Send
      </button>
    </div>
  );
}
