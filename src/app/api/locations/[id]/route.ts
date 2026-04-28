import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Location from "@/models/Location";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { name, icon, color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }

    const location = await Location.findByIdAndUpdate(
      id,
      { name: name.trim(), icon: icon || "📦", color: color || "#6b7280" },
      { new: true }
    );

    if (!location) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error("PUT /api/locations/:id error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    await Location.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/locations/:id error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
