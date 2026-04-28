import { NextRequest, NextResponse } from "next/server";
import { getAllMovements, createMovement } from "@/services/movement.service";
import { MovementSchema } from "@/schemas/product.schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const movements = await getAllMovements(limit);
    return NextResponse.json(movements);
  } catch (error) {
    console.error("GET /api/movements error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = MovementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const movement = await createMovement(validation.data);
    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error("POST /api/movements error:", error);
    const message = error instanceof Error ? error.message : "Serverfehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
