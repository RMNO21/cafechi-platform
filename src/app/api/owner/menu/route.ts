import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CreateMenuItemSchema, UpdateMenuItemSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// Create menu item
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CAFE_OWNER") {
      return NextResponse.json({ success: false, error: "دسترسی محدود" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateMenuItemSchema.safeParse(body);

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

    const { modifierGroups, coffeeProfile, tags, allergens, ...itemData } = parsed.data;

    const item = await db.menuItem.create({
      data: {
        ...itemData,
        cafeId: cafe.id,
        tags: JSON.stringify(tags),
        allergens: JSON.stringify(allergens),
        coffeeProfile: coffeeProfile ? JSON.stringify(coffeeProfile) : null,
        modifierGroups: {
          create: modifierGroups.map((g) => ({
            name: g.name,
            isRequired: g.isRequired,
            minSelection: g.minSelection,
            maxSelection: g.maxSelection,
            options: { create: g.options },
          })),
        },
      },
      include: {
        modifierGroups: { include: { options: true } },
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("[OWNER/MENU/POST]", error);
    return NextResponse.json({ success: false, error: "خطای سرور" }, { status: 500 });
  }
}
