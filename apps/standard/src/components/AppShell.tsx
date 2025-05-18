import React, { useState } from 'react';
import { HeaderBar } from './HeaderBar';
import { Sidebar } from './Sidebar';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    function toggleSidebar() {
        setIsSidebarOpen(!isSidebarOpen);
    }

    return (
        <div className="h-screen w-full flex bg-background overflow-hidden">
            <div
                className={`border-r bg-muted/40 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-60" : "w-0 hidden"
                    }`}
            >
                <Sidebar isOpen={isSidebarOpen} onToggleAction={toggleSidebar} />
            </div>

            <main className="flex-1 flex flex-col overflow-hidden">
                <HeaderBar title="Buddy Chat" onToggleSidebarAction={toggleSidebar} />

                <div className="flex-1 flex flex-col overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
