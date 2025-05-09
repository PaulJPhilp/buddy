"use client";

import { createContext, ReactNode, useContext, useState } from "react";

interface AppShellContextType {
    selectedThreadId: string | null;
    setSelectedThreadId: (id: string | null) => void;
}

const AppShellContext = createContext<AppShellContextType | undefined>(undefined);

export const AppShellProvider = ({ children }: { children: ReactNode }) => {
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

    return (
        <AppShellContext.Provider value={{ selectedThreadId, setSelectedThreadId }}>
            {children}
        </AppShellContext.Provider>
    );
};

export const useAppShell = () => {
    const context = useContext(AppShellContext);
    if (context === undefined) {
        throw new Error("useAppShell must be used within an AppShellProvider");
    }
    return context;
};
