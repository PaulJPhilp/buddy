import { themeStore } from "@/stores/themeStore"
import { useTheme } from "next-themes"
import { useEffect } from "react"

/**
 * Hook that integrates next-themes with our ThemeStore
 * This ensures the ThemeStore stays in sync with the theme provider
 */
export function useThemeIntegration() {
    const { theme: rawTheme } = useTheme()

    useEffect(() => {
        // Update theme store whenever next-themes changes
        themeStore.send({
            type: "updateRawTheme",
            rawTheme,
        })
    }, [rawTheme])

    return {
        rawTheme,
    }
} 