"use client";

import { useState, useEffect } from "react";
import {
  Settings, LayoutGrid, Users, QrCode, Palette,
  Coffee, Save, Plus, Trash2,
  ToggleLeft, ToggleRight, GripVertical, Edit, Eye,
  Wifi, Cigarette, TreePine, Gamepad2, Briefcase, Heart,
  Bell, LogOut
} from "lucide-react";
import { THEMES, THEME_LIST } from "@/lib/themes";
import type { ThemeId, WorkflowMode, KdsStation } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Tab = "profile" | "menu" | "theme" | "staff" | "tables";

interface CafeData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  businessType: string;
  workflowMode: WorkflowMode;
  themeId: ThemeId;
  amenities: Record<string, boolean>;
  openingHours: Record<string, { open: string; close: string } | null>;
  isApproved: boolean;
  kdsStations: KdsStation[];
  categories: CategoryData[];
  tables: TableData[];
  staffPermissions: StaffData[];
}

interface CategoryData {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  stationId: string | null;
  menuItems: MenuItemData[];
}

interface MenuItemData {
  id: string;
  categoryId?: string;
  title: string;
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
  displayOrder: number;
  tags: string[];
  allergens: string[];
}

interface TableData {
  id: string;
  tableNumber: string;
  qrToken: string;
  isOccupied: boolean;
}

interface StaffData {
  id: string;
  userId: string;
  stationId: string | null;
  canEditMenu: boolean;
  canToggleStock: boolean;
  canEditPrices: boolean;
  canManageOrders: boolean;
  canViewAnalytics: boolean;
  user: { fullName: string; phone: string };
  station?: { name: string; stationType: string } | null;
}

const WORKFLOW_LABELS: Record<WorkflowMode, { label: string; desc: string }> = {
  PAY_UPFRONT_BUZZER: { label: "پیجر دیجیتال", desc: "پرداخت قبل از آماده‌سازی + پیجر لرزان" },
  PAY_AT_COUNTER: { label: "پرداخت پای صندوق", desc: "سفارش آنلاین + پرداخت نقدی/کارتی" },
  TABLE_TAB_SPLIT: { label: "فاکتور مشترک میز", desc: "تقسیم دنگ بین اعضای میز" },
  VIEW_ONLY: { label: "کاتالوگ تصویری", desc: "بدون سبد خرید — نمایش منو فقط" },
};

