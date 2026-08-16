import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import type { MenuItem } from '@/types';

export interface TasteProfile {
  acidity?: number; // 0-10
  body?: number; // 0-10
  sweetness?: number; // 0-10
  bitterness?: number; // 0-10
  aroma?: number; // 0-10
  budgetMax?: number;
  timeOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  mood?: string;
}

export interface AISommelierRequest {
  cafeSlug: string;
  query?: string;
  preferences?: TasteProfile;
}

export interface AISommelierResponse {
  success: boolean;
  recommendation: string;
  suggestedItems: {
    id: string;
    title: string;
    price: number;
    reason: string;
    imageUrl?: string;
  }[];
  pairingNotes?: string;
  source: 'gemini' | 'openai' | 'expert_rules';
}

/**
 * Executes dynamic LLM inference using Gemini or OpenAI, falling back to expert coffee Sommelier rules if keys are unavailable.
 */
export async function generateCoffeeSommelierRecommendation(
  req: AISommelierRequest
): Promise<AISommelierResponse> {
  const { cafeSlug, query = '', preferences = {} } = req;

  // 1. Fetch real dynamic menu items for this cafe from DB
  let menuItems: any[] = [];
  try {
    const cafe = await db.cafe.findFirst({
      where: { slug: cafeSlug },
      include: {
        categories: {
          include: {
            menuItems: true,
          },
        },
      },
    });

    if (cafe?.categories) {
      menuItems = cafe.categories.flatMap((cat) => cat.menuItems || []);
    }
  } catch (dbErr) {
    console.warn('[AI/SOMMELIER] DB fetch failed, using available menu fallback:', dbErr);
  }

  // Format menu for LLM prompt context
  const menuContext = menuItems
    .map(
      (item) =>
        `- ID: ${item.id} | Title: "${item.title || item.name}" | Price: ${item.price.toLocaleString()} Tomans | Description: "${item.description || ''}"`
    )
    .join('\n');

  const systemPrompt = `شما "کافه‌چی هوشمند"، یک باریستای حرفه‌ای و متخصص قهوه (Coffee Sommelier) هستید. 
وظیفه شما راهنمایی مشتریان کافه برای انتخاب بهترین نوشیدنی و شیرینی متناسب با ذائقه، بودجه و زمان روز است.

لیست منوی واقعی این کافه به شرح زیر است:
${menuContext || '- اسپرسو تخصصی | ۱۲۵,۰۰۰ تومان\n- V60 پورآور | ۱۴۵,۰۰۰ تومان\n- کلد برو | ۱۳۵,۰۰۰ تومان\n- چیزکیک | ۱۴۵,۰۰۰ تومان'}

پاسخ شما باید لحن بسیار محترمانه، گرم و تخصصی به زبان فارسی داشته باشد و مستقیماً آیتم‌های موجود در منوی فوق را پیشنهاد دهد.`;

  const userPrompt = `درخواست مشتری: "${query || 'پیشنهاد اختصاصی براساس ذائقه me'}"
مشخصات ذائقه:
- اسیدیته (ترشی): ${preferences.acidity ?? 'متوسط'}/10
- بادی (سنگینی): ${preferences.body ?? 'متوسط'}/10
- شیرینی: ${preferences.sweetness ?? 'متوسط'}/10
- تلخی: ${preferences.bitterness ?? 'متوسط'}/10
- عطر: ${preferences.aroma ?? 'متوسط'}/10
${preferences.budgetMax ? `- حداکثر بودجه: ${preferences.budgetMax.toLocaleString()} تومان` : ''}

لطفاً ۱ تا ۳ آیتم دقیق از منو را با علت پیشنهاد و نکات مکمل (پیرینگ) توضیح دهید.`;

  // 2. Try Gemini API if GEMINI_API_KEY is available
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
      });

      const text = response.text || '';
      if (text) {
        const matchedItems = extractMatchedItemsFromMenu(text, menuItems);
        return {
          success: true,
          recommendation: text,
          suggestedItems: matchedItems,
          pairingNotes: 'پیشنهاد با هوش مصنوعی Google Gemini 2.5 تولید شده است.',
          source: 'gemini',
        };
      }
    } catch (geminiErr) {
      console.warn('[AI/SOMMELIER] Gemini API failed, checking OpenAI fallback:', geminiErr);
    }
  }

  // 3. Try OpenAI API if OPENAI_API_KEY is available
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      });

      const text = completion.choices[0]?.message?.content || '';
      if (text) {
        const matchedItems = extractMatchedItemsFromMenu(text, menuItems);
        return {
          success: true,
          recommendation: text,
          suggestedItems: matchedItems,
          pairingNotes: 'پیشنهاد با هوش مصنوعی OpenAI GPT-4o تولید شده است.',
          source: 'openai',
        };
      }
    } catch (openaiErr) {
      console.warn('[AI/SOMMELIER] OpenAI API failed, using Sommelier Expert Rules:', openaiErr);
    }
  }

  // 4. Expert Sommelier Rule-Based Fallback (Zero-latency offline engine)
  return generateRuleBasedSommelierResponse(query, preferences, menuItems);
}

