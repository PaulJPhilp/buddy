export default function TestPage() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-2xl space-y-8">
                {/* Header section to test typography and colors */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-foreground">
                        Tailwind v4 Test Page
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Testing various Tailwind features in our monorepo setup
                    </p>
                </div>

                {/* Card section to test components and shadows */}
                <div className="rounded-lg border bg-card p-6 shadow-lg">
                    <h2 className="text-2xl font-semibold text-card-foreground">
                        Card Component
                    </h2>
                    <p className="mt-2 text-card-foreground/80">
                        Testing card background, borders, and text colors
                    </p>
                </div>

                {/* Buttons section to test variants and states */}
                <div className="flex flex-wrap gap-4">
                    <button
                        type="button"
                        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                    >
                        Primary Button
                    </button>
                    <button
                        type="button"
                        className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/90"
                    >
                        Secondary Button
                    </button>
                    <button
                        type="button"
                        className="rounded-md bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90"
                    >
                        Destructive Button
                    </button>
                </div>

                {/* Grid section to test layout */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="rounded-md bg-accent p-4 text-accent-foreground"
                        >
                            Grid Item {i}
                        </div>
                    ))}
                </div>

                {/* Chart colors test */}
                <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className={`h-20 w-20 rounded-md bg-[hsl(var(--chart-${i}))]`}
                            aria-label={`Chart Color ${i}`}
                        />
                    ))}
                </div>

                {/* Sidebar colors test */}
                <div className="rounded-lg border bg-[hsl(var(--sidebar-background))] p-6">
                    <div className="space-y-4">
                        <h3 className="text-[hsl(var(--sidebar-foreground))]">
                            Sidebar Style Test
                        </h3>
                        <div className="rounded bg-[hsl(var(--sidebar-accent))] p-3 text-[hsl(var(--sidebar-accent-foreground))]">
                            Accent Background
                        </div>
                        <div className="rounded bg-[hsl(var(--sidebar-primary))] p-3 text-[hsl(var(--sidebar-primary-foreground))]">
                            Primary Background
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 