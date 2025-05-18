import React from 'react';
import { UIBar, UIBarProps } from './UIBar'; // Assuming UIBar can be used here or a similar component

export interface HeaderBarProps {
    title: string;
    leftAccessoryElements?: UIBarProps['elements'];
    rightAccessoryElements?: UIBarProps['elements'];
    className?: string;
    style?: React.CSSProperties;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
    title,
    leftAccessoryElements,
    rightAccessoryElements,
    className,
    style,
}) => {
    return (
        <div
            className={`flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 ${className || ''}`}
            style={style}
        >
            {leftAccessoryElements && leftAccessoryElements.length > 0 && (
                <UIBar elements={leftAccessoryElements} />
            )}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
                {title}
            </span>
            {rightAccessoryElements && rightAccessoryElements.length > 0 && (
                <UIBar elements={rightAccessoryElements} />
            )}
        </div>
    );
};
