import { NextResponse } from "next/server";
import { getShoppingList } from "@/services/shopping-list.service";

export async function GET() {
  try {
    const items = await getShoppingList();
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/shopping-list error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
