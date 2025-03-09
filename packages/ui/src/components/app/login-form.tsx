"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export function LoginForm() {
	const [isLoading, setIsLoading] = useState(false)

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setIsLoading(true)

		setTimeout(() => {
			setIsLoading(false)
		}, 3000)
	}

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					placeholder="name@example.com"
					type="email"
					autoCapitalize="none"
					autoComplete="email"
					autoCorrect="off"
					disabled={isLoading}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="password">Password</Label>
				<Input
					id="password"
					placeholder="••••••••"
					type="password"
					autoCapitalize="none"
					autoComplete="current-password"
					disabled={isLoading}
				/>
			</div>
			<Button className="w-full" disabled={isLoading}>
				{isLoading ? "Signing in..." : "Sign In"}
			</Button>
		</form>
	)
}