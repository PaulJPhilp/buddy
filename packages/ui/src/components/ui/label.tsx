'use client';

import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../utils/cn';

const labelVariants = cva(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> { }

// Create a simple functional component instead of using forwardRef
function Label({
    className,
    htmlFor,
    children,
    ...props
}: LabelProps) {
    return (
        <label
            className={cn(labelVariants(), className)}
            htmlFor={htmlFor}
            {...props}
        >
            {children}
        </label>
    );
}

export { Label, labelVariants };
