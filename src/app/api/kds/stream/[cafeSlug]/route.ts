import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Real-time KDS stream using Server-Sent Events (SSE)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cafeSlug: string }> }
) {
  const { cafeSlug } = await params;

  // Validate cafe exists
  const cafe = await db.cafe.findUnique({
    where: { slug: cafeSlug },
    select: { id: true },
  });

  if (!cafe) {
    return NextResponse.json({ success: false, error: "کافه یافت نشد" }, { status: 404 });
  }

  const cafeId = cafe.id;

  // Initialize event queue for this cafe
  global.__kdsEvents = global.__kdsEvents ?? {};
  global.__kdsEvents[cafeId] = global.__kdsEvents[cafeId] ?? [];

  // Track the last processed event index for this connection
  let lastIndex = global.__kdsEvents[cafeId].length;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      const connectMsg = `data: ${JSON.stringify({ type: "CONNECTED", cafeId })}\n\n`;
      controller.enqueue(encoder.encode(connectMsg));

      // Send current active orders on connect
      (async () => {
        try {
          const activeOrders = await db.order.findMany({
            where: {
              cafeId,
              status: { notIn: ["DELIVERED", "CANCELLED"] },
            },
            include: {
              orderItems: {
                include: {
                  item: { select: { title: true, imageUrl: true } },
                  station: { select: { name: true, stationType: true } },
                },
              },
              table: { select: { tableNumber: true } },
            },
            orderBy: { createdAt: "desc" },
          });

          const initialMsg = `data: ${JSON.stringify({
            type: "INITIAL_STATE",
            cafeId,
            payload: activeOrders.map((o) => ({
              ...o,
              orderItems: o.orderItems.map((oi) => ({
                ...oi,
                selectedModifiers: JSON.parse(oi.selectedModifiers),
              })),
              createdAt: o.createdAt.toISOString(),
              updatedAt: o.updatedAt.toISOString(),
            })),
          })}\n\n`;
          controller.enqueue(encoder.encode(initialMsg));
        } catch (err) {
          console.error("[KDS_STREAM] Failed to fetch initial state:", err);
        }
      })();

      // Poll for new events every 500ms
      const interval = setInterval(() => {
        const events = global.__kdsEvents?.[cafeId] ?? [];

        if (events.length > lastIndex) {
          const newEvents = events.slice(lastIndex);
          lastIndex = events.length;

          // Trim old events to prevent memory leak
          if (events.length > 500 && global.__kdsEvents) {
            global.__kdsEvents[cafeId] = events.slice(-100);
            lastIndex = global.__kdsEvents[cafeId].length;
          }

          for (const event of newEvents) {
            try {
              const msg = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(encoder.encode(msg));
            } catch {
              // Stream closed
              clearInterval(interval);
            }
          }
        }

        // Heartbeat every 15s
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(interval);
        }
      }, 500);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
