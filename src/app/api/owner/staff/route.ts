import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AddStaffSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// Add or update staff permission
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CAFE_OWNER") {
      return NextResponse.json({ success: false, error: "دسترسی محدود" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = AddStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "اطلاعات نامعتبر", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const cafe = await db.cafe.findFirst({ where: { ownerId: session.sub } });
    if (!cafe) {
      return NextResponse.json({ success: false, error: "کافه یافت نشد" }, { status: 404 });
    }

    // Find staff user by phone
    let staffUser = await db.user.findUnique({ where: { phone: parsed.data.phone } });

    if (!staffUser) {
      // Auto-create staff user (they can set password later)
      const bcrypt = await import("bcryptjs");
      const tmpHash = await bcrypt.hash("changeme123", 10);
      staffUser = await db.user.create({
        data: {
          phone: parsed.data.phone,
          passwordHash: tmpHash,
          fullName: "پرسنل جدید",
          role: "STAFF",
        },
      });
    }

    const permission = await db.staffPermission.upsert({
      where: { userId_cafeId: { userId: staffUser.id, cafeId: cafe.id } },
      create: {
        userId: staffUser.id,
        cafeId: cafe.id,
        stationId: parsed.data.stationId,
        canEditMenu: parsed.data.canEditMenu,
        canToggleStock: parsed.data.canToggleStock,
        canEditPrices: parsed.data.canEditPrices,
        canManageOrders: parsed.data.canManageOrders,
        canViewAnalytics: parsed.data.canViewAnalytics,
      },
      update: {
        stationId: parsed.data.stationId,
        canEditMenu: parsed.data.canEditMenu,
        canToggleStock: parsed.data.canToggleStock,
        canEditPrices: parsed.data.canEditPrices,
        canManageOrders: parsed.data.canManageOrders,
        canViewAnalytics: parsed.data.canViewAnalytics,
      },
    });

    return NextResponse.json({ success: true, data: permission }, { status: 201 });
  } catch (error) {
    console.error("[OWNER/STAFF/POST]", error);
    return NextResponse.json({ success: false, error: "خطای سرور" }, { status: 500 });
  }
}

// Remove staff permission
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CAFE_OWNER") {
      return NextResponse.json({ success: false, error: "دسترسی محدود" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId الزامی است" }, { status: 400 });
    }

    const cafe = await db.cafe.findFirst({ where: { ownerId: session.sub } });
    if (!cafe) {
      return NextResponse.json({ success: false, error: "کافه یافت نشد" }, { status: 404 });
    }

    await db.staffPermission.deleteMany({
      where: { userId, cafeId: cafe.id },
    });

    return NextResponse.json({ success: true, data: { message: "دسترسی پرسنل حذف شد" } });
  } catch (error) {
    console.error("[OWNER/STAFF/DELETE]", error);
    return NextResponse.json({ success: false, error: "خطای سرور" }, { status: 500 });
  }
}
