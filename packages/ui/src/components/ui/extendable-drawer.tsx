import { GripVertical } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../utils/cn'

interface ExtendableDrawerProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultWidth?: number
    minWidth?: number
    maxWidth?: number
    position?: 'left' | 'right'
    showHandle?: boolean
}

export function ExtendableDrawer({
    defaultWidth = 300,
    minWidth = 240,
    maxWidth = 600,
    position = 'left',
    showHandle = true,
    className,
    children,
    ...props
}: ExtendableDrawerProps) {
    const [isResizing, setIsResizing] = React.useState(false)
    const [width, setWidth] = React.useState(defaultWidth)
    const drawerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return

            const drawer = drawerRef.current
            if (!drawer) return

            const drawerRect = drawer.getBoundingClientRect()
            let newWidth: number

            if (position === 'left') {
                newWidth = e.clientX - drawerRect.left
            } else {
                newWidth = drawerRect.right - e.clientX
            }

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setWidth(newWidth)
            }
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing, minWidth, maxWidth, position])

    return (
        <div
            ref={drawerRef}
            className={cn(
                'relative flex h-full',
                position === 'right' && 'flex-row-reverse',
                className,
            )}
            style={{ width: `${width}px` }}
            {...props}
        >
            {children}
            {showHandle && (
                <div
                    className={cn(
                        'absolute inset-y-0 w-4 cursor-ew-resize flex items-center justify-center hover:bg-accent/20',
                        position === 'left' ? 'right-0' : 'left-0',
                    )}
                    onMouseDown={() => setIsResizing(true)}
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
            )}
        </div>
    )
} 