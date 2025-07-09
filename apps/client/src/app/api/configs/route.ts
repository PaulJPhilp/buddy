import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Path parameter is required" },
        { status: 400 }
      );
    }

    // Security: only allow access to config files
    if (
      !path.startsWith("/static/configs/") &&
      !path.startsWith("static/configs/") &&
      !path.startsWith("/configs/") &&
      !path.startsWith("configs/")
    ) {
      return NextResponse.json(
        { error: "Access denied", requestedPath: path },
        { status: 403 }
      );
    }

    // Remove leading slash and construct file path
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    // Navigate to workspace root and then to public directory
    const filePath = join(process.cwd(), "..", "..", "public", cleanPath);

    try {
      const fileContent = await readFile(filePath, "utf-8");
      const jsonContent = JSON.parse(fileContent);

      return NextResponse.json(jsonContent, {
        headers: {
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes
        },
      });
    } catch (fileError) {
      console.error("File read error:", fileError);
      return NextResponse.json(
        { error: "Configuration not found", path: cleanPath },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
