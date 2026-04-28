import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  try {
    await connectDB();


    const email = "ju@gmail.com";
    const password = "Pass321@";

    // Delete any existing user with this email to allow re-seeding
    await User.deleteOne({ email });

    const hashed = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name: "Jumaa Al-Marzouk",
      email,
      password: hashed,
      role: "admin",
    });

    return NextResponse.json(
      {
        message: "Admin erfolgreich erstellt",
        user: { id: String(admin._id), email: admin.email, role: admin.role },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}
