import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, createProduct } from "@/services/product.service";
import { ProductSchema } from "@/schemas/product.schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const status = searchParams.get("status") as "good" | "low" | "out" | undefined;

    const products = await getAllProducts({ search, categoryId, status });
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = ProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const product = await createProduct(validation.data);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    const message = error instanceof Error ? error.message : "Serverfehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
