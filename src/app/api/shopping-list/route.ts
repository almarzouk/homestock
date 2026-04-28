import { NextRequest, NextResponse } from "next/server";
import {
  getShoppingList,
  addToShoppingList,
  removeFromShoppingList,
} from "@/services/shopping-list.service";

export async function GET() {
  try {
    const items = await getShoppingList();
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/shopping-list error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "productId fehlt" }, { status: 400 });
    await addToShoppingList(productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/shopping-list error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "productId fehlt" }, { status: 400 });
    await removeFromShoppingList(productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/shopping-list error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
