import { NextRequest, NextResponse } from "next/server";
import { getAllCategories, createCategory } from "@/services/category.service";
import { CategorySchema } from "@/schemas/product.schema";

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = CategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const category = await createCategory(validation.data);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
