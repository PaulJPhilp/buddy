"use client";

export default function Home() {
  // This page is no longer used since layout.tsx handles chat app rendering directly
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <div className="text-6xl mb-6">💬</div>
        <h2 className="text-2xl font-bold mb-4">Welcome to Buddy Chat</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Chat applications are managed by the layout. This page should not be
          reached.
        </p>
      </div>
    </div>
  );
}
