import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

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
  // 2. Cafe 1: Roastery Collective (NORDIC_MINIMAL + PAY_UPFRONT_BUZZER)
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
  // 3. Cafe 2: Noir Social Club (OLED_CARBON + TABLE_TAB_SPLIT)
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
  // 4. KDS Stations — Cafe 1
  // ─────────────────────────────────────────
  const hotBar1 = await prisma.kdsStation.create({
    data: { cafeId: cafe1.id, name: "بار گرم", stationType: "HOT_BAR" },
  });
  const coldBar1 = await prisma.kdsStation.create({
    data: { cafeId: cafe1.id, name: "بار سرد", stationType: "COLD_BAR" },
  });
  const kitchen1 = await prisma.kdsStation.create({
    data: { cafeId: cafe1.id, name: "آشپزخانه", stationType: "KITCHEN" },
  });
  const pastry1 = await prisma.kdsStation.create({
    data: { cafeId: cafe1.id, name: "قنادی", stationType: "PASTRY" },
  });

  // KDS Stations — Cafe 2
  const hotBar2 = await prisma.kdsStation.create({
    data: { cafeId: cafe2.id, name: "بار گرم", stationType: "HOT_BAR" },
  });
  const coldBar2 = await prisma.kdsStation.create({
    data: { cafeId: cafe2.id, name: "بار سرد", stationType: "COLD_BAR" },
  });
  const kitchen2 = await prisma.kdsStation.create({
    data: { cafeId: cafe2.id, name: "آشپزخانه", stationType: "KITCHEN" },
  });
  const pastry2 = await prisma.kdsStation.create({
    data: { cafeId: cafe2.id, name: "قنادی", stationType: "PASTRY" },
  });

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
  // 6. Categories — Cafe 1
  // ─────────────────────────────────────────
  const catEspresso = await prisma.category.create({
    data: {
      cafeId: cafe1.id,
      stationId: hotBar1.id,
      name: "اسپرسو و لاته",
      displayOrder: 1,
    },
  });

  const catBrewMethods = await prisma.category.create({
    data: {
      cafeId: cafe1.id,
      stationId: hotBar1.id,
      name: "دم‌آوری دستی",
      displayOrder: 2,
    },
  });

  const catColdDrinks = await prisma.category.create({
    data: {
      cafeId: cafe1.id,
      stationId: coldBar1.id,
      name: "نوشیدنی‌های سرد",
      displayOrder: 3,
    },
  });

  const catPastry = await prisma.category.create({
    data: {
      cafeId: cafe1.id,
      stationId: pastry1.id,
      name: "شیرینی و کیک",
      displayOrder: 4,
    },
  });

  // Categories — Cafe 2
  const catEspresso2 = await prisma.category.create({
    data: {
      cafeId: cafe2.id,
      stationId: hotBar2.id,
      name: "اسپرسو بارد",
      displayOrder: 1,
    },
  });

  const catCocktails2 = await prisma.category.create({
    data: {
      cafeId: cafe2.id,
      stationId: coldBar2.id,
      name: "ماکتل‌های خاص",
      displayOrder: 2,
    },
  });

  console.log("✓ Categories created");

  // ─────────────────────────────────────────
  // 7. Menu Items — Cafe 1
  // ─────────────────────────────────────────

  // Item 1: Espresso
  const espresso = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catEspresso.id,
      title: "اسپرسو تخصصی",
      description: "شات دوبل اسپرسو از ترکیب دان اتیوپی یرگاچف و برازیل سرادو",
      price: 85000,
      prepTimeMinutes: 3,
      calories: 10,
      tags: JSON.stringify(["پرطرفدار", "تخصصی", "کافئین‌بالا"]),
      coffeeProfile: JSON.stringify({
        origin: "اتیوپی یرگاچف + برازیل سرادو",
        altitude: "1800-2200 متر",
        process: "واشد (Washed)",
        roastLevel: "میانه روشن",
        radar: {
          acidity: 8,
          body: 6,
          sweetness: 7,
          bitterness: 4,
          aroma: 9,
        },
        flavorNotes: ["یاسمن", "هلو زرد", "شکلات تلخ", "کارامل"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 1,
      reorderCount: 145,
      isAvailable: true,
    },
  });

  // Modifiers for Espresso
  const espressoSizeGroup = await prisma.itemModifierGroup.create({
    data: {
      itemId: espresso.id,
      name: "حجم",
      isRequired: true,
      minSelection: 1,
      maxSelection: 1,
    },
  });
  await prisma.itemModifierOption.createMany({
    data: [
      {
        groupId: espressoSizeGroup.id,
        name: "سینگل (۱ شات)",
        priceDelta: -15000,
        isDefault: false,
      },
      {
        groupId: espressoSizeGroup.id,
        name: "دوبل (۲ شات)",
        priceDelta: 0,
        isDefault: true,
      },
    ],
  });

  // Item 2: Flat White
  const flatWhite = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catEspresso.id,
      title: "فلت وایت",
      description: "اسپرسو ریسترتو با شیر بخارپز ابریشمی به سبک استرالیایی",
      price: 125000,
      prepTimeMinutes: 5,
      calories: 120,
      tags: JSON.stringify(["پرطرفدار", "ملایم"]),
      coffeeProfile: JSON.stringify({
        origin: "کنیا AA",
        altitude: "1500-2000 متر",
        process: "هانی (Honey)",
        roastLevel: "میانه",
        radar: {
          acidity: 6,
          body: 8,
          sweetness: 8,
          bitterness: 3,
          aroma: 7,
        },
        flavorNotes: ["توت سیاه", "کارامل", "بلوبری"],
      }),
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 2,
      reorderCount: 203,
      isAvailable: true,
    },
  });

  // Modifiers for Flat White
  const milkGroup = await prisma.itemModifierGroup.create({
    data: {
      itemId: flatWhite.id,
      name: "نوع شیر",
      isRequired: true,
      minSelection: 1,
      maxSelection: 1,
    },
  });
  await prisma.itemModifierOption.createMany({
    data: [
      {
        groupId: milkGroup.id,
        name: "شیر کامل",
        priceDelta: 0,
        isDefault: true,
      },
      {
        groupId: milkGroup.id,
        name: "شیر بادام",
        priceDelta: 15000,
        isDefault: false,
      },
      {
        groupId: milkGroup.id,
        name: "شیر جو دوسر (اوت)",
        priceDelta: 20000,
        isDefault: false,
      },
      {
        groupId: milkGroup.id,
        name: "شیر سویا",
        priceDelta: 10000,
        isDefault: false,
      },
    ],
  });

  // Item 3: V60 Pour-Over
  const pourOver = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catBrewMethods.id,
      title: "V60 پورآور",
      description:
        "دم‌آوری دستی V60 با دان تک منشأ — تهیه شده با آب ۹۲ درجه و زمان استخراج دقیق ۳:۳۰",
      price: 145000,
      prepTimeMinutes: 8,
      calories: 5,
      tags: JSON.stringify(["تک منشأ", "تخصصی", "دستی"]),
      coffeeProfile: JSON.stringify({
        origin: "کلمبیا هویلا",
        altitude: "1700-2000 متر",
        process: "واشد (Washed)",
        roastLevel: "روشن",
        radar: {
          acidity: 9,
          body: 5,
          sweetness: 8,
          bitterness: 2,
          aroma: 10,
        },
        flavorNotes: ["گریپ‌فروت", "زردآلو", "چای سفید", "گل مریم"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 1,
      reorderCount: 87,
      isAvailable: true,
    },
  });

  // Item 4: Iced Latte
  const icedLatte = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catColdDrinks.id,
      title: "آیس لاته",
      description: "اسپرسو سرد روی یخ با شیر سرد — کلاسیک و خنک‌کننده",
      price: 115000,
      prepTimeMinutes: 4,
      calories: 130,
      tags: JSON.stringify(["سرد", "پرطرفدار"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر"]),
      displayOrder: 1,
      reorderCount: 312,
      isAvailable: true,
    },
  });

  const icedMilkGroup = await prisma.itemModifierGroup.create({
    data: {
      itemId: icedLatte.id,
      name: "نوع شیر",
      isRequired: false,
      minSelection: 0,
      maxSelection: 1,
    },
  });
  await prisma.itemModifierOption.createMany({
    data: [
      {
        groupId: icedMilkGroup.id,
        name: "شیر کامل",
        priceDelta: 0,
        isDefault: true,
      },
      {
        groupId: icedMilkGroup.id,
        name: "شیر جو دوسر",
        priceDelta: 20000,
        isDefault: false,
      },
    ],
  });

  // Item 5: Cold Brew
  const coldBrew = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catColdDrinks.id,
      title: "کلد برو ۲۴ ساعته",
      description:
        "کلد برو طبیعی ۲۴ ساعته از دان برازیل با نُت‌های شکلاتی و کارامل",
      price: 135000,
      discountPrice: 115000,
      prepTimeMinutes: 2,
      calories: 15,
      tags: JSON.stringify(["سرد", "کم‌اسید", "طولانی‌مدت"]),
      coffeeProfile: JSON.stringify({
        origin: "برازیل سرادو",
        altitude: "900-1200 متر",
        process: "خشک (Natural)",
        roastLevel: "میانه تیره",
        radar: {
          acidity: 3,
          body: 9,
          sweetness: 8,
          bitterness: 5,
          aroma: 7,
        },
        flavorNotes: ["شکلات شیری", "کارامل", "آجیل"],
      }),
      allergens: JSON.stringify([]),
      displayOrder: 2,
      reorderCount: 178,
      isAvailable: true,
    },
  });

  // Item 6: Cheese Cake
  const cheeseCake = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catPastry.id,
      title: "چیزکیک نیویورکی",
      description:
        "چیزکیک کلاسیک نیویورکی با پایه بیسکوییت کره‌ای و توپینگ توت فرنگی تازه",
      price: 145000,
      prepTimeMinutes: 2,
      calories: 380,
      tags: JSON.stringify(["شیرین", "محبوب"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["شیر", "گلوتن", "تخم‌مرغ"]),
      displayOrder: 1,
      reorderCount: 95,
      isAvailable: true,
    },
  });

  // Item 7: Croissant
  const croissant = await prisma.menuItem.create({
    data: {
      cafeId: cafe1.id,
      categoryId: catPastry.id,
      title: "کروسان کره‌ای فرانسوی",
      description: "کروسان تازه‌پز با ۲۷ لایه خمیر کره‌ای — هر روز صبح پخته می‌شود",
      price: 95000,
      prepTimeMinutes: 5,
      calories: 290,
      tags: JSON.stringify(["تازه", "صبحانه"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["گلوتن", "شیر"]),
      displayOrder: 2,
      reorderCount: 134,
      isAvailable: true,
    },
  });

  const croissantFillGroup = await prisma.itemModifierGroup.create({
    data: {
      itemId: croissant.id,
      name: "نوع فیلینگ",
      isRequired: false,
      minSelection: 0,
      maxSelection: 1,
    },
  });
  await prisma.itemModifierOption.createMany({
    data: [
      {
        groupId: croissantFillGroup.id,
        name: "ساده (کره طبیعی)",
        priceDelta: 0,
        isDefault: true,
      },
      {
        groupId: croissantFillGroup.id,
        name: "نوتلا",
        priceDelta: 20000,
        isDefault: false,
      },
      {
        groupId: croissantFillGroup.id,
        name: "پنیر و اسفناج",
        priceDelta: 25000,
        isDefault: false,
      },
    ],
  });

  // Item 8: Signature Mocktail (Cafe 2)
  const mocktail = await prisma.menuItem.create({
    data: {
      cafeId: cafe2.id,
      categoryId: catCocktails2.id,
      title: "ماکتل نوآر",
      description: "شیر بادام، اسپرسو سرد، کارامل شور، بیتر گیاهی و یخ",
      price: 165000,
      prepTimeMinutes: 6,
      calories: 185,
      tags: JSON.stringify(["خاص", "سیگنیچر"]),
      coffeeProfile: null,
      allergens: JSON.stringify(["بادام", "شیر"]),
      displayOrder: 1,
      reorderCount: 67,
      isAvailable: true,
    },
  });

  console.log("✓ Menu items and modifiers created");

  // ─────────────────────────────────────────
  // 8. Tables — Cafe 1 (5 tables)
  // ─────────────────────────────────────────
  const tables1 = [
    { tableNumber: "۱", qrToken: generateQRToken() },
    { tableNumber: "۲", qrToken: generateQRToken() },
    { tableNumber: "۳", qrToken: generateQRToken() },
    { tableNumber: "۴", qrToken: generateQRToken() },
    { tableNumber: "۵", qrToken: generateQRToken() },
  ];

  const createdTables1 = await Promise.all(
    tables1.map((t) =>
      prisma.table.create({
        data: { cafeId: cafe1.id, ...t },
      })
    )
  );

  // Tables — Cafe 2 (5 tables)
  const tables2 = [
    { tableNumber: "A1", qrToken: generateQRToken() },
    { tableNumber: "A2", qrToken: generateQRToken() },
    { tableNumber: "B1", qrToken: generateQRToken() },
    { tableNumber: "B2", qrToken: generateQRToken() },
    { tableNumber: "VIP", qrToken: generateQRToken() },
  ];

  const createdTables2 = await Promise.all(
    tables2.map((t) =>
      prisma.table.create({
        data: { cafeId: cafe2.id, ...t },
      })
    )
  );

  console.log("✓ Tables created");

  // ─────────────────────────────────────────
  // 9. Sample Orders for "همان همیشگی" widget
  // ─────────────────────────────────────────
  const order1 = await prisma.order.create({
    data: {
      cafeId: cafe1.id,
      customerId: customer1.id,
      tableId: createdTables1[0].id,
      orderCode: generateOrderCode(),
      buzzerNumber: 12,
      status: "DELIVERED",
      paymentMode: "PAY_UPFRONT",
      paymentStatus: "PAID",
      subtotalAmount: 210000,
      totalAmount: 210000,
      paidAmount: 210000,
      orderItems: {
        create: [
          {
            itemId: flatWhite.id,
            stationId: hotBar1.id,
            quantity: 1,
            unitPrice: flatWhite.price,
            totalPrice: flatWhite.price,
            stationStatus: "DONE",
          },
          {
            itemId: cheeseCake.id,
            stationId: pastry1.id,
            quantity: 1,
            unitPrice: cheeseCake.price,
            totalPrice: cheeseCake.price,
            stationStatus: "DONE",
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      cafeId: cafe1.id,
      customerId: customer1.id,
      orderCode: generateOrderCode(),
      buzzerNumber: 7,
      status: "DELIVERED",
      paymentMode: "PAY_UPFRONT",
      paymentStatus: "PAID",
      subtotalAmount: 125000,
      totalAmount: 125000,
      paidAmount: 125000,
      orderItems: {
        create: [
          {
            itemId: flatWhite.id,
            stationId: hotBar1.id,
            quantity: 1,
            unitPrice: flatWhite.price,
            totalPrice: flatWhite.price,
            stationStatus: "DONE",
          },
        ],
      },
    },
  });

  // Live CONFIRMED order for KDS testing
  const liveOrder = await prisma.order.create({
    data: {
      cafeId: cafe1.id,
      customerId: customer1.id,
      tableId: createdTables1[1].id,
      orderCode: generateOrderCode(),
      buzzerNumber: 23,
      status: "CONFIRMED",
      paymentMode: "PAY_UPFRONT",
      paymentStatus: "PAID",
      subtotalAmount: 355000,
      totalAmount: 355000,
      paidAmount: 355000,
      orderItems: {
        create: [
          {
            itemId: espresso.id,
            stationId: hotBar1.id,
            quantity: 2,
            unitPrice: espresso.price,
            totalPrice: espresso.price * 2,
            stationStatus: "IN_PROGRESS",
          },
          {
            itemId: coldBrew.id,
            stationId: coldBar1.id,
            quantity: 1,
            unitPrice: coldBrew.discountPrice ?? coldBrew.price,
            totalPrice: coldBrew.discountPrice ?? coldBrew.price,
            stationStatus: "PENDING",
          },
          {
            itemId: croissant.id,
            stationId: pastry1.id,
            quantity: 1,
            unitPrice: croissant.price,
            totalPrice: croissant.price,
            stationStatus: "PENDING",
          },
        ],
      },
    },
  });

  console.log("✓ Sample orders created");

  // ─────────────────────────────────────────
  // 10. Loyalty Stamps
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
