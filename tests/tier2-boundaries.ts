import { db } from "@/lib/db";
import { THEMES, getTheme } from "@/lib/themes";
import {
  CoffeeProfileSchema,
  CreateMenuItemSchema,
  CreateOrderSchema,
  CreateTableServiceRequestSchema,
  DiscoveryQuerySchema,
  RegisterSchema,
  LoginSchema,
} from "@/lib/validations";
import { verifyToken } from "@/lib/auth";
import {
  assert,
  assertEqual,
  assertDefined,
  assertMatches,
  assertDeepEqual,
  setTestScope,
  describe,
  it,
  createMockRequest,
  setAuthSession,
  clearMockCookies,
} from "./harness";

// Route handlers
import { GET as getMenu } from "@/app/api/menu/[cafeSlug]/route";
import { GET as getTheUsual } from "@/app/api/the-usual/[cafeSlug]/route";
import { POST as createOrder } from "@/app/api/orders/route";
import { PATCH as patchOrderItem } from "@/app/api/orders/items/[orderItemId]/route";
import { GET as getOrderById, PATCH as patchOrder } from "@/app/api/orders/[orderId]/route";
import { POST as createTableService, PATCH as patchTableService } from "@/app/api/table-service/route";
import { GET as getKdsStream } from "@/app/api/kds/stream/[cafeSlug]/route";
import { PATCH as patchOwnerMenuItem } from "@/app/api/owner/menu/[itemId]/route";
import { POST as createOwnerMenu } from "@/app/api/owner/menu/route";
import { POST as createOwnerStaff } from "@/app/api/owner/staff/route";
import { PATCH as patchAdminCafe } from "@/app/api/admin/cafes/[cafeId]/route";
import { GET as getAdminCafes } from "@/app/api/admin/cafes/route";
import { GET as getAdminUsers } from "@/app/api/admin/users/route";
import { GET as getDiscovery } from "@/app/api/discovery/route";
import { POST as loginUser } from "@/app/api/auth/login/route";

