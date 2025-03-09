import { NextResponse } from "next/server";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = LoginSchema.parse(body);

    // TODO: Replace with actual database authentication
    // This is a mock response for testing
    if (email === "test@example.com" && password === "password123") {
      return NextResponse.json({
        token: "mock_jwt_token",
        user: {
          id: "1",
          email,
          name: "Test User",
        },
      });
    }

    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 },
    );
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
