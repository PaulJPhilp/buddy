"use client";

import { useCallback, useState } from "react";

interface ContextEngineeringTriggerProps {
  onToggle: (isOpen: boolean) => void;
  isOpen: boolean;
  elementCount?: number;
}

export function ContextEngineeringTrigger({
  onToggle,
  isOpen,
  elementCount = 0,
}: ContextEngineeringTriggerProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    onToggle(!isOpen);
  }, [onToggle, isOpen]);

  return (
    <div
      className={`
        relative w-full cursor-pointer transition-all duration-200
        ${isHovered ? "h-8" : "h-2"}
        ${isOpen ? "bg-blue-100 border-t border-blue-200" : "bg-gray-100 border-t border-gray-200"}
        hover:bg-blue-50
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thin trigger line */}
      <div
        className={`
          absolute top-0 left-0 right-0 h-0.5 transition-colors duration-200
          ${isOpen ? "bg-blue-500" : "bg-gray-300"}
          hover:bg-blue-400
        `}
      />

      {/* Expanded content on hover */}
      {isHovered && (
        <div className="flex items-center justify-center h-full px-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Context Engineering</span>
            {elementCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {elementCount}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {isOpen ? "Click to close" : "Click to open"}
            </span>
          </div>
        </div>
      )}

      {/* Minimal indicator when not hovered */}
      {!isHovered && elementCount > 0 && (
        <div className="absolute top-0 right-2 -translate-y-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );
}
