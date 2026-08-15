import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ToggleStockSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// Toggle menu item availability (86-ing)
export async function PATCH(request: Request) {
  try {
    const session = await getSession(request);
    if (
      !session ||
      (session.role !== "STAFF" &&
        session.role !== "CAFE_OWNER" &&
        session.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json(
        { success: false, error: "دسترسی محدود" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = ToggleStockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "اطلاعات نامعتبر" },
        { status: 400 }
      );
    }

    const { itemId, isAvailable } = parsed.data;

    // Verify the item belongs to the staff's cafe
    const item = await db.menuItem.findUnique({
      where: { id: itemId },
      select: { cafeId: true, title: true },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "آیتم یافت نشد" },
        { status: 404 }
      );
    }

    let hasPermission = session.role === "SUPER_ADMIN" || item.cafeId === session.cafeId;
    if (!hasPermission && session.role === "STAFF") {
      const staffPerm = await db.staffPermission.findFirst({
        where: { userId: session.sub, cafeId: item.cafeId },
      });
      if (staffPerm) hasPermission = true;
    }
    if (!hasPermission && session.role === "CAFE_OWNER") {
      const isOwner = await db.cafe.findFirst({
        where: { id: item.cafeId, ownerId: session.sub },
      });
      if (isOwner) hasPermission = true;
    }

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    await db.menuItem.update({
      where: { id: itemId },
      data: { isAvailable },
    });

    // Emit SSE event to notify all connected clients
    global.__kdsEvents = global.__kdsEvents ?? {};
    global.__kdsEvents[item.cafeId] = global.__kdsEvents[item.cafeId] ?? [];
    global.__kdsEvents[item.cafeId].push({
      type: "ITEM_86ED",
      cafeId: item.cafeId,
      payload: { itemId, itemTitle: item.title, isAvailable },
    });

    return NextResponse.json({
      success: true,
      data: {
        itemId,
        isAvailable,
        message: isAvailable
          ? `${item.title} موجود شد`
          : `${item.title} ناموجود شد (86)`,
      },
    });
  } catch (error) {
    console.error("[STOCK/TOGGLE]", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
