import Link from "next/link";

export default function Home() {
  return (
    <main className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
          Buddy AI Chat Assistant
        </h1>
        <p className="text-muted-foreground mt-2">
          Your intelligent AI conversation partner
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="rounded-lg border bg-card text-card-foreground shadow">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Get Started</h3>
            <p className="text-sm text-muted-foreground">
              Begin a conversation with Buddy AI
            </p>
          </div>
          <div className="p-6 pt-0">
            <Link href="/prompts" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
              Start Chatting
            </Link>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Manage Prompts</h3>
            <p className="text-sm text-muted-foreground">
              Create and manage your conversation prompts
            </p>
          </div>
          <div className="p-6 pt-0">
            <Link href="/prompts" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
              View Prompts
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 