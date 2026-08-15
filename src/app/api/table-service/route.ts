import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CreateTableServiceRequestSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateTableServiceRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "اطلاعات نامعتبر", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { cafeId, tableId, tableNumber, requestType, note } = parsed.data;

    let resolvedTableId = tableId;
    const existingTable = await db.table.findFirst({
      where: {
        OR: [
          { id: tableId },
          { cafeId, tableNumber },
          { cafeId },
        ],
      },
    });

    if (existingTable) {
      resolvedTableId = existingTable.id;
    }

    const req = await db.tableServiceRequest.create({
      data: { cafeId, tableId: resolvedTableId, tableNumber, requestType, note },
    });

    // Emit SSE event for KDS
    const requestLabels: Record<string, string> = {
      CALL_WAITER: "احضار گارسون",
      REQUEST_BILL: "درخواست صورتحساب",
      REQUEST_WATER: "درخواست آب",
      REQUEST_POS: "درخواست کارتخوان",
      GAME_REQUEST: "همبازی‌یابی بردگیم",
    };

    global.__kdsEvents = global.__kdsEvents ?? {};
    global.__kdsEvents[cafeId] = global.__kdsEvents[cafeId] ?? [];
    global.__kdsEvents[cafeId].push({
      type: "TABLE_SERVICE",
      cafeId,
      payload: {
        id: req.id,
        tableNumber,
        requestType,
        label: requestLabels[requestType] ?? requestType,
        note,
        createdAt: req.createdAt.toISOString(),
      },
    });

    return NextResponse.json(
      { success: true, data: req },
      { status: 201 }
    );
  } catch (error) {
    console.error("[TABLE_SERVICE/POST]", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const cafeId = searchParams.get("cafeId") ?? session.cafeId;

    if (!cafeId) {
      return NextResponse.json(
        { success: false, error: "cafeId الزامی است" },
        { status: 400 }
      );
    }

    const requests = await db.tableServiceRequest.findMany({
      where: { cafeId, status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("[TABLE_SERVICE/GET]", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STAFF" && session.role !== "CAFE_OWNER")) {
      return NextResponse.json({ success: false, error: "دسترسی محدود" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body as { id: string; status: string };

    const updated = await db.tableServiceRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[TABLE_SERVICE/PATCH]", error);
    return NextResponse.json({ success: false, error: "خطای سرور" }, { status: 500 });
  }
}
