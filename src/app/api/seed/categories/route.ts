import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

const CATEGORIES = [
  { name: "Milchprodukte",        color: "#60a5fa" }, // blue-400
  { name: "Fleisch & Wurst",      color: "#f87171" }, // red-400
  { name: "Obst & Gemüse",        color: "#4ade80" }, // green-400
  { name: "Brot & Backwaren",     color: "#fbbf24" }, // amber-400
  { name: "Tiefkühlprodukte",     color: "#38bdf8" }, // sky-400
  { name: "Getränke",             color: "#34d399" }, // emerald-400
  { name: "Konserven",            color: "#fb923c" }, // orange-400
  { name: "Nudeln & Reis",        color: "#facc15" }, // yellow-400
  { name: "Süßwaren & Snacks",    color: "#f472b6" }, // pink-400
  { name: "Gewürze & Saucen",     color: "#a78bfa" }, // violet-400
  { name: "Öl & Fett",            color: "#d97706" }, // amber-600
  { name: "Backzutaten",          color: "#fde68a" }, // amber-200
  { name: "Frühstück & Cerealien",color: "#86efac" }, // green-300
  { name: "Hygiene & Pflege",     color: "#67e8f9" }, // cyan-300
  { name: "Reinigungsmittel",     color: "#818cf8" }, // indigo-400
  { name: "Körperpflege",         color: "#fb7185" }, // rose-400
  { name: "Babyprodukte",         color: "#bbf7d0" }, // green-200
  { name: "Tierbedarf",           color: "#d4a574" }, // custom earth
  { name: "Haushaltsartikel",     color: "#94a3b8" }, // slate-400
  { name: "Sonstiges",            color: "#cbd5e1" }, // slate-300
];

export async function POST() {
  try {
    await connectDB();

    const results: { name: string; status: string }[] = [];

    for (const cat of CATEGORIES) {
      const exists = await Category.findOne({ name: cat.name });
      if (exists) {
        results.push({ name: cat.name, status: "already exists" });
        continue;
      }
      await Category.create(cat);
      results.push({ name: cat.name, status: "created" });
    }

    const created = results.filter((r) => r.status === "created").length;
    const skipped = results.filter((r) => r.status === "already exists").length;

    return NextResponse.json({
      message: `${created} Kategorien erstellt, ${skipped} bereits vorhanden`,
      results,
    });
  } catch (error) {
    console.error("Category seed error:", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
