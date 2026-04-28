import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/** GET /api/setup — returns whether the app has been set up yet */
export async function GET() {
  try {
    await connectDB();
    const count = await User.countDocuments();
    return NextResponse.json({ hasUsers: count > 0 });
  } catch (error) {
    console.error("GET /api/setup error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

/** POST /api/setup — creates the first admin user (only allowed when no users exist) */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Safety check: refuse if users already exist
    const count = await User.countDocuments();
    if (count > 0) {
      return NextResponse.json(
        { error: "Setup bereits abgeschlossen" },
        { status: 403 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-Mail und Passwort sind erforderlich" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 6 Zeichen haben" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name: "Admin",
      email: email.trim().toLowerCase(),
      password: hashed,
      role: "admin",
    });

    return NextResponse.json(
      {
        message: "Admin-Konto erfolgreich erstellt",
        user: { id: String(admin._id), email: admin.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/setup error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
