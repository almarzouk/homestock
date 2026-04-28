import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Location from "@/models/Location";

const DEFAULT_LOCATIONS = [
  { name: "Küche", icon: "🍳", color: "#f59e0b" },
  { name: "Lager", icon: "📦", color: "#6b7280" },
  { name: "Keller", icon: "🏚️", color: "#78716c" },
  { name: "Kühlschrank", icon: "❄️", color: "#60a5fa" },
  { name: "Tiefkühlschrank", icon: "🧊", color: "#38bdf8" },
  { name: "Vorratsschrank", icon: "🗄️", color: "#a78bfa" },
  { name: "Badezimmer", icon: "🛁", color: "#34d399" },
  { name: "Garage", icon: "🚗", color: "#94a3b8" },
];

export async function POST() {
  try {
    await connectDB();
    const results: { name: string; status: string }[] = [];

    for (const loc of DEFAULT_LOCATIONS) {
      const exists = await Location.findOne({ name: loc.name });
      if (exists) {
        results.push({ name: loc.name, status: "exists" });
      } else {
        await Location.create(loc);
        results.push({ name: loc.name, status: "created" });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
