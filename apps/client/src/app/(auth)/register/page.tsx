import { SignupForm } from "@components/app/signup-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create a new account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <div className="text-center mt-4 text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
