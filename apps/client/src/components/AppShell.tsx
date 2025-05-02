"use client"

import { Toaster } from "@/components/ui/toaster";
import { Effect, Fiber, Runtime } from "effect";
import React, { useEffect, useState } from "react";
import { Sidebar } from "./app-shell/Sidebar";
import { TopToolbar } from "./app-shell/TopToolbar";
import { UserCard } from "./app-shell/UserCard";

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [selectedChatIndex, setSelectedChatIndex] = useState<number>(0)

    function toggleSidebar() {
        setIsSidebarOpen(!isSidebarOpen)
    }

    // Clone children with additional props
    const enhancedChildren = React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
                isSelected: index === selectedChatIndex,
                onSelect: () => setSelectedChatIndex(index),
                threadId: `thread${index + 1}`
            });
        }
        return child;
    });

    useEffect(() => {
        const runtime = Runtime.defaultRuntime
        const fiber = Runtime.runFork(runtime)(Effect.never)

        return () => {
            Runtime.runPromise(runtime)(
                Effect.gen(function* () {
                    yield* Effect.logDebug("Interrupting AppSupervisor")
                    yield* Fiber.interrupt(fiber)
                })
            )
        }
    }, [])

    return (
        <>
            <div className="h-screen w-full flex bg-background overflow-hidden">
                <div className={`border-r bg-muted/40 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-16' : 'w-0 hidden'}`}>
                    <Sidebar isOpen={isSidebarOpen} onToggleAction={toggleSidebar} />
                </div>

                <main className="flex-1 flex flex-col overflow-hidden">
                    <TopToolbar onToggleSidebarAction={toggleSidebar} />

                    <div className="flex-1 flex gap-4 p-4 overflow-y-auto max-w-[1600px] mx-auto w-full">
                        {enhancedChildren}
                    </div>
                </main>
            </div>
            <UserCard />
            <Toaster />
        </>
    )
} 