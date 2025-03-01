import { NextRequest, NextResponse } from "next/server";
import * as crypto from "node:crypto";

// Helper function to hash passwords client-side before sending
function hashPassword(password: string): string {
    return crypto
        .createHash("sha256")
        .update(password + process.env.PASSWORD_SALT)
        .digest("hex");
}

// Check if user is authenticated
export async function GET(request: NextRequest) {
    // Access the cookie directly from the request
    const authToken = request.cookies.get("auth-token")?.value;

    if (!authToken) {
        return NextResponse.json(
            { success: false, message: "Not authenticated" },
            { status: 401 }
        );
    }

    try {
        // Use the token to get user data
        // Adjust to use your actual API endpoint
        const response = await fetch(`${process.env.API_URL}/api/user`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to verify token");
        }

        const data = await response.json();
        return NextResponse.json({ success: true, user: data.user });
    } catch (error) {
        console.error("Authentication error:", error);
        // Return a response that instructs the client to clear the cookie
        return NextResponse.json(
            { success: false, message: "Authentication failed" },
            {
                status: 401,
                headers: {
                    'Set-Cookie': `auth-token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
                }
            }
        );
    }
}

// Handle login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required" },
                { status: 400 }
            );
        }

        // Hash password before sending to API (if needed)
        // Note: You might not need this if your backend handles hashing
        const hashedPassword = hashPassword(password);

        // Call your authentication API with your existing endpoint
        const response = await fetch(`${process.env.API_URL}/api/user/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password: hashedPassword
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || "Authentication failed" },
                { status: response.status }
            );
        }

        // Create response with cookie
        const authResponse = NextResponse.json({
            success: true,
            user: data.user,
        });

        // Set cookie in the response
        authResponse.cookies.set({
            name: "auth-token",
            value: data.token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24, // 1 day
        });

        return authResponse;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { success: false, message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
