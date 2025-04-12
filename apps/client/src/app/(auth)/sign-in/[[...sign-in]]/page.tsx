import { SignIn } from "@clerk/nextjs"
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
                <h1 className="text-3xl font-black">Welcome back</h1>
                <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
                <SignIn
                    routing="path"
                    path="/sign-in"
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