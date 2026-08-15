"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, MapPin, Wifi, Cigarette, TreePine, Gamepad2,
  Briefcase, Heart, SlidersHorizontal, Map, List,
  ChevronDown, Star, Clock, ArrowLeft, Coffee, X
} from "lucide-react";
import dynamic from "next/dynamic";
import type { CafePublic } from "@/types";
import { formatDistance, isCafeOpenNow } from "@/lib/haversine";

// Dynamically import Leaflet map to avoid SSR issues
const CafeMap = dynamic(() => import("@/components/marketplace/CafeMap"), {
  ssr: false,
  loading: () => (
    <div className="skeleton" style={{ height: "500px", borderRadius: "16px" }} />
  ),
});

interface DiscoveryCafe extends CafePublic {
  distance?: number;
  isOpenNow?: boolean;
}

const THEME_LABELS: Record<string, string> = {
  CAFE: "کافه",
  SPECIALTY_CAFE: "روستری تخصصی",
  CAFE_BAR: "کافه‌بار",
  BAKERY: "بیکری",
  RESTAURANT: "رستوران",
  BRUNCH: "برانچ",
};

const FALLBACK_DISCOVERY_CAFES: any[] = [
  {
    id: "cmsuloxwv00055su40cryzwit",
    name: "روستری کالکتیو",
    slug: "roastery-collective",
    description: "یک فضای مینیمال و مدرن برای دوستداران قهوه تخصصی. از منشأ دان تا فنجان، هر مرحله با دقت انجام می‌شود.",
    address: "تهران، خیابان ولیعصر، پلاک ۴۵۲",
    phoneNumber: "02188776655",
    latitude: 35.7219,
    longitude: 51.3347,
    businessType: "SPECIALTY_CAFE",
    workflowMode: "PAY_UPFRONT_BUZZER",
    themeId: "NORDIC_MINIMAL",
    isOpenNow: true,
    isApproved: true,
    isActive: true,
    distance: 1.2,
    amenities: { wifi: true, smoking: false, outdoor: false, board_games: false, work_friendly: true, pet_friendly: false },
    categories: []
  },
  {
    id: "cmsuloxx200065su486rbxpb5",
    name: "نوآر سوشال کلاب",
    slug: "noir-social-club",
    description: "بار تخصصی قهوه شبانه با فضای دارک و آتمسفر خاص. محیطی ایده‌آل برای جلسات خلاقانه و ملاقات‌های شبانه.",
    address: "تهران، الهیه، خیابان فرشته، کوچه سوم",
    phoneNumber: "02122345678",
    latitude: 35.7891,
    longitude: 51.4156,
    businessType: "CAFE_BAR",
    workflowMode: "TABLE_TAB_SPLIT",
    themeId: "OLED_CARBON",
    isOpenNow: true,
    isApproved: true,
    isActive: true,
    distance: 3.4,
    amenities: { wifi: true, smoking: true, outdoor: true, board_games: false, work_friendly: false, pet_friendly: true },
    categories: []
  }
];

