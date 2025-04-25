import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Home() {
    const { userId } = await auth()

    if (!userId) {
        redirect("/sign-in")
    }

    return (
        <div className="h-full flex items-center justify-center">
            <h1 className="text-2xl font-bold">Welcome to Buddy</h1>
        </div>
    )
} 