"use client"

import { UserButton } from "@clerk/nextjs"

interface UserCardProps {
    isOpen: boolean
}

export function UserCard({ isOpen }: UserCardProps) {
    return (
        <div className={`p-4 border-t bg-muted/20 flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
            <UserButton />
            {isOpen && (
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium truncate">Your Account</p>
                </div>
            )}
        </div>
    )
} 