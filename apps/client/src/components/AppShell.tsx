"use client"

import { Effect, Fiber, Runtime } from "effect";
import { useEffect, useState } from "react";

import { characterAppEffect } from "@/app-character/CharacterApp"; // Import the character app logic
import { CharacterService } from "@/app-character/CharacterServiceApi";
import { MockCharacterService } from "@/app-character/MockCharacterService";
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
        // Get the default runtime
        const runtime = Runtime.defaultRuntime

        // Run the character app in a forked fiber with mock service
        const fiber = Runtime.runFork(runtime)(
            Effect.gen(function* () {
                yield* Effect.logDebug("AppShell: Starting character app")
                yield* Effect.provideService(CharacterService, MockCharacterService)(characterAppEffect)
                yield* Effect.logDebug("AppShell: Character app completed")
            })
        )

        console.log("Launched AppShell Character Fiber ID:", fiber.id)

        // Cleanup function to interrupt the fiber
        return () => {
            console.log("Interrupting AppShell Character Fiber ID:", fiber.id)
            Runtime.runPromise(runtime)(Fiber.interrupt(fiber))
                .then(() => console.log("AppShell Character Fiber interrupted successfully"))
                .catch((e) => console.error("Error interrupting AppShell Character Fiber:", e))
        }
    }, [])

    return (
        <>
            <div className="h-screen w-full flex bg-background overflow-hidden">
                {/* Container for the left column (Sidebar + UserCard) */}
                <div className={`border-r bg-muted/40 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-12'}`}>
                    {/* Pass state down to Sidebar */}
                    <Sidebar isOpen={isSidebarOpen} />
                    {/* Pass state down to UserCard */}
                    <UserCard isOpen={isSidebarOpen} />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Pass toggle function down to TopToolbar */}
                    <TopToolbar onToggleSidebar={toggleSidebar} />

                    {/* Actual Page/App Content */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {children}
                    </div>
                </main>
            </div>
            <Toaster />
        </>
    )
} 