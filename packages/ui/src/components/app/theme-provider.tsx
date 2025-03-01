'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

// Use a more permissive type for the ThemeProvider
export function ThemeProvider({ children, ...props }: Omit<ThemeProviderProps, 'children'> & { children: any }) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
