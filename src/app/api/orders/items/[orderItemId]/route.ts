import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UpdateItemStationStatusSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// Update a single order item's station status (for KDS)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderItemId: string }> }
) {
  try {
    const session = await getSession();
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

    const { orderItemId } = await params;
    const body = await request.json();
    const parsed = UpdateItemStationStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "وضعیت نامعتبر" },
        { status: 400 }
      );
    }

    const orderItem = await db.orderItem.update({
      where: { id: orderItemId },
      data: { stationStatus: parsed.data.stationStatus },
      include: {
        order: { select: { cafeId: true, id: true, orderCode: true } },
        item: { select: { title: true } },
      },
    });

    // Check if all items in order are DONE — auto-update order to READY
    const allItems = await db.orderItem.findMany({
      where: { orderId: orderItem.orderId },
    });

    const allDone = allItems.every((i) => i.stationStatus === "DONE");
    if (allDone) {
      await db.order.update({
        where: { id: orderItem.orderId },
        data: { status: "READY", updatedAt: new Date() },
      });

      // Emit ready event
      global.__kdsEvents = global.__kdsEvents ?? {};
      global.__kdsEvents[orderItem.order.cafeId] =
        global.__kdsEvents[orderItem.order.cafeId] ?? [];
      global.__kdsEvents[orderItem.order.cafeId].push({
        type: "ORDER_READY",
        cafeId: orderItem.order.cafeId,
        payload: { orderId: orderItem.orderId, orderCode: orderItem.order.orderCode },
      });
    }

    // Emit item status update event
    global.__kdsEvents = global.__kdsEvents ?? {};
    global.__kdsEvents[orderItem.order.cafeId] =
      global.__kdsEvents[orderItem.order.cafeId] ?? [];
    global.__kdsEvents[orderItem.order.cafeId].push({
      type: "ITEM_STATUS_UPDATE",
      cafeId: orderItem.order.cafeId,
      payload: {
        orderItemId: orderItem.id,
        orderId: orderItem.orderId,
        stationStatus: parsed.data.stationStatus,
        itemTitle: orderItem.item.title,
        allDone,
      },
    });

    return NextResponse.json({ success: true, data: orderItem });
  } catch (error) {
    console.error("[ORDER_ITEMS/PATCH]", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
