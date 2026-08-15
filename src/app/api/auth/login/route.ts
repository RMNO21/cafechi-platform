import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie, signToken } from "@/lib/auth";
import { LoginSchema } from "@/lib/validations";
import type { JWTPayload, UserRole } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "اطلاعات وارد شده نامعتبر است", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { phone, password } = parsed.data;

    const user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "شماره تلفن یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "شماره تلفن یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    // For CAFE_OWNER, get their cafeId
    let cafeId: string | undefined;
    if (user.role === "CAFE_OWNER") {
      const cafe = await db.cafe.findFirst({ where: { ownerId: user.id } });
      cafeId = cafe?.id;
    }

    // For STAFF, get their primary cafe and station
    let stationId: string | undefined;
    if (user.role === "STAFF") {
      const permission = await db.staffPermission.findFirst({
        where: { userId: user.id },
      });
      cafeId = permission?.cafeId;
      stationId = permission?.stationId ?? undefined;
    }

    const jwtPayload: JWTPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role as UserRole,
      fullName: user.fullName,
      cafeId,
      stationId,
    };

    const token = await signToken(jwtPayload);
    await setSessionCookie(jwtPayload);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        cafeId,
        token,
      },
    });
  } catch (error) {
    console.error("[AUTH/LOGIN]", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
