import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CoffeeProfile, ModifierGroup } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await params;

    const cafe = await db.cafe.findUnique({
      where: { slug: cafeSlug, isApproved: true, isActive: true },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { displayOrder: "asc" },
              include: {
                modifierGroups: {
                  include: { options: { orderBy: { isDefault: "desc" } } },
                },
              },
            },
          },
        },
        tables: { select: { id: true, tableNumber: true, qrToken: true } },
        kdsStations: { where: { isActive: true }, select: { id: true, name: true, stationType: true } },
      },
    });

    if (!cafe) {
      return NextResponse.json(
        { success: false, error: "کافه یافت نشد" },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const result = {
      ...cafe,
      amenities: JSON.parse(cafe.amenities),
      openingHours: JSON.parse(cafe.openingHours),
      categories: cafe.categories.map((cat) => ({
        ...cat,
        menuItems: cat.menuItems.map((item) => ({
          ...item,
          tags: JSON.parse(item.tags) as string[],
          allergens: JSON.parse(item.allergens) as string[],
          coffeeProfile: item.coffeeProfile
            ? (JSON.parse(item.coffeeProfile) as CoffeeProfile)
            : null,
          modifierGroups: item.modifierGroups.map(
            (g): ModifierGroup => ({
              id: g.id,
              name: g.name,
              isRequired: g.isRequired,
              minSelection: g.minSelection,
              maxSelection: g.maxSelection,
              options: g.options.map((o) => ({
                id: o.id,
                name: o.name,
                priceDelta: o.priceDelta,
                isDefault: o.isDefault,
              })),
            })
          ),
        })),
      })),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[MENU/CAFE]", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
