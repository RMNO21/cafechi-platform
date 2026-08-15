import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UpdateMenuItemSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CAFE_OWNER") {
      return NextResponse.json({ success: false, error: "دسترسی محدود" }, { status: 403 });
    }

    const { itemId } = await params;
    const body = await request.json();
    const parsed = UpdateMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "اطلاعات نامعتبر", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
    const item = await db.menuItem.findUnique({
      where: { id: itemId },
      include: { cafe: { select: { ownerId: true } } },
    });

    if (!item || item.cafe.ownerId !== session.sub) {
      return NextResponse.json({ success: false, error: "آیتم یافت نشد یا دسترسی غیرمجاز" }, { status: 404 });
    }

    const { modifierGroups, coffeeProfile, tags, allergens, ...rest } = parsed.data;

    const updated = await db.menuItem.update({
      where: { id: itemId },
      data: {
        ...rest,
        ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
        ...(allergens !== undefined ? { allergens: JSON.stringify(allergens) } : {}),
        ...(coffeeProfile !== undefined ? { coffeeProfile: JSON.stringify(coffeeProfile) } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[OWNER/MENU/PATCH]", error);
    return NextResponse.json({ success: false, error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CAFE_OWNER") {
      return NextResponse.json({ success: false, error: "دسترسی محدود" }, { status: 403 });
    }

    const { itemId } = await params;

    const item = await db.menuItem.findUnique({
      where: { id: itemId },
      include: { cafe: { select: { ownerId: true } } },
    });

    if (!item || item.cafe.ownerId !== session.sub) {
      return NextResponse.json({ success: false, error: "آیتم یافت نشد" }, { status: 404 });
    }

    await db.menuItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true, data: { message: "آیتم حذف شد" } });
  } catch (error) {
    console.error("[OWNER/MENU/DELETE]", error);
    return NextResponse.json({ success: false, error: "خطای سرور" }, { status: 500 });
  }
}
