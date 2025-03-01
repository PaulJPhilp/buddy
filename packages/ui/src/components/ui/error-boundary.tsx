'use client'

import * as React from 'react'

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

/**
 * A functional component wrapper for the class-based ErrorBoundary
 * This ensures compatibility with React 19
 */
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
    return (
        <ErrorBoundaryClass fallback={fallback}>
            {children}
        </ErrorBoundaryClass>
    )
}

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
}

/**
 * Internal class-based error boundary implementation
 */
class ErrorBoundaryClass extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex h-[30vh] w-full flex-col items-center justify-center gap-4 rounded-lg border border-destructive bg-destructive/10 p-8 text-destructive">
                    <h2 className="text-lg font-semibold">Something went wrong</h2>
                    {this.state.error && (
                        <pre className="max-w-full overflow-auto rounded bg-destructive/20 p-4 text-sm">
                            {this.state.error.message}
                        </pre>
                    )}
                </div>
            )
        }

        return this.props.children
    }
} 