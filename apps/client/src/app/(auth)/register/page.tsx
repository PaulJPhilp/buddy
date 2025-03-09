import { SignupForm } from "@components/app/signup-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Welcome</h1>
      <p className="text-slate-500 mt-2">Sign in to your account or create a new one</p>
      <div className="mt-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>Enter your information to create a new account</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <div className="text-center mt-4 text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}