"use client"

import { Effect, Fiber, Runtime } from "effect";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/toaster";
// Import the components
import { Sidebar } from "./app-shell/Sidebar";
import { TopToolbar } from "./app-shell/TopToolbar";
import { UserCard } from "./app-shell/UserCard";

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    console.log("AppShell component rendering");

    // State to manage sidebar visibility
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    // Function to toggle the sidebar state
    function toggleSidebar() {
        const newState = !isSidebarOpen
        console.log("Toggling sidebar, new state:", newState)
        setIsSidebarOpen(newState)
    }

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
                {/* Container for the left column (Sidebar + UserCard) */}
                <div className={`border-r bg-muted/40 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-32' : 'w-8'}`}>
                    {/* Pass state and toggle function down to Sidebar */}
                    <Sidebar isOpen={isSidebarOpen} onToggleAction={toggleSidebar} />
                    {/* Pass state down to UserCard */}
                    <UserCard isOpen={isSidebarOpen} />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Pass toggle function down to TopToolbar */}
                    <TopToolbar onToggleSidebarAction={toggleSidebar} />

                    {/* Chat Windows Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-4 p-4 overflow-y-auto">
                        {children}
                    </div>
                </main>
            </div>
            <Toaster />
        </>
    )
} 