const DEFAULT_OWNER_CAFE: CafeData = {
  id: "cmsuloxwv00055su40cryzwit",
  name: "روستری کالکتیو",
  slug: "roastery-collective",
  description: "یک فضای مینیمال و مدرن برای دوستداران قهوه تخصصی. از منشأ دان تا فنجان، هر مرحله با دقت انجام می‌شود.",
  address: "تهران، خیابان ولیعصر، پلاک ۴۵۲",
  latitude: 35.7219,
  longitude: 51.3347,
  phoneNumber: "02188776655",
  businessType: "SPECIALTY_CAFE",
  workflowMode: "PAY_UPFRONT_BUZZER",
  themeId: "NORDIC_MINIMAL",
  amenities: { wifi: true, smoking: false, outdoor: false, board_games: false, work_friendly: true, pet_friendly: false },
  openingHours: {
    sat: { open: "08:00", close: "23:00" },
    sun: { open: "08:00", close: "23:00" },
    mon: { open: "08:00", close: "23:00" },
    tue: { open: "08:00", close: "23:00" },
    wed: { open: "08:00", close: "23:00" },
    thu: { open: "08:00", close: "23:00" },
    fri: { open: "09:00", close: "23:00" },
  },
  isApproved: true,
  kdsStations: [
    { id: "stn-1", cafeId: "cmsuloxwv00055su40cryzwit", name: "بار گرم", stationType: "HOT_BAR" as const, isActive: true },
    { id: "stn-2", cafeId: "cmsuloxwv00055su40cryzwit", name: "بار سرد", stationType: "COLD_BAR" as const, isActive: true },
    { id: "stn-3", cafeId: "cmsuloxwv00055su40cryzwit", name: "آشپزخانه و بیکری", stationType: "KITCHEN" as const, isActive: true },
  ],
  categories: [
    {
      id: "cat-hot-coffee",
      name: "قهوه تخصصی و بار گرم",
      displayOrder: 1,
      isActive: true,
      stationId: "stn-1",
      menuItems: [
        { id: "item-espresso", title: "اسپرسو تخصصی", price: 85000, discountPrice: null, isAvailable: true, displayOrder: 1, tags: ["تک‌خاستگاه"], allergens: [] },
        { id: "item-v60", title: "دم‌آوری دستی V60", price: 125000, discountPrice: null, isAvailable: true, displayOrder: 2, tags: ["فیلتری"], allergens: [] },
        { id: "item-flatwhite", title: "فلت وایت", price: 110000, discountPrice: null, isAvailable: true, displayOrder: 3, tags: ["شیر قهوه"], allergens: ["شیر"] },
      ]
    },
    {
      id: "cat-cold-bar",
      name: "بار سرد و نوشیدنی‌های خنک",
      displayOrder: 2,
      isActive: true,
      stationId: "stn-2",
      menuItems: [
        { id: "item-coldbrew", title: "کلد برو ۲۴ ساعته", price: 135000, discountPrice: 115000, isAvailable: true, displayOrder: 1, tags: ["سرد"], allergens: [] },
        { id: "item-icedlatte", title: "آیس لاته تخصصی", price: 115000, discountPrice: null, isAvailable: true, displayOrder: 2, tags: ["سرد"], allergens: ["شیر"] },
      ]
    },
    {
      id: "cat-bakery",
      name: "شیرینی‌پزی و بیکری تازه",
      displayOrder: 3,
      isActive: true,
      stationId: "stn-3",
      menuItems: [
        { id: "item-croissant", title: "کروسان کره‌ای فرانسوی", price: 95000, discountPrice: null, isAvailable: true, displayOrder: 1, tags: ["تازه"], allergens: ["گلوتن", "شیر"] },
        { id: "item-cheesecake", title: "چیزکیک نیویورکی", price: 145000, discountPrice: null, isAvailable: true, displayOrder: 2, tags: ["شیرین"], allergens: ["شیر", "گلوتن"] },
      ]
    }
  ],
  tables: [
    { id: "tbl-1", tableNumber: "۱", qrToken: "qr-tbl-1", isOccupied: true },
    { id: "tbl-2", tableNumber: "۲", qrToken: "qr-tbl-2", isOccupied: false },
    { id: "tbl-3", tableNumber: "۳", qrToken: "qr-tbl-3", isOccupied: true },
    { id: "tbl-4", tableNumber: "۴", qrToken: "qr-tbl-4", isOccupied: false },
  ],
  staffPermissions: [
    { id: "staff-1", userId: "usr-staff-1", stationId: "stn-1", canEditMenu: true, canToggleStock: true, canEditPrices: false, canManageOrders: true, canViewAnalytics: true, user: { fullName: "رضا باریستا", phone: "09123333333" }, station: { name: "بار گرم", stationType: "HOT_BAR" } }
  ]
};

