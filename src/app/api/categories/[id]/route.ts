import { NextRequest, NextResponse } from "next/server";
import {
  updateCategory,
  deleteCategory,
} from "@/services/category.service";
import { CategorySchema } from "@/schemas/product.schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = CategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const category = await updateCategory(id, validation.data);
    if (!category) {
      return NextResponse.json({ error: "Kategorie nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error("PUT /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = await deleteCategory(id);
    if (!deleted) {
      return NextResponse.json({ error: "Kategorie nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
