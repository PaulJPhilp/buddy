"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onLoginAction: () => void;
}

export function LoginModal({
  isOpen,
  onCloseAction,
  onLoginAction,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[300px] p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[8pt] font-medium">Login</h2>
          <button
            type="button"
            onClick={onCloseAction}
            className="text-muted-foreground hover:text-foreground"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLoginAction();
          }}
          className="space-y-3"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-[6pt] mb-1 text-muted-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-[6pt] px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-[6pt] mb-1 text-muted-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-[6pt] px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter your password"
            />
          </div>
          <div className="flex justify-between items-center text-[6pt]">
            <label htmlFor="remember" className="flex items-center gap-1">
              <input id="remember" type="checkbox" className="h-2 w-2" />
              Remember me
            </label>
            <a href="#!" className="text-primary hover:underline">
              Forgot password?
            </a>
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground text-[6pt] py-1 rounded hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
          <div className="text-center text-[6pt] text-muted-foreground">
            Don't have an account?{" "}
            <a href="/sign-up" className="text-primary hover:underline">
              Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
