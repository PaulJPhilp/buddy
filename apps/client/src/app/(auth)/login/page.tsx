'use client';

import { LoginForm } from "@components/app/login-form";
import { Card, CardContent } from "@components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col text-center">
        <div className="mb-6 pb-2">
          <h1 className="text-[2rem] font-semibold tracking-wide text-[hsl(var(--foreground))]" style={{ lineHeight: 1.5 }}>Sign In</h1>
          <p className="text-sm text-muted-foreground mt-4">
            Enter your credentials to access your account
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <LoginForm />
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </>
  )
}