/**
 * Matches titles in LLM text output back to real database menu item IDs and metadata.
 */
function extractMatchedItemsFromMenu(text: string, menuItems: any[]) {
  const matched: any[] = [];
  for (const item of menuItems) {
    const title = item.title || item.name;
    if (title && text.includes(title)) {
      matched.push({
        id: item.id,
        title,
        price: item.price,
        reason: 'تطابق کامل با مشخصات طعمی انتخابی شما',
        imageUrl: item.imageUrl,
      });
    }
  }

  if (matched.length === 0 && menuItems.length > 0) {
    // Pick top 2 menu items as default picks
    matched.push(
      ...menuItems.slice(0, 2).map((item) => ({
        id: item.id,
        title: item.title || item.name,
        price: item.price,
        reason: 'محبوب‌ترین پیشنهاد باریستای کافه‌چی',
        imageUrl: item.imageUrl,
      }))
    );
  }

  return matched;
}

/**
 * Rule-based Coffee Sommelier fallback when external API keys are not present.
 */
function generateRuleBasedSommelierResponse(
  query: string,
  pref: TasteProfile,
  menuItems: any[]
): AISommelierResponse {
  const acidity = pref.acidity ?? 5;
  const body = pref.body ?? 5;
  const sweetness = pref.sweetness ?? 5;

  let recommendationText = '';
  const matchedItems: any[] = [];

  if (acidity >= 7) {
    recommendationText = `بر اساس علاقه‌مندی شما به اسیدیته و ترشی میوه‌ای، دم‌آوری دستی V60 با دانه‌های اتیوپی یا کنیا پیشنهادی ایده‌آل است. این قهوه طعم‌یادهای مرکباتی، شفاف و عطر گل‌های بهاری دارد.`;
    const v60 = menuItems.find((i) => (i.title || i.name)?.includes('V60') || (i.title || i.name)?.includes('دم‌آوری'));
    if (v60) matchedItems.push({ id: v60.id, title: v60.title || v60.name, price: v60.price, reason: 'ترشی شفاف میوه‌ای و نت‌های مرکباتی', imageUrl: v60.imageUrl });
  } else if (sweetness >= 7 || pref.mood?.includes('شیرین')) {
    recommendationText = `برای ذائقه شیرین‌پسند شما، آیس لاته، ماکیاتو کارامل یا آفوگاتو پیشنهادی فوق‌العاده است که تلخی قهوه را با شیرینی ملایم متعادل می‌کند.`;
    const sweetItem = menuItems.find((i) => (i.title || i.name)?.includes('لاته') || (i.title || i.name)?.includes('آفوگاتو'));
    if (sweetItem) matchedItems.push({ id: sweetItem.id, title: sweetItem.title || sweetItem.name, price: sweetItem.price, reason: 'تعادل عالی طعم قهوه و شیرینی ملایم', imageUrl: sweetItem.imageUrl });
  } else if (body >= 7) {
    recommendationText = `برای علاقه‌مندان به بادی سنگین و تلخی اصیل، اسپرسو تخصصی دوبل با دانه‌های برزیل یا گواتمالا همراه با چیزکیک نیویورکی ترکیب بسیار جذابی خواهد بود.`;
    const espresso = menuItems.find((i) => (i.title || i.name)?.includes('اسپرسو'));
    if (espresso) matchedItems.push({ id: espresso.id, title: espresso.title || espresso.name, price: espresso.price, reason: 'بادی سنگین، غلظت عالی و تلخی دلنشین', imageUrl: espresso.imageUrl });
  } else {
    recommendationText = `پیشنهاد ویژه باریستای کافه‌چی برای شما: کلد برو ۲۴ ساعته یا فلت وایت به همراه کروسان کره‌ای است که طعمی بالانس، آرام‌بخش و دلچسب دارد.`;
    const defaultItem = menuItems[0];
    if (defaultItem) matchedItems.push({ id: defaultItem.id, title: defaultItem.title || defaultItem.name, price: defaultItem.price, reason: 'طعم متعادل و محبوب مشتریان', imageUrl: defaultItem.imageUrl });
  }

  // Pair with pastry if available
  const pastry = menuItems.find((i) => (i.title || i.name)?.includes('چیزکیک') || (i.title || i.name)?.includes('کروسان') || (i.title || i.name)?.includes('تیرامیسو'));
  if (pastry && !matchedItems.some((m) => m.id === pastry.id)) {
    matchedItems.push({
      id: pastry.id,
      title: pastry.title || pastry.name,
      price: pastry.price,
      reason: 'مکمل فوق‌العاده شیرینی در کنار نوشیدنی انتخابی',
      imageUrl: pastry.imageUrl,
    });
  }

  return {
    success: true,
    recommendation: recommendationText,
    suggestedItems: matchedItems,
    pairingNotes: 'طراحی شده بر اساس الگوریتم هوشمند باریستا و مشخصات طعمی منو.',
    source: 'expert_rules',
  };
}
