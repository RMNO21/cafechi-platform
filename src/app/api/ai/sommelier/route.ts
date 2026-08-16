import { NextResponse } from 'next/server';
import { generateCoffeeSommelierRecommendation } from '@/lib/ai-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cafeSlug, query, preferences } = body;

    if (!cafeSlug) {
      return NextResponse.json(
        { success: false, error: 'شناسه کافه الزامی است' },
        { status: 400 }
      );
    }

    const result = await generateCoffeeSommelierRecommendation({
      cafeSlug,
      query,
      preferences,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API/AI/SOMMELIER]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در ارتباط با سرویس هوش مصنوعی',
      },
      { status: 500 }
    );
  }
}
