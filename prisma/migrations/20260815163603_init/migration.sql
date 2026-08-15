-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "cafes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "address" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "businessType" TEXT NOT NULL DEFAULT 'CAFE',
    "workflowMode" TEXT NOT NULL DEFAULT 'PAY_UPFRONT_BUZZER',
    "themeId" TEXT NOT NULL DEFAULT 'NORDIC_MINIMAL',
    "amenities" TEXT NOT NULL DEFAULT '{"wifi":true,"smoking":false,"outdoor":false,"board_games":false,"work_friendly":true,"pet_friendly":false}',
    "openingHours" TEXT NOT NULL DEFAULT '{"mon":{"open":"08:00","close":"22:00"},"tue":{"open":"08:00","close":"22:00"},"wed":{"open":"08:00","close":"22:00"},"thu":{"open":"08:00","close":"22:00"},"fri":{"open":"09:00","close":"23:00"},"sat":{"open":"09:00","close":"23:00"},"sun":{"open":"10:00","close":"21:00"}}',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rushHourBufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cafes_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kds_stations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cafeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stationType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "kds_stations_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "staff_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "stationId" TEXT,
    "canEditMenu" BOOLEAN NOT NULL DEFAULT false,
    "canToggleStock" BOOLEAN NOT NULL DEFAULT true,
    "canEditPrices" BOOLEAN NOT NULL DEFAULT false,
    "canManageOrders" BOOLEAN NOT NULL DEFAULT true,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "staff_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "staff_permissions_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "staff_permissions_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "kds_stations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cafeId" TEXT NOT NULL,
    "stationId" TEXT,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "categories_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "categories_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "kds_stations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cafeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "discountPrice" INTEGER,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "dailyStockRemaining" INTEGER,
    "prepTimeMinutes" INTEGER NOT NULL DEFAULT 5,
    "calories" INTEGER,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "coffeeProfile" TEXT,
    "allergens" TEXT NOT NULL DEFAULT '[]',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "reorderCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "menu_items_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_modifier_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "minSelection" INTEGER NOT NULL DEFAULT 0,
    "maxSelection" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "item_modifier_groups_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "menu_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_modifier_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceDelta" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "item_modifier_options_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "item_modifier_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cafeId" TEXT NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "currentOrderId" TEXT,
    CONSTRAINT "tables_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cafeId" TEXT NOT NULL,
    "tableId" TEXT,
    "customerId" TEXT,
    "orderCode" TEXT NOT NULL,
    "buzzerNumber" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentMode" TEXT NOT NULL DEFAULT 'PAY_UPFRONT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "subtotalAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "tipAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "customerNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "stationId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "selectedModifiers" TEXT NOT NULL DEFAULT '[]',
    "stationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "itemNotes" TEXT,
    CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "menu_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_items_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "kds_stations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "split_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "payerName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidItemIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "split_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "table_service_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cafeId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "table_service_requests_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "table_service_requests_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "loyalty_stamps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "stampsCount" INTEGER NOT NULL DEFAULT 0,
    "maxStamps" INTEGER NOT NULL DEFAULT 6,
    "freeDrinksEarned" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "loyalty_stamps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "loyalty_stamps_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "cafes_slug_key" ON "cafes"("slug");

-- CreateIndex
CREATE INDEX "cafes_slug_idx" ON "cafes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "staff_permissions_userId_cafeId_key" ON "staff_permissions"("userId", "cafeId");

-- CreateIndex
CREATE UNIQUE INDEX "tables_qrToken_key" ON "tables"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderCode_key" ON "orders"("orderCode");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_stamps_userId_cafeId_key" ON "loyalty_stamps"("userId", "cafeId");
