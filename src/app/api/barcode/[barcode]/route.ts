import { NextRequest, NextResponse } from "next/server";
import { lookupBarcode } from "@/services/barcode.service";

interface RouteParams {
  params: Promise<{ barcode: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { barcode } = await params;
    const result = await lookupBarcode(barcode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/barcode/[barcode] error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