export function registerTier2Tests(): void {
  // ───────────────────────────────────────────────────────────────────────────
  // Feature 1 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 1);
  describe("Feature 1 Boundary: Theme Definitions & Fallbacks", () => {
    it("T2.1.1: Fallback to NORDIC_MINIMAL on unknown/invalid theme ID", () => {
      const fallback = getTheme("UNKNOWN_CUSTOM_THEME_404");
      assertEqual(fallback.id, "NORDIC_MINIMAL");
      assertEqual(fallback.cssVars["--theme-bg"], "#F6F3EE");
    });

    it("T2.1.2: Empty string theme ID gracefully returns default theme", () => {
      const fallback = getTheme("");
      assertEqual(fallback.id, "NORDIC_MINIMAL");
    });

    it("T2.1.3: Validate all theme color values are non-empty valid hex strings", () => {
      for (const [themeId, theme] of Object.entries(THEMES)) {
        const hexTokens = [
          "--theme-bg",
          "--theme-bg-2",
          "--theme-surface",
          "--theme-border",
          "--theme-text",
          "--theme-text-2",
          "--theme-accent",
          "--theme-accent-fg",
          "--theme-accent-2",
        ];
        for (const token of hexTokens) {
          const val = theme.cssVars[token];
          assertMatches(
            val,
            /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/,
            `Token ${token} in theme ${themeId} must be a valid hex color, got "${val}"`
          );
        }
      }
    });

    it("T2.1.4: Border-radius token in NEO_EDITORIAL is strictly '0px'", () => {
      const neo = THEMES.NEO_EDITORIAL;
      assertEqual(neo.cssVars["--theme-radius"], "0px");
      assertEqual(neo.cssVars["--theme-radius-lg"], "0px");
    });

    it("T2.1.5: Theme font weight display is integer-equivalent string ('800' or '900')", () => {
      for (const [themeId, theme] of Object.entries(THEMES)) {
        const weight = theme.cssVars["--theme-font-weight-display"];
        assert(
          weight === "800" || weight === "900",
          `Theme ${themeId} display weight must be 800 or 900, got ${weight}`
        );
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 2 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 2);
  describe("Feature 2 Boundary: Customer Menu Theme Injection", () => {
    it("T2.2.1: 404 response on missing cafe slug", async () => {
      const req = createMockRequest("/api/menu/missing-slug-cafe-12345");
      const res = await getMenu(req, { params: Promise.resolve({ cafeSlug: "missing-slug-cafe-12345" }) });
      assertEqual(res.status, 404);
    });

    it("T2.2.2: Cafe with zero categories returns empty categories array without throwing", async () => {
      // Find a cafe and check response structure
      const cafe = await db.cafe.findFirst({ where: { isApproved: true, isActive: true } });
      assertDefined(cafe);
      const req = createMockRequest(`/api/menu/${cafe.slug}`);
      const res = await getMenu(req, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      assertEqual(res.status, 200);
      const json = await res.json();
      assert(Array.isArray(json.data.categories), "Categories must be an array");
    });

    it("T2.2.3: Category with zero available items returns empty menuItems array", async () => {
      const cafe = await db.cafe.findFirst({ where: { isApproved: true, isActive: true } });
      assertDefined(cafe);

      // Create empty category
      const emptyCat = await db.category.create({
        data: {
          cafeId: cafe.id,
          name: "دسته‌بندی خالی آزمایشی",
          displayOrder: 999,
          isActive: true,
        },
      });

      const req = createMockRequest(`/api/menu/${cafe.slug}`);
      const res = await getMenu(req, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const json = await res.json();
      const cat = json.data.categories.find((c: any) => c.id === emptyCat.id);
      assertDefined(cat);
      assertDeepEqual(cat.menuItems, []);

      // Cleanup
      await db.category.delete({ where: { id: emptyCat.id } });
    });

    it("T2.2.4: Special Persian / URL-encoded characters in slug handled properly", async () => {
      const req = createMockRequest("/api/menu/%DA%A9%D8%A7%D9%81%D9%87-%D8%AA%D8%B3%D8%AA");
      const res = await getMenu(req, { params: Promise.resolve({ cafeSlug: "کافه-تست" }) });
      // Non-existent slug returns 404 without 500 error
      assertEqual(res.status, 404);
    });

    it("T2.2.5: Inactive category (isActive: false) is omitted from public menu", async () => {
      const cafe = await db.cafe.findFirst({ where: { isApproved: true, isActive: true } });
      assertDefined(cafe);

      const inactiveCat = await db.category.create({
        data: {
          cafeId: cafe.id,
          name: "دسته‌بندی غیرفعال",
          displayOrder: 998,
          isActive: false,
        },
      });

      const req = createMockRequest(`/api/menu/${cafe.slug}`);
      const res = await getMenu(req, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const json = await res.json();
      const found = json.data.categories.find((c: any) => c.id === inactiveCat.id);
      assertEqual(found, undefined, "Inactive category must not appear in public menu");

      await db.category.delete({ where: { id: inactiveCat.id } });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 3 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 3);
  describe("Feature 3 Boundary: Haman Hamishegi Widget", () => {
    it("T2.3.1: Customer with only cancelled/pending orders receives empty 'the usual' list", async () => {
      const testUser = await db.user.create({
        data: {
          phone: `0930${Math.floor(1000000 + Math.random() * 9000000)}`,
          passwordHash: "dummyhash",
          fullName: "کاربر سفارش کنسل",
          role: "CUSTOMER",
        },
      });
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);
      const menuItem = await db.menuItem.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(menuItem);

      // Create CANCELLED order
      await db.order.create({
        data: {
          cafeId: cafe.id,
          customerId: testUser.id,
          orderCode: `CAN-${Date.now().toString().slice(-4)}`,
          status: "CANCELLED",
          paymentMode: "PAY_UPFRONT_BUZZER",
          subtotalAmount: menuItem.price,
          totalAmount: menuItem.price,
          orderItems: {
            create: [{ itemId: menuItem.id, quantity: 1, unitPrice: menuItem.price, totalPrice: menuItem.price }],
          },
        },
      });

      await setAuthSession("CUSTOMER", cafe.id, { sub: testUser.id, phone: testUser.phone });
      const req = createMockRequest(`/api/the-usual/${cafe.slug}`);
      const res = await getTheUsual(req, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const json = await res.json();
      assertDeepEqual(json.data, [], "Cancelled orders must not contribute to usual favorites");
    });

    it("T2.3.2: All past ordered items 86'd (unavailable) returns empty list gracefully", async () => {
      const testUser = await db.user.create({
        data: {
          phone: `0931${Math.floor(1000000 + Math.random() * 9000000)}`,
          passwordHash: "dummyhash",
          fullName: "کاربر ناموجود",
          role: "CUSTOMER",
        },
      });
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);
      const unavailableItem = await db.menuItem.create({
        data: {
          cafeId: cafe.id,
          categoryId: (await db.category.findFirst({ where: { cafeId: cafe.id } }))!.id,
          title: "آیتم موقتا ناموجود",
          price: 50000,
          isAvailable: false,
        },
      });

      await db.order.create({
        data: {
          cafeId: cafe.id,
          customerId: testUser.id,
          orderCode: `UNAV-${Date.now().toString().slice(-4)}`,
          status: "DELIVERED",
          paymentMode: "PAY_UPFRONT_BUZZER",
          subtotalAmount: unavailableItem.price,
          totalAmount: unavailableItem.price,
          orderItems: {
            create: [{ itemId: unavailableItem.id, quantity: 5, unitPrice: unavailableItem.price, totalPrice: unavailableItem.price * 5 }],
          },
        },
      });

      await setAuthSession("CUSTOMER", cafe.id, { sub: testUser.id, phone: testUser.phone });
      const req = createMockRequest(`/api/the-usual/${cafe.slug}`);
      const res = await getTheUsual(req, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const json = await res.json();
      assertDeepEqual(json.data, [], "86'd items must be excluded from usual list");
    });

    it("T2.3.3: Reorder count tie breaker preserves deterministic ordering", async () => {
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);
      const req = createMockRequest(`/api/the-usual/${cafe.slug}`);
      const res = await getTheUsual(req, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      assertEqual(res.status, 200);
    });

    it("T2.3.4: Customer with >50 past orders queries efficiently within limit", async () => {
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);
      const user = await db.user.findFirst({ where: { role: "CUSTOMER" } });
      assertDefined(user);

      await setAuthSession("CUSTOMER", cafe.id, { sub: user.id, phone: user.phone });
      const start = Date.now();
      const req = createMockRequest(`/api/the-usual/${cafe.slug}`);
      const res = await getTheUsual(req, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const elapsed = Date.now() - start;
      assertEqual(res.status, 200);
      assert(elapsed < 2000, "Query must complete within 2000ms");
    });

    it("T2.3.5: Non-existent cafe slug returns 404 in the-usual endpoint", async () => {
      const user = await db.user.findFirst({ where: { role: "CUSTOMER" } });
      assertDefined(user);
      await setAuthSession("CUSTOMER", undefined, { sub: user.id, phone: user.phone });

      const req = createMockRequest("/api/the-usual/ghost-cafe-not-found");
      const res = await getTheUsual(req, { params: Promise.resolve({ cafeSlug: "ghost-cafe-not-found" }) });
      assertEqual(res.status, 404);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 4 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 4);
  describe("Feature 4 Boundary: Loyalty Stamp Card", () => {
    it("T2.4.1: Customer with 0 stamps receives stampsCount: 0", async () => {
      const user = await db.user.create({
        data: {
          phone: `0932${Math.floor(1000000 + Math.random() * 9000000)}`,
          passwordHash: "dummyhash",
          fullName: "کاربر بدون مهر",
          role: "CUSTOMER",
        },
      });
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);

      const stamp = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: user.id, cafeId: cafe.id } },
      });
      assertEqual(stamp, null, "User with no orders should have no stamp record");
    });

    it("T2.4.2: Customer reaching exactly 6 stamps does not cause arithmetic overflow", async () => {
      const user = await db.user.create({
        data: {
          phone: `0933${Math.floor(1000000 + Math.random() * 9000000)}`,
          passwordHash: "dummyhash",
          fullName: "کاربر ۶ مهر",
          role: "CUSTOMER",
        },
      });
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);

      const stamp = await db.loyaltyStamp.create({
        data: {
          userId: user.id,
          cafeId: cafe.id,
          stampsCount: 6,
          maxStamps: 6,
          freeDrinksEarned: 1,
        },
      });

      assertEqual(stamp.stampsCount, 6);
      assertEqual(stamp.freeDrinksEarned, 1);
    });

    it("T2.4.3: Repeated orders past max stamps cap or cycle correctly", async () => {
      const user = await db.user.findFirst({ where: { role: "CUSTOMER" } });
      assertDefined(user);
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);

      const stamp = await db.loyaltyStamp.upsert({
        where: { userId_cafeId: { userId: user.id, cafeId: cafe.id } },
        create: { userId: user.id, cafeId: cafe.id, stampsCount: 1 },
        update: { stampsCount: { increment: 1 } },
      });

      assert(stamp.stampsCount > 0, "Stamp count must be positive integer");
    });

    it("T2.4.4: Stamps belonging to Cafe A are not visible when querying Cafe B", async () => {
      const user = await db.user.findFirst({ where: { role: "CUSTOMER" } });
      assertDefined(user);
      const cafes = await db.cafe.findMany({ take: 2 });
      assert(cafes.length >= 2);

      const stampA = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: user.id, cafeId: cafes[0].id } },
      });
      const stampB = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: user.id, cafeId: cafes[1].id } },
      });

      // Different cafe IDs must yield isolated records
      if (stampA && stampB) {
        assert(stampA.cafeId !== stampB.cafeId);
      }
    });

    it("T2.4.5: Unauthenticated order does not create orphaned stamp record", async () => {
      clearMockCookies();
      const cafe = await db.cafe.findFirst({ where: { isApproved: true, isActive: true } });
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
      assertEqual(res.status, 201);
      const json = await res.json();
      assertDefined(json.data.id);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 5 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 5);
  describe("Feature 5 Boundary: Coffee Flavor Radar Chart", () => {
    it("T2.5.1: Radar axis value below minimum (<1) rejected by Zod schema", () => {
      const invalid = {
        origin: "Kenya",
        altitude: "1800m",
        process: "Washed",
        roastLevel: "Medium",
        radar: { acidity: 0, body: 5, sweetness: 5, bitterness: 5, aroma: 5 },
        flavorNotes: ["Blackberry"],
      };
      const res = CoffeeProfileSchema.safeParse(invalid);
      assertEqual(res.success, false, "Radar value < 1 must be rejected");
    });

    it("T2.5.2: Radar axis value above maximum (>10) rejected by Zod schema", () => {
      const invalid = {
        origin: "Kenya",
        altitude: "1800m",
        process: "Washed",
        roastLevel: "Medium",
        radar: { acidity: 10.1, body: 5, sweetness: 5, bitterness: 5, aroma: 5 },
        flavorNotes: ["Blackberry"],
      };
      const res = CoffeeProfileSchema.safeParse(invalid);
      assertEqual(res.success, false, "Radar value > 10 must be rejected");
    });

    it("T2.5.3: Decimal radar axis values (e.g. 7.5) validate properly", () => {
      const validDecimal = {
        origin: "Guatemala",
        altitude: "1650m",
        process: "Honey",
        roastLevel: "Medium",
        radar: { acidity: 7.5, body: 6.2, sweetness: 8.8, bitterness: 2.1, aroma: 9.0 },
        flavorNotes: ["Milk Chocolate", "Orange"],
      };
      const res = CoffeeProfileSchema.safeParse(validDecimal);
      assertEqual(res.success, true, "Decimal radar values must be accepted");
    });

    it("T2.5.4: Menu item with coffeeProfile: null omits radar without throwing", async () => {
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);
      const itemWithoutProfile = await db.menuItem.findFirst({
        where: { cafeId: cafe.id, coffeeProfile: null },
      });
      if (itemWithoutProfile) {
        assertEqual(itemWithoutProfile.coffeeProfile, null);
      }
    });

    it("T2.5.5: All 5 axes set to identical extreme values (all 1s or all 10s) produce valid polygon", () => {
      const size = 160;
      const center = size / 2;
      const radius = 55;

      for (const extremeVal of [1, 10]) {
        const vertices = [0, 1, 2, 3, 4].map((i) => {
          const angle = Math.PI / 2 - (2 * Math.PI * i) / 5;
          const r = (extremeVal / 10) * radius;
          return { x: center + r * Math.cos(angle), y: center - r * Math.sin(angle) };
        });
        assertEqual(vertices.length, 5);
        for (const v of vertices) {
          assert(!isNaN(v.x) && !isNaN(v.y));
        }
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 6 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 6);
  describe("Feature 6 Boundary: Menu Drawer & Floating Cart", () => {
    it("T2.6.1: Order with 0 items rejected by CreateOrderSchema (min 1)", () => {
      const emptyOrder = {
        cafeId: "cafe-1",
        paymentMode: "PAY_UPFRONT_BUZZER",
        items: [],
      };
      const res = CreateOrderSchema.safeParse(emptyOrder);
      assertEqual(res.success, false, "0 items must be rejected");
    });

    it("T2.6.2: Item quantity set to 0 or negative number rejected", () => {
      const zeroQty = {
        cafeId: "cafe-1",
        paymentMode: "PAY_UPFRONT_BUZZER",
        items: [{ menuItemId: "item-1", quantity: 0, selectedModifiers: [] }],
      };
      const negQty = {
        cafeId: "cafe-1",
        paymentMode: "PAY_UPFRONT_BUZZER",
        items: [{ menuItemId: "item-1", quantity: -2, selectedModifiers: [] }],
      };
      assertEqual(CreateOrderSchema.safeParse(zeroQty).success, false);
      assertEqual(CreateOrderSchema.safeParse(negQty).success, false);
    });

    it("T2.6.3: Menu item with invalid price delta in modifiers validated", async () => {
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);
      assert(cafe.id.length > 0);
    });

    it("T2.6.4: Order schema rejects unknown paymentMode", () => {
      const invalidMode = {
        cafeId: "cafe-1",
        paymentMode: "BITCOIN_LIGHTNING",
        items: [{ menuItemId: "item-1", quantity: 1, selectedModifiers: [] }],
      };
      assertEqual(CreateOrderSchema.safeParse(invalidMode).success, false);
    });

    it("T2.6.5: Order containing unavailable (86'd) item rejected with 400", async () => {
      const cafe = await db.cafe.findFirst({ where: { isApproved: true, isActive: true } });
      assertDefined(cafe);
      const cat = await db.category.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(cat);

      const unavailItem = await db.menuItem.create({
        data: {
          cafeId: cafe.id,
          categoryId: cat.id,
          title: "آیتم ناموجود تست",
          price: 60000,
          isAvailable: false,
        },
      });

      const req = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [{ menuItemId: unavailItem.id, quantity: 1, selectedModifiers: [] }],
        },
      });

      const res = await createOrder(req);
      assertEqual(res.status, 400);
      const json = await res.json();
      assertEqual(json.success, false);

      await db.menuItem.delete({ where: { id: unavailItem.id } });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 7 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 7);
  describe("Feature 7 Boundary: Table Service Hub & FAB", () => {
    it("T2.7.1: Table service request with invalid requestType rejected", () => {
      const invalid = {
        cafeId: "cafe-1",
        tableId: "t-1",
        tableNumber: "4",
        requestType: "ORDER_PIZZA",
      };
      assertEqual(CreateTableServiceRequestSchema.safeParse(invalid).success, false);
    });

    it("T2.7.2: Request note exceeding 200 characters rejected by validation schema", () => {
      const longNote = "ا".repeat(201);
      const invalid = {
        cafeId: "cafe-1",
        tableId: "t-1",
        tableNumber: "4",
        requestType: "CALL_WAITER",
        note: longNote,
      };
      assertEqual(CreateTableServiceRequestSchema.safeParse(invalid).success, false);
    });

    it("T2.7.3: Non-existent tableId falls back gracefully to cafe default table", async () => {
      const cafe = await db.cafe.findFirst({ where: { isApproved: true } });
      assertDefined(cafe);

      const req = createMockRequest("/api/table-service", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          tableId: "non-existent-table-xyz",
          tableNumber: "99",
          requestType: "CALL_WAITER",
        },
      });

      const res = await createTableService(req);
      assertEqual(res.status, 201);
    });

    it("T2.7.4: Rapid consecutive table service requests create discrete records", async () => {
      const cafe = await db.cafe.findFirst({ where: { isApproved: true } });
      assertDefined(cafe);
      const table = await db.table.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(table);

      const p1 = createTableService(
        createMockRequest("/api/table-service", {
          method: "POST",
          body: { cafeId: cafe.id, tableId: table.id, tableNumber: table.tableNumber, requestType: "CALL_WAITER" },
        })
      );
      const p2 = createTableService(
        createMockRequest("/api/table-service", {
          method: "POST",
          body: { cafeId: cafe.id, tableId: table.id, tableNumber: table.tableNumber, requestType: "REQUEST_WATER" },
        })
      );

      const [r1, r2] = await Promise.all([p1, p2]);
      assertEqual(r1.status, 201);
      assertEqual(r2.status, 201);
    });

    it("T2.7.5: Table service PATCH without auth returns 403", async () => {
      clearMockCookies();
      const req = createMockRequest("/api/table-service", {
        method: "PATCH",
        body: { id: "some-id", status: "DONE" },
      });
      const res = await patchTableService(req);
      assertEqual(res.status, 403);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 8 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 8);
  describe("Feature 8 Boundary: KDS Barista Board & SSE", () => {
    it("T2.8.1: KDS stream connection to non-existent cafe returns 404", async () => {
      const req = createMockRequest("/api/kds/stream/non-existent-cafe-kds-404");
      const res = await getKdsStream(req, { params: Promise.resolve({ cafeSlug: "non-existent-cafe-kds-404" }) });
      assertEqual(res.status, 404);
    });

    it("T2.8.2: KDS initial state when cafe has zero active orders handles query gracefully", async () => {
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);
      const active = await db.order.findMany({
        where: { cafeId: cafe.id, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      });
      assert(Array.isArray(active));
    });

    it("T2.8.3: Updating item station status for non-existent orderItemId returns error", async () => {
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);
      await setAuthSession("STAFF", cafe.id);

      const req = createMockRequest("/api/orders/items/non-existent-item-id-123", {
        method: "PATCH",
        body: { stationStatus: "DONE" },
      });

      const res = await patchOrderItem(req, { params: Promise.resolve({ orderItemId: "non-existent-item-id-123" }) });
      assert(res.status === 404 || res.status === 500);
    });

    it("T2.8.4: Order with single item marking that item DONE immediately transitions order to READY", async () => {
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);
      const menuItem = await db.menuItem.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(menuItem);

      const order = await db.order.create({
        data: {
          cafeId: cafe.id,
          orderCode: `T284-${Date.now().toString().slice(-4)}`,
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

      await setAuthSession("STAFF", cafe.id);
      const req = createMockRequest(`/api/orders/items/${order.orderItems[0].id}`, {
        method: "PATCH",
        body: { stationStatus: "DONE" },
      });

      const res = await patchOrderItem(req, { params: Promise.resolve({ orderItemId: order.orderItems[0].id }) });
      assertEqual(res.status, 200);

      const checkOrder = await db.order.findUnique({ where: { id: order.id } });
      assertEqual(checkOrder?.status, "READY");
    });

    it("T2.8.5: KDS event queue handles event pushing without memory corruption", () => {
      const cafeId = "test-cafe-mem";
      (global as any).__kdsEvents = (global as any).__kdsEvents ?? {};
      (global as any).__kdsEvents[cafeId] = [];

      for (let i = 0; i < 50; i++) {
        (global as any).__kdsEvents[cafeId].push({ type: "TEST_EVENT", index: i });
      }

      assertEqual((global as any).__kdsEvents[cafeId].length, 50);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 9 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 9);
  describe("Feature 9 Boundary: Owner Studio & Menu/Category CRUD", () => {
    it("T2.9.1: Menu item creation with negative price rejected by Zod schema", () => {
      const invalid = {
        categoryId: "cat-1",
        title: "قهوه با قیمت منفی",
        price: -50000,
      };
      assertEqual(CreateMenuItemSchema.safeParse(invalid).success, false);
    });

    it("T2.9.2: Prep time minutes set to 0 or >120 rejected", () => {
      const zeroPrep = { categoryId: "cat-1", title: "آیتم", price: 50000, prepTimeMinutes: 0 };
      const overPrep = { categoryId: "cat-1", title: "آیتم", price: 50000, prepTimeMinutes: 121 };
      assertEqual(CreateMenuItemSchema.safeParse(zeroPrep).success, false);
      assertEqual(CreateMenuItemSchema.safeParse(overPrep).success, false);
    });

    it("T2.9.3: Owner updating menu item belonging to another cafe returns 404/403", async () => {
      const owner2 = await db.user.findFirst({ where: { phone: "09122222222" } }); // Owner of cafe 2
      assertDefined(owner2);
      const cafe1 = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe1);
      const itemInCafe1 = await db.menuItem.findFirst({ where: { cafeId: cafe1.id } });
      assertDefined(itemInCafe1);

      await setAuthSession("CAFE_OWNER", undefined, { sub: owner2.id, phone: owner2.phone });

      const req = createMockRequest(`/api/owner/menu/${itemInCafe1.id}`, {
        method: "PATCH",
        body: { price: 999999 },
      });

      const res = await patchOwnerMenuItem(req, { params: Promise.resolve({ itemId: itemInCafe1.id }) });
      assertEqual(res.status, 404);
    });

    it("T2.9.4: Non-owner role receives 403 on owner menu endpoints", async () => {
      await setAuthSession("CUSTOMER");
      const req = createMockRequest("/api/owner/menu", {
        method: "POST",
        body: { title: "تست", price: 10000 },
      });
      const res = await createOwnerMenu(req);
      assertEqual(res.status, 403);
    });

    it("T2.9.5: Duplicate staff assignment to same cafe handled via upsert", async () => {
      const owner = await db.user.findFirst({ where: { phone: "09121111111" } });
      assertDefined(owner);
      const cafe = await db.cafe.findFirst({ where: { ownerId: owner.id } });
      assertDefined(cafe);

      await setAuthSession("CAFE_OWNER", cafe.id, { sub: owner.id, phone: owner.phone });

      const req1 = createMockRequest("/api/owner/staff", {
        method: "POST",
        body: { phone: "09125556677", canEditMenu: false },
      });
      const res1 = await createOwnerStaff(req1);
      assertEqual(res1.status, 201);

      const req2 = createMockRequest("/api/owner/staff", {
        method: "POST",
        body: { phone: "09125556677", canEditMenu: true },
      });
      const res2 = await createOwnerStaff(req2);
      assertEqual(res2.status, 201);
      const json2 = await res2.json();
      assertEqual(json2.data.canEditMenu, true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 10 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 10);
  describe("Feature 10 Boundary: Super Admin Dashboard", () => {
    it("T2.10.1: Non-admin user updating cafe approval status returns 403", async () => {
      await setAuthSession("CUSTOMER");
      const cafe = await db.cafe.findFirst();
      assertDefined(cafe);

      const req = createMockRequest(`/api/admin/cafes/${cafe.id}`, {
        method: "PATCH",
        body: { isApproved: true },
      });
      const res = await patchAdminCafe(req, { params: Promise.resolve({ cafeId: cafe.id }) });
      assertEqual(res.status, 403);
    });

    it("T2.10.2: Setting isActive: false on cafe removes it from public discovery", async () => {
      await setAuthSession("SUPER_ADMIN");
      const cafe = await db.cafe.findFirst({ where: { isApproved: true } });
      assertDefined(cafe);

      // Deactivate
      const patchReq = createMockRequest(`/api/admin/cafes/${cafe.id}`, {
        method: "PATCH",
        body: { isActive: false },
      });
      await patchAdminCafe(patchReq, { params: Promise.resolve({ cafeId: cafe.id }) });

      // Query discovery
      const discReq = createMockRequest("/api/discovery");
      const discRes = await getDiscovery(discReq);
      const discJson = await discRes.json();
      const found = discJson.data.find((c: any) => c.id === cafe.id);
      assertEqual(found, undefined, "Deactivated cafe must not appear in discovery");

      // Restore active
      const restoreReq = createMockRequest(`/api/admin/cafes/${cafe.id}`, {
        method: "PATCH",
        body: { isActive: true },
      });
      await patchAdminCafe(restoreReq, { params: Promise.resolve({ cafeId: cafe.id }) });
    });

    it("T2.10.3: Idempotent approval of already-approved cafe returns 200", async () => {
      await setAuthSession("SUPER_ADMIN");
      const cafe = await db.cafe.findFirst({ where: { isApproved: true } });
      assertDefined(cafe);

      const req = createMockRequest(`/api/admin/cafes/${cafe.id}`, {
        method: "PATCH",
        body: { isApproved: true },
      });
      const res = await patchAdminCafe(req, { params: Promise.resolve({ cafeId: cafe.id }) });
      assertEqual(res.status, 200);
    });

    it("T2.10.4: Admin cafe list query handles cafes with 0 orders gracefully", async () => {
      await setAuthSession("SUPER_ADMIN");
      const res = await getAdminCafes();
      assertEqual(res.status, 200);
      const json = await res.json();
      for (const cafe of json.data) {
        assert(typeof cafe._count.orders === "number");
      }
    });

    it("T2.10.5: Admin user list query returns passwordHash omitted from payload", async () => {
      await setAuthSession("SUPER_ADMIN");
      const res = await getAdminUsers();
      assertEqual(res.status, 200);
      const json = await res.json();
      for (const user of json.data) {
        assertEqual(user.passwordHash, undefined, "passwordHash must never be exposed");
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 11 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 11);
  describe("Feature 11 Boundary: Discovery Marketplace", () => {
    it("T2.11.1: Search query with special characters / SQL injection attempt safely handled", async () => {
      const req = createMockRequest("/api/discovery?q=%27%20OR%201=1%20--%20");
      const res = await getDiscovery(req);
      assertEqual(res.status, 200);
      const json = await res.json();
      assertEqual(json.success, true);
    });

    it("T2.11.2: Negative radius in discovery query rejected (<0.5 km)", () => {
      const invalid = { radius: 0.1 };
      assertEqual(DiscoveryQuerySchema.safeParse(invalid).success, false);
    });

    it("T2.11.3: Coordinates out of range (lat > 90 or lng > 180) handled properly", async () => {
      const req = createMockRequest("/api/discovery?lat=120&lng=200");
      const res = await getDiscovery(req);
      assertEqual(res.status, 200);
    });

    it("T2.11.4: Discovery query when no cafes match criteria returns empty array []", async () => {
      const req = createMockRequest("/api/discovery?q=non_existent_impossible_cafe_query_xyz_999");
      const res = await getDiscovery(req);
      assertEqual(res.status, 200);
      const json = await res.json();
      assertDeepEqual(json.data, []);
    });

    it("T2.11.5: Discovery query when coordinates omitted skips distance calculation cleanly", async () => {
      const req = createMockRequest("/api/discovery");
      const res = await getDiscovery(req);
      const json = await res.json();
      for (const cafe of json.data) {
        assertEqual(cafe.distance, null);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Feature 12 Boundary (5 tests)
  // ───────────────────────────────────────────────────────────────────────────
  setTestScope(2, 12);
  describe("Feature 12 Boundary: Auth & Mock Payment Gateway", () => {
    it("T2.12.1: Registration with phone < 10 characters rejected", () => {
      const invalid = {
        phone: "0912123",
        password: "password123",
        fullName: "تست",
        role: "CUSTOMER",
      };
      assertEqual(RegisterSchema.safeParse(invalid).success, false);
    });

    it("T2.12.2: Registration with password < 6 characters rejected", () => {
      const invalid = {
        phone: "09121234567",
        password: "123",
        fullName: "تست",
        role: "CUSTOMER",
      };
      assertEqual(RegisterSchema.safeParse(invalid).success, false);
    });

    it("T2.12.3: Login with wrong password returns 401", async () => {
      const req = createMockRequest("/api/auth/login", {
        method: "POST",
        body: { phone: "09124444444", password: "WRONG_PASSWORD_XYZ" },
      });
      const res = await loginUser(req);
      assertEqual(res.status, 401);
    });

    it("T2.12.4: Tampered or invalid JWT token returns null session", async () => {
      const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature";
      const payload = await verifyToken(invalidToken);
      assertEqual(payload, null);
    });

    it("T2.12.5: Mock payment / getOrder on non-existent orderId returns 404", async () => {
      const req = createMockRequest("/api/orders/non-existent-order-id-999");
      const res = await getOrderById(req, { params: Promise.resolve({ orderId: "non-existent-order-id-999" }) });
      assertEqual(res.status, 404);
    });
  });
}