export default function DiscoveryPage() {
  const [cafes, setCafes] = useState<DiscoveryCafe[]>(FALLBACK_DISCOVERY_CAFES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5);
  const [filters, setFilters] = useState({
    wifi: false,
    smoking: false,
    outdoor: false,
    board_games: false,
    work_friendly: false,
    pet_friendly: false,
    openNow: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCafes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (userLocation) {
        params.set("lat", String(userLocation.lat));
        params.set("lng", String(userLocation.lng));
        params.set("radius", String(radius));
      }
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.set(key, "true");
      });

      const res = await fetch(`/api/discovery?${params.toString()}`);
      const data = await res.json();
      if (data.success) setCafes(data.data);
    } catch (err) {
      console.error("Discovery fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, userLocation, radius, filters]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(fetchCafes, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [fetchCafes]);

  const requestGeolocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.error("Geolocation error:", err)
    );
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* ── Top Navigation ── */}
      <header className="nav">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 36, height: 36,
              background: "var(--color-text)",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Coffee size={18} color="#FAF6ED" strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.03em", lineHeight: 1 }}>cafechi</div>
              <div style={{ fontSize: "0.65rem", color: "var(--color-text-2)", lineHeight: 1 }}>کافه‌چی</div>
            </div>
          </div>

          {/* Nav Links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "var(--space-6)" }}>
            <a href="/login" className="btn btn-secondary btn-sm">ورود</a>
            <a href="/register" className="btn btn-primary btn-sm">ثبت‌نام کافه</a>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section style={{
        padding: "var(--space-20) 0 var(--space-16)",
        background: "linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-2) 100%)",
        borderBottom: "1px solid var(--color-border)",
      }}>
        <div className="container" style={{ maxWidth: 720, textAlign: "center" }}>
          <div style={{
            display: "inline-block",
            padding: "var(--space-2) var(--space-4)",
            background: "var(--color-bg-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-full)",
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: "var(--color-text-2)",
            marginBottom: "var(--space-6)",
            letterSpacing: "0.05em",
          }}>
            کشف قهوه تخصصی در شهر شما
          </div>

          <h1 style={{ marginBottom: "var(--space-5)", color: "var(--color-text)" }}>
            هر لحظه‌ای لایق<br />
            <span style={{ color: "var(--color-accent)" }}>بهترین قهوه</span> است
          </h1>

          <p style={{ fontSize: "1.125rem", marginBottom: "var(--space-10)", maxWidth: 520, margin: "0 auto var(--space-10)" }}>
            منوی دیجیتال، سفارش‌گیری هوشمند و تجربه کافه‌ای بی‌نظیر — همه در یک پلتفرم
          </p>

          {/* Search Bar */}
          <div style={{
            position: "relative",
            maxWidth: 600,
            margin: "0 auto",
          }}>
            <Search
              size={20}
              style={{
                position: "absolute",
                right: "var(--space-4)",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-2)",
              }}
            />
            <input
              ref={searchRef}
              type="text"
              className="input"
              placeholder="جستجو در کافه‌ها، شهرها و آیتم‌های منو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingRight: "var(--space-12)",
                paddingLeft: "var(--space-4)",
                height: 56,
                fontSize: "1rem",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--color-border)",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  left: "var(--space-4)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-2)",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Controls Bar ── */}
      <section style={{
        padding: "var(--space-4) 0",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 64,
        zIndex: 40,
      }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
          {/* Left: Geolocation + Radius */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <button
              onClick={requestGeolocation}
              className="btn btn-secondary btn-sm"
              style={{ gap: "var(--space-2)" }}
            >
              <MapPin size={15} />
              {userLocation ? "موقعیت: فعال" : "استفاده از موقعیتم"}
            </button>

            {userLocation && (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <input
                  type="range"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  style={{ width: 100, accentColor: "var(--color-accent)" }}
                />
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-2)", fontFamily: "var(--font-latin)" }}>
                  {radius} km
                </span>
              </div>
            )}
          </div>

          {/* Right: Filters + View Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="btn btn-secondary btn-sm"
              style={{ position: "relative" }}
            >
              <SlidersHorizontal size={15} />
              فیلترها
              {activeFilterCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -6, left: -6,
                  width: 18, height: 18,
                  background: "var(--color-accent)",
                  color: "white",
                  borderRadius: "50%",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-latin)",
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div style={{
              display: "flex",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}>
              {([["list", <List size={15} />], ["map", <Map size={15} />]] as const).map(([mode, icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as "list" | "map")}
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    background: viewMode === mode ? "var(--color-text)" : "transparent",
                    color: viewMode === mode ? "var(--color-bg)" : "var(--color-text-2)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div className="container" style={{ paddingTop: "var(--space-3)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {([
              { key: "openNow", label: "باز است", icon: <Clock size={14} /> },
              { key: "wifi", label: "وای‌فای", icon: <Wifi size={14} /> },
              { key: "outdoor", label: "فضای باز", icon: <TreePine size={14} /> },
              { key: "smoking", label: "سیگار", icon: <Cigarette size={14} /> },
              { key: "board_games", label: "بردگیم", icon: <Gamepad2 size={14} /> },
              { key: "work_friendly", label: "کار با لپ‌تاپ", icon: <Briefcase size={14} /> },
              { key: "pet_friendly", label: "حیوان خانگی", icon: <Heart size={14} /> },
            ] as const).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => toggleFilter(key as keyof typeof filters)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-2) var(--space-4)",
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${filters[key as keyof typeof filters] ? "var(--color-text)" : "var(--color-border)"}`,
                  background: filters[key as keyof typeof filters] ? "var(--color-text)" : "transparent",
                  color: filters[key as keyof typeof filters] ? "var(--color-bg)" : "var(--color-text-2)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Results ── */}
      <main className="container" style={{ padding: "var(--space-8) var(--space-6)" }}>
        {/* Result count */}
        <div style={{ marginBottom: "var(--space-6)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "0.9375rem", color: "var(--color-text-2)" }}>
            {loading ? "در حال جستجو..." : `${cafes.length} کافه یافت شد`}
          </p>
          {searchQuery && (
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>
              نتایج جستجو: «{searchQuery}»
            </span>
          )}
        </div>

        {viewMode === "map" ? (
          <CafeMap cafes={cafes} userLocation={userLocation} />
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "var(--space-6)",
          }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 280 }} />
              ))
            ) : cafes.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "var(--space-20) 0" }}>
                <Coffee size={48} color="var(--color-border)" style={{ marginBottom: "var(--space-4)" }} />
                <h3 style={{ color: "var(--color-text-2)" }}>کافه‌ای یافت نشد</h3>
                <p>فیلترها را تغییر دهید یا جستجوی دیگری انجام دهید</p>
              </div>
            ) : (
              cafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid var(--color-border)",
        padding: "var(--space-12) 0",
        marginTop: "var(--space-16)",
        background: "var(--color-bg-2)",
      }}>
        <div className="container" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "var(--space-4)" }}>
            <div style={{
              width: 28, height: 28,
              background: "var(--color-text)",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Coffee size={14} color="#FAF6ED" strokeWidth={1.5} />
            </div>
            <span style={{ fontWeight: 900, fontSize: "1rem" }}>cafechi</span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)" }}>
            © ۱۴۰۳ کافه‌چی — پلتفرم هوشمند کافه‌های ایران
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Cafe Card Component ──────────────────────────────────────────────────────

function CafeCard({ cafe }: { cafe: DiscoveryCafe }) {
  const amenities = (cafe.amenities || {}) as unknown as Record<string, boolean>;

  return (
    <a
      href={`/c/${cafe.slug}`}
      className="card card-hover"
      style={{ display: "block", textDecoration: "none" }}
    >
      {/* Cover Image Placeholder */}
      <div style={{
        height: 160,
        background: "linear-gradient(135deg, var(--color-bg-2) 0%, var(--color-border) 100%)",
        position: "relative",
        overflow: "hidden",
      }}>
        {cafe.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cafe.coverUrl}
            alt={cafe.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Coffee size={40} color="var(--color-text-2)" strokeWidth={1} />
          </div>
        )}

        {/* Status Badge */}
        <div style={{ position: "absolute", top: "var(--space-3)", right: "var(--space-3)" }}>
          <span className={`badge ${cafe.isOpenNow ? "badge-green" : "badge-gray"}`}>
            {cafe.isOpenNow ? "باز است" : "بسته"}
          </span>
        </div>

        {/* Distance */}
        {cafe.distance !== undefined && cafe.distance !== null && (
          <div style={{ position: "absolute", bottom: "var(--space-3)", left: "var(--space-3)" }}>
            <span className="badge badge-gray" style={{ fontFamily: "var(--font-latin)" }}>
              <MapPin size={11} />
              {formatDistance(cafe.distance)}
            </span>
          </div>
        )}
      </div>

      <div className="card-body" style={{ padding: "var(--space-5)" }}>
        {/* Business type */}
        <span style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "var(--color-accent)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}>
          {THEME_LABELS[cafe.businessType] ?? cafe.businessType}
        </span>

        <h3 style={{ margin: "var(--space-1) 0 var(--space-2)", fontSize: "1.125rem", fontWeight: 800 }}>
          {cafe.name}
        </h3>

        <p style={{
          fontSize: "0.875rem",
          color: "var(--color-text-2)",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          marginBottom: "var(--space-4)",
          lineHeight: 1.5,
        }}>
          {cafe.description ?? "کافه تخصصی با بهترین قهوه‌ها"}
        </p>

        {/* Address */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
          <MapPin size={13} color="var(--color-text-2)" />
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-2)" }}>{cafe.address}</span>
        </div>

        {/* Amenity icons */}
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          {amenities.wifi && <span title="وای‌فای"><Wifi size={15} color="var(--color-text-2)" /></span>}
          {amenities.outdoor && <span title="فضای باز"><TreePine size={15} color="var(--color-text-2)" /></span>}
          {amenities.board_games && <span title="بردگیم"><Gamepad2 size={15} color="var(--color-text-2)" /></span>}
          {amenities.work_friendly && <span title="کار با لپ‌تاپ"><Briefcase size={15} color="var(--color-text-2)" /></span>}
          {amenities.pet_friendly && <span title="پت‌فرندلی"><Heart size={15} color="var(--color-text-2)" /></span>}
          {amenities.smoking && <span title="سیگار"><Cigarette size={15} color="var(--color-text-2)" /></span>}
        </div>
      </div>
    </a>
  );
}
