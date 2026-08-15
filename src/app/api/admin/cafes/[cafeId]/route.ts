import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cafeId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "دسترسی محدود" }, { status: 403 });
  }

  const { cafeId } = await params;
  const body = await request.json();

  const updated = await db.cafe.update({
    where: { id: cafeId },
    data: {
      isApproved: body.isApproved !== undefined ? body.isApproved : undefined,
      isActive: body.isActive !== undefined ? body.isActive : undefined,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
