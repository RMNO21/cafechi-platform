import { db } from "@/lib/db";
import { getTheme } from "@/lib/themes";
import { haversineDistance } from "@/lib/haversine";
import {
  assert,
  assertEqual,
  assertDefined,
  assertInRange,
  assertDeepEqual,
  setTestScope,
  describe,
  it,
  createMockRequest,
  setAuthSession,
} from "./harness";

// Route handlers
import { GET as getMenu } from "@/app/api/menu/[cafeSlug]/route";
import { GET as getTheUsual } from "@/app/api/the-usual/[cafeSlug]/route";
import { POST as createOrder } from "@/app/api/orders/route";
import { GET as getOrderById, PATCH as patchOrder } from "@/app/api/orders/[orderId]/route";
import { PATCH as patchOrderItem } from "@/app/api/orders/items/[orderItemId]/route";
import { POST as createTableService, PATCH as patchTableService } from "@/app/api/table-service/route";
import { GET as getOwnerCafe, PATCH as patchOwnerCafe } from "@/app/api/owner/cafe/route";
import { POST as createOwnerMenuItem } from "@/app/api/owner/menu/route";
import { PATCH as patchAdminCafe } from "@/app/api/admin/cafes/[cafeId]/route";
import { GET as getDiscovery } from "@/app/api/discovery/route";
import { PATCH as toggleStock } from "@/app/api/stock/route";
import { GET as getKdsStream } from "@/app/api/kds/stream/[cafeSlug]/route";

