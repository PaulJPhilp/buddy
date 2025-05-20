"use client";

import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppToolbar } from './AppToolbar';

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
                className={`border-r bg-muted/40 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-[240px] sm:w-[280px] lg:w-[320px]" : "w-0 hidden"}`}
                role="complementary"
                aria-label="Sidebar"
            >
                <AppSidebar isOpen={isSidebarOpen} onToggleAction={toggleSidebar} />
            </div>

            <main 
              className="flex-1 flex flex-col overflow-hidden"
              role="main"
              id="main-content"
            >
                <AppToolbar onToggleSidebarAction={toggleSidebar} />

                <div className="flex-1 flex flex-col overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
