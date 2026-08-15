'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CafePublic, Category, MenuItem, CartItem, CoffeeProfile, SelectedModifier } from '@/types';
import { getThemeCssString, getTheme } from '@/lib/themes';
import { useParams, useRouter } from 'next/navigation';
import { 
  Coffee, ShoppingBag, Plus, Minus, X, ChevronDown, 
  Bell, Receipt, Droplets, CreditCard, Star, Check 
} from 'lucide-react';

// --- SVGs & Components ---

const CoffeeRadar = ({ profile }: { profile: CoffeeProfile }) => {
  const size = 200;
  const center = size / 2;
  const radius = 64;
  
  const axes = [
    { label: 'اسیدیته', value: profile.radar?.acidity ?? profile.acidity ?? 0 },
    { label: 'بادی', value: profile.radar?.body ?? profile.body ?? 0 },
    { label: 'شیرینی', value: profile.radar?.sweetness ?? profile.sweetness ?? 0 },
    { label: 'تلخی', value: profile.radar?.bitterness ?? profile.bitterness ?? 0 },
    { label: 'عطر', value: profile.radar?.aroma ?? profile.aroma ?? 0 },
  ];

  const getPoint = (value: number, angleIndex: number, max: number = 10) => {
    const angle = (Math.PI / 2) - (2 * Math.PI * angleIndex / 5);
    const r = (Math.min(Math.max(value, 0), max) / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center - r * Math.sin(angle)
    };
  };

  const points = axes.map((a, i) => {
    const p = getPoint(a.value, i);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-2" style={{ direction: 'ltr' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[2, 4, 6, 8, 10].map(level => {
          const bgPoints = axes.map((_, i) => {
            const p = getPoint(level, i, 10);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={level} points={bgPoints} fill="none" stroke="var(--theme-border)" strokeOpacity="0.8" strokeWidth="1" />;
        })}
        {axes.map((a, i) => {
          const p = getPoint(10, i, 10);
          const textP = getPoint(12.8, i, 10);
          return (
            <g key={a.label}>
              <line x1={center} y1={center} x2={p.x} y2={p.y} stroke="var(--theme-border)" strokeOpacity="0.8" strokeWidth="1" />
              <text 
                x={textP.x} 
                y={textP.y} 
                fill="var(--theme-text)" 
                fontSize="11" 
                fontWeight="700" 
                fontFamily="var(--font-persian)" 
                textAnchor="middle" 
                dominantBaseline="middle"
              >
                {a.label}
              </text>
            </g>
          );
        })}
        <polygon points={points} fill="var(--theme-accent)" fillOpacity="0.25" stroke="var(--theme-accent)" strokeWidth="2.5" />
        {axes.map((a, i) => {
          const p = getPoint(a.value, i);
          return <circle key={`c-${i}`} cx={p.x} cy={p.y} r="3.5" fill="var(--theme-accent)" />;
        })}
      </svg>
    </div>
  );
};

