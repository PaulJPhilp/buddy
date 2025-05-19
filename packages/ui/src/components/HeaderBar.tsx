import React from 'react';
import { UIBar, UIBarProps } from './UIBar'; // Assuming UIBar can be used here or a similar component

export interface HeaderBarProps {
    title: string;
    leftAccessoryElements?: UIBarProps['elements'];
    rightAccessoryElements?: UIBarProps['elements'];
    className?: string;
    style?: React.CSSProperties;
}

export const HeaderBar: React.FC<HeaderBarProps & { status?: string; error?: string | null }> = ({
    title,
    leftAccessoryElements,
    rightAccessoryElements,
    className,
    style,
    status,
    error,
}) => {
    return (
        <div
            className={`flex items-center justify-between px-sm py-xxs bg-background border-b border-border ${className || ''}`}
            style={style}
        >
            {leftAccessoryElements && leftAccessoryElements.length > 0 && (
                <UIBar elements={leftAccessoryElements} />
            )}
            <div className="flex-1 flex flex-col items-center">
                <span className="font-semibold text-foreground text-sm">{title}</span>
                {status && (
                    <span className="text-xs text-muted-foreground mt-xxs">{status}</span>
                )}
                {error && (
                    <span className="text-xs text-destructive mt-xxs">{error}</span>
                )}
            </div>
            {rightAccessoryElements && rightAccessoryElements.length > 0 && (
                <UIBar elements={rightAccessoryElements} />
            )}
        </div>
    );
};
