import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Home() {
    const { userId } = await auth()

    if (!userId) {
        redirect("/sign-in")
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Welcome to Buddy</h1>
            <p className="mt-2">You are signed in as {userId}</p>
        </div>
    )
} 