// ─────────────────────────────────────────────────────────────────────────────
// CafeChi (کافه‌چی) — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

// ─── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole = "SUPER_ADMIN" | "CAFE_OWNER" | "STAFF" | "CUSTOMER";

export interface JWTPayload {
  sub: string; // user id
  phone: string;
  role: UserRole;
  fullName: string;
  cafeId?: string; // for CAFE_OWNER scope
  stationId?: string; // for STAFF scope
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  phone: string;
  role: UserRole;
  fullName: string;
  cafeId?: string;
  stationId?: string;
}

// ─── Cafe ─────────────────────────────────────────────────────────────────────

export type WorkflowMode =
  | "PAY_UPFRONT_BUZZER"
  | "PAY_AT_COUNTER"
  | "TABLE_TAB_SPLIT"
  | "VIEW_ONLY";

export type ThemeId =
  | "NORDIC_MINIMAL"
  | "OLED_CARBON"
  | "ARTISAN_SEPIA"
  | "NEO_EDITORIAL"
  | "WARM_TERRACOTTA";

export type BusinessType =
  | "CAFE"
  | "SPECIALTY_CAFE"
  | "CAFE_BAR"
  | "BAKERY"
  | "RESTAURANT"
  | "BRUNCH";

export interface CafeAmenities {
  wifi: boolean;
  smoking: boolean;
  outdoor: boolean;
  board_games: boolean;
  work_friendly: boolean;
  pet_friendly: boolean;
}

export interface DayHours {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export type OpeningHours = {
  mon: DayHours | null;
  tue: DayHours | null;
  wed: DayHours | null;
  thu: DayHours | null;
  fri: DayHours | null;
  sat: DayHours | null;
  sun: DayHours | null;
};

export interface CafePublic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  businessType: string;
  workflowMode: WorkflowMode;
  themeId: ThemeId;
  theme?: ThemeId; // alias
  amenities: CafeAmenities;
  openingHours: OpeningHours;
  isApproved: boolean;
  isActive: boolean;
  distance?: number; // km, computed by Haversine
  isOpenNow?: boolean;
  categories?: Category[]; // populated in menu response
  loyaltyProgram?: boolean;
  stampsCount?: number;
}

// ─── KDS Station ──────────────────────────────────────────────────────────────

export type StationType =
  | "HOT_BAR"
  | "COLD_BAR"
  | "KITCHEN"
  | "PASTRY"
  | "EXPEDITER";

export interface KdsStation {
  id: string;
  cafeId: string;
  name: string;
  stationType: StationType;
  isActive: boolean;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export interface CoffeeProfile {
  origin?: string;
  altitude?: string;
  process?: string;
  roastLevel?: string;
  acidity?: number;
  body?: number;
  sweetness?: number;
  bitterness?: number;
  aroma?: number;
  radar?: {
    acidity: number; // 1-10
    body: number;
    sweetness: number;
    bitterness: number;
    aroma: number;
  };
  flavorNotes?: string[];
}

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number;
  price?: number; // alias
  isDefault: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  required?: boolean; // alias
  minSelection: number;
  maxSelection: number;
  maxSelections?: number; // alias
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  cafeId: string;
  categoryId: string;
  title: string;
  name?: string; // alias for title
  description: string | null;
  price: number;
  discountPrice: number | null;
  discountedPrice?: number | null; // alias
  imageUrl: string | null;
  isAvailable: boolean;
  dailyStockRemaining: number | null;
  prepTimeMinutes: number;
  calories: number | null;
  tags: string[];
  coffeeProfile: CoffeeProfile | null;
  allergens: string[];
  displayOrder: number;
  reorderCount: number;
  modifierGroups: ModifierGroup[];
}

export interface Category {
  id: string;
  cafeId: string;
  stationId: string | null;
  name: string;
  displayOrder: number;
  isActive: boolean;
  menuItems: MenuItem[];
  items?: MenuItem[]; // alias
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "IN_PREPARATION"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "PARTIAL" | "REFUNDED";

export type StationStatus = "PENDING" | "IN_PROGRESS" | "DONE";

export interface SelectedModifier {
  id: string;
  name: string;
  priceDelta: number;
}

export interface OrderItemPublic {
  id: string;
  orderId: string;
  itemId: string;
  stationId: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedModifiers: SelectedModifier[];
  stationStatus: StationStatus;
  itemNotes: string | null;
  item: {
    title: string;
    imageUrl: string | null;
  };
}

export interface Order {
  id: string;
  cafeId: string;
  tableId: string | null;
  customerId: string | null;
  orderCode: string;
  code?: string; // alias for orderCode
  buzzerNumber: number | null;
  status: OrderStatus;
  paymentMode: WorkflowMode;
  paymentStatus: PaymentStatus;
  paid?: boolean; // convenient boolean flag
  subtotalAmount: number;
  discountAmount: number;
  tipAmount: number;
  totalAmount: number;
  paidAmount: number;
  customerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItemPublic[];
  items?: OrderItemPublic[]; // alias for orderItems
  tableNumber?: string; // alias for table?.tableNumber
  table?: {
    tableNumber: string;
  } | null;
}

// ─── Cart (Client-Side) ───────────────────────────────────────────────────────

export interface CartItem {
  id: string; // local cart item id (unique per cart entry)
  menuItemId: string;
  title: string;
  name?: string; // alias
  price: number; // effective price (with modifiers)
  quantity: number;
  selectedModifiers: SelectedModifier[];
  modifiers?: SelectedModifier[]; // alias
  itemNotes?: string;
  imageUrl?: string | null;
}

// ─── Table Service ────────────────────────────────────────────────────────────

export type TableServiceRequestType =
  | "CALL_WAITER"
  | "REQUEST_BILL"
  | "REQUEST_WATER"
  | "REQUEST_POS"
  | "GAME_REQUEST";

export interface TableServiceRequest {
  id: string;
  cafeId: string;
  tableId: string;
  tableNumber: string;
  requestType: TableServiceRequestType;
  type?: TableServiceRequestType; // alias
  note: string | null;
  status: "PENDING" | "ACKNOWLEDGED" | "DONE";
  createdAt: string;
}

// ─── KDS Real-Time Event ──────────────────────────────────────────────────────

export type KdsEventType =
  | "INITIAL_STATE"
  | "NEW_ORDER"
  | "ITEM_STATUS_UPDATE"
  | "TABLE_SERVICE"
  | "ITEM_86ED"
  | "ORDER_READY"
  | string;

export interface KdsEvent {
  type: KdsEventType;
  cafeId: string;
  payload: any;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  nameFa: string;
  description: string;
  preview: {
    bg: string;
    surface: string;
    text: string;
    accent: string;
    border: string;
  };
  cssVars: Record<string, string>;
}

// ─── Split Payment ────────────────────────────────────────────────────────────

export interface SplitPayment {
  id: string;
  orderId: string;
  payerName: string;
  amount: number;
  paidItemIds: string[];
  createdAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Loyalty ──────────────────────────────────────────────────────────────────

export interface LoyaltyStamp {
  id: string;
  userId: string;
  cafeId: string;
  stampsCount: number;
  maxStamps: number;
  freeDrinksEarned: number;
}
