import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { haversineDistance, isCafeOpenNow } from "@/lib/haversine";
import { DiscoveryQuerySchema } from "@/lib/validations";
import type { CafeAmenities } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = DiscoveryQuerySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "پارامترهای نامعتبر" },
        { status: 400 }
      );
    }

    const {
      q,
      lat,
      lng,
      radius,
      wifi,
      smoking,
      outdoor,
      board_games,
      work_friendly,
      pet_friendly,
      openNow,
      businessType,
    } = parsed.data;

    // Fetch all approved active cafes
    const cafes = await db.cafe.findMany({
      where: {
        isApproved: true,
        isActive: true,
        ...(businessType ? { businessType } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { description: { contains: q } },
                { address: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        owner: { select: { fullName: true } },
        kdsStations: { select: { id: true, name: true, stationType: true } },
      },
    });

    // Process cafes with computed fields
    let results = cafes.map((cafe) => {
      const amenities = JSON.parse(cafe.amenities) as CafeAmenities;
      const isOpenNow = isCafeOpenNow(cafe.openingHours);
      const distance =
        lat !== undefined && lng !== undefined
          ? haversineDistance(lat, lng, cafe.latitude, cafe.longitude)
          : null;

      return {
        id: cafe.id,
        name: cafe.name,
        slug: cafe.slug,
        description: cafe.description,
        logoUrl: cafe.logoUrl,
        coverUrl: cafe.coverUrl,
        address: cafe.address,
        latitude: cafe.latitude,
        longitude: cafe.longitude,
        phoneNumber: cafe.phoneNumber,
        businessType: cafe.businessType,
        workflowMode: cafe.workflowMode,
        themeId: cafe.themeId,
        amenities,
        isOpenNow,
        distance, // km
        isApproved: cafe.isApproved,
        isActive: cafe.isActive,
      };
    });

    // Filter by radius (geolocation)
    if (lat !== undefined && lng !== undefined) {
      results = results.filter((c) => c.distance !== null && c.distance <= radius);
      results.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    }

    // Filter by amenities
    if (wifi !== undefined) results = results.filter((c) => c.amenities.wifi === wifi);
    if (smoking !== undefined) results = results.filter((c) => c.amenities.smoking === smoking);
    if (outdoor !== undefined) results = results.filter((c) => c.amenities.outdoor === outdoor);
    if (board_games !== undefined) results = results.filter((c) => c.amenities.board_games === board_games);
    if (work_friendly !== undefined) results = results.filter((c) => c.amenities.work_friendly === work_friendly);
    if (pet_friendly !== undefined) results = results.filter((c) => c.amenities.pet_friendly === pet_friendly);

    // Filter open now
    if (openNow) results = results.filter((c) => c.isOpenNow);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("[DISCOVERY]", error);
    return NextResponse.json(
      { success: false, error: "خطای سرور" },
      { status: 500 }
    );
  }
}
