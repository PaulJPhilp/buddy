import { LoginForm } from "@components/app/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import Link from "next/link"

export default function LoginPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold">Welcome</h1>
            <p className="text-slate-500 mt-2">Sign in to your account or create a new one</p>
            <div className="mt-8">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Sign In</CardTitle>
                        <CardDescription>Enter your credentials to access your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LoginForm />
                        <div className="text-center mt-4 text-sm text-slate-500">
                            Don't have an account?{" "}
                            <Link href="/register" className="text-blue-600 hover:underline">
                                Sign up
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

