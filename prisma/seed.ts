import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

function generateOrderCode(): string {
  return "C-" + Math.floor(Math.random() * 900 + 100).toString();
}

function generateQRToken(): string {
  return randomBytes(32).toString("hex");
}

async function main() {
  console.log("🌱 Seeding CafeChi database...");

  // ─────────────────────────────────────────
  // 1. Users
  // ─────────────────────────────────────────
  const superAdminHash = await bcrypt.hash("admin123", 12);
  const owner1Hash = await bcrypt.hash("owner123", 12);
  const owner2Hash = await bcrypt.hash("owner456", 12);
  const staffHash = await bcrypt.hash("staff123", 12);
  const customerHash = await bcrypt.hash("customer123", 12);

  const superAdmin = await prisma.user.upsert({
    where: { phone: "09120000000" },
    update: {},
    create: {
      phone: "09120000000",
      passwordHash: superAdminHash,
      fullName: "مدیر ارشد سیستم",
      role: "SUPER_ADMIN",
    },
  });

  const owner1 = await prisma.user.upsert({
    where: { phone: "09121111111" },
    update: {},
    create: {
      phone: "09121111111",
      passwordHash: owner1Hash,
      fullName: "علی رضایی",
      role: "CAFE_OWNER",
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { phone: "09122222222" },
    update: {},
    create: {
      phone: "09122222222",
      passwordHash: owner2Hash,
      fullName: "سارا محمدی",
      role: "CAFE_OWNER",
    },
  });

  const staff1 = await prisma.user.upsert({
    where: { phone: "09123333333" },
    update: {},
    create: {
      phone: "09123333333",
      passwordHash: staffHash,
      fullName: "رضا باریستا",
      role: "STAFF",
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { phone: "09124444444" },
    update: {},
    create: {
      phone: "09124444444",
      passwordHash: customerHash,
      fullName: "نیلوفر احمدی",
      role: "CUSTOMER",
    },
  });

  console.log("✓ Users created");

  // ─────────────────────────────────────────
  // 2. Cafe 1: Roastery Collective
  // ─────────────────────────────────────────
  const cafe1 = await prisma.cafe.upsert({
    where: { slug: "roastery-collective" },
    update: {},
    create: {
      ownerId: owner1.id,
      name: "روستری کالکتیو",
      slug: "roastery-collective",
      description:
        "یک فضای مینیمال و مدرن برای دوستداران قهوه تخصصی. از منشأ دان تا فنجان، هر مرحله با دقت انجام می‌شود.",
      address: "تهران، خیابان ولیعصر، پلاک ۴۵۲",
      latitude: 35.7219,
      longitude: 51.3347,
      phoneNumber: "02188776655",
      businessType: "SPECIALTY_CAFE",
      workflowMode: "PAY_UPFRONT_BUZZER",
      themeId: "NORDIC_MINIMAL",
      amenities: JSON.stringify({
        wifi: true,
        smoking: false,
        outdoor: false,
        board_games: false,
        work_friendly: true,
        pet_friendly: false,
      }),
      openingHours: JSON.stringify({
        mon: { open: "08:00", close: "22:00" },
        tue: { open: "08:00", close: "22:00" },
        wed: { open: "08:00", close: "22:00" },
        thu: { open: "08:00", close: "22:00" },
        fri: { open: "09:00", close: "23:00" },
        sat: { open: "09:00", close: "23:00" },
        sun: { open: "10:00", close: "21:00" },
      }),
      isApproved: true,
      isActive: true,
    },
  });

  // ─────────────────────────────────────────
  // 3. Cafe 2: Noir Social Club
  // ─────────────────────────────────────────
  const cafe2 = await prisma.cafe.upsert({
    where: { slug: "noir-social-club" },
    update: {},
    create: {
      ownerId: owner2.id,
      name: "نوآر سوشال کلاب",
      slug: "noir-social-club",
      description:
        "بار تخصصی قهوه شبانه با فضای دارک و آتمسفر خاص. محیطی ایده‌آل برای جلسات خلاقانه و ملاقات‌های شبانه.",
      address: "تهران، الهیه، خیابان فرشته، کوچه سوم",
      latitude: 35.7891,
      longitude: 51.4156,
      phoneNumber: "02122345678",
      businessType: "CAFE_BAR",
      workflowMode: "TABLE_TAB_SPLIT",
      themeId: "OLED_CARBON",
      amenities: JSON.stringify({
        wifi: true,
        smoking: true,
        outdoor: true,
        board_games: true,
        work_friendly: false,
        pet_friendly: true,
      }),
      openingHours: JSON.stringify({
        mon: { open: "14:00", close: "01:00" },
        tue: { open: "14:00", close: "01:00" },
        wed: { open: "14:00", close: "01:00" },
        thu: { open: "14:00", close: "02:00" },
        fri: { open: "15:00", close: "02:00" },
        sat: { open: "15:00", close: "02:00" },
        sun: { open: "16:00", close: "00:00" },
      }),
      isApproved: true,
      isActive: true,
    },
  });

  console.log("✓ Cafes created");

  // ─────────────────────────────────────────
  // 4. KDS Stations — only if not already exists
  // ─────────────────────────────────────────
  let hotBar1 = await prisma.kdsStation.findFirst({ where: { cafeId: cafe1.id, stationType: "HOT_BAR" } });
  if (!hotBar1) hotBar1 = await prisma.kdsStation.create({ data: { cafeId: cafe1.id, name: "بار گرم", stationType: "HOT_BAR" } });

  let coldBar1 = await prisma.kdsStation.findFirst({ where: { cafeId: cafe1.id, stationType: "COLD_BAR" } });
  if (!coldBar1) coldBar1 = await prisma.kdsStation.create({ data: { cafeId: cafe1.id, name: "بار سرد", stationType: "COLD_BAR" } });

  let kitchen1 = await prisma.kdsStation.findFirst({ where: { cafeId: cafe1.id, stationType: "KITCHEN" } });
  if (!kitchen1) kitchen1 = await prisma.kdsStation.create({ data: { cafeId: cafe1.id, name: "آشپزخانه", stationType: "KITCHEN" } });

  let pastry1 = await prisma.kdsStation.findFirst({ where: { cafeId: cafe1.id, stationType: "PASTRY" } });
  if (!pastry1) pastry1 = await prisma.kdsStation.create({ data: { cafeId: cafe1.id, name: "قنادی", stationType: "PASTRY" } });

  let hotBar2 = await prisma.kdsStation.findFirst({ where: { cafeId: cafe2.id, stationType: "HOT_BAR" } });
  if (!hotBar2) hotBar2 = await prisma.kdsStation.create({ data: { cafeId: cafe2.id, name: "بار گرم", stationType: "HOT_BAR" } });

  let coldBar2 = await prisma.kdsStation.findFirst({ where: { cafeId: cafe2.id, stationType: "COLD_BAR" } });
  if (!coldBar2) coldBar2 = await prisma.kdsStation.create({ data: { cafeId: cafe2.id, name: "بار سرد", stationType: "COLD_BAR" } });

  let pastry2 = await prisma.kdsStation.findFirst({ where: { cafeId: cafe2.id, stationType: "PASTRY" } });
  if (!pastry2) pastry2 = await prisma.kdsStation.create({ data: { cafeId: cafe2.id, name: "قنادی", stationType: "PASTRY" } });

  console.log("✓ KDS Stations created");

  // ─────────────────────────────────────────
  // 5. Staff Permissions
  // ─────────────────────────────────────────
  await prisma.staffPermission.upsert({
    where: { userId_cafeId: { userId: staff1.id, cafeId: cafe1.id } },
    update: {},
    create: {
      userId: staff1.id,
      cafeId: cafe1.id,
      stationId: hotBar1.id,
      canEditMenu: false,
      canToggleStock: true,
      canEditPrices: false,
      canManageOrders: true,
      canViewAnalytics: false,
    },
  });

  console.log("✓ Staff permissions created");

  // ─────────────────────────────────────────
  // 6. CLEAR old menu items and categories (for idempotency)
  // ─────────────────────────────────────────
  // Must delete in reverse FK order
  await prisma.orderItem.deleteMany({ where: { item: { cafeId: cafe1.id } } });
  await prisma.itemModifierOption.deleteMany({ where: { group: { item: { cafeId: cafe1.id } } } });
  await prisma.itemModifierGroup.deleteMany({ where: { item: { cafeId: cafe1.id } } });
  await prisma.menuItem.deleteMany({ where: { cafeId: cafe1.id } });
  await prisma.category.deleteMany({ where: { cafeId: cafe1.id } });

  await prisma.orderItem.deleteMany({ where: { item: { cafeId: cafe2.id } } });
  await prisma.itemModifierOption.deleteMany({ where: { group: { item: { cafeId: cafe2.id } } } });
  await prisma.itemModifierGroup.deleteMany({ where: { item: { cafeId: cafe2.id } } });
  await prisma.menuItem.deleteMany({ where: { cafeId: cafe2.id } });
  await prisma.category.deleteMany({ where: { cafeId: cafe2.id } });

  console.log("✓ Cleared old menu data");

  // ─────────────────────────────────────────
  // 7. Categories — Cafe 1 (Roastery Collective)
  // ─────────────────────────────────────────
  const catEspresso = await prisma.category.create({
    data: { cafeId: cafe1.id, stationId: hotBar1.id, name: "اسپرسو و لاته", displayOrder: 1 },
  });
  const catBrewMethods = await prisma.category.create({
    data: { cafeId: cafe1.id, stationId: hotBar1.id, name: "دم‌آوری دستی", displayOrder: 2 },
  });
  const catColdDrinks = await prisma.category.create({
    data: { cafeId: cafe1.id, stationId: coldBar1.id, name: "نوشیدنی‌های سرد", displayOrder: 3 },
  });
  const catPastry = await prisma.category.create({
    data: { cafeId: cafe1.id, stationId: pastry1.id, name: "شیرینی و کیک", displayOrder: 4 },
  });

  // ─────────────────────────────────────────
  // 8. Categories — Cafe 2 (Noir Social Club)
  // ─────────────────────────────────────────
  const catNoir1 = await prisma.category.create({
    data: { cafeId: cafe2.id, stationId: hotBar2.id, name: "اسپرسو بارد", displayOrder: 1 },
  });
  const catNoir2 = await prisma.category.create({
    data: { cafeId: cafe2.id, stationId: coldBar2.id, name: "ماکتل‌های خاص", displayOrder: 2 },
  });
  const catNoir3 = await prisma.category.create({
    data: { cafeId: cafe2.id, stationId: pastry2.id, name: "دسر و خوردنی شبانه", displayOrder: 3 },
  });

  console.log("✓ Categories created");

  // ─────────────────────────────────────────
  // 9. Menu Items — Cafe 1: Espresso & Latte
  // ─────────────────────────────────────────

  const espresso = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catEspresso.id,
      title: "اسپرسو تخصصی",
      description: "شات دوبل اسپرسو از ترکیب دان اتیوپی یرگاچف و برازیل سرادو — کرمای طلایی غنی",
      price: 85000,
      prepTimeMinutes: 3,
      calories: 10,
      imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80",
      tags: JSON.stringify(["پرطرفدار", "تخصصی", "کافئین‌بالا"]),
      coffeeProfile: JSON.stringify({
        origin: "اتیوپی یرگاچف + برازیل سرادو",
        altitude: "1800-2200 متر",
        process: "واشد (Washed)",
        roastLevel: "میانه روشن",
        radar: { acidity: 8, body: 6, sweetness: 7, bitterness: 4, aroma: 9 },
        flavorNotes: ["یاسمن", "هلو زرد", "شکلات تلخ", "کارامل"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 1,
      reorderCount: 145,
      isAvailable: true,
    },
  });

  // Espresso modifiers
  const espressoSizeGroup = await prisma.itemModifierGroup.create({
    data: { itemId: espresso.id, name: "حجم", isRequired: true, minSelection: 1, maxSelection: 1 },
  });
  await prisma.itemModifierOption.createMany({
    data: [
      { groupId: espressoSizeGroup.id, name: "سینگل (۱ شات)", priceDelta: -15000, isDefault: false },
      { groupId: espressoSizeGroup.id, name: "دوبل (۲ شات)", priceDelta: 0, isDefault: true },
    ],
  });

  const flatWhite = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catEspresso.id,
      title: "فلت وایت",
      description: "اسپرسو ریسترتو با شیر بخارپز ابریشمی به سبک استرالیایی — بدنه‌ای کرمی و غنی",
      price: 125000,
      prepTimeMinutes: 5,
      calories: 120,
      imageUrl: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80",
      tags: JSON.stringify(["پرطرفدار", "ملایم", "ریسترتو"]),
      coffeeProfile: JSON.stringify({
        origin: "کنیا AA",
        altitude: "1500-2000 متر",
        process: "هانی (Honey)",
        roastLevel: "میانه",
        radar: { acidity: 6, body: 8, sweetness: 8, bitterness: 3, aroma: 7 },
        flavorNotes: ["توت سیاه", "کارامل", "بلوبری", "گلاب"],
      }),
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 2,
      reorderCount: 203,
      isAvailable: true,
    },
  });

  const milkGroup = await prisma.itemModifierGroup.create({
    data: { itemId: flatWhite.id, name: "نوع شیر", isRequired: true, minSelection: 1, maxSelection: 1 },
  });
  await prisma.itemModifierOption.createMany({
    data: [
      { groupId: milkGroup.id, name: "شیر کامل", priceDelta: 0, isDefault: true },
      { groupId: milkGroup.id, name: "شیر بادام", priceDelta: 15000, isDefault: false },
      { groupId: milkGroup.id, name: "شیر جو دوسر (اوت)", priceDelta: 20000, isDefault: false },
      { groupId: milkGroup.id, name: "شیر سویا", priceDelta: 10000, isDefault: false },
    ],
  });

  const cappuccino = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catEspresso.id,
      title: "کاپوچینو ایتالیایی",
      description: "کاپوچینو کلاسیک با نسبت ۱:۱:۱ اسپرسو، شیر و فوم — پودر دارچین در نهایت",
      price: 115000,
      prepTimeMinutes: 5,
      calories: 90,
      imageUrl: "https://images.unsplash.com/photo-1534687941688-651ccaafbff8?w=400&q=80",
      tags: JSON.stringify(["کلاسیک", "ایتالیایی"]),
      coffeeProfile: JSON.stringify({
        origin: "برازیل سانتوس + اتیوپی",
        altitude: "1200-1800 متر",
        process: "ترکیبی",
        roastLevel: "میانه",
        radar: { acidity: 5, body: 7, sweetness: 7, bitterness: 5, aroma: 8 },
        flavorNotes: ["شکلات", "کارامل", "آجیل برشته"],
      }),
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 3,
      reorderCount: 167,
      isAvailable: true,
    },
  });

  const latte = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catEspresso.id,
      title: "لاته آرت",
      description: "لاته ۲۲۰ml با لته‌آرت دست‌پز باریستا — نقش قلب یا گل روی فوم شیر",
      price: 130000,
      prepTimeMinutes: 6,
      calories: 140,
      imageUrl: "https://images.unsplash.com/photo-1485808191679-5f86510df739?w=400&q=80",
      tags: JSON.stringify(["آرت", "محبوب", "اینستاگرامی"]),
      coffeeProfile: JSON.stringify({
        origin: "کلمبیا هویلا",
        altitude: "1600-1900 متر",
        process: "واشد",
        roastLevel: "میانه روشن",
        radar: { acidity: 7, body: 7, sweetness: 8, bitterness: 3, aroma: 8 },
        flavorNotes: ["کارامل شور", "توت قرمز", "شکلات شیری"],
      }),
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 4,
      reorderCount: 189,
      isAvailable: true,
    },
  });

  const macchiato = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catEspresso.id,
      title: "ماکیاتو کارامل",
      description: "اسپرسو اندازه بلند با سس کارامل دست‌ساز و شیر بخارپز — شیرین و پرکافئین",
      price: 140000,
      prepTimeMinutes: 5,
      calories: 180,
      imageUrl: "https://images.unsplash.com/photo-1485808191679-5f86510df739?w=400&q=80",
      tags: JSON.stringify(["کارامل", "شیرین", "پرطرفدار"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 5,
      reorderCount: 142,
      isAvailable: true,
    },
  });

  const cortado = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catEspresso.id,
      title: "کورتادو",
      description: "اسپرسو دوبل با نصف مقدار شیر گرم — تعادل بی‌نظیر قهوه و شیر",
      price: 105000,
      prepTimeMinutes: 4,
      calories: 60,
      imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80",
      tags: JSON.stringify(["تخصصی", "کم‌حجم", "قوی"]),
      coffeeProfile: JSON.stringify({
        origin: "اتیوپی گجی",
        altitude: "2000-2300 متر",
        process: "ناچرال",
        roastLevel: "روشن",
        radar: { acidity: 9, body: 5, sweetness: 8, bitterness: 3, aroma: 10 },
        flavorNotes: ["بلوبری", "توت‌فرنگی", "هیبیسکوس", "لیمو"],
      }),
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 6,
      reorderCount: 98,
      isAvailable: true,
    },
  });

  // ─────────────────────────────────────────
  // 10. Menu Items — Cafe 1: Pour-over / Brew methods
  // ─────────────────────────────────────────

  const pourOver = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catBrewMethods.id,
      title: "V60 پورآور",
      description: "دم‌آوری دستی V60 با دان تک منشأ — آب ۹۲ درجه، زمان استخراج دقیق ۳:۳۰",
      price: 145000,
      prepTimeMinutes: 8,
      calories: 5,
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      tags: JSON.stringify(["تک منشأ", "تخصصی", "دستی", "V60"]),
      coffeeProfile: JSON.stringify({
        origin: "کلمبیا هویلا",
        altitude: "1700-2000 متر",
        process: "واشد (Washed)",
        roastLevel: "روشن",
        radar: { acidity: 9, body: 5, sweetness: 8, bitterness: 2, aroma: 10 },
        flavorNotes: ["گریپ‌فروت", "زردآلو", "چای سفید", "گل مریم"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 1,
      reorderCount: 87,
      isAvailable: true,
    },
  });

  const aeropress = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catBrewMethods.id,
      title: "ایروپرس تخصصی",
      description: "دم‌آوری فشاری ایروپرس با دستور اختصاصی روستری — غلیظ‌تر از فیلتر با کلارتی بیشتر از اسپرسو",
      price: 135000,
      prepTimeMinutes: 7,
      calories: 8,
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      tags: JSON.stringify(["ایروپرس", "تخصصی", "غلیظ"]),
      coffeeProfile: JSON.stringify({
        origin: "گواتمالا آنتیگوا",
        altitude: "1500-1700 متر",
        process: "واشد",
        roastLevel: "میانه",
        radar: { acidity: 7, body: 8, sweetness: 7, bitterness: 4, aroma: 8 },
        flavorNotes: ["شکلات تیره", "آلو خشک", "توتک"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 2,
      reorderCount: 62,
      isAvailable: true,
    },
  });

  const chemex = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catBrewMethods.id,
      title: "کمکس — برای دو نفر",
      description: "دم‌آوری ۴۰۰ml در ظرف کمکس شیشه‌ای با فیلتر ضخیم — پاک‌ترین فنجان فیلتر",
      price: 160000,
      prepTimeMinutes: 10,
      calories: 8,
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      tags: JSON.stringify(["کمکس", "دو نفره", "پاک"]),
      coffeeProfile: JSON.stringify({
        origin: "پاناما گِشا",
        altitude: "1800-2000 متر",
        process: "واشد",
        roastLevel: "روشن",
        radar: { acidity: 10, body: 4, sweetness: 9, bitterness: 1, aroma: 10 },
        flavorNotes: ["گل یاس", "هلو سفید", "چای جاسمین", "لیچی"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 3,
      reorderCount: 41,
      isAvailable: true,
    },
  });

  const frenchPress = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catBrewMethods.id,
      title: "فرنچ پرس کلاسیک",
      description: "دم‌آوری ۴ دقیقه‌ای فرنچ پرس — بدنه سنگین و فول باری",
      price: 125000,
      prepTimeMinutes: 8,
      calories: 10,
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      tags: JSON.stringify(["فرنچ پرس", "کلاسیک", "پربادی"]),
      coffeeProfile: JSON.stringify({
        origin: "سوماترا مانادهلینگ",
        altitude: "1000-1500 متر",
        process: "نیمه‌شسته (Wet-Hulled)",
        roastLevel: "میانه تیره",
        radar: { acidity: 3, body: 10, sweetness: 6, bitterness: 6, aroma: 7 },
        flavorNotes: ["خاک مرطوب", "تنباکو", "شکلات تیره", "ادویه"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 4,
      reorderCount: 55,
      isAvailable: true,
    },
  });

  const mokaPot = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catBrewMethods.id,
      title: "موکاپات ایتالیایی",
      description: "قهوه سنتی موکاپات روی گاز با دان ترکیبی ایتالیایی — غلیظ و پرکافئین",
      price: 110000,
      prepTimeMinutes: 9,
      calories: 12,
      imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80",
      tags: JSON.stringify(["موکا", "سنتی", "ایتالیایی"]),
      coffeeProfile: JSON.stringify({
        origin: "ترکیب ایتالیایی",
        altitude: "900-1400 متر",
        process: "ترکیبی",
        roastLevel: "تیره (Dark)",
        radar: { acidity: 3, body: 9, sweetness: 5, bitterness: 8, aroma: 7 },
        flavorNotes: ["شکلات تلخ", "کاکائو", "ادویه گرم"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 5,
      reorderCount: 73,
      isAvailable: true,
    },
  });

  // ─────────────────────────────────────────
  // 11. Menu Items — Cafe 1: Cold Drinks
  // ─────────────────────────────────────────

  const icedLatte = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catColdDrinks.id,
      title: "آیس لاته",
      description: "اسپرسو سرد روی یخ با شیر سرد — کلاسیک و خنک‌کننده",
      price: 115000,
      prepTimeMinutes: 4,
      calories: 130,
      imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80",
      tags: JSON.stringify(["سرد", "پرطرفدار", "آیس"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 1,
      reorderCount: 312,
      isAvailable: true,
    },
  });

  const icedLatteGroup = await prisma.itemModifierGroup.create({
    data: { itemId: icedLatte.id, name: "نوع شیر", isRequired: false, minSelection: 0, maxSelection: 1 },
  });
  await prisma.itemModifierOption.createMany({
    data: [
      { groupId: icedLatteGroup.id, name: "شیر کامل", priceDelta: 0, isDefault: true },
      { groupId: icedLatteGroup.id, name: "شیر جو دوسر", priceDelta: 20000, isDefault: false },
      { groupId: icedLatteGroup.id, name: "شیر بادام", priceDelta: 15000, isDefault: false },
    ],
  });

  const coldBrew = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catColdDrinks.id,
      title: "کلد برو ۲۴ ساعته",
      description: "کلد برو طبیعی ۲۴ ساعته از دان برازیل — نُت‌های شکلاتی و کارامل، کم‌اسید",
      price: 135000,
      discountPrice: 115000,
      prepTimeMinutes: 2,
      calories: 15,
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80",
      tags: JSON.stringify(["سرد", "کم‌اسید", "طولانی‌مدت", "تخفیف"]),
      coffeeProfile: JSON.stringify({
        origin: "برازیل سرادو",
        altitude: "900-1200 متر",
        process: "خشک (Natural)",
        roastLevel: "میانه تیره",
        radar: { acidity: 3, body: 9, sweetness: 8, bitterness: 5, aroma: 7 },
        flavorNotes: ["شکلات شیری", "کارامل", "آجیل"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 2,
      reorderCount: 178,
      isAvailable: true,
    },
  });

  const nitroCold = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catColdDrinks.id,
      title: "نیترو کلد برو",
      description: "کلد برو نیتروژنی شارژشده — فوم کرمی ظریف بدون شیر، بدنه ابریشمی",
      price: 155000,
      prepTimeMinutes: 2,
      calories: 15,
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80",
      tags: JSON.stringify(["نیترو", "بدون شیر", "کرمی", "ویژه"]),
      coffeeProfile: JSON.stringify({
        origin: "اتیوپی + برازیل",
        altitude: "1400-1900 متر",
        process: "ترکیبی",
        roastLevel: "میانه",
        radar: { acidity: 4, body: 9, sweetness: 7, bitterness: 4, aroma: 8 },
        flavorNotes: ["شکلات شیری", "وانیل", "کارامل تلخ"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 3,
      reorderCount: 89,
      isAvailable: true,
    },
  });

  const icedMatcha = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catColdDrinks.id,
      title: "آیس ماچا لاته",
      description: "پودر ماچای سِرمونی گرید ژاپن با شیر جو دوسر روی یخ — ترازدار و گیاهی",
      price: 130000,
      prepTimeMinutes: 4,
      calories: 110,
      imageUrl: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&q=80",
      tags: JSON.stringify(["ماچا", "گیاهی", "ژاپنی", "بدون قهوه"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 4,
      reorderCount: 134,
      isAvailable: true,
    },
  });

  const hotChocolate = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catColdDrinks.id,
      title: "شکلات داغ بلژیکی",
      description: "شکلات داغ با پودر کاکائو ۷۰٪ والرونا و شیر کامل — فنجانی که گرما می‌بخشد",
      price: 120000,
      prepTimeMinutes: 5,
      calories: 220,
      imageUrl: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80",
      tags: JSON.stringify(["گرم", "بدون قهوه", "کاکائو", "زمستانی"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 5,
      reorderCount: 98,
      isAvailable: true,
    },
  });

  // ─────────────────────────────────────────
  // 12. Menu Items — Cafe 1: Pastry & Cake
  // ─────────────────────────────────────────

  const cheeseCake = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catPastry.id,
      title: "چیزکیک نیویورکی",
      description: "چیزکیک کلاسیک نیویورکی با پایه بیسکوییت کره‌ای و توپینگ توت‌فرنگی تازه",
      price: 145000,
      prepTimeMinutes: 2,
      calories: 380,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
      tags: JSON.stringify(["شیرین", "محبوب", "نیویورکی"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر", "گلوتن", "تخم‌مرغ"]),
      displayOrder: 1,
      reorderCount: 95,
      isAvailable: true,
    },
  });

  const croissant = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catPastry.id,
      title: "کروسان کره‌ای فرانسوی",
      description: "کروسان تازه‌پز با ۲۷ لایه خمیر کره‌ای — هر روز صبح پخته می‌شود",
      price: 95000,
      prepTimeMinutes: 5,
      calories: 290,
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80",
      tags: JSON.stringify(["تازه", "صبحانه", "فرانسوی"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["گلوتن", "شیر"]),
      displayOrder: 2,
      reorderCount: 134,
      isAvailable: true,
    },
  });

  const croissantFillGroup = await prisma.itemModifierGroup.create({
    data: { itemId: croissant.id, name: "نوع فیلینگ", isRequired: false, minSelection: 0, maxSelection: 1 },
  });
  await prisma.itemModifierOption.createMany({
    data: [
      { groupId: croissantFillGroup.id, name: "ساده (کره طبیعی)", priceDelta: 0, isDefault: true },
      { groupId: croissantFillGroup.id, name: "نوتلا", priceDelta: 20000, isDefault: false },
      { groupId: croissantFillGroup.id, name: "پنیر و اسفناج", priceDelta: 25000, isDefault: false },
      { groupId: croissantFillGroup.id, name: "بادام و عسل", priceDelta: 15000, isDefault: false },
    ],
  });

  const tiramisu = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catPastry.id,
      title: "تیرامیسو کلاسیک",
      description: "تیرامیسو اصیل ایتالیایی با ماسکارپونه و بیسکویت ساووایاردی آغشته در اسپرسو",
      price: 165000,
      prepTimeMinutes: 2,
      calories: 420,
      imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
      tags: JSON.stringify(["ایتالیایی", "محبوب", "قهوه‌ای"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر", "گلوتن", "تخم‌مرغ"]),
      displayOrder: 3,
      reorderCount: 82,
      isAvailable: true,
    },
  });

  const muffinBlueberry = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catPastry.id,
      title: "ماففین بلوبری",
      description: "ماففین تازه‌پز با بلوبری تازه — بدون مواد نگه‌دارنده، تازه هر روز",
      price: 85000,
      prepTimeMinutes: 2,
      calories: 310,
      imageUrl: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80",
      tags: JSON.stringify(["تازه", "بلوبری", "خانگی"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["گلوتن", "شیر", "تخم‌مرغ"]),
      displayOrder: 4,
      reorderCount: 67,
      isAvailable: true,
    },
  });

  const brownie = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catPastry.id,
      title: "براونی شکلاتی",
      description: "براونی فدج با شکلات ۷۲٪ والرونا — خارج ترد، داخل نرم و ذوب‌شدنی",
      price: 95000,
      prepTimeMinutes: 2,
      calories: 350,
      imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80",
      tags: JSON.stringify(["شکلاتی", "والرونا", "فدج"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["گلوتن", "شیر", "تخم‌مرغ"]),
      displayOrder: 5,
      reorderCount: 113,
      isAvailable: true,
    },
  });

  console.log("✓ Cafe 1 menu items created");

  // ─────────────────────────────────────────
  // 13. Menu Items — Cafe 2: Noir Social Club
  // ─────────────────────────────────────────

  const noirEspresso = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir1.id,
      title: "اسپرسو دارک بلند",
      description: "بلند اختصاصی نوآر با بادی سنگین و کرمای فندقی ضخیم — از دان گواتمالا و سوماترا",
      price: 90000,
      prepTimeMinutes: 3,
      calories: 12,
      imageUrl: "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=400&q=80",
      tags: JSON.stringify(["دارک", "پرکافئین", "بلند"]),
      coffeeProfile: JSON.stringify({
        origin: "گواتمالا + سوماترا",
        altitude: "1500-1800 متر",
        process: "ترکیبی",
        roastLevel: "دارک (Dark)",
        radar: { acidity: 2, body: 10, sweetness: 6, bitterness: 8, aroma: 8 },
        flavorNotes: ["کاکائو تلخ", "تنباکوی شیرین", "ادویه گرم"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 1,
      reorderCount: 156,
      isAvailable: true,
    },
  });

  const noirEspressoSizeGroup = await prisma.itemModifierGroup.create({
    data: { itemId: noirEspresso.id, name: "حجم شات", isRequired: true, minSelection: 1, maxSelection: 1 },
  });
  await prisma.itemModifierOption.createMany({
    data: [
      { groupId: noirEspressoSizeGroup.id, name: "سینگل", priceDelta: -20000, isDefault: false },
      { groupId: noirEspressoSizeGroup.id, name: "دوبل", priceDelta: 0, isDefault: true },
      { groupId: noirEspressoSizeGroup.id, name: "تریپل", priceDelta: 20000, isDefault: false },
    ],
  });

  const affogato = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir1.id,
      title: "آفوگاتو نوآر",
      description: "اسپرسو داغ تازه روی جلاتوی وانیل ماداگاسکار با تراشه‌های شکلات دست‌ساز",
      price: 145000,
      prepTimeMinutes: 4,
      calories: 250,
      imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80",
      tags: JSON.stringify(["دسر قهوه", "ویژه", "ایتالیایی"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 2,
      reorderCount: 94,
      isAvailable: true,
    },
  });

  const noirRomano = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir1.id,
      title: "اسپرسو رومانو",
      description: "اسپرسو سینگل با یک اسلایس لیمو — ترکیب اسیدیته مرکبات و تلخی قهوه",
      price: 95000,
      prepTimeMinutes: 3,
      calories: 8,
      imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80",
      tags: JSON.stringify(["رومانو", "لیمو", "سینگل"]),
      coffeeProfile: JSON.stringify({
        origin: "سیسیل ایتالیا (رست ایتالیایی)",
        altitude: "900-1400 متر",
        process: "ترکیبی",
        roastLevel: "دارک",
        radar: { acidity: 6, body: 8, sweetness: 5, bitterness: 7, aroma: 8 },
        flavorNotes: ["مرکبات", "شکلات تیره", "کارامل تلخ"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 3,
      reorderCount: 71,
      isAvailable: true,
    },
  });

  const ristretto = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir1.id,
      title: "ریسترتو دوبل",
      description: "ریسترتو کنسانتره با نصف حجم معمول — شیرین‌ترین و غلیظ‌ترین شکل اسپرسو",
      price: 100000,
      prepTimeMinutes: 3,
      calories: 8,
      imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80",
      tags: JSON.stringify(["ریسترتو", "کنسانتره", "شیرین"]),
      coffeeProfile: JSON.stringify({
        origin: "اتیوپی + کلمبیا",
        altitude: "1600-2000 متر",
        process: "واشد",
        roastLevel: "میانه تیره",
        radar: { acidity: 7, body: 9, sweetness: 8, bitterness: 5, aroma: 9 },
        flavorNotes: ["شکلات شیری", "کارامل", "توت قرمز"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 4,
      reorderCount: 48,
      isAvailable: true,
    },
  });

  const noirCappuccino = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir1.id,
      title: "کاپوچینو دارک",
      description: "کاپوچینو با اسپرسو دارک بلند نوآر — فوم متراکم و بادی سنگین‌تر از نسخه معمول",
      price: 120000,
      prepTimeMinutes: 5,
      calories: 90,
      imageUrl: "https://images.unsplash.com/photo-1534687941688-651ccaafbff8?w=400&q=80",
      tags: JSON.stringify(["دارک", "کاپوچینو", "پرقدرت"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 5,
      reorderCount: 87,
      isAvailable: true,
    },
  });

  // Noir Mocktails
  const noirMocktail = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir2.id,
      title: "ماکتل نوآر سیگنیچر",
      description: "شیر بادام، اسپرسو سرد ۲ شات، کارامل شور دست‌ساز، بیتر گیاهی و یخ — نوشیدنی ویژه خانه",
      price: 165000,
      prepTimeMinutes: 6,
      calories: 185,
      imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80",
      tags: JSON.stringify(["خاص", "سیگنیچر", "کارامل", "بادام"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["بادام", "شیر"]),
      displayOrder: 1,
      reorderCount: 134,
      isAvailable: true,
    },
  });

  const blueMoon = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir2.id,
      title: "بلو مون موهیتو",
      description: "چای پروانه‌ای آبی، آب‌لیمو، نعنا تازه، شربت آگاو و یخ خرد شده — آبی پررنگ با رنگ‌تغییر جادویی",
      price: 155000,
      prepTimeMinutes: 7,
      calories: 120,
      imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80",
      tags: JSON.stringify(["آبی", "پروانه‌ای", "جادویی", "خنک"]),
      coffeeProfile: null,
      allergens: JSON.stringify([]),
      displayOrder: 2,
      reorderCount: 89,
      isAvailable: true,
    },
  });

  const espressoMartiniMock = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir2.id,
      title: "اسپرسو مارتینی موک",
      description: "اسپرسو سرد شیکرشده، شیر نارگیل، وانیل، قند نیشکر — بدون الکل، با فوم ظریف",
      price: 175000,
      prepTimeMinutes: 8,
      calories: 200,
      imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80",
      tags: JSON.stringify(["بدون الکل", "فانی", "نارگیل"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["نارگیل", "شیر"]),
      displayOrder: 3,
      reorderCount: 76,
      isAvailable: true,
    },
  });

  const watermelonBasil = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir2.id,
      title: "هندوانه ریحان لیموناد",
      description: "آب هندوانه تازه، ریحان تازه، لیمو و شربت زعفران — تابستانی و جذاب",
      price: 140000,
      prepTimeMinutes: 5,
      calories: 110,
      imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80",
      tags: JSON.stringify(["هندوانه", "ریحان", "تابستانی", "بدون قهوه"]),
      coffeeProfile: null,
      allergens: JSON.stringify([]),
      displayOrder: 4,
      reorderCount: 61,
      isAvailable: true,
    },
  });

  const matchaSoyMock = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir2.id,
      title: "ماچا سویا ماکتل",
      description: "ماچای ارگانیک ژاپنی، شیر سویا، عسل وحشی و دارچین — سالم و پرانرژی",
      price: 145000,
      prepTimeMinutes: 5,
      calories: 140,
      imageUrl: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&q=80",
      tags: JSON.stringify(["ماچا", "سویا", "گیاهی", "انرژی"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["سویا"]),
      displayOrder: 5,
      reorderCount: 52,
      isAvailable: true,
    },
  });

  // Noir Desserts
  const noirTiramisu = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir3.id,
      title: "تیرامیسو نوآر",
      description: "تیرامیسو با اسپرسو دارک نوآر و لیکور قهوه‌ای بدون الکل — تلخ‌تر و غنی‌تر",
      price: 185000,
      prepTimeMinutes: 2,
      calories: 450,
      imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
      tags: JSON.stringify(["دسر", "تیرامیسو", "نوآر", "قهوه"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر", "گلوتن", "تخم‌مرغ"]),
      displayOrder: 1,
      reorderCount: 78,
      isAvailable: true,
    },
  });

  const darkChocTart = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir3.id,
      title: "تارت شکلات تلخ ۷۲٪",
      description: "تارت کوچک با کرم گاناش شکلات ۷۲٪ و پایه سابله — تلخ‌شیرین و عمیق",
      price: 155000,
      prepTimeMinutes: 2,
      calories: 320,
      imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80",
      tags: JSON.stringify(["تارت", "شکلات تیره", "گاناش"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["گلوتن", "شیر", "تخم‌مرغ"]),
      displayOrder: 2,
      reorderCount: 54,
      isAvailable: true,
    },
  });

  const panna = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catNoir3.id,
      title: "پاناکوتا وانیل",
      description: "پاناکوتای ایتالیایی با وانیل ماداگاسکار و سس توت قرمز — لرزان و ابریشمی",
      price: 145000,
      prepTimeMinutes: 2,
      calories: 280,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
      tags: JSON.stringify(["پاناکوتا", "وانیل", "ایتالیایی"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر", "تخم‌مرغ"]),
      displayOrder: 3,
      reorderCount: 43,
      isAvailable: true,
    },
  });

  console.log("✓ Cafe 2 menu items created");

  // ─────────────────────────────────────────
  // 14. Tables
  // ─────────────────────────────────────────
  const existingTables1 = await prisma.table.findMany({ where: { cafeId: cafe1.id } });
  let createdTables1 = existingTables1;
  if (existingTables1.length === 0) {
    createdTables1 = await Promise.all(
      ["۱", "۲", "۳", "۴", "۵"].map((n) =>
        prisma.table.create({ data: { cafeId: cafe1.id, tableNumber: n, qrToken: generateQRToken() } })
      )
    );
  }

  const existingTables2 = await prisma.table.findMany({ where: { cafeId: cafe2.id } });
  let createdTables2 = existingTables2;
  if (existingTables2.length === 0) {
    createdTables2 = await Promise.all(
      ["A1", "A2", "B1", "B2", "VIP"].map((n) =>
        prisma.table.create({ data: { cafeId: cafe2.id, tableNumber: n, qrToken: generateQRToken() } })
      )
    );
  }

  console.log("✓ Tables created");

  // ─────────────────────────────────────────
  // 15. Sample Orders (for "همان همیشگی" widget)
  // ─────────────────────────────────────────
  const existingOrders = await prisma.order.findMany({ where: { cafeId: cafe1.id, customerId: customer1.id }, take: 1 });
  if (existingOrders.length === 0) {
    await prisma.order.create({
      data: {
        cafeId: cafe1.id,
        customerId: customer1.id,
        tableId: createdTables1[0].id,
        orderCode: generateOrderCode(),
        buzzerNumber: 12,
        status: "DELIVERED",
        paymentMode: "PAY_UPFRONT_BUZZER",
        paymentStatus: "PAID",
        subtotalAmount: 270000,
        totalAmount: 270000,
        paidAmount: 270000,
        orderItems: {
          create: [
            { itemId: flatWhite.id, stationId: hotBar1.id, quantity: 1, unitPrice: flatWhite.price, totalPrice: flatWhite.price, stationStatus: "DONE" },
            { itemId: cheeseCake.id, stationId: pastry1.id, quantity: 1, unitPrice: cheeseCake.price, totalPrice: cheeseCake.price, stationStatus: "DONE" },
          ],
        },
      },
    });

    await prisma.order.create({
      data: {
        cafeId: cafe1.id,
        customerId: customer1.id,
        orderCode: generateOrderCode(),
        buzzerNumber: 7,
        status: "DELIVERED",
        paymentMode: "PAY_UPFRONT_BUZZER",
        paymentStatus: "PAID",
        subtotalAmount: 280000,
        totalAmount: 280000,
        paidAmount: 280000,
        orderItems: {
          create: [
            { itemId: flatWhite.id, stationId: hotBar1.id, quantity: 1, unitPrice: flatWhite.price, totalPrice: flatWhite.price, stationStatus: "DONE" },
            { itemId: coldBrew.id, stationId: coldBar1.id, quantity: 1, unitPrice: coldBrew.discountPrice ?? coldBrew.price, totalPrice: coldBrew.discountPrice ?? coldBrew.price, stationStatus: "DONE" },
          ],
        },
      },
    });

    // Live order for KDS testing
    await prisma.order.create({
      data: {
        cafeId: cafe1.id,
        customerId: customer1.id,
        tableId: createdTables1[1].id,
        orderCode: generateOrderCode(),
        buzzerNumber: 23,
        status: "CONFIRMED",
        paymentMode: "PAY_UPFRONT_BUZZER",
        paymentStatus: "PAID",
        subtotalAmount: 355000,
        totalAmount: 355000,
        paidAmount: 355000,
        orderItems: {
          create: [
            { itemId: espresso.id, stationId: hotBar1.id, quantity: 2, unitPrice: espresso.price, totalPrice: espresso.price * 2, stationStatus: "IN_PROGRESS" },
            { itemId: coldBrew.id, stationId: coldBar1.id, quantity: 1, unitPrice: coldBrew.discountPrice ?? coldBrew.price, totalPrice: coldBrew.discountPrice ?? coldBrew.price, stationStatus: "PENDING" },
            { itemId: croissant.id, stationId: pastry1.id, quantity: 1, unitPrice: croissant.price, totalPrice: croissant.price, stationStatus: "PENDING" },
          ],
        },
      },
    });
  }

  console.log("✓ Sample orders created");

  // ─────────────────────────────────────────
  // 16. Loyalty Stamps
  // ─────────────────────────────────────────
  await prisma.loyaltyStamp.upsert({
    where: { userId_cafeId: { userId: customer1.id, cafeId: cafe1.id } },
    update: {},
    create: {
      userId: customer1.id,
      cafeId: cafe1.id,
      stampsCount: 4,
      maxStamps: 6,
      freeDrinksEarned: 0,
    },
  });

  console.log("✓ Loyalty stamps created");

  console.log("\n✅ Database seeded successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 Test Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Super Admin → phone: 09120000000  | password: admin123");
  console.log("Cafe Owner 1 → phone: 09121111111 | password: owner123");
  console.log("Cafe Owner 2 → phone: 09122222222 | password: owner456");
  console.log("Staff       → phone: 09123333333  | password: staff123");
  console.log("Customer    → phone: 09124444444  | password: customer123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌐 Cafe URLs:");
  console.log("→ /c/roastery-collective  (NORDIC_MINIMAL | PAY_UPFRONT_BUZZER)");
  console.log("→ /c/noir-social-club     (OLED_CARBON | TABLE_TAB_SPLIT)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
