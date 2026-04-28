import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Location from "@/models/Location";

export async function GET() {
  try {
    await connectDB();
    const locations = await Location.find().sort({ name: 1 });
    return NextResponse.json(locations);
  } catch (error) {
    console.error("GET /api/locations error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, icon, color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }

    const location = await Location.create({
      name: name.trim(),
      icon: icon || "📦",
      color: color || "#6b7280",
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "Name bereits vorhanden" }, { status: 409 });
    }
    console.error("POST /api/locations error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
