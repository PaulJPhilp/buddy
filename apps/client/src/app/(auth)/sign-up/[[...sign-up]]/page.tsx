import { SignUp } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Page() {
    const { userId } = await auth()

    if (userId) {
        redirect("/")
    }

    return (
        <div className="grid min-h-screen place-items-center bg-background">
            <div className="w-full max-w-[400px] px-4">
                <h1 className="text-3xl font-black">Create your account</h1>
                <p className="mt-2 text-muted-foreground">Sign up to get started with BuddyChat</p>
                <SignUp
                    routing="path"
                    path="/sign-up"
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "shadow-none bg-transparent",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                            socialButtonsBlockButton: "hover:bg-muted",
                            formButtonPrimary: "bg-primary hover:bg-primary/90",
                        }
                    }}
                />
            </div>
        </div>
    )
} 