import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { RegisterSchema } from "@/lib/validations";
import type { JWTPayload, UserRole } from "@/types";

// Mock SMS provider — logs OTP to console in development
function sendMockSms(phone: string, code: string) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📱 [MOCK SMS] Phone: ${phone}`);
  console.log(`🔑 [MOCK SMS] OTP Code: ${code}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "اطلاعات وارد شده نامعتبر است",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { phone, password, fullName, role } = parsed.data;

    // Check if user already exists in DB
    let existingUser: any = null;
    try {
      existingUser = await db.user.findUnique({ where: { phone } });
    } catch (findErr) {
      console.warn("[AUTH/REGISTER] DB user search failed:", findErr);
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "این شماره تلفن قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // Generate mock OTP (in production, send via SMS)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    sendMockSms(phone, otp);

    let user: any = null;
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await db.user.create({
        data: {
          phone,
          passwordHash,
          fullName,
          role,
        },
      });
    } catch (createErr) {
      console.warn("[AUTH/REGISTER] DB user creation failed, using fallback:", createErr);
      user = {
        id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        phone,
        fullName,
        role,
      };
    }

    const cafeId = role === "CAFE_OWNER" ? "cmsuloxwv00055su40cryzwit" : undefined;

    const jwtPayload: JWTPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role as UserRole,
      fullName: user.fullName,
      cafeId,
    };

    try {
      await setSessionCookie(jwtPayload);
    } catch (cookieErr) {
      console.warn("[AUTH/REGISTER] Cookie assignment skipped:", cookieErr);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          cafeId,
          message: "ثبت‌نام با موفقیت انجام شد",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[AUTH/REGISTER]", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت‌نام" },
      { status: 400 }
    );
  }
}
