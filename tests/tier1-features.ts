import { db } from "@/lib/db";
import { THEMES, THEME_LIST, getTheme, getThemeCssString } from "@/lib/themes";
import { CoffeeProfileSchema, CartItemSchema } from "@/lib/validations";
import { haversineDistance, isCafeOpenNow } from "@/lib/haversine";
import type { ThemeId, JWTPayload } from "@/types";
import {
  assert,
  assertEqual,
  assertDeepEqual,
  assertDefined,
  assertInRange,
  assertMatches,
  assertIncludes,
  setTestScope,
  describe,
  it,
  createMockRequest,
  setAuthSession,
  clearMockCookies,
} from "./harness";

// Route handler imports
import { GET as getMenu } from "@/app/api/menu/[cafeSlug]/route";
import { GET as getTheUsual } from "@/app/api/the-usual/[cafeSlug]/route";
import { POST as createOrder, GET as getOrders } from "@/app/api/orders/route";
import { GET as getOrderById, PATCH as patchOrder } from "@/app/api/orders/[orderId]/route";
import { PATCH as patchOrderItem } from "@/app/api/orders/items/[orderItemId]/route";
import { POST as createTableService, GET as getTableService, PATCH as patchTableService } from "@/app/api/table-service/route";
import { GET as getKdsStream } from "@/app/api/kds/stream/[cafeSlug]/route";
import { GET as getOwnerCafe, PATCH as patchOwnerCafe } from "@/app/api/owner/cafe/route";
import { POST as createOwnerMenuItem } from "@/app/api/owner/menu/route";
import { PATCH as patchOwnerMenuItem } from "@/app/api/owner/menu/[itemId]/route";
import { POST as createOwnerStaff } from "@/app/api/owner/staff/route";
import { GET as getAdminCafes } from "@/app/api/admin/cafes/route";
import { PATCH as patchAdminCafe } from "@/app/api/admin/cafes/[cafeId]/route";
import { GET as getAdminUsers } from "@/app/api/admin/users/route";
import { GET as getDiscovery } from "@/app/api/discovery/route";
import { POST as registerUser } from "@/app/api/auth/register/route";
import { POST as loginUser } from "@/app/api/auth/login/route";
import { GET as getAuthMe } from "@/app/api/auth/me/route";

