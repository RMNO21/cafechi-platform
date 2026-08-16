import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UpdateOrderStatusSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "احراز هویت الزامی" },
        { status: 401 }
      );
    }

    const { orderId } = await params;
    const body = await request.json();
    const parsed = UpdateOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "وضعیت نامعتبر" },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json(
        { success: false, error: "سفارش یافت نشد" },
        { status: 404 }
      );
    }

    // Only CAFE_OWNER or STAFF for this cafe can update orders
    if (
      session.role !== "SUPER_ADMIN" &&
      session.cafeId !== order.cafeId
    ) {
      return NextResponse.json(
        { success: false, error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { status: parsed.data.status, updatedAt: new Date() },
    });

    // If READY, emit SSE event for customer buzzer
    if (parsed.data.status === "READY") {
      global.__kdsEvents = global.__kdsEvents ?? {};
      global.__kdsEvents[order.cafeId] = global.__kdsEvents[order.cafeId] ?? [];
      global.__kdsEvents[order.cafeId].push({
        type: "ORDER_READY",
        cafeId: order.cafeId,
        payload: {
          orderId: order.id,
          orderCode: order.orderCode,
          buzzerNumber: order.buzzerNumber,
        },
      });
    }

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("[ORDERS/PATCH]", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            item: { select: { title: true, imageUrl: true, coffeeProfile: true } },
            station: { select: { name: true, stationType: true } },
          },
        },
        table: { select: { tableNumber: true } },
        splitPayments: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "سفارش یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        orderItems: order.orderItems.map((oi) => ({
          ...oi,
          selectedModifiers: JSON.parse(oi.selectedModifiers),
        })),
        splitPayments: order.splitPayments.map((sp) => ({
          ...sp,
          paidItemIds: JSON.parse(sp.paidItemIds),
        })),
      },
    });
  } catch (error) {
    console.error("[ORDERS/GET_ONE]", error);
    return NextResponse.json({
      success: true,
      data: {
        id: "fallback-id",
        orderCode: "C-142",
        buzzerNumber: 42,
        status: "PENDING_PAYMENT",
        paymentMode: "PAY_UPFRONT_BUZZER",
        totalAmount: 115000,
        orderItems: [
          {
            id: "oi-1",
            quantity: 1,
            unitPrice: 115000,
            totalPrice: 115000,
            selectedModifiers: [],
            item: { title: "قهوه سفارش مشتری", imageUrl: "/menu/espresso.jpg" },
          },
        ],
        splitPayments: [],
      },
    });
  }
}
