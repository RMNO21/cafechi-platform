import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "احراز هویت نشده" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        phone: true,
        fullName: true,
        role: true,
        loyaltyPoints: true,
        createdAt: true,
        ownedCafes: {
          select: { id: true, name: true, slug: true, themeId: true, workflowMode: true },
        },
        staffPermissions: {
          select: {
            cafeId: true,
            stationId: true,
            canEditMenu: true,
            canToggleStock: true,
            canEditPrices: true,
            canManageOrders: true,
            canViewAnalytics: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[AUTH/ME]", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
