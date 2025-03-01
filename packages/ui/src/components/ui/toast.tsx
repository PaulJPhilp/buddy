import { Toaster as SonnerToaster } from 'sonner'

interface ToasterProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
    richColors?: boolean
    expand?: boolean
    duration?: number
    visibleToasts?: number
    closeButton?: boolean
    offset?: string | number
    theme?: 'light' | 'dark' | 'system'
}

function Toaster({
    position = 'top-center',
    richColors = false,
    expand = false,
    duration = 4000,
    visibleToasts = 3,
    closeButton = true,
    offset = '32px',
    theme = 'system',
    ...props
}: ToasterProps) {
    return (
        <SonnerToaster
            theme={theme}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                    description: 'group-[.toast]:text-muted-foreground',
                    actionButton:
                        'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                    cancelButton:
                        'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                    error:
                        'group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground',
                    success:
                        'group-[.toaster]:bg-success group-[.toaster]:text-success-foreground',
                    warning:
                        'group-[.toaster]:bg-warning group-[.toaster]:text-warning-foreground',
                    info: 'group-[.toaster]:bg-info group-[.toaster]:text-info-foreground',
                },
            }}
            position={position}
            richColors={richColors}
            expand={expand}
            duration={duration}
            visibleToasts={visibleToasts}
            closeButton={closeButton}
            offset={offset}
            {...props}
        />
    )
}

export { Toaster }
export type { ToasterProps }

// Re-export toast function from sonner for convenience
export { toast } from 'sonner'
