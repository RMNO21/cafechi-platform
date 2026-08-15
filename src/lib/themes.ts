import type { ThemeDefinition, ThemeId } from "@/types";

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  NORDIC_MINIMAL: {
    id: "NORDIC_MINIMAL",
    name: "Nordic Minimal",
    nameFa: "نوردیک مینیمال",
    description: "سفید مات، کادر خاکستری، تایپوگرافی مشکی — کافه‌های مدرن و روشن",
    preview: {
      bg: "#FAFAFA",
      surface: "#FFFFFF",
      text: "#111111",
      accent: "#3B3B3B",
      border: "#E0E0E0",
    },
    cssVars: {
      "--theme-bg": "#FAFAFA",
      "--theme-bg-2": "#F5F5F5",
      "--theme-surface": "#FFFFFF",
      "--theme-border": "#E0E0E0",
      "--theme-text": "#111111",
      "--theme-text-2": "#555555",
      "--theme-accent": "#3B3B3B",
      "--theme-accent-fg": "#FFFFFF",
      "--theme-accent-2": "#6B6B6B",
      "--theme-card-shadow": "0 1px 3px rgba(0,0,0,0.08)",
      "--theme-radius": "8px",
      "--theme-radius-lg": "16px",
      "--theme-font-weight-display": "800",
    },
  },
  OLED_CARBON: {
    id: "OLED_CARBON",
    name: "OLED Carbon",
    nameFa: "اولد کربن",
    description: "مشکی عمیق با زرد کهربایی — بارهای تخصصی شبانه",
    preview: {
      bg: "#0A0A0A",
      surface: "#141414",
      text: "#F5F5F5",
      accent: "#F0A500",
      border: "#2A2A2A",
    },
    cssVars: {
      "--theme-bg": "#0A0A0A",
      "--theme-bg-2": "#111111",
      "--theme-surface": "#1A1A1A",
      "--theme-border": "#2E2E2E",
      "--theme-text": "#F0F0F0",
      "--theme-text-2": "#888888",
      "--theme-accent": "#F0A500",
      "--theme-accent-fg": "#0A0A0A",
      "--theme-accent-2": "#D4921E",
      "--theme-card-shadow": "0 2px 8px rgba(0,0,0,0.6)",
      "--theme-radius": "6px",
      "--theme-radius-lg": "12px",
      "--theme-font-weight-display": "900",
    },
  },
  ARTISAN_SEPIA: {
    id: "ARTISAN_SEPIA",
    name: "Artisan Sepia",
    nameFa: "آرتیزان سپیا",
    description: "کرم کاغذ دست‌ساز و قهوه‌ای برشته — روستری‌ها و کافه‌عمارت‌ها",
    preview: {
      bg: "#FAF6ED",
      surface: "#FDF9F2",
      text: "#2C1810",
      accent: "#8B4513",
      border: "#DDD0BC",
    },
    cssVars: {
      "--theme-bg": "#FAF6ED",
      "--theme-bg-2": "#F5EDD8",
      "--theme-surface": "#FDF9F2",
      "--theme-border": "#DDD0BC",
      "--theme-text": "#2C1810",
      "--theme-text-2": "#6B4C3B",
      "--theme-accent": "#8B4513",
      "--theme-accent-fg": "#FAF6ED",
      "--theme-accent-2": "#A0522D",
      "--theme-card-shadow": "0 2px 6px rgba(44,24,16,0.1)",
      "--theme-radius": "4px",
      "--theme-radius-lg": "8px",
      "--theme-font-weight-display": "800",
    },
  },
  NEO_EDITORIAL: {
    id: "NEO_EDITORIAL",
    name: "Neo Editorial",
    nameFa: "نئو ادیتوریال",
    description: "گرید فریم مشکی ۲px و سایه شارپ — ژورنال‌های ترند",
    preview: {
      bg: "#F8F8F8",
      surface: "#FFFFFF",
      text: "#000000",
      accent: "#000000",
      border: "#000000",
    },
    cssVars: {
      "--theme-bg": "#F8F8F8",
      "--theme-bg-2": "#EFEFEF",
      "--theme-surface": "#FFFFFF",
      "--theme-border": "#000000",
      "--theme-text": "#000000",
      "--theme-text-2": "#444444",
      "--theme-accent": "#000000",
      "--theme-accent-fg": "#FFFFFF",
      "--theme-accent-2": "#333333",
      "--theme-card-shadow": "4px 4px 0px #000000",
      "--theme-radius": "0px",
      "--theme-radius-lg": "0px",
      "--theme-font-weight-display": "900",
    },
  },
  WARM_TERRACOTTA: {
    id: "WARM_TERRACOTTA",
    name: "Warm Terracotta",
    nameFa: "ترراکوتای گرم",
    description: "تنالیته خاکی و گوشه‌های کاملاً گرد — بیکری‌ها و برانچ",
    preview: {
      bg: "#FDF0E8",
      surface: "#FFFFFF",
      text: "#2D1206",
      accent: "#9C4221",
      border: "#F0D5C8",
    },
    cssVars: {
      "--theme-bg": "#FDF0E8",
      "--theme-bg-2": "#F9E4D7",
      "--theme-surface": "#FFFFFF",
      "--theme-border": "#F0D5C8",
      "--theme-text": "#2D1206",
      "--theme-text-2": "#7A3E28",
      "--theme-accent": "#9C4221",
      "--theme-accent-fg": "#FDF0E8",
      "--theme-accent-2": "#C05A2E",
      "--theme-card-shadow": "0 3px 12px rgba(156,66,33,0.12)",
      "--theme-radius": "24px",
      "--theme-radius-lg": "32px",
      "--theme-font-weight-display": "800",
    },
  },
};

export function getThemeCssString(themeId: ThemeId): string {
  const theme = THEMES[themeId];
  if (!theme) return "";
  return Object.entries(theme.cssVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");
}

export function getTheme(themeId: string): ThemeDefinition {
  return THEMES[themeId as ThemeId] ?? THEMES.NORDIC_MINIMAL;
}

export const THEME_LIST = Object.values(THEMES);