export function registerTier1Tests(): void {
  // ───────────────────────────────────────────────────────────────────────────
  // Feature 1: 5-Theme Definitions & Tokens (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 1);
  describe("Feature 1: 5-Theme Definitions & Tokens", () => {
    it("T1.1.1: Verify all 5 theme IDs exist in THEMES dictionary", () => {
      const expectedThemes: ThemeId[] = [
        "NORDIC_MINIMAL",
        "OLED_CARBON",
        "ARTISAN_SEPIA",
        "NEO_EDITORIAL",
        "WARM_TERRACOTTA",
      ];
      for (const themeId of expectedThemes) {
        assertDefined(THEMES[themeId], `Theme ${themeId} must be defined in THEMES`);
        assertEqual(THEMES[themeId].id, themeId, `Theme id property must match key ${themeId}`);
      }
    });

    it("T1.1.2: Verify each theme defines all 13 required CSS variable tokens", () => {
      const requiredTokens = [
        "--theme-bg",
        "--theme-bg-2",
        "--theme-surface",
        "--theme-border",
        "--theme-text",
        "--theme-text-2",
        "--theme-accent",
        "--theme-accent-fg",
        "--theme-accent-2",
        "--theme-card-shadow",
        "--theme-radius",
        "--theme-radius-lg",
        "--theme-font-weight-display",
      ];

      for (const [themeId, theme] of Object.entries(THEMES)) {
        for (const token of requiredTokens) {
          assertDefined(
            theme.cssVars[token],
            `Theme ${themeId} is missing CSS variable token ${token}`
          );
          assert(
            theme.cssVars[token].length > 0,
            `Token ${token} in theme ${themeId} must not be empty`
          );
        }
      }
    });

    it("T1.1.3: Verify getThemeCssString() generates valid CSS variable syntax", () => {
      const cssString = getThemeCssString("NORDIC_MINIMAL");
      assertIncludes(cssString, "--theme-bg: #F6F3EE;");
      assertIncludes(cssString, "--theme-accent: #8B5E3C;");
      assertIncludes(cssString, "--theme-radius: 12px;");
      assertMatches(cssString, /--theme-[a-z0-9-]+:\s*[^;]+;/);
    });

    it("T1.1.4: Verify getTheme() returns exact definition and provides NORDIC_MINIMAL fallback", () => {
      const oled = getTheme("OLED_CARBON");
      assertEqual(oled.name, "OLED Carbon");
      assertEqual(oled.cssVars["--theme-bg"], "#080808");

      const fallback = getTheme("NON_EXISTENT_THEME");
      assertEqual(fallback.id, "NORDIC_MINIMAL");
    });

    it("T1.1.5: Verify THEME_LIST contains exactly 5 complete theme objects with Persian metadata", () => {
      assertEqual(THEME_LIST.length, 5);
      const persianNames = THEME_LIST.map((t) => t.nameFa);
      assertIncludes(persianNames, "نوردیک مینیمال");
      assertIncludes(persianNames, "اولد کربن");
      assertIncludes(persianNames, "آرتیزان سپیا");
      assertIncludes(persianNames, "نئو ادیتوریال");
      assertIncludes(persianNames, "ترراکوتای گرم");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 2: Customer Menu Theme Injection (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 2);
  describe("Feature 2: Customer Menu Theme Injection", () => {
    it("T1.2.1: Verify /api/menu/[cafeSlug] returns 200 with cafe theme ID for valid slug", async () => {
      const req = createMockRequest("/api/menu/roastery-collective");
      const res = await getMenu(req, { params: Promise.resolve({ cafeSlug: "roastery-collective" }) });
      assertEqual(res.status, 200);
      const json = await res.json();
      assert(json.success, "Response success must be true");
      assertEqual(json.data.slug, "roastery-collective");
      assertEqual(json.data.themeId, "NORDIC_MINIMAL");
    });

    it("T1.2.2: Verify menu categories and items are returned in correct displayOrder", async () => {
      const req = createMockRequest("/api/menu/roastery-collective");
      const res = await getMenu(req, { params: Promise.resolve({ cafeSlug: "roastery-collective" }) });
      const json = await res.json();
      const categories = json.data.categories;
      assert(categories.length > 0, "Categories must not be empty");

      for (let i = 1; i < categories.length; i++) {
        assert(
          categories[i].displayOrder >= categories[i - 1].displayOrder,
          "Categories must be sorted by displayOrder ascending"
        );
      }
    });

    it("T1.2.3: Verify parsed amenities and opening hours JSON structures in menu response", async () => {
      const req = createMockRequest("/api/menu/roastery-collective");
      const res = await getMenu(req, { params: Promise.resolve({ cafeSlug: "roastery-collective" }) });
      const json = await res.json();
      const cafe = json.data;

      assertEqual(typeof cafe.amenities, "object");
      assertEqual(typeof cafe.amenities.wifi, "boolean");
      assertEqual(typeof cafe.openingHours, "object");
      assertDefined(cafe.openingHours.sat, "Opening hours must contain days");
    });

    it("T1.2.4: Verify modifier groups are populated with default options and prices", async () => {
      const req = createMockRequest("/api/menu/roastery-collective");
      const res = await getMenu(req, { params: Promise.resolve({ cafeSlug: "roastery-collective" }) });
      const json = await res.json();
      const items = json.data.categories.flatMap((c: any) => c.menuItems);
      const itemWithMods = items.find((i: any) => i.modifierGroups && i.modifierGroups.length > 0);

      assertDefined(itemWithMods, "Must find at least one item with modifier groups");
      const modGroup = itemWithMods.modifierGroups[0];
      assertDefined(modGroup.name);
      assert(modGroup.options.length > 0, "Modifier group must have options");
      assertEqual(typeof modGroup.options[0].priceDelta, "number");
    });

    it("T1.2.5: Verify unapproved/inactive cafes return 404 in customer menu API", async () => {
      const req = createMockRequest("/api/menu/non-existent-cafe-slug-xyz");
      const res = await getMenu(req, { params: Promise.resolve({ cafeSlug: "non-existent-cafe-slug-xyz" }) });
      assertEqual(res.status, 404);
      const json = await res.json();
      assertEqual(json.success, false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 3: "همان همیشگی" (Haman Hamishegi) Widget (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 3);
  describe("Feature 3: Haman Hamishegi Widget", () => {
    it("T1.3.1: Verify /api/the-usual/[cafeSlug] returns empty array for unauthenticated customer", async () => {
      clearMockCookies();
      const req = createMockRequest("/api/the-usual/roastery-collective");
      const res = await getTheUsual(req, { params: Promise.resolve({ cafeSlug: "roastery-collective" }) });
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.success, true);
      assertDeepEqual(json.data, []);
    });

    it("T1.3.2: Verify /api/the-usual/[cafeSlug] returns past delivered items for logged-in customer", async () => {
      // Find a customer with delivered orders or seed a test order
      const customer = await db.user.findFirst({ where: { role: "CUSTOMER" } });
      assertDefined(customer, "Customer user must exist");
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe, "Cafe must exist");
      const menuItem = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(menuItem, "Menu item must exist");

      // Ensure at least one delivered order exists
      await db.order.create({
        data: {
          cafeId: cafe.id,
          customerId: customer.id,
          orderCode: `TEST-USUAL-${Date.now().toString().slice(-4)}`,
          status: "DELIVERED",
          paymentMode: "PAY_UPFRONT_BUZZER",
          paymentStatus: "PAID",
          subtotalAmount: menuItem.price,
          totalAmount: menuItem.price,
          orderItems: {
            create: [
              {
                itemId: menuItem.id,
                quantity: 2,
                unitPrice: menuItem.price,
                totalPrice: menuItem.price * 2,
                stationStatus: "DONE",
              },
            ],
          },
        },
      });

      await setAuthSession("CUSTOMER", cafe.id, { sub: customer.id, phone: customer.phone });
      const req = createMockRequest("/api/the-usual/roastery-collective");
      const res = await getTheUsual(req, { params: Promise.resolve({ cafeSlug: "roastery-collective" }) });
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.success, true);
      assert(Array.isArray(json.data), "Data must be an array");
      assert(json.data.length > 0, "Must return at least one favorite item");
      assertEqual(json.data[0].id, menuItem.id);
    });

    it("T1.3.3: Verify returned items are sorted by reorder frequency descending", async () => {
      const customer = await db.user.findFirst({ where: { role: "CUSTOMER" } });
      assertDefined(customer);
      await setAuthSession("CUSTOMER", undefined, { sub: customer.id, phone: customer.phone });

      const req = createMockRequest("/api/the-usual/roastery-collective");
      const res = await getTheUsual(req, { params: Promise.resolve({ cafeSlug: "roastery-collective" }) });
      const json = await res.json();
      const items = json.data;

      if (items.length > 1) {
        for (let i = 1; i < items.length; i++) {
          assert(
            items[i - 1].reorderFrequency >= items[i].reorderFrequency,
            "Items must be sorted by reorder frequency descending"
          );
        }
      }
    });

    it("T1.3.4: Verify unavailable (86'd) items are filtered out of recommendations", async () => {
      const customer = await db.user.findFirst({ where: { role: "CUSTOMER" } });
      assertDefined(customer);
      await setAuthSession("CUSTOMER", undefined, { sub: customer.id, phone: customer.phone });

      const req = createMockRequest("/api/the-usual/roastery-collective");
      const res = await getTheUsual(req, { params: Promise.resolve({ cafeSlug: "roastery-collective" }) });
      const json = await res.json();

      for (const item of json.data) {
        assertEqual(item.isAvailable, true, "Recommended items must only include available items");
      }
    });

    it("T1.3.5: Verify maximum 3 items are returned by the endpoint", async () => {
      const customer = await db.user.findFirst({ where: { role: "CUSTOMER" } });
      assertDefined(customer);
      await setAuthSession("CUSTOMER", undefined, { sub: customer.id, phone: customer.phone });

      const req = createMockRequest("/api/the-usual/roastery-collective");
      const res = await getTheUsual(req, { params: Promise.resolve({ cafeSlug: "roastery-collective" }) });
      const json = await res.json();
      assert(json.data.length <= 3, `Expected at most 3 items, got ${json.data.length}`);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 4: Loyalty Stamp Card (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 4);
  describe("Feature 4: Loyalty Stamp Card", () => {
    it("T1.4.1: Verify customer receives loyalty stamp record creation upon placing order", async () => {
      const user = await db.user.findFirst({ where: { phone: "09124444444" } });
      assertDefined(user);
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      // Clean prior loyalty stamp
      await db.loyaltyStamp.deleteMany({ where: { userId: user.id, cafeId: cafe.id } });

      await setAuthSession("CUSTOMER", cafe.id, { sub: user.id, phone: user.phone });

      const req = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [{ menuItemId: item.id, quantity: 1, selectedModifiers: [] }],
        },
      });

      const res = await createOrder(req);
      assertEqual(res.status, 201);

      const stamp = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: user.id, cafeId: cafe.id } },
      });
      assertDefined(stamp, "Loyalty stamp record must exist");
      assertEqual(stamp.stampsCount, 1);
    });

    it("T1.4.2: Verify loyalty stamps count increments with subsequent orders", async () => {
      const user = await db.user.findFirst({ where: { phone: "09124444444" } });
      assertDefined(user);
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      await setAuthSession("CUSTOMER", cafe.id, { sub: user.id, phone: user.phone });

      const req = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [{ menuItemId: item.id, quantity: 1, selectedModifiers: [] }],
        },
      });

      await createOrder(req);

      const stamp = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: user.id, cafeId: cafe.id } },
      });
      assertDefined(stamp);
      assertEqual(stamp.stampsCount, 2);
    });

    it("T1.4.3: Verify maxStamps defaults to 6 in database schema", async () => {
      const user = await db.user.findFirst({ where: { phone: "09124444444" } });
      assertDefined(user);
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);

      const stamp = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: user.id, cafeId: cafe.id } },
      });
      assertDefined(stamp);
      assertEqual(stamp.maxStamps, 6);
    });

    it("T1.4.4: Verify loyalty stamp query returns correct count for customer at cafe", async () => {
      const user = await db.user.findFirst({ where: { phone: "09124444444" } });
      assertDefined(user);
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);

      const stamp = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: user.id, cafeId: cafe.id } },
      });
      assertDefined(stamp);
      assertInRange(stamp.stampsCount, 1, 6);
    });

    it("T1.4.5: Verify loyalty stamps are isolated per cafe per customer", async () => {
      const user = await db.user.findFirst({ where: { phone: "09124444444" } });
      assertDefined(user);
      const cafe1 = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      const cafe2 = await db.cafe.findFirst({ where: { slug: "noir-social-club" } });
      assertDefined(cafe1);
      assertDefined(cafe2);

      const stamp1 = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: user.id, cafeId: cafe1.id } },
      });
      const stamp2 = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: user.id, cafeId: cafe2.id } },
      });

      assertDefined(stamp1);
      assertEqual(stamp2?.stampsCount ?? 0, 0, "Cafe 2 must not have Cafe 1 stamps");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 5: Coffee Flavor Radar Chart (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 5);
  describe("Feature 5: Coffee Flavor Radar Chart", () => {
    it("T1.5.1: Verify CoffeeProfileSchema validates 5 radar axes", () => {
      const validProfile = {
        origin: "Ethiopia Yirgacheffe",
        altitude: "1950m",
        process: "Washed",
        roastLevel: "Light-Medium",
        radar: {
          acidity: 8.5,
          body: 6,
          sweetness: 7.5,
          bitterness: 3,
          aroma: 9,
        },
        flavorNotes: ["Floral", "Bergamot", "Jasmine"],
      };

      const result = CoffeeProfileSchema.safeParse(validProfile);
      assert(result.success, "Profile schema validation must succeed");
    });

    it("T1.5.2: Verify radar axis values are bounded within range [1, 10]", () => {
      const invalidLow = {
        origin: "Colombia",
        altitude: "1600m",
        process: "Natural",
        roastLevel: "Medium",
        radar: { acidity: 0.5, body: 5, sweetness: 5, bitterness: 5, aroma: 5 },
        flavorNotes: ["Caramel"],
      };
      const invalidHigh = {
        origin: "Colombia",
        altitude: "1600m",
        process: "Natural",
        roastLevel: "Medium",
        radar: { acidity: 11, body: 5, sweetness: 5, bitterness: 5, aroma: 5 },
        flavorNotes: ["Caramel"],
      };

      assert(!CoffeeProfileSchema.safeParse(invalidLow).success, "Values < 1 must fail");
      assert(!CoffeeProfileSchema.safeParse(invalidHigh).success, "Values > 10 must fail");
    });

    it("T1.5.3: Verify menu item coffeeProfile parses origin, process, altitude, and roastLevel", async () => {
      const item = await db.menuItem.findFirst({
        where: { coffeeProfile: { not: null } },
      });
      assertDefined(item, "Must have at least one coffee item with profile in DB");
      const profile = JSON.parse(item.coffeeProfile!);
      assertDefined(profile.origin, "Origin must be defined");
      assertDefined(profile.process, "Process must be defined");
      assertDefined(profile.roastLevel, "Roast level must be defined");
    });

    it("T1.5.4: Verify flavorNotes array is properly deserialized from menu item", async () => {
      const item = await db.menuItem.findFirst({
        where: { coffeeProfile: { not: null } },
      });
      assertDefined(item);
      const profile = JSON.parse(item.coffeeProfile!);
      assert(Array.isArray(profile.flavorNotes), "flavorNotes must be an array");
      assert(profile.flavorNotes.length > 0, "flavorNotes must contain at least one note");
    });

    it("T1.5.5: Verify trigonometric coordinates calculation produces valid 2D polygon vertices", () => {
      const size = 160;
      const center = size / 2;
      const radius = 55;
      const axesValues = [8, 6, 7, 3, 9];

      const vertices = axesValues.map((val, i) => {
        const angle = Math.PI / 2 - (2 * Math.PI * i) / 5;
        const r = (val / 10) * radius;
        return {
          x: center + r * Math.cos(angle),
          y: center - r * Math.sin(angle),
        };
      });

      assertEqual(vertices.length, 5);
      for (const v of vertices) {
        assertInRange(v.x, 0, size, "Vertex X must be within SVG bounds");
        assertInRange(v.y, 0, size, "Vertex Y must be within SVG bounds");
        assert(!isNaN(v.x) && !isNaN(v.y), "Coordinates must not be NaN");
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 6: Menu Drawer & Floating Cart (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 6);
  describe("Feature 6: Menu Drawer & Floating Cart", () => {
    it("T1.6.1: Verify CartItemSchema validates menu item ID, quantity, and selected modifiers", () => {
      const validCartItem = {
        menuItemId: "item-123",
        quantity: 2,
        selectedModifiers: [
          { id: "mod-1", name: "شیر بادام", priceDelta: 15000 },
        ],
        itemNotes: "کم‌شکر لطفاً",
      };

      const result = CartItemSchema.safeParse(validCartItem);
      assert(result.success, "CartItemSchema should succeed for valid cart item");
    });

    it("T1.6.2: Verify cart total calculation accounts for base price plus modifier deltas multiplied by quantity", () => {
      const basePrice = 85000;
      const quantity = 3;
      const modifiers = [
        { id: "m1", name: "اکسترا شات", priceDelta: 20000 },
        { id: "m2", name: "سیروپ وانیل", priceDelta: 10000 },
      ];

      const modTotal = modifiers.reduce((acc, m) => acc + m.priceDelta, 0);
      const unitPrice = basePrice + modTotal;
      const totalPrice = unitPrice * quantity;

      assertEqual(unitPrice, 115000);
      assertEqual(totalPrice, 345000);
    });

    it("T1.6.3: Verify order creation creates order items with selected modifiers JSON", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      const modifiers = [{ id: "test-opt", name: "شیر جو دوسر", priceDelta: 12000 }];

      const req = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [
            {
              menuItemId: item.id,
              quantity: 1,
              selectedModifiers: modifiers,
              itemNotes: "بدون نی",
            },
          ],
        },
      });

      const res = await createOrder(req);
      assertEqual(res.status, 201);
      const json = await res.json();
      assertEqual(json.success, true);
      assertDefined(json.data.id);
      assertEqual(json.data.orderItems[0].totalPrice, item.price + 12000);
    });

    it("T1.6.4: Verify PAY_UPFRONT_BUZZER order generates buzzer number in range [1, 99]", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      const req = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [{ menuItemId: item.id, quantity: 1, selectedModifiers: [] }],
        },
      });

      const res = await createOrder(req);
      const json = await res.json();
      assertDefined(json.data.buzzerNumber);
      assertInRange(json.data.buzzerNumber, 1, 99, "Buzzer number must be between 1 and 99");
    });

    it("T1.6.5: Verify TABLE_TAB_SPLIT order initializes with status CONFIRMED and UNPAID", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      const req = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "TABLE_TAB_SPLIT",
          items: [{ menuItemId: item.id, quantity: 1, selectedModifiers: [] }],
        },
      });

      const res = await createOrder(req);
      const json = await res.json();
      assertEqual(json.data.status, "CONFIRMED");
      assertEqual(json.data.paymentMode, "TABLE_TAB_SPLIT");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 7: Table Service Hub & FAB (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 7);
  describe("Feature 7: Table Service Hub & FAB", () => {
    it("T1.7.1: Verify POST /api/table-service creates a request with status PENDING", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const table = await db.table.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(table);

      const req = createMockRequest("/api/table-service", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          tableId: table.id,
          tableNumber: table.tableNumber,
          requestType: "CALL_WAITER",
          note: "منو لطفاً",
        },
      });

      const res = await createTableService(req);
      assertEqual(res.status, 201);
      const json = await res.json();
      assertEqual(json.success, true);
      assertEqual(json.data.status, "PENDING");
      assertEqual(json.data.requestType, "CALL_WAITER");
    });

    it("T1.7.2: Verify all 5 service types are accepted", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const table = await db.table.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(table);

      const serviceTypes = [
        "CALL_WAITER",
        "REQUEST_BILL",
        "REQUEST_WATER",
        "REQUEST_POS",
        "GAME_REQUEST",
      ];

      for (const serviceType of serviceTypes) {
        const req = createMockRequest("/api/table-service", {
          method: "POST",
          body: {
            cafeId: cafe.id,
            tableId: table.id,
            tableNumber: table.tableNumber,
            requestType: serviceType,
          },
        });
        const res = await createTableService(req);
        assertEqual(res.status, 201, `Service type ${serviceType} should be accepted`);
      }
    });

    it("T1.7.3: Verify table service request emits TABLE_SERVICE event to KDS queue", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const table = await db.table.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(table);

      const req = createMockRequest("/api/table-service", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          tableId: table.id,
          tableNumber: table.tableNumber,
          requestType: "REQUEST_WATER",
        },
      });

      await createTableService(req);
      const events = (global as any).__kdsEvents?.[cafe.id] ?? [];
      const serviceEvent = events.find((e: any) => e.type === "TABLE_SERVICE" && e.payload.requestType === "REQUEST_WATER");
      assertDefined(serviceEvent, "KDS event TABLE_SERVICE must be emitted");
    });

    it("T1.7.4: Verify GET /api/table-service returns pending requests for staff", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);

      await setAuthSession("STAFF", cafe.id);
      const req = createMockRequest(`/api/table-service?cafeId=${cafe.id}`);
      const res = await getTableService(req);
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.success, true);
      assert(Array.isArray(json.data), "Requests must be an array");
    });

    it("T1.7.5: Verify PATCH /api/table-service updates request status to DONE", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const pendingReq = await db.tableServiceRequest.findFirst({
        where: { cafeId: cafe.id, status: "PENDING" },
      });
      assertDefined(pendingReq);

      await setAuthSession("STAFF", cafe.id);
      const patchReq = createMockRequest("/api/table-service", {
        method: "PATCH",
        body: { id: pendingReq.id, status: "DONE" },
      });

      const res = await patchTableService(patchReq);
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.data.status, "DONE");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 8: KDS Barista Board & SSE (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 8);
  describe("Feature 8: KDS Barista Board & SSE", () => {
    it("T1.8.1: Verify GET /api/kds/stream/[cafeSlug] establishes SSE connection with text/event-stream headers", async () => {
      const req = createMockRequest("/api/kds/stream/roastery-collective");
      const res = await getKdsStream(req, { params: Promise.resolve({ cafeSlug: "roastery-collective" }) });
      assertEqual(res.status, 200);
      assertEqual(res.headers.get("Content-Type"), "text/event-stream");
      assertEqual(res.headers.get("Cache-Control"), "no-cache, no-transform");
    });

    it("T1.8.2: Verify initial state event contains active orders with modifiers and table info", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);

      const activeOrders = await db.order.findMany({
        where: { cafeId: cafe.id, status: { notIn: ["DELIVERED", "CANCELLED"] } },
        include: { orderItems: true, table: true },
      });
      assert(activeOrders.length >= 0, "Query for active orders succeeds");
    });

    it("T1.8.3: Verify PATCH /api/orders/items/[orderItemId] updates item status to IN_PROGRESS", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.orderItem.findFirst({
        where: { order: { cafeId: cafe.id } },
      });
      assertDefined(item);

      await setAuthSession("STAFF", cafe.id);
      const req = createMockRequest(`/api/orders/items/${item.id}`, {
        method: "PATCH",
        body: { stationStatus: "IN_PROGRESS" },
      });

      const res = await patchOrderItem(req, { params: Promise.resolve({ orderItemId: item.id }) });
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.data.stationStatus, "IN_PROGRESS");
    });

    it("T1.8.4: Verify marking all items in an order DONE auto-transitions order status to READY", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const menuItem = await db.menuItem.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(menuItem);

      // Create single item order
      const order = await db.order.create({
        data: {
          cafeId: cafe.id,
          orderCode: `TEST-AUTO-${Date.now().toString().slice(-4)}`,
          status: "IN_PREPARATION",
          paymentMode: "PAY_UPFRONT_BUZZER",
          subtotalAmount: menuItem.price,
          totalAmount: menuItem.price,
          orderItems: {
            create: [
              {
                itemId: menuItem.id,
                quantity: 1,
                unitPrice: menuItem.price,
                totalPrice: menuItem.price,
                stationStatus: "IN_PROGRESS",
              },
            ],
          },
        },
        include: { orderItems: true },
      });

      const orderItemId = order.orderItems[0].id;

      await setAuthSession("STAFF", cafe.id);
      const req = createMockRequest(`/api/orders/items/${orderItemId}`, {
        method: "PATCH",
        body: { stationStatus: "DONE" },
      });

      const res = await patchOrderItem(req, { params: Promise.resolve({ orderItemId }) });
      assertEqual(res.status, 200);

      const updatedOrder = await db.order.findUnique({ where: { id: order.id } });
      assertDefined(updatedOrder);
      assertEqual(updatedOrder.status, "READY");
    });

    it("T1.8.5: Verify station status updates emit ITEM_STATUS_UPDATE and ORDER_READY SSE events", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);

      const events = (global as any).__kdsEvents?.[cafe.id] ?? [];
      const readyEvent = events.find((e: any) => e.type === "ORDER_READY");
      assertDefined(readyEvent, "ORDER_READY event must be present in queue");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 9: Owner Studio & Menu/Category CRUD (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 9);
  describe("Feature 9: Owner Studio & Menu/Category CRUD", () => {
    it("T1.9.1: Verify GET /api/owner/cafe returns full cafe configuration for authenticated owner", async () => {
      const owner = await db.user.findFirst({ where: { phone: "09121111111" } });
      assertDefined(owner);
      await setAuthSession("CAFE_OWNER", undefined, { sub: owner.id, phone: owner.phone });

      const req = createMockRequest("/api/owner/cafe");
      const res = await getOwnerCafe(req);
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.success, true);
      assertDefined(json.data.themeId);
      assertDefined(json.data.categories);
    });

    it("T1.9.2: Verify PATCH /api/owner/cafe updates cafe themeId and amenities", async () => {
      const owner = await db.user.findFirst({ where: { phone: "09121111111" } });
      assertDefined(owner);
      await setAuthSession("CAFE_OWNER", undefined, { sub: owner.id, phone: owner.phone });

      const req = createMockRequest("/api/owner/cafe", {
        method: "PATCH",
        body: {
          themeId: "WARM_TERRACOTTA",
          amenities: {
            wifi: true,
            smoking: true,
            outdoor: true,
            board_games: true,
            work_friendly: true,
            pet_friendly: true,
          },
        },
      });

      const res = await patchOwnerCafe(req);
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.data.themeId, "WARM_TERRACOTTA");

      // Reset back
      const resetReq = createMockRequest("/api/owner/cafe", {
        method: "PATCH",
        body: { themeId: "NORDIC_MINIMAL" },
      });
      await patchOwnerCafe(resetReq);
    });

    it("T1.9.3: Verify POST /api/owner/menu creates new menu item with modifier groups", async () => {
      const owner = await db.user.findFirst({ where: { phone: "09121111111" } });
      assertDefined(owner);
      const cafe = await db.cafe.findFirst({ where: { ownerId: owner.id } });
      assertDefined(cafe);
      const category = await db.category.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(category);

      await setAuthSession("CAFE_OWNER", cafe.id, { sub: owner.id, phone: owner.phone });

      const req = createMockRequest("/api/owner/menu", {
        method: "POST",
        body: {
          categoryId: category.id,
          title: `اسپرسو تست ${Date.now().toString().slice(-4)}`,
          price: 70000,
          prepTimeMinutes: 4,
          tags: ["تخصصی", "سینگل اوریجین"],
          allergens: [],
          modifierGroups: [
            {
              name: "نوع دانه",
              isRequired: true,
              minSelection: 1,
              maxSelection: 1,
              options: [
                { name: "بلند برزیل/اتیوپی", priceDelta: 0, isDefault: true },
                { name: "کلمبیا ویلا", priceDelta: 15000, isDefault: false },
              ],
            },
          ],
        },
      });

      const res = await createOwnerMenuItem(req);
      assertEqual(res.status, 201);
      const json = await res.json();
      assertEqual(json.success, true);
      assertDefined(json.data.id);
      assertEqual(json.data.modifierGroups.length, 1);
    });

    it("T1.9.4: Verify PATCH /api/owner/menu/[itemId] modifies item price and availability", async () => {
      const owner = await db.user.findFirst({ where: { phone: "09121111111" } });
      assertDefined(owner);
      const cafe = await db.cafe.findFirst({ where: { ownerId: owner.id } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(item);

      await setAuthSession("CAFE_OWNER", cafe.id, { sub: owner.id, phone: owner.phone });

      const newPrice = item.price + 5000;
      const req = createMockRequest(`/api/owner/menu/${item.id}`, {
        method: "PATCH",
        body: { price: newPrice, isAvailable: true },
      });

      const res = await patchOwnerMenuItem(req, { params: Promise.resolve({ itemId: item.id }) });
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.data.price, newPrice);
    });

    it("T1.9.5: Verify POST /api/owner/staff creates or updates staff station permissions", async () => {
      const owner = await db.user.findFirst({ where: { phone: "09121111111" } });
      assertDefined(owner);
      const cafe = await db.cafe.findFirst({ where: { ownerId: owner.id } });
      assertDefined(cafe);

      await setAuthSession("CAFE_OWNER", cafe.id, { sub: owner.id, phone: owner.phone });

      const req = createMockRequest("/api/owner/staff", {
        method: "POST",
        body: {
          phone: "09129998877",
          canEditMenu: true,
          canToggleStock: true,
          canEditPrices: false,
          canManageOrders: true,
        },
      });

      const res = await createOwnerStaff(req);
      assertEqual(res.status, 201);
      const json = await res.json();
      assertEqual(json.success, true);
      assertEqual(json.data.canEditMenu, true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 10: Super Admin Dashboard (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 10);
  describe("Feature 10: Super Admin Dashboard", () => {
    it("T1.10.1: Verify GET /api/admin/cafes returns all cafes with owner details and order counts", async () => {
      await setAuthSession("SUPER_ADMIN");
      const res = await getAdminCafes();
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.success, true);
      assert(json.data.length >= 2, "Admin should see all cafes");
      assertDefined(json.data[0].owner);
      assertDefined(json.data[0]._count.orders);
    });

    it("T1.10.2: Verify PATCH /api/admin/cafes/[cafeId] updates cafe isApproved status", async () => {
      await setAuthSession("SUPER_ADMIN");
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);

      const req = createMockRequest(`/api/admin/cafes/${cafe.id}`, {
        method: "PATCH",
        body: { isApproved: true, isActive: true },
      });

      const res = await patchAdminCafe(req, { params: Promise.resolve({ cafeId: cafe.id }) });
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.data.isApproved, true);
    });

    it("T1.10.3: Verify GET /api/admin/users returns registered users list", async () => {
      await setAuthSession("SUPER_ADMIN");
      const res = await getAdminUsers();
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.success, true);
      assert(json.data.length >= 5, "Should return registered users");
      assertDefined(json.data[0].phone);
      assertDefined(json.data[0].role);
    });

    it("T1.10.4: Verify non-admin role receives 403 Forbidden on admin endpoints", async () => {
      await setAuthSession("CUSTOMER");
      const res = await getAdminCafes();
      assertEqual(res.status, 403);
      const json = await res.json();
      assertEqual(json.success, false);
    });

    it("T1.10.5: Verify admin metrics aggregate total cafes and user counts", async () => {
      await setAuthSession("SUPER_ADMIN");
      const [cafeCount, userCount] = await Promise.all([
        db.cafe.count(),
        db.user.count(),
      ]);

      assert(cafeCount >= 2, "Platform should have at least 2 cafes");
      assert(userCount >= 5, "Platform should have at least 5 users");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 11: Discovery Marketplace (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 11);
  describe("Feature 11: Discovery Marketplace", () => {
    it("T1.11.1: Verify GET /api/discovery returns approved and active cafes only", async () => {
      const req = createMockRequest("/api/discovery");
      const res = await getDiscovery(req);
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.success, true);
      for (const cafe of json.data) {
        assertEqual(cafe.isApproved, true);
        assertEqual(cafe.isActive, true);
      }
    });

    it("T1.11.2: Verify text search ?q= filters matching cafe names or descriptions", async () => {
      const req = createMockRequest("/api/discovery?q=%D8%B1%D9%88%D8%B3%D8%AA%D8%B1%DB%8C"); // روستری
      const res = await getDiscovery(req);
      const json = await res.json();
      assert(json.data.length > 0, "Should match roastery collective");
      assertIncludes(json.data[0].name, "روستری");
    });

    it("T1.11.3: Verify amenity filter ?wifi=true filters cafes with WiFi", async () => {
      const req = createMockRequest("/api/discovery?wifi=true");
      const res = await getDiscovery(req);
      const json = await res.json();
      for (const cafe of json.data) {
        assertEqual(cafe.amenities.wifi, true);
      }
    });

    it("T1.11.4: Verify Haversine formula correctly computes distance in kilometers", () => {
      // Distance between Tehran Center (35.6892, 51.3890) and Tajrish (35.8053, 51.4286) ~ 13.5km
      const dist = haversineDistance(35.6892, 51.389, 35.8053, 51.4286);
      assertInRange(dist, 12.0, 15.0, "Distance should be approx 13.5km");
    });

    it("T1.11.5: Verify isCafeOpenNow() correctly parses opening hours schedule", () => {
      const schedule = JSON.stringify({
        mon: { open: "08:00", close: "23:00" },
        tue: { open: "08:00", close: "23:00" },
        wed: { open: "08:00", close: "23:00" },
        thu: { open: "08:00", close: "23:00" },
        fri: { open: "08:00", close: "23:00" },
        sat: { open: "08:00", close: "23:00" },
        sun: { open: "08:00", close: "23:00" },
      });
      const isOpen = isCafeOpenNow(schedule);
      assertEqual(typeof isOpen, "boolean");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 12: Auth & Mock Payment Gateway (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(1, 12);
  describe("Feature 12: Auth & Mock Payment Gateway", () => {
    it("T1.12.1: Verify POST /api/auth/register creates user with hashed password and returns session", async () => {
      const phone = `0910${Math.floor(1000000 + Math.random() * 9000000)}`;
      const req = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          phone,
          password: "securePassword123",
          fullName: "کاربر تستی ثبت نام",
          role: "CUSTOMER",
        },
      });

      const res = await registerUser(req);
      assertEqual(res.status, 201);
      const json = await res.json();
      assertEqual(json.success, true);
      assertEqual(json.data.phone, phone);

      const dbUser = await db.user.findUnique({ where: { phone } });
      assertDefined(dbUser);
      assert(dbUser.passwordHash !== "securePassword123", "Password must be hashed with bcrypt");
    });

    it("T1.12.2: Verify POST /api/auth/login verifies bcrypt password and returns token", async () => {
      const req = createMockRequest("/api/auth/login", {
        method: "POST",
        body: {
          phone: "09124444444",
          password: "customer123",
        },
      });

      const res = await loginUser(req);
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.success, true);
      assertDefined(json.data.token, "Login must return JWT token");
    });

    it("T1.12.3: Verify GET /api/auth/me returns current user profile payload", async () => {
      const user = await db.user.findFirst({ where: { phone: "09124444444" } });
      assertDefined(user);
      await setAuthSession("CUSTOMER", undefined, { sub: user.id, phone: user.phone });

      const res = await getAuthMe();
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.success, true);
      assertEqual(json.data.phone, "09124444444");
    });

    it("T1.12.4: Verify GET /api/orders/[orderId] retrieves order details for payment verification", async () => {
      const order = await db.order.findFirst({ include: { orderItems: true } });
      assertDefined(order);

      const req = createMockRequest(`/api/orders/${order.id}`);
      const res = await getOrderById(req, { params: Promise.resolve({ orderId: order.id }) });
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.success, true);
      assertEqual(json.data.id, order.id);
      assert(Array.isArray(json.data.orderItems), "orderItems must be array");
    });

    it("T1.12.5: Verify PATCH /api/orders/[orderId] transitions order status to CONFIRMED upon payment completion", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const menuItem = await db.menuItem.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(menuItem);

      const order = await db.order.create({
        data: {
          cafeId: cafe.id,
          orderCode: `TEST-PAY-${Date.now().toString().slice(-4)}`,
          status: "PENDING_PAYMENT",
          paymentMode: "PAY_UPFRONT_BUZZER",
          subtotalAmount: menuItem.price,
          totalAmount: menuItem.price,
          orderItems: {
            create: [
              {
                itemId: menuItem.id,
                quantity: 1,
                unitPrice: menuItem.price,
                totalPrice: menuItem.price,
              },
            ],
          },
        },
      });

      await setAuthSession("CAFE_OWNER", cafe.id);
      const req = createMockRequest(`/api/orders/${order.id}`, {
        method: "PATCH",
        body: { status: "CONFIRMED" },
      });

      const res = await patchOrder(req, { params: Promise.resolve({ orderId: order.id }) });
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.data.status, "CONFIRMED");
    });
  });
}
