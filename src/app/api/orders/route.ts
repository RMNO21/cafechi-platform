import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CreateOrderSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

function generateOrderCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(Math.random() * 900 + 100);
  return `${letter}-${num}`;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "اطلاعات نامعتبر", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { cafeId, tableId, items, customerNotes, paymentMode } = parsed.data;

    // Fetch cafe to validate workflow mode
    const cafe = await db.cafe.findUnique({
      where: { id: cafeId, isApproved: true, isActive: true },
    });

    if (!cafe) {
      return NextResponse.json(
        { success: false, error: "کافه یافت نشد" },
        { status: 404 }
      );
    }

    // Fetch all menu items to calculate prices
    const itemIds = items.map((i) => i.menuItemId);
    const menuItems = await db.menuItem.findMany({
      where: { id: { in: itemIds }, cafeId, isAvailable: true },
      include: { category: { select: { stationId: true } } },
    });

    if (menuItems.length !== itemIds.length) {
      return NextResponse.json(
        { success: false, error: "برخی آیتم‌ها موجود نیستند" },
        { status: 400 }
      );
    }

    // Calculate order totals
    let subtotalAmount = 0;
    const orderItemsData = items.map((cartItem) => {
      const menuItem = menuItems.find((m) => m.id === cartItem.menuItemId)!;
      const basePrice = menuItem.discountPrice ?? menuItem.price;
      const modifierTotal = cartItem.selectedModifiers.reduce(
        (sum, mod) => sum + mod.priceDelta,
        0
      );
      const unitPrice = basePrice + modifierTotal;
      const totalPrice = unitPrice * cartItem.quantity;
      subtotalAmount += totalPrice;

      return {
        itemId: cartItem.menuItemId,
        stationId: menuItem.category.stationId ?? undefined,
        quantity: cartItem.quantity,
        unitPrice,
        totalPrice,
        selectedModifiers: JSON.stringify(cartItem.selectedModifiers),
        itemNotes: cartItem.itemNotes,
      };
    });

    // Assign buzzer number for PAY_UPFRONT_BUZZER
    const buzzerNumber =
      paymentMode === "PAY_UPFRONT_BUZZER"
        ? Math.floor(Math.random() * 99 + 1)
        : null;

    // Determine initial status based on payment mode
    const initialStatus =
      paymentMode === "PAY_UPFRONT_BUZZER"
        ? "PENDING_PAYMENT"
        : paymentMode === "TABLE_TAB_SPLIT"
        ? "CONFIRMED"
        : "PENDING_PAYMENT";

    const order = await db.order.create({
      data: {
        cafeId,
        tableId: tableId ?? null,
        customerId: session?.sub ?? null,
        orderCode: generateOrderCode(),
        buzzerNumber,
        status: initialStatus,
        paymentMode,
        paymentStatus: paymentMode === "TABLE_TAB_SPLIT" ? "UNPAID" : "UNPAID",
        subtotalAmount,
        totalAmount: subtotalAmount,
        customerNotes: customerNotes ?? null,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: { item: { select: { title: true, imageUrl: true } } },
        },
        table: { select: { tableNumber: true } },
      },
    });

    // Update reorder counts
    await Promise.all(
      items.map((i) =>
        db.menuItem.update({
          where: { id: i.menuItemId },
          data: { reorderCount: { increment: i.quantity } },
        })
      )
    );

    // Add loyalty stamp if customer is logged in
    if (session?.sub) {
      await db.loyaltyStamp.upsert({
        where: { userId_cafeId: { userId: session.sub, cafeId } },
        create: { userId: session.sub, cafeId, stampsCount: 1 },
        update: { stampsCount: { increment: 1 } },
      });
    }

    // Emit SSE event for KDS (write to a simple in-memory broadcast)
    // The SSE route polls for new orders, this is handled by the stream endpoint
    global.__kdsEvents = global.__kdsEvents ?? {};
    global.__kdsEvents[cafeId] = global.__kdsEvents[cafeId] ?? [];
    global.__kdsEvents[cafeId].push({
      type: "NEW_ORDER",
      cafeId,
      payload: {
        orderId: order.id,
        orderCode: order.orderCode,
        buzzerNumber: order.buzzerNumber,
        items: order.orderItems.map((oi) => ({
          id: oi.id,
          itemTitle: oi.item.title,
          quantity: oi.quantity,
          stationId: oi.stationId,
          stationStatus: oi.stationStatus,
        })),
        tableNumber: order.table?.tableNumber ?? null,
        createdAt: order.createdAt.toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: order.id,
          orderCode: order.orderCode,
          buzzerNumber: order.buzzerNumber,
          status: order.status,
          paymentMode: order.paymentMode,
          totalAmount: order.totalAmount,
          orderItems: order.orderItems,
          table: order.table,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ORDERS/POST]", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}

// Get orders for a cafe (owner/staff only)
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "CAFE_OWNER" && session.role !== "STAFF")) {
      return NextResponse.json(
        { success: false, error: "دسترسی محدود" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cafeId = searchParams.get("cafeId") ?? session.cafeId;

    if (!cafeId) {
      return NextResponse.json(
        { success: false, error: "cafeId الزامی است" },
        { status: 400 }
      );
    }

    const status = searchParams.get("status");
    const orders = await db.order.findMany({
      where: {
        cafeId,
        ...(status ? { status } : { status: { notIn: ["DELIVERED", "CANCELLED"] } }),
      },
      include: {
        orderItems: {
          include: {
            item: { select: { title: true, imageUrl: true } },
            station: { select: { name: true, stationType: true } },
          },
        },
        table: { select: { tableNumber: true } },
        customer: { select: { fullName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("[ORDERS/GET]", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
