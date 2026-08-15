import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Get "the usual" recommendations for logged-in customer at a cafe
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { cafeSlug } = await params;

    const cafe = await db.cafe.findUnique({
      where: { slug: cafeSlug },
      select: { id: true },
    });

    if (!cafe) {
      return NextResponse.json({ success: false, error: "کافه یافت نشد" }, { status: 404 });
    }

    // Find top 3 most-reordered items by this customer at this cafe
    const pastOrders = await db.order.findMany({
      where: {
        cafeId: cafe.id,
        customerId: session.sub,
        status: "DELIVERED",
      },
      include: {
        orderItems: {
          include: {
            item: {
              select: {
                id: true,
                title: true,
                price: true,
                discountPrice: true,
                imageUrl: true,
                isAvailable: true,
                coffeeProfile: true,
                allergens: true,
                tags: true,
                modifierGroups: {
                  include: { options: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Count frequency of each item
    const itemFreq = new Map<string, { item: typeof pastOrders[0]["orderItems"][0]["item"]; count: number }>();
    for (const order of pastOrders) {
      for (const oi of order.orderItems) {
        const existing = itemFreq.get(oi.item.id);
        if (existing) {
          existing.count += oi.quantity;
        } else {
          itemFreq.set(oi.item.id, { item: oi.item, count: oi.quantity });
        }
      }
    }

    // Sort by frequency, take top 3, filter available items
    const topItems = Array.from(itemFreq.values())
      .filter((e) => e.item.isAvailable)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((e) => ({
        ...e.item,
        tags: JSON.parse(e.item.tags),
        allergens: JSON.parse(e.item.allergens),
        coffeeProfile: e.item.coffeeProfile ? JSON.parse(e.item.coffeeProfile) : null,
        reorderFrequency: e.count,
      }));

    return NextResponse.json({ success: true, data: topItems });
  } catch (error) {
    console.error("[THE_USUAL]", error);
    return NextResponse.json({ success: false, error: "خطای سرور" }, { status: 500 });
  }
}
