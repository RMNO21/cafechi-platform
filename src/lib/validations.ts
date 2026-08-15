import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
});

export const RegisterSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
  fullName: z.string().min(2).max(100),
  role: z.enum(["CUSTOMER", "CAFE_OWNER"]).default("CUSTOMER"),
});

// ─── Cafe ─────────────────────────────────────────────────────────────────────

export const UpdateCafeSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().min(5).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phoneNumber: z.string().min(8).max(20).optional(),
  businessType: z.string().optional(),
  workflowMode: z
    .enum(["PAY_UPFRONT_BUZZER", "PAY_AT_COUNTER", "TABLE_TAB_SPLIT", "VIEW_ONLY"])
    .optional(),
  themeId: z
    .enum([
      "NORDIC_MINIMAL",
      "OLED_CARBON",
      "ARTISAN_SEPIA",
      "NEO_EDITORIAL",
      "WARM_TERRACOTTA",
    ])
    .optional(),
  amenities: z
    .object({
      wifi: z.boolean(),
      smoking: z.boolean(),
      outdoor: z.boolean(),
      board_games: z.boolean(),
      work_friendly: z.boolean(),
      pet_friendly: z.boolean(),
    })
    .optional(),
  openingHours: z.record(z.string(), z.object({ open: z.string(), close: z.string() }).nullable()).optional(),
  rushHourBufferMinutes: z.number().int().min(0).max(60).optional(),
});

// ─── Menu ─────────────────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  stationId: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const ModifierOptionSchema = z.object({
  name: z.string().min(1).max(100),
  priceDelta: z.number().int().default(0),
  isDefault: z.boolean().default(false),
});

export const ModifierGroupSchema = z.object({
  name: z.string().min(1).max(100),
  isRequired: z.boolean().default(false),
  minSelection: z.number().int().min(0).default(0),
  maxSelection: z.number().int().min(1).default(1),
  options: z.array(ModifierOptionSchema).min(1),
});

export const CoffeeProfileSchema = z.object({
  origin: z.string(),
  altitude: z.string(),
  process: z.string(),
  roastLevel: z.string(),
  radar: z.object({
    acidity: z.number().min(1).max(10),
    body: z.number().min(1).max(10),
    sweetness: z.number().min(1).max(10),
    bitterness: z.number().min(1).max(10),
    aroma: z.number().min(1).max(10),
  }),
  flavorNotes: z.array(z.string()),
});

export const CreateMenuItemSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  price: z.number().int().positive(),
  discountPrice: z.number().int().positive().optional(),
  isAvailable: z.boolean().default(true),
  dailyStockRemaining: z.number().int().positive().optional(),
  prepTimeMinutes: z.number().int().min(1).max(120).default(5),
  calories: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  coffeeProfile: CoffeeProfileSchema.optional(),
  allergens: z.array(z.string()).default([]),
  displayOrder: z.number().int().optional(),
  modifierGroups: z.array(ModifierGroupSchema).default([]),
});

export const UpdateMenuItemSchema = CreateMenuItemSchema.partial();

export const ToggleStockSchema = z.object({
  itemId: z.string(),
  isAvailable: z.boolean(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────

export const SelectedModifierSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceDelta: z.number(),
});

export const CartItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().min(1),
  selectedModifiers: z.array(SelectedModifierSchema).default([]),
  itemNotes: z.string().max(200).optional(),
});

export const CreateOrderSchema = z.object({
  cafeId: z.string(),
  tableId: z.string().optional(),
  qrToken: z.string().optional(),
  items: z.array(CartItemSchema).min(1),
  customerNotes: z.string().max(500).optional(),
  paymentMode: z.enum([
    "PAY_UPFRONT_BUZZER",
    "PAY_AT_COUNTER",
    "TABLE_TAB_SPLIT",
    "VIEW_ONLY",
  ]),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "CONFIRMED",
    "IN_PREPARATION",
    "READY",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export const UpdateItemStationStatusSchema = z.object({
  stationStatus: z.enum(["PENDING", "IN_PROGRESS", "DONE"]),
});

// ─── Table Service ────────────────────────────────────────────────────────────

export const CreateTableServiceRequestSchema = z.object({
  cafeId: z.string(),
  tableId: z.string(),
  tableNumber: z.string(),
  requestType: z.enum([
    "CALL_WAITER",
    "REQUEST_BILL",
    "REQUEST_WATER",
    "REQUEST_POS",
    "GAME_REQUEST",
  ]),
  note: z.string().max(200).optional(),
});

// ─── Staff ────────────────────────────────────────────────────────────────────

export const AddStaffSchema = z.object({
  phone: z.string().min(10).max(15),
  stationId: z.string().optional(),
  canEditMenu: z.boolean().default(false),
  canToggleStock: z.boolean().default(true),
  canEditPrices: z.boolean().default(false),
  canManageOrders: z.boolean().default(true),
  canViewAnalytics: z.boolean().default(false),
});

// ─── Discovery ────────────────────────────────────────────────────────────────

export const DiscoveryQuerySchema = z.object({
  q: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().min(0.5).max(20).default(5),
  wifi: z.coerce.boolean().optional(),
  smoking: z.coerce.boolean().optional(),
  outdoor: z.coerce.boolean().optional(),
  board_games: z.coerce.boolean().optional(),
  work_friendly: z.coerce.boolean().optional(),
  pet_friendly: z.coerce.boolean().optional(),
  openNow: z.coerce.boolean().optional(),
  businessType: z.string().optional(),
});

// ─── Split Payment ────────────────────────────────────────────────────────────

export const SplitPaymentSchema = z.object({
  payerName: z.string().min(1).max(100),
  paidItemIds: z.array(z.string()).optional(),
  equalSplit: z.boolean().optional(),
  splitCount: z.number().int().min(1).optional(),
});
