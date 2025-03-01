import * as React from 'react'

import { cn } from '../../utils/cn'

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    autoResize?: boolean
}

function Textarea({
    className,
    autoResize,
    onChange,
    ...props
}: TextareaProps) {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (autoResize && textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
        onChange?.(event)
    }

    React.useEffect(() => {
        if (autoResize && textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [autoResize])

    return (
        <textarea
            ref={textareaRef}
            onChange={handleChange}
            className={cn(
                'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        />
    )
}

export { Textarea }