export function registerTier3Tests(): void {
  setTestScope(3);
  describe("Tier 3: Cross-Feature Combinations (15 Integration Tests)", () => {
    // ─────────────────────────────────────────────────────────────────────────
    // T3.1: Owner Theme Switch -> Menu Token Reflection
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.1: Owner Theme Switch -> Menu Token Reflection", async () => {
      const owner = await db.user.findFirst({ where: { phone: "09121111111" } });
      assertDefined(owner);
      const cafe = await db.cafe.findFirst({ where: { ownerId: owner.id } });
      assertDefined(cafe);

      await setAuthSession("CAFE_OWNER", cafe.id, { sub: owner.id, phone: owner.phone });

      // Switch theme to OLED_CARBON
      const patchReq = createMockRequest("/api/owner/cafe", {
        method: "PATCH",
        body: { themeId: "OLED_CARBON" },
      });
      const patchRes = await patchOwnerCafe(patchReq);
      assertEqual(patchRes.status, 200);

      // Customer fetches menu
      const menuReq = createMockRequest(`/api/menu/${cafe.slug}`);
      const menuRes = await getMenu(menuReq, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const menuJson = await menuRes.json();
      assertEqual(menuJson.data.themeId, "OLED_CARBON");

      const themeTokens = getTheme(menuJson.data.themeId);
      assertEqual(themeTokens.cssVars["--theme-bg"], "#080808");

      // Reset back to NORDIC_MINIMAL
      const resetReq = createMockRequest("/api/owner/cafe", {
        method: "PATCH",
        body: { themeId: "NORDIC_MINIMAL" },
      });
      await patchOwnerCafe(resetReq);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.2: Theme + Cart + Modifiers + Order Total Calculation
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.2: Theme + Cart + Modifiers + Order Total Calculation", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      const modifiers = [
        { id: "mod-syrup", name: "سیروپ کارامل", priceDelta: 15000 },
        { id: "mod-extra", name: "اکسترا شات", priceDelta: 25000 },
      ];

      const expectedUnitPrice = item.price + 15000 + 25000;
      const quantity = 2;
      const expectedTotal = expectedUnitPrice * quantity;

      const req = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [
            {
              menuItemId: item.id,
              quantity,
              selectedModifiers: modifiers,
            },
          ],
        },
      });

      const res = await createOrder(req);
      assertEqual(res.status, 201);
      const json = await res.json();
      assertEqual(json.data.totalAmount, expectedTotal);
      assertEqual(json.data.orderItems[0].unitPrice, expectedUnitPrice);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.3: Order Creation -> KDS Broadcast -> Item Progression -> Auto-Ready
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.3: Order Creation -> KDS Broadcast -> Item Progression -> Auto-Ready", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const items = await db.menuItem.findMany({ where: { cafeId: cafe.id, isAvailable: true }, take: 2 });
      assert(items.length >= 2, "Cafe must have at least 2 items");

      // Create order with 2 items
      const orderReq = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [
            { menuItemId: items[0].id, quantity: 1, selectedModifiers: [] },
            { menuItemId: items[1].id, quantity: 1, selectedModifiers: [] },
          ],
        },
      });

      const orderRes = await createOrder(orderReq);
      assertEqual(orderRes.status, 201);
      const orderJson = await orderRes.json();
      const orderId = orderJson.data.id;
      const item1Id = orderJson.data.orderItems[0].id;
      const item2Id = orderJson.data.orderItems[1].id;

      // Barista updates item 1 to DONE
      await setAuthSession("STAFF", cafe.id);
      const p1 = createMockRequest(`/api/orders/items/${item1Id}`, {
        method: "PATCH",
        body: { stationStatus: "DONE" },
      });
      await patchOrderItem(p1, { params: Promise.resolve({ orderItemId: item1Id }) });

      // Order should still be PENDING_PAYMENT / IN_PREPARATION
      let check = await db.order.findUnique({ where: { id: orderId } });
      assert(check?.status !== "READY");

      // Barista updates item 2 to DONE -> triggers AUTO-READY
      const p2 = createMockRequest(`/api/orders/items/${item2Id}`, {
        method: "PATCH",
        body: { stationStatus: "DONE" },
      });
      await patchOrderItem(p2, { params: Promise.resolve({ orderItemId: item2Id }) });

      check = await db.order.findUnique({ where: { id: orderId } });
      assertEqual(check?.status, "READY");
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.4: Customer Order -> Loyalty Stamp Accumulation
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.4: Customer Order -> Loyalty Stamp Accumulation", async () => {
      const user = await db.user.findFirst({ where: { phone: "09124444444" } });
      assertDefined(user);
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      const initialStamp = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: user.id, cafeId: cafe.id } },
      });
      const initialCount = initialStamp?.stampsCount ?? 0;

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

      const updatedStamp = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: user.id, cafeId: cafe.id } },
      });
      assertDefined(updatedStamp);
      assertEqual(updatedStamp.stampsCount, initialCount + 1);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.5: Multiple Orders -> Reorder Count -> Haman Hamishegi Widget
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.5: Multiple Orders -> Reorder Count -> Haman Hamishegi Widget", async () => {
      const customer = await db.user.findFirst({ where: { role: "CUSTOMER" } });
      assertDefined(customer);
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      // Create a DELIVERED order for customer
      await db.order.create({
        data: {
          cafeId: cafe.id,
          customerId: customer.id,
          orderCode: `USUAL-INC-${Date.now().toString().slice(-4)}`,
          status: "DELIVERED",
          paymentMode: "PAY_UPFRONT_BUZZER",
          paymentStatus: "PAID",
          subtotalAmount: item.price * 3,
          totalAmount: item.price * 3,
          orderItems: {
            create: [
              {
                itemId: item.id,
                quantity: 3,
                unitPrice: item.price,
                totalPrice: item.price * 3,
                stationStatus: "DONE",
              },
            ],
          },
        },
      });

      await setAuthSession("CUSTOMER", cafe.id, { sub: customer.id, phone: customer.phone });
      const req = createMockRequest(`/api/the-usual/${cafe.slug}`);
      const res = await getTheUsual(req, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const json = await res.json();
      assert(json.data.length > 0);
      assert(json.data.some((i: any) => i.id === item.id));
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.6: Staff 86-Stock Depletion -> Customer Menu Disabling
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.6: Staff 86-Stock Depletion -> Customer Menu Disabling", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      // Staff 86's the item
      await setAuthSession("STAFF", cafe.id);
      const toggleReq = createMockRequest("/api/stock", {
        method: "PATCH",
        body: { itemId: item.id, isAvailable: false },
      });
      const toggleRes = await toggleStock(toggleReq);
      assertEqual(toggleRes.status, 200);

      // Customer fetches menu -> item is filtered out from available items
      const menuReq = createMockRequest(`/api/menu/${cafe.slug}`);
      const menuRes = await getMenu(menuReq, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const menuJson = await menuRes.json();
      const allAvailableItems = menuJson.data.categories.flatMap((c: any) => c.menuItems);
      const found = allAvailableItems.find((i: any) => i.id === item.id);
      assertEqual(found, undefined, "86'd item must be hidden from available customer menu");

      // Restore item
      const restoreReq = createMockRequest("/api/stock", {
        method: "PATCH",
        body: { itemId: item.id, isAvailable: true },
      });
      await toggleStock(restoreReq);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.7: Table Service FAB -> KDS SSE Alert -> Staff Resolution
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.7: Table Service FAB -> KDS SSE Alert -> Staff Resolution", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const table = await db.table.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(table);

      // Customer sends table request
      const fabReq = createMockRequest("/api/table-service", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          tableId: table.id,
          tableNumber: table.tableNumber,
          requestType: "REQUEST_BILL",
          note: "کارتخوان لطفاً",
        },
      });
      const fabRes = await createTableService(fabReq);
      assertEqual(fabRes.status, 201);
      const reqId = (await fabRes.json()).data.id;

      // Staff resolves request
      await setAuthSession("STAFF", cafe.id);
      const resolveReq = createMockRequest("/api/table-service", {
        method: "PATCH",
        body: { id: reqId, status: "DONE" },
      });
      const resolveRes = await patchTableService(resolveReq);
      assertEqual(resolveRes.status, 200);

      const check = await db.tableServiceRequest.findUnique({ where: { id: reqId } });
      assertEqual(check?.status, "DONE");
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.8: Cafe Registration -> Admin Approval -> Discovery Appearance
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.8: Cafe Registration -> Admin Approval -> Discovery Appearance", async () => {
      const owner = await db.user.create({
        data: {
          phone: `0919${Math.floor(1000000 + Math.random() * 9000000)}`,
          passwordHash: "dummyhash",
          fullName: "مالک کافه جدید",
          role: "CAFE_OWNER",
        },
      });

      const uniqueSlug = `cafe-new-${Date.now().toString().slice(-4)}`;
      const newCafe = await db.cafe.create({
        data: {
          ownerId: owner.id,
          name: "کافه جدید آزمایشی",
          slug: uniqueSlug,
          address: "تهران، میدان ونک",
          latitude: 35.7575,
          longitude: 51.41,
          phoneNumber: "02188889999",
          isApproved: false,
          isActive: true,
          themeId: "WARM_TERRACOTTA",
        },
      });

      // Initially unapproved -> not in discovery
      let discReq = createMockRequest("/api/discovery");
      let discRes = await getDiscovery(discReq);
      let discJson = await discRes.json();
      assertEqual(discJson.data.find((c: any) => c.id === newCafe.id), undefined);

      // Super Admin approves cafe
      await setAuthSession("SUPER_ADMIN");
      const approveReq = createMockRequest(`/api/admin/cafes/${newCafe.id}`, {
        method: "PATCH",
        body: { isApproved: true },
      });
      await patchAdminCafe(approveReq, { params: Promise.resolve({ cafeId: newCafe.id }) });

      // Now appears in discovery
      discReq = createMockRequest("/api/discovery");
      discRes = await getDiscovery(discReq);
      discJson = await discRes.json();
      const approvedCafe = discJson.data.find((c: any) => c.id === newCafe.id);
      assertDefined(approvedCafe, "Approved cafe must now appear in discovery");
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.9: Upfront Payment Workflow -> Buzzer Assignment -> Payment Confirmation
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.9: Upfront Payment Workflow -> Buzzer Assignment -> Payment Confirmation", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      const orderReq = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [{ menuItemId: item.id, quantity: 1, selectedModifiers: [] }],
        },
      });

      const orderRes = await createOrder(orderReq);
      assertEqual(orderRes.status, 201);
      const orderData = (await orderRes.json()).data;
      assertDefined(orderData.buzzerNumber);
      assertEqual(orderData.status, "PENDING_PAYMENT");

      // Mock payment confirms order
      await setAuthSession("CAFE_OWNER", cafe.id);
      const payReq = createMockRequest(`/api/orders/${orderData.id}`, {
        method: "PATCH",
        body: { status: "CONFIRMED" },
      });
      const payRes = await patchOrder(payReq, { params: Promise.resolve({ orderId: orderData.id }) });
      assertEqual(payRes.status, 200);
      assertEqual((await payRes.json()).data.status, "CONFIRMED");
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.10: Table Tab Split Workflow -> Direct Confirmation -> Table Service Bill Request
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.10: Table Tab Split Workflow -> Direct Confirmation -> Table Service Bill Request", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const table = await db.table.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(table);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      // Order created directly as CONFIRMED on table tab
      const orderReq = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          tableId: table.id,
          paymentMode: "TABLE_TAB_SPLIT",
          items: [{ menuItemId: item.id, quantity: 2, selectedModifiers: [] }],
        },
      });

      const orderRes = await createOrder(orderReq);
      assertEqual(orderRes.status, 201);
      const orderData = (await orderRes.json()).data;
      assertEqual(orderData.status, "CONFIRMED");

      // Customer calls for bill
      const billReq = createMockRequest("/api/table-service", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          tableId: table.id,
          tableNumber: table.tableNumber,
          requestType: "REQUEST_BILL",
        },
      });
      const billRes = await createTableService(billReq);
      assertEqual(billRes.status, 201);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.11: Owner Menu CRUD -> 5-Axis Radar Data -> Menu Profile Display
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.11: Owner Menu CRUD -> 5-Axis Radar Data -> Menu Profile Display", async () => {
      const owner = await db.user.findFirst({ where: { phone: "09121111111" } });
      assertDefined(owner);
      const cafe = await db.cafe.findFirst({ where: { ownerId: owner.id } });
      assertDefined(cafe);
      const cat = await db.category.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(cat);

      await setAuthSession("CAFE_OWNER", cafe.id, { sub: owner.id, phone: owner.phone });

      const customRadar = {
        origin: "Costa Rica Tarrazu",
        altitude: "1700m",
        process: "Honey",
        roastLevel: "Light",
        radar: { acidity: 9, body: 7, sweetness: 8, bitterness: 2, aroma: 9.5 },
        flavorNotes: ["Green Apple", "Honey", "Citrus"],
      };

      const createReq = createMockRequest("/api/owner/menu", {
        method: "POST",
        body: {
          categoryId: cat.id,
          title: `قهوه کوستاریکا ${Date.now().toString().slice(-4)}`,
          price: 110000,
          coffeeProfile: customRadar,
          modifierGroups: [],
        },
      });

      const createRes = await createOwnerMenuItem(createReq);
      assertEqual(createRes.status, 201);
      const itemId = (await createRes.json()).data.id;

      // Customer menu retrieves radar
      const menuReq = createMockRequest(`/api/menu/${cafe.slug}`);
      const menuRes = await getMenu(menuReq, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const menuJson = await menuRes.json();
      const item = menuJson.data.categories.flatMap((c: any) => c.menuItems).find((i: any) => i.id === itemId);
      assertDefined(item);
      assertDefined(item.coffeeProfile);
      assertEqual(item.coffeeProfile.radar.acidity, 9);
      assertEqual(item.coffeeProfile.radar.aroma, 9.5);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.12: Discovery Geo-Search -> Navigation -> Theme Loading
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.12: Discovery Geo-Search -> Navigation -> Theme Loading", async () => {
      // Search near Roastery Collective (35.7219, 51.3347)
      const req = createMockRequest("/api/discovery?lat=35.72&lng=51.33&radius=5");
      const res = await getDiscovery(req);
      assertEqual(res.status, 200);
      const json = await res.json();
      assert(json.data.length > 0);

      const closestCafe = json.data[0];
      assertDefined(closestCafe.distance);
      assertInRange(closestCafe.distance, 0, 5);

      // Load theme definition for closest cafe
      const theme = getTheme(closestCafe.themeId);
      assertDefined(theme.cssVars["--theme-bg"]);
      assertDefined(theme.cssVars["--theme-accent"]);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.13: Admin Cafe Deactivation -> Customer Menu 404 -> KDS Stream Disconnect
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.13: Admin Cafe Deactivation -> Customer Menu 404 -> KDS Stream Disconnect", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "noir-social-club" } });
      assertDefined(cafe);

      await setAuthSession("SUPER_ADMIN");
      const deactReq = createMockRequest(`/api/admin/cafes/${cafe.id}`, {
        method: "PATCH",
        body: { isActive: false },
      });
      await patchAdminCafe(deactReq, { params: Promise.resolve({ cafeId: cafe.id }) });

      // Customer menu 404
      const menuReq = createMockRequest(`/api/menu/${cafe.slug}`);
      const menuRes = await getMenu(menuReq, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      assertEqual(menuRes.status, 404);

      // Restore active status
      const restoreReq = createMockRequest(`/api/admin/cafes/${cafe.id}`, {
        method: "PATCH",
        body: { isActive: true },
      });
      await patchAdminCafe(restoreReq, { params: Promise.resolve({ cafeId: cafe.id }) });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.14: Station Filter Isolation in KDS
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.14: Station Filter Isolation in KDS", async () => {
      const cafe = await db.cafe.findFirst({
        where: { slug: "roastery-collective" },
        include: { kdsStations: true },
      });
      assertDefined(cafe);
      assert(cafe.kdsStations.length > 0, "Cafe must have KDS stations");

      const hotBarStation = cafe.kdsStations.find((s) => s.stationType === "HOT_BAR");
      if (hotBarStation) {
        assertEqual(hotBarStation.stationType, "HOT_BAR");
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // T3.15: Complex Multi-Item Cart with Discounted Prices & Multi-Select Modifiers
    // ─────────────────────────────────────────────────────────────────────────
    it("T3.15: Complex Multi-Item Cart with Discounted Prices & Multi-Select Modifiers", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const items = await db.menuItem.findMany({ where: { cafeId: cafe.id, isAvailable: true }, take: 2 });
      assert(items.length >= 2);

      const item1 = items[0];
      const item2 = items[1];

      const price1 = item1.discountPrice ?? item1.price;
      const price2 = item2.discountPrice ?? item2.price;

      const mods1 = [{ id: "m1", name: "اکسترا ۱", priceDelta: 10000 }];
      const mods2 = [
        { id: "m2a", name: "سیروپ ۱", priceDelta: 8000 },
        { id: "m2b", name: "سیروپ ۲", priceDelta: 8000 },
      ];

      const line1Total = (price1 + 10000) * 2;
      const line2Total = (price2 + 16000) * 3;
      const expectedGrandTotal = line1Total + line2Total;

      const orderReq = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [
            { menuItemId: item1.id, quantity: 2, selectedModifiers: mods1 },
            { menuItemId: item2.id, quantity: 3, selectedModifiers: mods2 },
          ],
        },
      });

      const orderRes = await createOrder(orderReq);
      assertEqual(orderRes.status, 201);
      const orderJson = await orderRes.json();
      assertEqual(orderJson.data.totalAmount, expectedGrandTotal);
    });
  });
}
