import * as React from 'react'

import { cn } from '../../utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-xl border bg-card text-card-foreground shadow',
                className,
            )}
            {...props}
        />
    )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> { }

function CardHeader({ className, ...props }: CardHeaderProps) {
    return (
        <div
            className={cn('flex flex-col space-y-1.5 p-6', className)}
            {...props}
        />
    )
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }

function CardTitle({ className, ...props }: CardTitleProps) {
    return (
        <h3
            className={cn('font-semibold leading-none tracking-tight', className)}
            {...props}
        />
    )
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { }

function CardDescription({ className, ...props }: CardDescriptionProps) {
    return (
        <p
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    )
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { }

function CardContent({ className, ...props }: CardContentProps) {
    return (
        <div className={cn('p-6 pt-0', className)} {...props} />
    )
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

function CardFooter({ className, ...props }: CardFooterProps) {
    return (
        <div
            className={cn('flex items-center p-6 pt-0', className)}
            {...props}
        />
    )
}

export {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
}
