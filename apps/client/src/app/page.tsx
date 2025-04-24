import { SignOutButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Home() {
    const { userId } = await auth()

    if (!userId) {
        redirect("/sign-in")
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Welcome to Buddy</h1>
                    <p className="mt-2">You are signed in as {userId}</p>
                </div>
                <SignOutButton>
                    <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        Sign out
                    </button>
                </SignOutButton>
            </div>
        </div>
    )
} 