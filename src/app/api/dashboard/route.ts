import { NextResponse } from "next/server";
import { getTotalProductCount } from "@/services/product.service";
import { getAlertCounts } from "@/services/alert.service";
import { getRecentMovements } from "@/services/movement.service";

export async function GET() {
  try {
    const [totalProducts, alertCounts, recentMovements] = await Promise.all([
      getTotalProductCount(),
      getAlertCounts(),
      getRecentMovements(5),
    ]);

    return NextResponse.json({
      totalProducts,
      ...alertCounts,
      recentMovements,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
