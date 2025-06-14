import {
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("file");

  const configsDir = path.resolve(process.cwd(), "public/configs");

  try {
    if (!filename) {
      // Return list of available config files with metadata
      const files = readdirSync(configsDir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => {
          const filePath = path.join(configsDir, f);
          const stats = statSync(filePath);
          return {
            name: f,
            lastModified: stats.mtime.getTime(),
            size: stats.size,
          };
        });
      return NextResponse.json(files);
    }

    // Return specific config file with metadata
    const filePath = path.join(configsDir, filename);
    const content = readFileSync(filePath, "utf-8");
    const stats = statSync(filePath);

    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/json",
        "Last-Modified": stats.mtime.toUTCString(),
        "X-File-Size": stats.size.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const configsDir = path.resolve(process.cwd(), "public/configs");
    const body = await request.json();

    // Validate required fields
    if (!body.filename || !body.config) {
      return NextResponse.json(
        { error: "Missing required fields: filename, config" },
        { status: 400 },
      );
    }

    const filename = body.filename.endsWith(".json")
      ? body.filename
      : `${body.filename}.json`;
    const filePath = path.join(configsDir, filename);

    // Check if file already exists
    try {
      statSync(filePath);
      return NextResponse.json(
        { error: "Config file already exists" },
        { status: 409 },
      );
    } catch {
      // File doesn't exist, which is what we want for POST
    }

    // Write the config file
    writeFileSync(filePath, JSON.stringify(body.config, null, 2), "utf-8");

    // Return success with file metadata
    const stats = statSync(filePath);
    return NextResponse.json(
      {
        message: "Config created successfully",
        filename,
        lastModified: stats.mtime.getTime(),
        size: stats.size,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating config:", error);
    return NextResponse.json(
      { error: "Failed to create config file" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("file");

    if (!filename) {
      return NextResponse.json(
        { error: "Missing filename parameter" },
        { status: 400 },
      );
    }

    const configsDir = path.resolve(process.cwd(), "public/configs");
    const filePath = path.join(configsDir, filename);
    const body = await request.json();
    // Check if file exists
    let originalStats: Stats
    try {
      originalStats = statSync(filePath)
    } catch {
      return NextResponse.json(
        { error: "Config file not found" },
        { status: 404 },
      );
    }

    // Optimistic concurrency control
    const ifUnmodifiedSince = request.headers.get("If-Unmodified-Since");
    if (ifUnmodifiedSince) {
      const clientLastModified = new Date(ifUnmodifiedSince).getTime();
      if (originalStats.mtime.getTime() > clientLastModified) {
        return NextResponse.json(
          {
            error: "Config file has been modified by another process",
            serverLastModified: originalStats.mtime.getTime(),
            clientLastModified,
          },
          { status: 409 },
        );
      }
    }

    // Write the updated config
    writeFileSync(filePath, JSON.stringify(body, null, 2), "utf-8");

    // Return success with new metadata
    const newStats = statSync(filePath);
    return NextResponse.json({
      message: "Config updated successfully",
      filename,
      lastModified: newStats.mtime.getTime(),
      size: newStats.size,
    });
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { error: "Failed to update config file" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("file");

    if (!filename) {
      return NextResponse.json(
        { error: "Missing filename parameter" },
        { status: 400 },
      );
    }

    const configsDir = path.resolve(process.cwd(), "public/configs");
    const filePath = path.join(configsDir, filename);

    // Check if file exists
    try {
      statSync(filePath);
    } catch {
      return NextResponse.json(
        { error: "Config file not found" },
        { status: 404 },
      );
    }

    // Delete the file
    unlinkSync(filePath);

    return NextResponse.json({
      message: "Config deleted successfully",
      filename,
    });
  } catch (error) {
    console.error("Error deleting config:", error);
    return NextResponse.json(
      { error: "Failed to delete config file" },
      { status: 500 },
    );
  }
}