export default function OwnerPage() {
  const [cafe, setCafe] = useState<CafeData | null>(DEFAULT_OWNER_CAFE);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    fetch("/api/owner/cafe")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setCafe(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (updates: Partial<CafeData>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/owner/cafe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setCafe((prev) => prev ? { ...prev, ...updates } : prev);
        setSavedMsg("تغییرات ذخیره شد");
        setTimeout(() => setSavedMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Coffee size={32} color="var(--color-text-2)" className="skeleton" />
      </div>
    );
  }

  if (!cafe) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h2>کافه‌ای یافت نشد</h2>
          <p>ابتدا کافه خود را ثبت کنید</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex" }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 240,
        background: "var(--color-surface)",
        borderLeft: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
      }}>
        {/* Logo */}
        <div style={{ padding: "var(--space-6)", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div style={{ width: 36, height: 36, background: "var(--color-text)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Coffee size={18} color="#FAF6ED" strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "0.9rem", lineHeight: 1 }}>استودیو</div>
              <div style={{ fontSize: "0.7rem", color: "var(--color-text-2)", lineHeight: 1.2, marginTop: 2 }}>{cafe.name}</div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--color-border)" }}>
          <span className={`badge ${cafe.isApproved ? "badge-green" : "badge-amber"}`}>
            {cafe.isApproved ? "تأیید شده" : "در انتظار تأیید"}
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "var(--space-4) var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {([
            { id: "profile", label: "پروفایل و تنظیمات", icon: <Settings size={18} /> },
            { id: "menu", label: "منوساز", icon: <LayoutGrid size={18} /> },
            { id: "theme", label: "تم بصری", icon: <Palette size={18} /> },
            { id: "staff", label: "پرسنل", icon: <Users size={18} /> },
            { id: "tables", label: "میزها و QR", icon: <QrCode size={18} /> },
          ] as const).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                background: activeTab === id ? "var(--color-bg-2)" : "transparent",
                color: activeTab === id ? "var(--color-text)" : "var(--color-text-2)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-persian)",
                fontWeight: activeTab === id ? 700 : 500,
                fontSize: "0.9rem",
                width: "100%",
                textAlign: "right",
                transition: "all var(--transition-fast)",
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "var(--space-4) var(--space-3)", borderTop: "1px solid var(--color-border)" }}>
          <a href={`/c/${cafe.slug}`} target="_blank" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-accent)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "var(--space-3)" }}>
            <Eye size={15} /> مشاهده منو
          </a>
          <a href={`/kds/${cafe.slug}`} target="_blank" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-2)", fontWeight: 600, fontSize: "0.875rem", marginBottom: "var(--space-3)" }}>
            <Bell size={15} /> داشبورد KDS
          </a>
          <button
            onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
            style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-red)", fontWeight: 600, fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-persian)", width: "100%" }}
          >
            <LogOut size={15} /> خروج
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, marginRight: 240, padding: "var(--space-8)" }}>
        {/* Save success message */}
        {savedMsg && (
          <div style={{
            position: "fixed", top: "var(--space-4)", left: "50%", transform: "translateX(-50%)",
            background: "var(--color-sage)", color: "white",
            padding: "var(--space-3) var(--space-6)",
            borderRadius: "var(--radius-full)",
            fontWeight: 700,
            zIndex: 999,
            boxShadow: "var(--shadow-lg)",
          }}>
            {savedMsg}
          </div>
        )}

        {activeTab === "profile" && (
          <ProfileTab cafe={cafe} onSave={handleSave} saving={saving} />
        )}
        {activeTab === "menu" && (
          <MenuTab cafe={cafe} setCafe={setCafe} />
        )}
        {activeTab === "theme" && (
          <ThemeTab cafe={cafe} onSave={handleSave} saving={saving} />
        )}
        {activeTab === "staff" && (
          <StaffTab cafe={cafe} setCafe={setCafe} />
        )}
        {activeTab === "tables" && (
          <TablesTab cafe={cafe} />
        )}
      </main>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab({ cafe, onSave, saving }: { cafe: CafeData; onSave: (d: Partial<CafeData>) => void; saving: boolean }) {
  const [form, setForm] = useState({
    name: cafe.name,
    description: cafe.description ?? "",
    address: cafe.address,
    phoneNumber: cafe.phoneNumber,
    workflowMode: cafe.workflowMode,
    amenities: { ...cafe.amenities },
  });

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h2 style={{ marginBottom: "var(--space-2)" }}>پروفایل و تنظیمات</h2>
        <p>اطلاعات پایه کافه، مدل گردش کار و امکانات</p>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <h4 style={{ marginBottom: "var(--space-2)" }}>اطلاعات پایه</h4>

          <div className="form-group">
            <label className="label">نام کافه</label>
            <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="label">توضیحات</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="form-group">
            <label className="label">آدرس</label>
            <input className="input" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="label">شماره تلفن</label>
            <input className="input" dir="ltr" value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Workflow Mode */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-body">
          <h4 style={{ marginBottom: "var(--space-5)" }}>مدل گردش کار سفارش‌گیری</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            {(Object.entries(WORKFLOW_LABELS) as [WorkflowMode, { label: string; desc: string }][]).map(([mode, { label, desc }]) => (
              <button
                key={mode}
                onClick={() => setForm((p) => ({ ...p, workflowMode: mode }))}
                style={{
                  padding: "var(--space-4)",
                  border: `2px solid ${form.workflowMode === mode ? "var(--color-text)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-lg)",
                  background: form.workflowMode === mode ? "var(--color-bg-2)" : "transparent",
                  cursor: "pointer",
                  textAlign: "right",
                  fontFamily: "var(--font-persian)",
                  transition: "all var(--transition-fast)",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: "var(--space-1)" }}>{label}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-2)" }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-body">
          <h4 style={{ marginBottom: "var(--space-5)" }}>امکانات</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-3)" }}>
            {[
              { key: "wifi", label: "وای‌فای", icon: <Wifi size={18} /> },
              { key: "smoking", label: "سیگار", icon: <Cigarette size={18} /> },
              { key: "outdoor", label: "فضای باز", icon: <TreePine size={18} /> },
              { key: "board_games", label: "بردگیم", icon: <Gamepad2 size={18} /> },
              { key: "work_friendly", label: "کار با لپ‌تاپ", icon: <Briefcase size={18} /> },
              { key: "pet_friendly", label: "پت‌فرندلی", icon: <Heart size={18} /> },
            ].map(({ key, label, icon }) => {
              const active = form.amenities[key];
              return (
                <button
                  key={key}
                  onClick={() => setForm((p) => ({ ...p, amenities: { ...p.amenities, [key]: !active } }))}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    padding: "var(--space-4)",
                    border: `2px solid ${active ? "var(--color-text)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-lg)",
                    background: active ? "var(--color-text)" : "transparent",
                    color: active ? "var(--color-bg)" : "var(--color-text-2)",
                    cursor: "pointer",
                    fontFamily: "var(--font-persian)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={() => onSave(form)}
        className="btn btn-primary btn-lg"
        disabled={saving}
      >
        <Save size={18} />
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>
    </div>
  );
}

// ── Theme Tab ─────────────────────────────────────────────────────────────────

function ThemeTab({ cafe, onSave, saving }: { cafe: CafeData; onSave: (d: Partial<CafeData>) => void; saving: boolean }) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(cafe.themeId);

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h2 style={{ marginBottom: "var(--space-2)" }}>تم بصری</h2>
        <p>هویت بصری منوی مشتریان کافه خود را انتخاب کنید</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--space-5)", marginBottom: "var(--space-8)" }}>
        {THEME_LIST.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
            style={{
              padding: "var(--space-5)",
              border: `3px solid ${selectedTheme === theme.id ? "var(--color-text)" : "var(--color-border)"}`,
              borderRadius: "var(--radius-xl)",
              background: "var(--color-surface)",
              cursor: "pointer",
              textAlign: "right",
              fontFamily: "var(--font-persian)",
              transition: "all var(--transition-base)",
              boxShadow: selectedTheme === theme.id ? "var(--shadow-lg)" : "none",
            }}
          >
            {/* Color palette preview */}
            <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
              {[theme.preview.bg, theme.preview.surface, theme.preview.text, theme.preview.accent, theme.preview.border].map((color, i) => (
                <div key={i} style={{ width: 28, height: 28, background: color, borderRadius: "var(--radius-sm)", border: "1px solid rgba(0,0,0,0.1)", flex: "0 0 auto" }} />
              ))}
            </div>

            {/* Theme name */}
            <div style={{ fontWeight: 900, fontSize: "1rem", marginBottom: "var(--space-1)" }}>{theme.nameFa}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-2)", fontFamily: "var(--font-latin)" }}>{theme.name}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-2)", marginTop: "var(--space-2)", lineHeight: 1.5 }}>{theme.description}</div>

            {selectedTheme === theme.id && (
              <div style={{ marginTop: "var(--space-3)" }}>
                <span className="badge badge-green">انتخاب فعلی</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Live Preview */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h4 style={{ marginBottom: "var(--space-4)" }}>پیش‌نمایش زنده منو</h4>
        <div
          style={{
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <ThemePreview themeId={selectedTheme} cafeName={cafe.name} />
        </div>
      </div>

      <button
        onClick={() => onSave({ themeId: selectedTheme })}
        className="btn btn-primary btn-lg"
        disabled={saving}
      >
        <Save size={18} />
        {saving ? "در حال ذخیره..." : "ذخیره تم"}
      </button>
    </div>
  );
}

function ThemePreview({ themeId, cafeName }: { themeId: ThemeId; cafeName: string }) {
  const theme = THEMES[themeId] ?? THEMES.NORDIC_MINIMAL;
  const { cssVars } = theme;

  return (
    <div style={{
      background: cssVars["--theme-bg"],
      color: cssVars["--theme-text"],
      padding: "var(--space-6)",
      minHeight: 200,
      fontFamily: "var(--font-persian)",
    }}>
      {/* Mock header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5)", paddingBottom: "var(--space-4)", borderBottom: `1px solid ${cssVars["--theme-border"]}` }}>
        <div style={{ fontWeight: 900, fontSize: "1.25rem" }}>{cafeName}</div>
        <div style={{ background: cssVars["--theme-accent"], color: cssVars["--theme-accent-fg"], padding: "var(--space-2) var(--space-4)", borderRadius: cssVars["--theme-radius"], fontSize: "0.875rem", fontWeight: 700 }}>
          سفارش
        </div>
      </div>

      {/* Mock category tab */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
        {["اسپرسو", "نوشیدنی سرد", "شیرینی"].map((cat, i) => (
          <div key={cat} style={{
            padding: "var(--space-2) var(--space-4)",
            borderRadius: cssVars["--theme-radius"],
            background: i === 0 ? cssVars["--theme-accent"] : cssVars["--theme-surface"],
            color: i === 0 ? cssVars["--theme-accent-fg"] : cssVars["--theme-text-2"],
            fontSize: "0.875rem",
            fontWeight: 700,
            border: `1px solid ${cssVars["--theme-border"]}`,
          }}>
            {cat}
          </div>
        ))}
      </div>

      {/* Mock item */}
      <div style={{
        background: cssVars["--theme-surface"],
        border: `1px solid ${cssVars["--theme-border"]}`,
        borderRadius: cssVars["--theme-radius-lg"],
        padding: "var(--space-4)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: cssVars["--theme-card-shadow"],
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1rem" }}>فلت وایت</div>
          <div style={{ fontSize: "0.8125rem", color: cssVars["--theme-text-2"] }}>اسپرسو با شیر بخارپز</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span style={{ fontWeight: 800, fontFamily: "var(--font-latin)" }}>۱۲۵،۰۰۰</span>
          <div style={{
            width: 32, height: 32,
            background: cssVars["--theme-accent"],
            color: cssVars["--theme-accent-fg"],
            borderRadius: cssVars["--theme-radius"],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "1.2rem",
          }}>+</div>
        </div>
      </div>
    </div>
  );
}

// ── Menu Tab ──────────────────────────────────────────────────────────────────

function MenuTab({ cafe, setCafe }: { cafe: CafeData; setCafe: React.Dispatch<React.SetStateAction<CafeData | null>> }) {
  const [showNewItem, setShowNewItem] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [categories, setCategories] = useState(cafe.categories);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over?.id);
      const reordered = arrayMove(categories, oldIndex, newIndex).map((c, i) => ({ ...c, displayOrder: i }));
      setCategories(reordered);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-8)" }}>
        <div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>منوساز</h2>
          <p>دسته‌بندی‌ها و آیتم‌ها را مدیریت کنید</p>
        </div>
        <button onClick={() => setShowNewItem(true)} className="btn btn-primary">
          <Plus size={18} /> آیتم جدید
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {categories.map((cat) => (
              <SortableCategory key={cat.id} category={cat} cafeId={cafe.id} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* New Category */}
      <div className="card" style={{ marginTop: "var(--space-6)", borderStyle: "dashed" }}>
        <div className="card-body" style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          <input
            className="input"
            placeholder="نام دسته‌بندی جدید..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            onClick={async () => {
              if (!newCatName.trim()) return;
              const res = await fetch("/api/owner/menu/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCatName, cafeId: cafe.id }),
              });
              const data = await res.json();
              if (data.success) {
                setCategories((prev) => [...prev, { ...data.data, menuItems: [] }]);
                setNewCatName("");
              }
            }}
            className="btn btn-primary"
          >
            <Plus size={18} /> افزودن
          </button>
        </div>
      </div>

      {showNewItem && (
        <NewItemModal
          cafeId={cafe.id}
          categories={categories}
          stations={cafe.kdsStations}
          onClose={() => setShowNewItem(false)}
          onCreated={(item) => {
            setCategories((prev) =>
              prev.map((c) =>
                c.id === item.categoryId
                  ? { ...c, menuItems: [...c.menuItems, item] }
                  : c
              )
            );
          }}
        />
      )}
    </div>
  );
}

function SortableCategory({ category, cafeId }: { category: CategoryData; cafeId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="card">
      <div className="card-body">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div {...attributes} {...listeners} style={{ cursor: "grab", color: "var(--color-border)" }}>
              <GripVertical size={20} />
            </div>
            <h4 style={{ margin: 0 }}>{category.name}</h4>
            <span className="badge badge-gray">{category.menuItems.length} آیتم</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {category.menuItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-3) var(--space-4)",
                background: "var(--color-bg-2)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.isAvailable ? "var(--color-emerald)" : "var(--color-red)" }} />
                <span style={{ fontWeight: 700 }}>{item.title}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                <span style={{ fontFamily: "var(--font-latin)", fontWeight: 700, fontSize: "0.9rem" }}>
                  {(item.discountPrice ?? item.price).toLocaleString()} ت
                </span>
                <button
                  onClick={async () => {
                    await fetch(`/api/stock`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: item.id, isAvailable: !item.isAvailable }) });
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-2)" }}
                >
                  {item.isAvailable ? <ToggleRight size={20} color="var(--color-emerald)" /> : <ToggleLeft size={20} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewItemModal({ cafeId, categories, stations, onClose, onCreated }: {
  cafeId: string;
  categories: CategoryData[];
  stations: KdsStation[];
  onClose: () => void;
  onCreated: (item: MenuItemData) => void;
}) {
  const [form, setForm] = useState({
    categoryId: categories[0]?.id ?? "",
    title: "",
    description: "",
    price: "",
    prepTimeMinutes: "5",
    tags: "",
    allergens: "",
    hasCoffeeProfile: false,
    coffeeProfile: {
      origin: "", altitude: "", process: "", roastLevel: "",
      radar: { acidity: 5, body: 5, sweetness: 5, bitterness: 5, aroma: 5 },
      flavorNotes: "",
    },
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/owner/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: form.categoryId,
          title: form.title,
          description: form.description,
          price: parseInt(form.price),
          prepTimeMinutes: parseInt(form.prepTimeMinutes),
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          allergens: form.allergens.split(",").map((t) => t.trim()).filter(Boolean),
          coffeeProfile: form.hasCoffeeProfile ? {
            ...form.coffeeProfile,
            flavorNotes: form.coffeeProfile.flavorNotes.split(",").map((t) => t.trim()).filter(Boolean),
          } : undefined,
          modifierGroups: [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        onCreated(data.data);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
          <h3>آیتم جدید</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Edit size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="label">دسته‌بندی</label>
            <select className="input" value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label">نام آیتم *</label>
            <input className="input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          </div>

          <div className="form-group">
            <label className="label">توضیحات</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <div className="form-group">
              <label className="label">قیمت (تومان) *</label>
              <input className="input" type="number" dir="ltr" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">زمان آماده‌سازی (دقیقه)</label>
              <input className="input" type="number" dir="ltr" value={form.prepTimeMinutes} onChange={(e) => setForm((p) => ({ ...p, prepTimeMinutes: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="label">تگ‌ها (با ویرگول جدا کنید)</label>
            <input className="input" placeholder="پرطرفدار، تخصصی، کافئین‌بالا" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="label">آلرژن‌ها (با ویرگول)</label>
            <input className="input" placeholder="شیر، گلوتن، بادام" value={form.allergens} onChange={(e) => setForm((p) => ({ ...p, allergens: e.target.value }))} />
          </div>

          {/* Coffee profile toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <input
              type="checkbox"
              id="hasCoffeeProfile"
              checked={form.hasCoffeeProfile}
              onChange={(e) => setForm((p) => ({ ...p, hasCoffeeProfile: e.target.checked }))}
            />
            <label htmlFor="hasCoffeeProfile" className="label" style={{ margin: 0 }}>
              افزودن پروفایل طعمی قهوه تخصصی
            </label>
          </div>

          {form.hasCoffeeProfile && (
            <div style={{ padding: "var(--space-5)", background: "var(--color-bg-2)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className="form-group">
                  <label className="label">منشأ دان</label>
                  <input className="input" placeholder="اتیوپی یرگاچف" value={form.coffeeProfile.origin} onChange={(e) => setForm((p) => ({ ...p, coffeeProfile: { ...p.coffeeProfile, origin: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label className="label">ارتفاع کشت</label>
                  <input className="input" placeholder="1800-2200 متر" value={form.coffeeProfile.altitude} onChange={(e) => setForm((p) => ({ ...p, coffeeProfile: { ...p.coffeeProfile, altitude: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label className="label">روش فرآوری</label>
                  <input className="input" placeholder="واشد، هانی، ناچرال" value={form.coffeeProfile.process} onChange={(e) => setForm((p) => ({ ...p, coffeeProfile: { ...p.coffeeProfile, process: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label className="label">درجه رست</label>
                  <input className="input" placeholder="روشن، میانه، تیره" value={form.coffeeProfile.roastLevel} onChange={(e) => setForm((p) => ({ ...p, coffeeProfile: { ...p.coffeeProfile, roastLevel: e.target.value } }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="label">نُت‌های طعمی (با ویرگول)</label>
                <input className="input" placeholder="شکلات، کارامل، توت قرمز" value={form.coffeeProfile.flavorNotes} onChange={(e) => setForm((p) => ({ ...p, coffeeProfile: { ...p.coffeeProfile, flavorNotes: e.target.value } }))} />
              </div>

              {/* Radar sliders */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <label className="label">پروفایل رادار (۱ تا ۱۰)</label>
                {[
                  { key: "acidity", label: "اسیدیته" },
                  { key: "body", label: "بادی" },
                  { key: "sweetness", label: "شیرینی" },
                  { key: "bitterness", label: "تلخی" },
                  { key: "aroma", label: "عطر" },
                ].map(({ key, label }) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                    <span style={{ width: 60, fontSize: "0.875rem", fontWeight: 700 }}>{label}</span>
                    <input
                      type="range"
                      min={1} max={10}
                      value={form.coffeeProfile.radar[key as keyof typeof form.coffeeProfile.radar]}
                      onChange={(e) => setForm((p) => ({ ...p, coffeeProfile: { ...p.coffeeProfile, radar: { ...p.coffeeProfile.radar, [key]: parseInt(e.target.value) } } }))}
                      style={{ flex: 1, accentColor: "var(--color-accent)" }}
                    />
                    <span style={{ width: 24, fontSize: "0.875rem", fontWeight: 700, fontFamily: "var(--font-latin)", textAlign: "center" }}>
                      {form.coffeeProfile.radar[key as keyof typeof form.coffeeProfile.radar]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              {saving ? "در حال ذخیره..." : "ذخیره آیتم"}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Staff Tab ─────────────────────────────────────────────────────────────────

function StaffTab({ cafe, setCafe }: { cafe: CafeData; setCafe: React.Dispatch<React.SetStateAction<CafeData | null>> }) {
  const [phone, setPhone] = useState("");
  const [permissions, setPermissions] = useState({
    canEditMenu: false,
    canToggleStock: true,
    canEditPrices: false,
    canManageOrders: true,
    canViewAnalytics: false,
  });
  const [saving, setSaving] = useState(false);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/owner/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, ...permissions }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h2 style={{ marginBottom: "var(--space-2)" }}>مدیریت پرسنل</h2>
        <p>دسترسی‌های باریستاها و کارمندان کافه را مدیریت کنید</p>
      </div>

      {/* Current Staff */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-body">
          <h4 style={{ marginBottom: "var(--space-5)" }}>پرسنل فعلی</h4>
          {cafe.staffPermissions.length === 0 ? (
            <p style={{ color: "var(--color-text-2)", textAlign: "center", padding: "var(--space-6)" }}>
              هیچ پرسنلی اضافه نشده
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {cafe.staffPermissions.map((staff) => (
                <div key={staff.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-4)",
                  background: "var(--color-bg-2)",
                  borderRadius: "var(--radius-lg)",
                }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{staff.user.fullName}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--color-text-2)", fontFamily: "var(--font-latin)", direction: "ltr" }}>{staff.user.phone}</div>
                    {staff.station && (
                      <span className="badge badge-accent" style={{ marginTop: "var(--space-2)" }}>{staff.station.name}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {staff.canEditMenu && <span className="badge badge-amber">ویرایش منو</span>}
                    {staff.canToggleStock && <span className="badge badge-gray">86 آیتم</span>}
                    {staff.canManageOrders && <span className="badge badge-green">مدیریت سفارش</span>}
                    <button
                      onClick={async () => {
                        await fetch(`/api/owner/staff?userId=${staff.userId}`, { method: "DELETE" });
                        window.location.reload();
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-red)" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add New Staff */}
      <div className="card">
        <div className="card-body">
          <h4 style={{ marginBottom: "var(--space-5)" }}>افزودن پرسنل جدید</h4>
          <form onSubmit={handleAddStaff} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <div className="form-group">
              <label className="label">شماره تلفن باریستا</label>
              <input className="input" type="tel" dir="ltr" placeholder="09..." value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>

            <div>
              <label className="label" style={{ marginBottom: "var(--space-3)" }}>دسترسی‌ها</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {[
                  { key: "canEditMenu", label: "ویرایش منو", desc: "افزودن و ویرایش آیتم‌های منو" },
                  { key: "canToggleStock", label: "مدیریت ناموجودی (86)", desc: "اعلام ناموجودی آیتم‌ها" },
                  { key: "canEditPrices", label: "ویرایش قیمت‌ها", desc: "تغییر قیمت آیتم‌ها" },
                  { key: "canManageOrders", label: "مدیریت سفارشات", desc: "تغییر وضعیت سفارشات در KDS" },
                  { key: "canViewAnalytics", label: "مشاهده آمار", desc: "دسترسی به گزارشات فروش" },
                ].map(({ key, label, desc }) => (
                  <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={permissions[key as keyof typeof permissions]}
                      onChange={(e) => setPermissions((p) => ({ ...p, [key]: e.target.checked }))}
                      style={{ marginTop: 3 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{label}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-2)" }}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Plus size={18} />
              {saving ? "در حال افزودن..." : "افزودن پرسنل"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Tables Tab ────────────────────────────────────────────────────────────────

function TablesTab({ cafe }: { cafe: CafeData }) {
  const [tables, setTables] = useState(cafe.tables);

  const generateQR = async (tableNumber: string) => {
    const QRCode = (await import("qrcode")).default;
    const url = `${window.location.origin}/c/${cafe.slug}?table=${tableNumber}`;
    const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: "#121211", light: "#FAFAFA" } });
    const link = document.createElement("a");
    link.download = `qr-table-${tableNumber}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-8)" }}>
        <div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>میزها و کدهای QR</h2>
          <p>کد QR هر میز را دانلود و روی استند میز نصب کنید</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
        {tables.map((table) => (
          <div key={table.id} className="card" style={{ textAlign: "center" }}>
            <div className="card-body" style={{ padding: "var(--space-5)" }}>
              <div style={{
                width: 80, height: 80,
                background: "var(--color-bg-2)",
                borderRadius: "var(--radius-lg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto var(--space-4)",
                fontSize: "2rem",
                fontWeight: 900,
                color: "var(--color-text-2)",
              }}>
                {table.tableNumber}
              </div>
              <div style={{ fontWeight: 800, marginBottom: "var(--space-2)" }}>میز {table.tableNumber}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: table.isOccupied ? "var(--color-red)" : "var(--color-emerald)" }} />
                <span style={{ fontSize: "0.8125rem", color: "var(--color-text-2)" }}>
                  {table.isOccupied ? "اشغال" : "آزاد"}
                </span>
              </div>
              <button
                onClick={() => generateQR(table.tableNumber)}
                className="btn btn-secondary btn-sm btn-full"
              >
                <QrCode size={15} /> دانلود QR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
