import { NextRequest, NextResponse } from "next/server";
import { getMovementsByProduct } from "@/services/movement.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const movements = await getMovementsByProduct(id);
    return NextResponse.json(movements);
  } catch (error) {
    console.error("GET /api/products/[id]/movements error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