const FALLBACK_CAFES: Record<string, CafePublic> = {
  'roastery-collective': {
    id: 'cmsuloxwv00055su40cryzwit',
    name: 'روستری کالکتیو',
    slug: 'roastery-collective',
    description: 'یک فضای مینیمال و مدرن برای دوستداران قهوه تخصصی. از منشأ دان تا فنجان، هر مرحله با دقت انجام می‌شود.',
    address: 'تهران، خیابان ولیعصر، پلاک ۴۵۲',
    phoneNumber: '02188776655',
    latitude: 35.7219,
    longitude: 51.3347,
    businessType: 'SPECIALTY_CAFE',
    workflowMode: 'PAY_UPFRONT_BUZZER',
    themeId: 'NORDIC_MINIMAL',
    theme: 'NORDIC_MINIMAL',
    isOpenNow: true,
    isApproved: true,
    isActive: true,
    loyaltyProgram: true,
    stampsCount: 3,
    categories: [
      {
        id: 'cat-hot-coffee',
        name: 'قهوه تخصصی و بار گرم',
        displayOrder: 1,
        isActive: true,
        menuItems: [
          {
            id: 'item-espresso',
            title: 'اسپرسو تخصصی',
            name: 'اسپرسو تخصصی',
            description: 'سینگل اوریجین اتیوپی یرگاچف — عصاره‌گیری با پروفایل دمایی دقیق',
            price: 85000,
            discountPrice: null,
            isAvailable: true,
            displayOrder: 1,
            tags: ['تک‌خاستگاه', 'اسپشیالتی', 'شسته‌شده'],
            allergens: [],
            coffeeProfile: {
              origin: 'اتیوپی یرگاچف',
              altitude: '1900-2200 متر',
              process: 'شسته‌شده (Washed)',
              roastLevel: 'روشن (Light)',
              radar: { acidity: 9, body: 5, sweetness: 8, bitterness: 2, aroma: 10 },
              flavorNotes: ['یاس', 'ترنج', 'مرکبات', 'هلو']
            },
            modifierGroups: [
              {
                id: 'mod-espresso-beans',
                name: 'انتخاب دان قهوه',
                isRequired: true,
                minSelection: 1,
                maxSelection: 1,
                options: [
                  { id: 'opt-ethiopia', name: 'اتیوپی یرگاچف (تک‌خاستگاه)', priceDelta: 0, isDefault: true },
                  { id: 'opt-colombia', name: 'کلمبیا ال‌پارایزو (تخمیری)', priceDelta: 20000, isDefault: false }
                ]
              }
            ]
          },
          {
            id: 'item-v60',
            title: 'دم‌آوری دستی V60',
            name: 'دم‌آوری دستی V60',
            description: 'قهوه فیلتری دمی با شفافیت طعمی بی‌نظیر و نُت‌های میوه‌ای درخشان',
            price: 125000,
            discountPrice: null,
            isAvailable: true,
            displayOrder: 2,
            tags: ['فیلتری', 'کم‌چگال', 'پیچیده'],
            allergens: [],
            coffeeProfile: {
              origin: 'کنیا نیری',
              altitude: '1700-1900 متر',
              process: 'شسته‌شده دوگانه',
              roastLevel: 'فیلتر برشت (Light-Medium)',
              radar: { acidity: 9, body: 4, sweetness: 8, bitterness: 2, aroma: 9 },
              flavorNotes: ['توت‌فرنگی وحشی', 'گریپ‌فروت', 'عسل']
            },
            modifierGroups: []
          },
          {
            id: 'item-flatwhite',
            title: 'فلت وایت',
            name: 'فلت وایت',
            description: 'دابل ریسترتو با شیر بخار داده شده با میکروفوم ابریشمی',
            price: 110000,
            discountPrice: null,
            isAvailable: true,
            displayOrder: 3,
            tags: ['شیر قهوه', 'میکروفوم'],
            allergens: ['شیر'],
            coffeeProfile: null,
            modifierGroups: [
              {
                id: 'mod-milk-type',
                name: 'نوع شیر',
                isRequired: false,
                minSelection: 0,
                maxSelection: 1,
                options: [
                  { id: 'opt-regular-milk', name: 'شیر کامل پاستوریزه', priceDelta: 0, isDefault: true },
                  { id: 'opt-oat-milk', name: 'شیر جو دوسر (گیاهی)', priceDelta: 25000, isDefault: false }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'cat-cold-bar',
        name: 'بار سرد و نوشیدنی‌های خنک',
        displayOrder: 2,
        isActive: true,
        menuItems: [
          {
            id: 'item-coldbrew',
            title: 'کلد برو ۲۴ ساعته',
            name: 'کلد برو ۲۴ ساعته',
            description: 'دم‌آوری سرد ۲۴ ساعته از دان برازیل با نُت‌های شکلات تلخ و کارامل',
            price: 135000,
            discountPrice: 115000,
            isAvailable: true,
            displayOrder: 1,
            tags: ['سرد', 'کم‌اسید'],
            allergens: [],
            coffeeProfile: {
              origin: 'برازیل سرادو',
              altitude: '900-1200 متر',
              process: 'خشک (Natural)',
              roastLevel: 'میانه تیره',
              radar: { acidity: 3, body: 9, sweetness: 8, bitterness: 5, aroma: 7 },
              flavorNotes: ['شکلات شیری', 'کارامل', 'آجیل']
            },
            modifierGroups: []
          },
          {
            id: 'item-icedlatte',
            title: 'آیس لاته تخصصی',
            name: 'آیس لاته تخصصی',
            description: 'اسپرسو دابل روی یخ با شیر خنک ابریشمی',
            price: 115000,
            discountPrice: null,
            isAvailable: true,
            displayOrder: 2,
            tags: ['سرد', 'محبوب'],
            allergens: ['شیر'],
            coffeeProfile: null,
            modifierGroups: []
          }
        ]
      },
      {
        id: 'cat-bakery',
        name: 'شیرینی‌پزی و بیکری تازه',
        displayOrder: 3,
        isActive: true,
        menuItems: [
          {
            id: 'item-croissant',
            title: 'کروسان کره‌ای فرانسوی',
            name: 'کروسان کره‌ای فرانسوی',
            description: 'کروسان تازه‌پز با ۲۷ لایه خمیر کره‌ای طبیعی',
            price: 95000,
            discountPrice: null,
            isAvailable: true,
            displayOrder: 1,
            tags: ['تازه', 'صبحانه'],
            allergens: ['گلوتن', 'شیر'],
            coffeeProfile: null,
            modifierGroups: [
              {
                id: 'mod-filling',
                name: 'نوع فیلینگ',
                isRequired: false,
                minSelection: 0,
                maxSelection: 1,
                options: [
                  { id: 'opt-plain', name: 'ساده (کره طبیعی)', priceDelta: 0, isDefault: true },
                  { id: 'opt-nutella', name: 'نوتلا فندق', priceDelta: 20000, isDefault: false },
                  { id: 'opt-cheese', name: 'پنیر خامه‌ای و اسفناج', priceDelta: 25000, isDefault: false }
                ]
              }
            ]
          },
          {
            id: 'item-cheesecake',
            title: 'چیزکیک نیویورکی',
            name: 'چیزکیک نیویورکی',
            description: 'چیزکیک تنوری کلاسیک با کراست بیسکوییت کره‌ای و سس توت‌فرنگی تازه',
            price: 145000,
            discountPrice: null,
            isAvailable: true,
            displayOrder: 2,
            tags: ['شیرین', 'محبوب'],
            allergens: ['شیر', 'گلوتن', 'تخم‌مرغ'],
            coffeeProfile: null,
            modifierGroups: []
          }
        ]
      }
    ]
  },
  'noir-social-club': {
    id: 'cmsuloxx200065su486rbxpb5',
    name: 'نوآر سوشال کلاب',
    slug: 'noir-social-club',
    description: 'بار تخصصی قهوه شبانه با فضای دارک و آتمسفر خاص. محیطی ایده‌آل برای جلسات خلاقانه و ملاقات‌های شبانه.',
    address: 'تهران، الهیه، خیابان فرشته، کوچه سوم',
    phoneNumber: '02122345678',
    latitude: 35.7891,
    longitude: 51.4156,
    businessType: 'CAFE_BAR',
    workflowMode: 'TABLE_TAB_SPLIT',
    themeId: 'OLED_CARBON',
    theme: 'OLED_CARBON',
    isOpenNow: true,
    isApproved: true,
    isActive: true,
    loyaltyProgram: true,
    stampsCount: 2,
    categories: [
      {
        id: 'cat-noir-signature',
        name: 'نوشیدنی‌های ویژه نوآر',
        displayOrder: 1,
        isActive: true,
        menuItems: [
          {
            id: 'item-noir-espresso',
            title: 'اسپرسو دارک بلِند',
            name: 'اسپرسو دارک بلِند',
            description: 'بلند اختصاصی نوآر با بادی سنگین و کرمای فندقی ضخیم',
            price: 90000,
            discountPrice: null,
            isAvailable: true,
            displayOrder: 1,
            tags: ['دارک', 'پرکافئین'],
            allergens: [],
            coffeeProfile: {
              origin: 'گوآتمالا و سومطره',
              altitude: '1500-1800 متر',
              process: 'ترکیبی',
              roastLevel: 'دارک (Dark)',
              radar: { acidity: 2, body: 10, sweetness: 6, bitterness: 8, aroma: 8 },
              flavorNotes: ['کاکائو تلخ', 'تنباکوی شیرین', 'ادویه گرم']
            },
            modifierGroups: []
          },
          {
            id: 'item-noir-affogato',
            title: 'آفوگاتو نوآر',
            name: 'آفوگاتو نوآر',
            description: 'اسپرسو داغ تازه روی جلاتوی وانیل ماداگاسکار با تراشه‌های شکلات دست‌ساز',
            price: 130000,
            discountPrice: null,
            isAvailable: true,
            displayOrder: 2,
            tags: ['دسر قهوه', 'ویژه'],
            allergens: ['شیر'],
            coffeeProfile: null,
            modifierGroups: []
          }
        ]
      }
    ]
  }
} as unknown as Record<string, CafePublic>;

// --- Main Page Component ---

export default function CafeMenuPage({ params }: { params?: Promise<{ cafeSlug: string }> }) {
  const router = useRouter();
  const routerParams = useParams();
  const routeSlug = (routerParams?.cafeSlug as string) || '';
  const initialSlug = routeSlug || 'roastery-collective';
  
  const [cafeSlug, setCafeSlug] = useState<string>(initialSlug);
  const [cafe, setCafe] = useState<CafePublic | null>(FALLBACK_CAFES[initialSlug] || FALLBACK_CAFES['roastery-collective']);
  const [theUsual, setTheUsual] = useState<MenuItem[]>(
    (FALLBACK_CAFES[initialSlug]?.categories?.[0]?.menuItems?.slice(0, 3) as MenuItem[]) || []
  );
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(
    FALLBACK_CAFES[initialSlug]?.categories?.[0]?.id || ''
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Drawer & Modals state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [drawerQuantity, setDrawerQuantity] = useState(1);
  const [drawerModifiers, setDrawerModifiers] = useState<SelectedModifier[]>([]);
  const [tableHubOpen, setTableHubOpen] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState<{ isOpen: boolean; type: string; orderCode?: string }>({ isOpen: false, type: '' });

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Parse params
  useEffect(() => {
    if (!params) return;
    let active = true;
    params.then((p) => {
      if (active && p?.cafeSlug && p.cafeSlug !== cafeSlug) {
        setCafeSlug(p.cafeSlug);
        const fallback = FALLBACK_CAFES[p.cafeSlug];
        if (fallback) {
          setCafe(fallback);
          if (fallback.categories && fallback.categories[0]) {
            setActiveCategory(fallback.categories[0].id);
          }
        }
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [params, cafeSlug]);

  // Fetch Live Data in background
  useEffect(() => {
    const slugToFetch = cafeSlug || 'roastery-collective';
    let isMounted = true;
    const loadData = async () => {
      try {
        const [cafeRes, usualRes] = await Promise.all([
          fetch(`/api/menu/${slugToFetch}`),
          fetch(`/api/the-usual/${slugToFetch}`)
        ]);
        
        if (cafeRes.ok) {
          const raw = await cafeRes.json();
          const cafeData = raw.data || raw;
          if (isMounted && cafeData && (cafeData.categories?.length || cafeData.name)) {
            setCafe(cafeData);
            if (cafeData.categories && cafeData.categories.length > 0 && !activeCategory) {
              setActiveCategory(cafeData.categories[0].id);
            }
          }
        }
        if (usualRes.ok) {
          const usualRaw = await usualRes.json();
          const usualData = usualRaw.data || usualRaw;
          if (isMounted && Array.isArray(usualData) && usualData.length > 0) {
            setTheUsual(usualData.slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Background sync note:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [cafeSlug]);

  // Scroll Spy setup
  useEffect(() => {
    if (!cafe?.categories) return;

    observerRef.current = new IntersectionObserver((entries) => {
      // Find the first intersecting entry
      const visible = entries.find(entry => entry.isIntersecting);
      if (visible) {
        setActiveCategory(visible.target.id);
      }
    }, {
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0.1
    });

    Object.values(categoryRefs.current).forEach(ref => {
      if (ref) observerRef.current?.observe(ref);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [cafe?.categories]);

  const scrollToCategory = (categoryId: string) => {
    const el = categoryRefs.current[categoryId];
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 120,
        behavior: 'smooth'
      });
      setActiveCategory(categoryId);
    }
  };

  const addToCart = useCallback((item: MenuItem, qty: number, modifiers: SelectedModifier[] = []) => {
    if (cafe?.workflowMode === 'VIEW_ONLY') return;
    
    setCart(prev => {
      const modifierKey = modifiers.map(m => m.id).sort().join('-');
      const cartItemId = `${item.id}-${modifierKey}-${prev.length + 1}`;
      const cartItem: CartItem = {
        id: cartItemId,
        menuItemId: item.id,
        title: item.title || item.name || '',
        name: item.title || item.name || '',
        price: item.discountPrice || item.discountedPrice || item.price,
        quantity: qty,
        selectedModifiers: modifiers,
        modifiers,
      };
      return [...prev, cartItem];
    });
    setSelectedItem(null);
    setDrawerQuantity(1);
    setDrawerModifiers([]);
  }, [cafe?.workflowMode]);

  const openDrawer = (item: MenuItem) => {
    setSelectedItem(item);
    setDrawerQuantity(1);
    setDrawerModifiers([]);
  };

  const closeDrawer = () => {
    setSelectedItem(null);
    setDrawerQuantity(1);
    setDrawerModifiers([]);
  };

  const handleTableService = async (type: string) => {
    if (!cafe) return;
    try {
      const typeMapping: Record<string, string> = {
        WAITER: 'CALL_WAITER',
        BILL: 'REQUEST_BILL',
        WATER: 'REQUEST_WATER',
        POS: 'REQUEST_POS',
        CALL_WAITER: 'CALL_WAITER',
        REQUEST_BILL: 'REQUEST_BILL',
        REQUEST_WATER: 'REQUEST_WATER',
        REQUEST_POS: 'REQUEST_POS',
      };
      const requestType = typeMapping[type] || 'CALL_WAITER';
      const defaultTable = (cafe as CafePublic & { tables?: Array<{ id: string; tableNumber: string }> }).tables?.[0];

      await fetch('/api/table-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: cafe.id,
          tableId: defaultTable?.id || 'sample-table-id',
          tableNumber: defaultTable?.tableNumber || '۱',
          requestType,
        }),
      });
      setTableHubOpen(false);
      alert('درخواست شما با موفقیت برای پرسنل ارسال شد.');
    } catch (err) {
      console.error(err);
      alert('خطا در ثبت درخواست');
    }
  };

  const handleCheckout = async () => {
    if (!cafe || cart.length === 0) return;
    try {
      // ── Detect fake fallback IDs and remap to real DB IDs ──────────────────
      const hasFakeIds = cart.some(c =>
        c.menuItemId?.startsWith('item-') ||
        c.menuItemId?.startsWith('cat-') ||
        !c.menuItemId
      );

      let activeCart = cart;
      let activeCafe = cafe;

      if (hasFakeIds) {
        // Refresh real cafe data
        const menuRes = await fetch(`/api/menu/${cafeSlug}`);
        if (menuRes.ok) {
          const menuRaw = await menuRes.json();
          const freshCafe = menuRaw.data || menuRaw;
          if (freshCafe?.categories) {
            activeCafe = freshCafe;
            setCafe(freshCafe);
            const allRealItems: MenuItem[] = freshCafe.categories.flatMap(
              (cat: { menuItems?: MenuItem[]; items?: MenuItem[] }) =>
                cat.menuItems || cat.items || []
            );
            // Remap by title match
            activeCart = cart.map(cartItem => {
              const realItem = allRealItems.find(
                ri => (ri.title || ri.name) === (cartItem.title || cartItem.name)
              );
              return realItem ? { ...cartItem, menuItemId: realItem.id } : cartItem;
            });
          }
        }
      }

      const items = activeCart.map(c => ({
        menuItemId: c.menuItemId,
        quantity: c.quantity,
        selectedModifiers: (c.selectedModifiers || c.modifiers || []).map(m => ({
          id: m.id,
          name: m.name,
          priceDelta: m.priceDelta ?? 0,
        })),
        itemNotes: c.itemNotes || '',
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: activeCafe.id,
          paymentMode: activeCafe.workflowMode,
          items,
        })
      });
      const data = await res.json();
      if (!data.success && !data.data) {
        alert(data.error || 'خطا در ثبت سفارش');
        return;
      }
      const order = data.data || data;

      if (activeCafe.workflowMode === 'PAY_UPFRONT_BUZZER') {
        router.push(`/mock-payment?orderId=${order.id}`);
      } else if (activeCafe.workflowMode === 'PAY_AT_COUNTER') {
        setCheckoutModal({ isOpen: true, type: 'PAY_AT_COUNTER', orderCode: order.orderCode || order.code || 'C-142' });
        setCart([]);
      } else if (activeCafe.workflowMode === 'TABLE_TAB_SPLIT') {
        setCheckoutModal({ isOpen: true, type: 'TABLE_TAB_SPLIT' });
        setCart([]);
      }
    } catch (err) {
      console.error(err);
      alert('خطا در ثبت سفارش');
    }
  };

  // Calculations
  const cartTotal = cart.reduce((total, item) => {
    const mods = item.modifiers || item.selectedModifiers || [];
    const modsTotal = mods.reduce((mt: number, mod: SelectedModifier & { price?: number }) => mt + (mod.price || mod.priceDelta || 0), 0);
    return total + ((item.price + modsTotal) * item.quantity);
  }, 0);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  if (loading) {
    return <div className="flex h-screen items-center justify-center rtl"><div className="animate-pulse">در حال بارگذاری...</div></div>;
  }

  if (!cafe) {
    return <div className="flex h-screen items-center justify-center rtl">کافه پیدا نشد</div>;
  }

  // Inject Theme styles
  const activeTheme = getTheme(cafe.themeId || cafe.theme || 'NORDIC_MINIMAL');
  const themeCss = getThemeCssString ? getThemeCssString(cafe.themeId || cafe.theme || 'NORDIC_MINIMAL') : '';

  return (
    <div 
      className="cm-root-wrapper" 
      style={{ 
        direction: 'rtl',
        backgroundColor: activeTheme.preview.bg,
        color: activeTheme.preview.text,
        minHeight: '100vh',
        ...(activeTheme.cssVars as React.CSSProperties),
      }}
    >
      {themeCss && <style dangerouslySetInnerHTML={{ __html: `.cm-root-wrapper { ${themeCss} }` }} />}
      
      {/* Self-contained Scoped CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .cm-root-wrapper {
          font-family: var(--font-persian), 'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif;
          min-height: 100vh;
          background: var(--theme-bg);
          color: var(--theme-text);
          direction: rtl;
        }
        .cm-container {
          max-width: 600px;
          margin: 0 auto;
          min-height: 100vh;
          padding-bottom: 120px;
          position: relative;
          background: var(--theme-bg);
        }
        @media (min-width: 640px) {
          .cm-container {
            border-left: 1px solid var(--theme-border);
            border-right: 1px solid var(--theme-border);
            box-shadow: var(--theme-card-shadow-lg, 0 0 50px rgba(0,0,0,0.08));
          }
        }
        .cm-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--theme-surface);
          border-bottom: 1px solid var(--theme-border);
          box-shadow: var(--theme-card-shadow);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .cm-header-top {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px 10px;
        }
        .cm-cafe-logo {
          width: 46px;
          height: 46px;
          border-radius: var(--theme-radius-lg, 14px);
          background: var(--theme-accent);
          color: var(--theme-accent-fg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-weight: 800;
          overflow: hidden;
          box-shadow: var(--theme-card-shadow);
        }
        .cm-cafe-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cm-cafe-name {
          font-size: 1.2rem;
          font-weight: var(--theme-font-weight-display, 800);
          margin: 0;
          color: var(--theme-text);
          letter-spacing: -0.02em;
        }
        .cm-cafe-desc {
          font-size: 0.78rem;
          color: var(--theme-text-2);
          margin-top: 3px;
          line-height: 1.45;
          opacity: 0.9;
        }
        .cm-tabs-scroll {
          display: flex;
          overflow-x: auto;
          gap: 8px;
          padding: 8px 16px 12px;
          border-top: 1px solid var(--theme-border);
          scrollbar-width: none;
        }
        .cm-tabs-scroll::-webkit-scrollbar { display: none; }
        .cm-tab-btn {
          padding: 7px 16px;
          border-radius: var(--theme-radius-full, 999px);
          font-size: 0.8125rem;
          font-weight: 700;
          border: 1px solid var(--theme-border);
          background: var(--theme-bg-2);
          color: var(--theme-text-2);
          cursor: pointer;
          white-space: nowrap;
          transition: all 150ms ease;
          font-family: inherit;
        }
        .cm-tab-btn.active {
          background: var(--theme-accent);
          color: var(--theme-accent-fg);
          border-color: var(--theme-accent);
          box-shadow: var(--theme-card-shadow);
        }
        .cm-banner-viewonly {
          background: var(--theme-bg-2);
          color: var(--theme-text);
          text-align: center;
          padding: 8px;
          font-size: 0.8125rem;
          font-weight: 700;
          border-bottom: 1px solid var(--theme-border);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .cm-usual-hero {
          margin: 16px;
          border-radius: var(--theme-radius-lg, 16px);
          padding: 16px;
          background: linear-gradient(135deg, var(--theme-accent), var(--theme-accent-2));
          color: var(--theme-accent-fg);
          box-shadow: var(--theme-card-shadow);
        }
        .cm-usual-hero h2 {
          font-size: 1.05rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          color: var(--theme-accent-fg);
        }
        .cm-usual-scroll {
          display: flex;
          overflow-x: auto;
          gap: 12px;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .cm-usual-scroll::-webkit-scrollbar { display: none; }
        .cm-usual-card {
          min-width: 150px;
          background: color-mix(in srgb, var(--theme-accent-fg) 16%, transparent);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid color-mix(in srgb, var(--theme-accent-fg) 25%, transparent);
          border-radius: var(--theme-radius, 12px);
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .cm-usual-title {
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--theme-accent-fg);
        }
        .cm-usual-price {
          font-size: 0.75rem;
          opacity: 0.95;
          margin-top: 4px;
          color: var(--theme-accent-fg);
        }
        .cm-usual-btn {
          margin-top: 10px;
          background: var(--theme-surface);
          color: var(--theme-accent);
          border: none;
          border-radius: var(--theme-radius, 8px);
          padding: 6px 0;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
          box-shadow: var(--theme-card-shadow);
          transition: transform 120ms;
        }
        .cm-usual-btn:hover {
          transform: translateY(-1px);
        }
        .cm-loyalty-card {
          margin: 16px;
          border-radius: var(--theme-radius-lg, 16px);
          padding: 16px;
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          box-shadow: var(--theme-card-shadow);
        }
        .cm-loyalty-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cm-loyalty-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--theme-text);
        }
        .cm-loyalty-badge {
          font-size: 0.75rem;
          background: var(--theme-accent);
          color: var(--theme-accent-fg);
          padding: 3px 10px;
          border-radius: var(--theme-radius-full, 999px);
          font-weight: 700;
        }
        .cm-stamps-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 14px;
        }
        .cm-stamp-item {
          width: 44px;
          height: 44px;
          border-radius: var(--theme-radius-full, 50%);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--theme-bg-2);
          border: 2px dashed var(--theme-border);
          color: var(--theme-text-2);
          transition: all 150ms ease;
        }
        .cm-stamp-item.active {
          background: var(--theme-accent);
          color: var(--theme-accent-fg);
          border-style: solid;
          border-color: var(--theme-accent);
          box-shadow: 0 0 12px var(--theme-accent-glow, rgba(139, 94, 60, 0.35));
        }
        .cm-category-block {
          margin: 24px 16px 8px;
          content-visibility: auto;
          contain-intrinsic-block-size: auto calc(96px * 4 + 60px);
        }
        .cm-cat-title {
          font-size: 1.15rem;
          font-weight: var(--theme-font-weight-display, 800);
          margin-bottom: 14px;
          border-right: 4px solid var(--theme-accent);
          padding-right: 10px;
          color: var(--theme-text);
        }
        .cm-item-card {
          display: flex;
          gap: 12px;
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: var(--theme-radius-lg, 16px);
          padding: 12px;
          margin-bottom: 12px;
          box-shadow: var(--theme-card-shadow);
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }
        .cm-item-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--theme-card-shadow-hover, var(--theme-card-shadow));
        }
        @media (prefers-reduced-motion: reduce) {
          .cm-item-card, .cm-tab-btn, .cm-usual-btn, .cm-stamp-item, .cm-table-fab {
            transition: none !important;
          }
        }
        .cm-item-thumb {
          width: 84px;
          height: 84px;
          border-radius: var(--theme-radius, 12px);
          background: var(--theme-bg-2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          color: var(--theme-text-2);
          position: relative;
        }
        .cm-item-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cm-item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .cm-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .cm-item-name {
          font-size: 0.9375rem;
          font-weight: 800;
          color: var(--theme-text);
          margin: 0;
        }
        .cm-item-desc {
          font-size: 0.75rem;
          color: var(--theme-text-2);
          line-height: 1.4;
          margin-top: 4px;
          opacity: 0.8;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .cm-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }
        .cm-item-price {
          font-size: 0.875rem;
          font-weight: 800;
          color: var(--theme-accent);
        }
        .cm-item-plus-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--theme-radius, 8px);
          background: var(--theme-accent);
          color: var(--theme-accent-fg);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity 120ms;
        }
        .cm-item-plus-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .cm-cart-bar {
          position: fixed;
          bottom: 16px;
          left: 16px;
          right: 16px;
          max-width: 548px;
          margin: 0 auto;
          z-index: 50;
          background: var(--theme-accent);
          color: var(--theme-accent-fg);
          border-radius: var(--theme-radius-lg, 16px);
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: var(--theme-card-shadow-lg, 0 8px 30px rgba(0,0,0,0.25));
          border: 1px solid var(--theme-border);
          cursor: pointer;
        }
        .cm-table-fab {
          position: fixed;
          bottom: 84px;
          right: 20px;
          z-index: 45;
          width: 52px;
          height: 52px;
          border-radius: var(--theme-radius-full, 50%);
          background: var(--theme-surface);
          color: var(--theme-text);
          border: 1px solid var(--theme-border);
          box-shadow: var(--theme-card-shadow);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 150ms;
        }
        .cm-table-hub-menu {
          position: absolute;
          bottom: 64px;
          right: 0;
          background: var(--theme-surface);
          border-radius: var(--theme-radius-lg, 16px);
          box-shadow: var(--theme-card-shadow-lg, 0 8px 24px rgba(0,0,0,0.18));
          padding: 8px;
          width: 190px;
          border: 1px solid var(--theme-border);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cm-table-hub-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: none;
          border: none;
          border-radius: var(--theme-radius, 10px);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--theme-text);
          cursor: pointer;
          font-family: inherit;
          text-align: right;
          width: 100%;
          transition: background 120ms;
        }
        .cm-table-hub-btn:hover {
          background: var(--theme-bg-2);
        }
        .cm-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 60;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .cm-drawer-sheet {
          background: var(--theme-surface);
          color: var(--theme-text);
          border-top-left-radius: var(--theme-radius-lg, 24px);
          border-top-right-radius: var(--theme-radius-lg, 24px);
          border-top: 1px solid var(--theme-border);
          width: 100%;
          max-width: 580px;
          max-height: 85vh;
          overflow-y: auto;
          padding: 20px 18px 30px;
          box-shadow: var(--theme-card-shadow-lg, 0 -8px 30px rgba(0,0,0,0.3));
        }
        .cm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 70;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .cm-modal-card {
          background: var(--theme-surface);
          color: var(--theme-text);
          border-radius: var(--theme-radius-lg, 24px);
          border: 1px solid var(--theme-border);
          padding: 24px;
          width: 100%;
          max-width: 380px;
          box-shadow: var(--theme-card-shadow-lg, 0 16px 40px rgba(0,0,0,0.25));
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}} />

      <div className="cm-container">
        
        {/* View Only Banner */}
        {cafe.workflowMode === 'VIEW_ONLY' && (
          <div className="cm-banner-viewonly">
            سفارش حضوری توسط سالن‌کار انجام می‌شود
          </div>
        )}

        {/* Header */}
        <header className="cm-header">
          <div className="cm-header-top">
            <div className="cm-cafe-logo">
              {cafe.logoUrl ? (
                <img src={cafe.logoUrl} alt={cafe.name} />
              ) : (
                <Coffee size={22} />
              )}
            </div>
            <div className="cm-cafe-info">
              <h1 className="cm-cafe-name">{cafe.name}</h1>
              <p className="cm-cafe-desc">{cafe.description}</p>
            </div>
          </div>

          {/* Categories Tabs */}
          <div className="cm-tabs-scroll">
            {cafe.categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`cm-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </header>

        <main>
          {/* The Usual Widget */}
          {theUsual.length > 0 && (
            <section className="cm-usual-hero">
              <h2>
                <Star size={18} fill="currentColor" />
                همان همیشگی
              </h2>
              <div className="cm-usual-scroll">
                {theUsual.map((item) => (
                  <div key={item.id} className="cm-usual-card">
                    <div>
                      <div className="cm-usual-title">{item.title || item.name}</div>
                      <div className="cm-usual-price">{item.price.toLocaleString()} تومان</div>
                    </div>
                    <button 
                      onClick={() => addToCart(item, 1)}
                      disabled={cafe.workflowMode === 'VIEW_ONLY'}
                      className="cm-usual-btn"
                    >
                      افزودن سریع
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Loyalty Widget */}
          {cafe.loyaltyProgram && (
            <section className="cm-loyalty-card">
              <div className="cm-loyalty-header">
                <span className="cm-loyalty-title">کارت وفاداری دیجیتال</span>
                <span className="cm-loyalty-badge">
                  {cafe.stampsCount || 0} از ۶ مهر
                </span>
              </div>
              <div className="cm-stamps-row">
                {[1, 2, 3, 4, 5, 6].map((stamp) => (
                  <div 
                    key={stamp} 
                    className={`cm-stamp-item ${(cafe.stampsCount || 0) >= stamp ? 'active' : ''}`}
                  >
                    <Coffee size={18} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Menu Categories & Items */}
          {cafe.categories?.map((category: Category) => (
            <section 
              key={category.id} 
              id={category.id} 
              ref={(el) => { categoryRefs.current[category.id] = el as HTMLDivElement | null; }}
              className="cm-category-block"
            >
              <h2 className="cm-cat-title">
                {category.name}
              </h2>
              <div>
                {(category.menuItems || category.items || []).map((item: MenuItem) => (
                  <div 
                    key={item.id} 
                    className="cm-item-card"
                    onClick={() => item.isAvailable && openDrawer(item)}
                    style={{ opacity: !item.isAvailable ? 0.5 : 1 }}
                  >
                    <div className="cm-item-thumb">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title || item.name}
                          loading="lazy"
                          decoding="async"
                          width={84}
                          height={84}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      ) : (
                        <Coffee size={32} />
                      )}
                      {!item.isAvailable && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.7)', color: '#FFFFFF', backdropFilter: 'blur(2px)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, borderRadius: 'var(--theme-radius)' }}>
                          ناموجود
                        </div>
                      )}
                    </div>
                    
                    <div className="cm-item-details">
                      <div>
                        <div className="cm-item-header">
                          <h3 className="cm-item-name">{item.title || item.name}</h3>
                          {item.coffeeProfile && (
                            <span style={{ color: 'var(--theme-accent)' }} title="پروفایل طعمی">
                              <Star size={16} fill="currentColor" />
                            </span>
                          )}
                        </div>
                        <p className="cm-item-desc">{item.description}</p>
                      </div>
                      
                      <div className="cm-item-footer">
                        <div>
                          {(item.discountPrice || item.discountedPrice) ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '11px', textDecoration: 'line-through', opacity: 0.5 }}>{item.price.toLocaleString()}</span>
                              <span className="cm-item-price">{(item.discountPrice || item.discountedPrice)?.toLocaleString()} تومان</span>
                            </div>
                          ) : (
                            <span className="cm-item-price">{item.price.toLocaleString()} تومان</span>
                          )}
                        </div>
                        
                        <button 
                          disabled={cafe.workflowMode === 'VIEW_ONLY' || !item.isAvailable}
                          onClick={(e) => { e.stopPropagation(); if (item.isAvailable) addToCart(item, 1); }}
                          className="cm-item-plus-btn"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>

        {/* Cart Bottom Bar */}
        {cartCount > 0 && cafe.workflowMode !== 'VIEW_ONLY' && (
          <div className="cm-cart-bar" onClick={handleCheckout}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <ShoppingBag size={24} />
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--theme-surface)', color: 'var(--theme-accent)', width: '18px', height: '18px', borderRadius: 'var(--theme-radius-full, 50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, border: '1px solid var(--theme-border)' }}>
                  {cartCount}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', opacity: 0.85 }}>سبد خرید</span>
                <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>{cartTotal.toLocaleString()} تومان</span>
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.875rem', background: 'color-mix(in srgb, var(--theme-accent-fg) 20%, transparent)', color: 'var(--theme-accent-fg)', padding: '6px 14px', borderRadius: 'var(--theme-radius)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              تکمیل سفارش <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
            </div>
          </div>
        )}

        {/* Table Service Hub FAB */}
        <div style={{ position: 'fixed', bottom: '84px', right: '20px', zIndex: 45 }}>
          {tableHubOpen && (
            <div className="cm-table-hub-menu">
              <button onClick={() => handleTableService('WAITER')} className="cm-table-hub-btn">
                <Bell size={18} style={{ color: 'var(--color-amber, #D97706)' }} /> صدا زدن سالن‌کار
              </button>
              <button onClick={() => handleTableService('BILL')} className="cm-table-hub-btn">
                <Receipt size={18} style={{ color: 'var(--color-emerald, #059669)' }} /> درخواست صورتحساب
              </button>
              <button onClick={() => handleTableService('WATER')} className="cm-table-hub-btn">
                <Droplets size={18} style={{ color: 'var(--color-accent, #3B82F6)' }} /> درخواست آب خنک
              </button>
              <button onClick={() => handleTableService('POS')} className="cm-table-hub-btn">
                <CreditCard size={18} style={{ color: 'var(--theme-accent, #8B5E3C)' }} /> درخواست کارتخوان
              </button>
            </div>
          )}
          <button 
            onClick={() => setTableHubOpen(!tableHubOpen)}
            className="cm-table-fab"
            style={{ background: tableHubOpen ? 'var(--color-red, #EF4444)' : 'var(--theme-surface)', color: tableHubOpen ? '#FFFFFF' : 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
          >
            <Bell size={22} />
          </button>
        </div>

        {/* Item Detail Drawer */}
        {selectedItem && (
          <div className="cm-drawer-overlay" onClick={closeDrawer}>
            <div className="cm-drawer-sheet" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--theme-border)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>{selectedItem.title || selectedItem.name}</h3>
                <button onClick={closeDrawer} style={{ background: 'var(--theme-bg-2)', border: 'none', borderRadius: 'var(--theme-radius-full, 50%)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--theme-text)' }}>
                  <X size={18} />
                </button>
              </div>
              
              <div style={{ padding: '16px 0' }}>
                {selectedItem.imageUrl && (
                  <img src={selectedItem.imageUrl} alt={selectedItem.title || selectedItem.name} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--theme-radius)', marginBottom: '16px' }} />
                )}
                
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, opacity: 0.85, marginBottom: '16px' }}>{selectedItem.description}</p>
                
                {/* Coffee Profile Radar */}
                {selectedItem.coffeeProfile && (
                  <div style={{ background: 'var(--theme-bg-2)', borderRadius: 'var(--theme-radius-lg)', padding: '14px', marginBottom: '16px', border: '1px solid var(--theme-border)' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--theme-text)' }}>
                      <Coffee size={16} /> پروفایل طعمی و ویژگی‌ها
                    </h4>
                    <CoffeeRadar profile={selectedItem.coffeeProfile} />
                  </div>
                )}

                {/* Modifiers */}
                {selectedItem.modifierGroups?.map((group) => (
                  <div key={group.id} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--theme-text)' }}>{group.name}</h4>
                      {group.isRequired && <span style={{ fontSize: '11px', background: 'var(--theme-accent)', color: 'var(--theme-accent-fg)', padding: '2px 6px', borderRadius: 'var(--theme-radius-sm, 4px)', fontWeight: 700 }}>اجباری</span>}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {group.options.map((opt) => {
                        const isSelected = drawerModifiers.some((m) => m.id === opt.id);
                        return (
                          <label key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--theme-radius)', border: `1px solid ${isSelected ? 'var(--theme-accent)' : 'var(--theme-border)'}`, background: isSelected ? 'var(--theme-bg-2)' : 'transparent', cursor: 'pointer', color: 'var(--theme-text)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input 
                                type={group.maxSelection === 1 ? 'radio' : 'checkbox'}
                                name={group.id}
                                checked={isSelected}
                                onChange={() => {
                                  if (group.maxSelection === 1) {
                                    setDrawerModifiers((prev) => [...prev.filter((m) => !group.options.find((o) => o.id === m.id)), { id: opt.id, name: opt.name, priceDelta: opt.priceDelta }]);
                                  } else {
                                    if (isSelected) {
                                      setDrawerModifiers((prev) => prev.filter((m) => m.id !== opt.id));
                                    } else {
                                      if (!group.maxSelection || drawerModifiers.filter((m) => group.options.find((o) => o.id === m.id)).length < group.maxSelection) {
                                        setDrawerModifiers((prev) => [...prev, { id: opt.id, name: opt.name, priceDelta: opt.priceDelta }]);
                                      }
                                    }
                                  }
                                }}
                                style={{ accentColor: 'var(--theme-accent)' }}
                              />
                              <span style={{ fontSize: '0.875rem' }}>{opt.name}</span>
                            </div>
                            {opt.priceDelta > 0 && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>+{opt.priceDelta.toLocaleString()} تومان</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Quantity */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', padding: '12px 16px', background: 'var(--theme-bg-2)', borderRadius: 'var(--theme-radius)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--theme-text)' }}>تعداد</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--theme-surface)', padding: '4px 8px', borderRadius: 'var(--theme-radius-sm, 8px)', border: '1px solid var(--theme-border)' }}>
                    <button onClick={() => setDrawerQuantity(Math.max(1, drawerQuantity - 1))} style={{ background: 'none', border: 'none', color: 'var(--theme-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Minus size={18} />
                    </button>
                    <span style={{ fontWeight: 800, minWidth: '20px', textAlign: 'center', color: 'var(--theme-text)' }}>{drawerQuantity}</span>
                    <button onClick={() => setDrawerQuantity(drawerQuantity + 1)} style={{ background: 'none', border: 'none', color: 'var(--theme-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--theme-border)' }}>
                <button 
                  onClick={() => addToCart(selectedItem, drawerQuantity, drawerModifiers)}
                  disabled={cafe.workflowMode === 'VIEW_ONLY'}
                  style={{ width: '100%', background: 'var(--theme-accent)', color: 'var(--theme-accent-fg)', border: 'none', borderRadius: 'var(--theme-radius)', padding: '14px 18px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: 'var(--theme-card-shadow)' }}
                >
                  <span>افزودن به سبد سفارش</span>
                  <span>{((selectedItem.discountPrice || selectedItem.price) * drawerQuantity).toLocaleString()} تومان</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modals */}
        {checkoutModal.isOpen && (
          <div className="cm-modal-overlay" onClick={() => setCheckoutModal({ isOpen: false, type: '' })}>
            <div className="cm-modal-card" onClick={(e) => e.stopPropagation()}>
              {checkoutModal.type === 'PAY_AT_COUNTER' && (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: 'var(--theme-radius-full, 50%)', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <Check size={36} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '8px', color: 'var(--theme-text)' }}>سفارش ثبت شد</h3>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '16px', lineHeight: 1.5, color: 'var(--theme-text-2)' }}>برای پرداخت به صندوق مراجعه کنید و کد زیر را به باریستا اعلام فرمایید:</p>
                  <div style={{ background: 'var(--theme-bg-2)', width: '100%', padding: '16px 0', borderRadius: 'var(--theme-radius)', fontFamily: 'var(--font-mono, monospace)', fontSize: '1.875rem', fontWeight: 900, color: 'var(--theme-accent)', marginBottom: '20px', border: '2px dashed var(--theme-accent)', letterSpacing: '4px' }}>
                    {checkoutModal.orderCode}
                  </div>
                  <button onClick={() => setCheckoutModal({ isOpen: false, type: '' })} style={{ width: '100%', background: 'var(--theme-accent)', color: 'var(--theme-accent-fg)', border: 'none', padding: '12px 0', borderRadius: 'var(--theme-radius)', fontSize: '0.9375rem', fontWeight: 800, cursor: 'pointer', boxShadow: 'var(--theme-card-shadow)' }}>
                    متوجه شدم
                  </button>
                </>
              )}

              {checkoutModal.type === 'TABLE_TAB_SPLIT' && (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: 'var(--theme-radius-full, 50%)', background: 'rgba(37, 99, 235, 0.15)', color: '#3B82F6', border: '1px solid rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <Receipt size={36} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '8px', color: 'var(--theme-text)' }}>افزوده شد به صورتحساب میز</h3>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '20px', lineHeight: 1.5, color: 'var(--theme-text-2)' }}>سفارش شما با موفقیت ثبت شد و به تب باز میز اضافه گردید.</p>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => setCheckoutModal({ isOpen: false, type: '' })} style={{ width: '100%', background: 'var(--theme-bg-2)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)', padding: '12px 0', borderRadius: 'var(--theme-radius)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
                      مشاهده منو
                    </button>
                    <button onClick={() => { alert('رفتن به صفحه پرداخت سهم من'); setCheckoutModal({ isOpen: false, type: '' }); }} style={{ width: '100%', background: 'var(--theme-accent)', color: 'var(--theme-accent-fg)', border: 'none', padding: '12px 0', borderRadius: 'var(--theme-radius)', fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer', boxShadow: 'var(--theme-card-shadow)' }}>
                      پرداخت سهم من الان
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
