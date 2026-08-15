import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "دسترسی محدود" }, { status: 403 });
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      phone: true,
      fullName: true,
      role: true,
      loyaltyPoints: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: users });
}
