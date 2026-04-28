import { NextResponse } from "next/server";
import { getAlerts } from "@/services/alert.service";

export async function GET() {
  try {
    const alerts = await getAlerts();
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("GET /api/alerts error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
