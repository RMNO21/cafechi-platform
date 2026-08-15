import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UpdateCafeSchema, AddStaffSchema } from "@/lib/validations";
import type { CafeAmenities } from "@/types";

export const dynamic = "force-dynamic";

// GET cafe details for owner
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CAFE_OWNER") {
      return NextResponse.json({ success: false, error: "دسترسی محدود" }, { status: 403 });
    }

    const cafe = await db.cafe.findFirst({
      where: { ownerId: session.sub },
      include: {
        kdsStations: true,
        categories: {
          include: {
            menuItems: {
              include: { modifierGroups: { include: { options: true } } },
              orderBy: { displayOrder: "asc" },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
        tables: { orderBy: { tableNumber: "asc" } },
        staffPermissions: {
          include: {
            user: { select: { id: true, fullName: true, phone: true } },
            station: { select: { id: true, name: true, stationType: true } },
          },
        },
      },
    });

    if (!cafe) {
      return NextResponse.json({ success: false, error: "کافه یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...cafe,
        amenities: JSON.parse(cafe.amenities),
        openingHours: JSON.parse(cafe.openingHours),
        categories: cafe.categories.map((cat) => ({
          ...cat,
          menuItems: cat.menuItems.map((item) => ({
            ...item,
            tags: JSON.parse(item.tags),
            allergens: JSON.parse(item.allergens),
            coffeeProfile: item.coffeeProfile ? JSON.parse(item.coffeeProfile) : null,
          })),
        })),
      },
    });
  } catch (error) {
    console.error("[OWNER/CAFE/GET]", error);
    return NextResponse.json({ success: false, error: "خطای سرور" }, { status: 500 });
  }
}

// UPDATE cafe settings
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CAFE_OWNER") {
      return NextResponse.json({ success: false, error: "دسترسی محدود" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateCafeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "اطلاعات نامعتبر", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { amenities, openingHours, ...rest } = parsed.data;

    const cafe = await db.cafe.findFirst({ where: { ownerId: session.sub } });
    if (!cafe) {
      return NextResponse.json({ success: false, error: "کافه یافت نشد" }, { status: 404 });
    }

    const updated = await db.cafe.update({
      where: { id: cafe.id },
      data: {
        ...rest,
        ...(amenities ? { amenities: JSON.stringify(amenities) } : {}),
        ...(openingHours ? { openingHours: JSON.stringify(openingHours) } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[OWNER/CAFE/PATCH]", error);
    return NextResponse.json({ success: false, error: "خطای سرور" }, { status: 500 });
  }
}
