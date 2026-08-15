'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { CafePublic, Category, MenuItem, CartItem, CoffeeProfile, SelectedModifier } from '@/types';
import { getThemeCssString } from '@/lib/themes';
import { useParams } from 'next/navigation';
import { 
  Coffee, ShoppingBag, Plus, Minus, X, ChevronDown, ChevronUp, 
  Bell, Receipt, Droplets, CreditCard, Star, AlertTriangle, Info, Check 
} from 'lucide-react';

// --- SVGs & Components ---

const CoffeeRadar = ({ profile }: { profile: CoffeeProfile }) => {
  const size = 160;
  const center = size / 2;
  const radius = size * 0.4;
  
  const axes = [
    { label: 'اسیدیته', value: profile.radar?.acidity || profile.acidity || 0 },
    { label: 'بادی', value: profile.radar?.body || profile.body || 0 },
    { label: 'شیرینی', value: profile.radar?.sweetness || profile.sweetness || 0 },
    { label: 'تلخی', value: profile.radar?.bitterness || profile.bitterness || 0 },
    { label: 'عطر', value: profile.radar?.aroma || profile.aroma || 0 },
  ];

  const getPoint = (value: number, angleIndex: number, max: number = 10) => {
    const angle = (Math.PI / 2) - (2 * Math.PI * angleIndex / 5);
    const r = (value / max) * radius;
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
    <div className="flex flex-col items-center justify-center p-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[2, 4, 6, 8, 10].map(level => {
          const bgPoints = axes.map((_, i) => {
            const p = getPoint(level, i, 10);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={level} points={bgPoints} fill="none" stroke="var(--theme-text)" strokeOpacity="0.1" />;
        })}
        {axes.map((a, i) => {
          const p = getPoint(10, i, 10);
          const textP = getPoint(11.5, i, 10);
          return (
            <g key={a.label}>
              <line x1={center} y1={center} x2={p.x} y2={p.y} stroke="var(--theme-text)" strokeOpacity="0.1" />
              <text x={textP.x} y={textP.y} fill="var(--theme-text)" fontSize="10" textAnchor="middle" dominantBaseline="middle">
                {a.label}
              </text>
            </g>
          );
        })}
        <polygon points={points} fill="var(--theme-accent)" fillOpacity="0.3" stroke="var(--theme-accent)" strokeWidth="2" />
        {axes.map((a, i) => {
          const p = getPoint(a.value, i);
          return <circle key={`c-${i}`} cx={p.x} cy={p.y} r="3" fill="var(--theme-accent)" />;
        })}
      </svg>
    </div>
  );
};

const FALLBACK_CAFES: Record<string, any> = {
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
};

// --- Main Page Component ---

export default function CafeMenuPage({ params }: { params?: Promise<{ cafeSlug: string }> }) {
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
    if (routeSlug) {
      setCafeSlug(routeSlug);
      if (FALLBACK_CAFES[routeSlug]) {
        setCafe(FALLBACK_CAFES[routeSlug]);
        if (FALLBACK_CAFES[routeSlug].categories?.[0]) {
          setActiveCategory(FALLBACK_CAFES[routeSlug].categories[0].id);
        }
      }
    } else if (params) {
      params.then((p) => {
        if (p?.cafeSlug) {
          setCafeSlug(p.cafeSlug);
          if (FALLBACK_CAFES[p.cafeSlug]) {
            setCafe(FALLBACK_CAFES[p.cafeSlug]);
          }
        }
      }).catch(() => {});
    }
  }, [routeSlug, params]);

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
        top: el.offsetTop - 80,
        behavior: 'smooth'
      });
      setActiveCategory(categoryId);
    }
  };

  const addToCart = (item: MenuItem, qty: number, modifiers: SelectedModifier[] = []) => {
    if (cafe?.workflowMode === 'VIEW_ONLY') return;
    
    const cartItem: CartItem = {
      id: Math.random().toString(36).substring(7),
      menuItemId: item.id,
      title: item.title || item.name || '',
      name: item.title || item.name || '',
      price: item.discountPrice || item.discountedPrice || item.price,
      quantity: qty,
      selectedModifiers: modifiers,
      modifiers,
    };
    setCart(prev => [...prev, cartItem]);
    closeDrawer();
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(c => c.id !== cartItemId));
  };

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
      const defaultTable = (cafe as any).tables?.[0];

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
      const items = cart.map(c => ({
        menuItemId: c.menuItemId,
        quantity: c.quantity,
        selectedModifiers: (c.selectedModifiers || c.modifiers || []).map(m => ({
          id: m.id,
          name: m.name,
          priceDelta: m.priceDelta ?? (m as any).price ?? 0,
        })),
        itemNotes: c.itemNotes || '',
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: cafe.id,
          paymentMode: cafe.workflowMode,
          items,
        })
      });
      const data = await res.json();
      if (!data.success && !data.data) {
        alert(data.error || 'خطا در ثبت سفارش');
        return;
      }
      const order = data.data || data;

      if (cafe.workflowMode === 'PAY_UPFRONT_BUZZER') {
        window.location.href = `/mock-payment?orderId=${order.id}`;
      } else if (cafe.workflowMode === 'PAY_AT_COUNTER') {
        setCheckoutModal({ isOpen: true, type: 'PAY_AT_COUNTER', orderCode: order.orderCode || order.code || 'C-142' });
        setCart([]);
      } else if (cafe.workflowMode === 'TABLE_TAB_SPLIT') {
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
    const modsTotal = mods.reduce((mt: number, mod: any) => mt + (mod.price || mod.priceDelta || 0), 0);
    return total + ((item.price + modsTotal) * item.quantity);
  }, 0);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  if (loading) {
    return <div className="flex h-screen items-center justify-center rtl"><div className="animate-pulse">در حال بارگذاری...</div></div>;
  }

  if (!cafe) {
    return <div className="flex h-screen items-center justify-center rtl">کافه پیدا نشد</div>;
  }

  // Inject Theme styles via <style>
  const themeCss = getThemeCssString ? getThemeCssString(cafe.themeId || cafe.theme || 'NORDIC_MINIMAL') : '';

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] font-sans rtl" style={{ direction: 'rtl' }}>
      {themeCss && <style dangerouslySetInnerHTML={{ __html: `:root { ${themeCss} }` }} />}
      
      {/* View Only Banner */}
      {cafe.workflowMode === 'VIEW_ONLY' && (
        <div className="bg-yellow-100 text-yellow-800 text-center py-2 text-sm sticky top-0 z-50 shadow-sm font-medium">
          سفارش حضوری توسط سالنکار
        </div>
      )}

      {/* Header */}
      <header className="bg-[var(--theme-surface)] shadow-sm sticky top-0 z-40 transition-all">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {cafe.logoUrl ? (
              <img src={cafe.logoUrl} alt={cafe.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--theme-accent)] text-white flex items-center justify-center">
                <Coffee size={20} />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg">{cafe.name}</h1>
              <p className="text-xs opacity-70">{cafe.description}</p>
            </div>
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar border-t border-[var(--theme-text)] border-opacity-10">
          {cafe.categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeCategory === cat.id 
                  ? 'border-[var(--theme-accent)] text-[var(--theme-accent)]' 
                  : 'border-transparent opacity-70'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      <main className="pb-32 px-4 pt-4 space-y-8">
        
        {/* The Usual Widget */}
        {theUsual.length > 0 && (
          <section className="rounded-2xl p-4 bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-md">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Star size={18} fill="currentColor" />
              همان همیشگی
            </h2>
            <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
              {theUsual.map(item => (
                <div key={item.id} className="min-w-[140px] bg-white/20 rounded-xl p-3 backdrop-blur-sm border border-white/30 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm truncate">{item.title || item.name}</h3>
                    <p className="text-xs opacity-90 mt-1">{item.price.toLocaleString()} تومان</p>
                  </div>
                  <button 
                    onClick={() => addToCart(item, 1)}
                    disabled={cafe.workflowMode === 'VIEW_ONLY'}
                    className="mt-3 bg-white text-orange-600 rounded-lg py-1.5 text-xs font-bold shadow-sm hover:bg-orange-50 disabled:opacity-50"
                  >
                    افزودن
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Loyalty Widget */}
        {cafe.loyaltyProgram && (
          <section className="bg-[var(--theme-surface)] rounded-2xl p-4 shadow-sm border border-[var(--theme-text)] border-opacity-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">کارت وفاداری</h3>
              <span className="text-xs bg-[var(--theme-accent)] text-white px-2 py-0.5 rounded-full">
                {cafe.stampsCount || 0} / 6
              </span>
            </div>
            <div className="flex justify-between">
              {[1,2,3,4,5,6].map(stamp => (
                <div key={stamp} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  (cafe.stampsCount || 0) >= stamp 
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)] text-white' 
                    : 'border-dashed border-gray-300 text-gray-300'
                }`}>
                  <Coffee size={18} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Menu Categories */}
        {cafe.categories?.map((category: Category) => (
          <section 
            key={category.id} 
            id={category.id} 
            ref={(el) => { categoryRefs.current[category.id] = el as HTMLDivElement | null; }}
            className="scroll-mt-24 space-y-4"
          >
            <h2 className="font-bold text-xl mb-4 border-r-4 border-[var(--theme-accent)] pr-3">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(category.menuItems || category.items || []).map((item: MenuItem) => (
                <div 
                  key={item.id} 
                  className={`bg-[var(--theme-surface)] rounded-2xl p-3 flex gap-4 shadow-sm border border-[var(--theme-text)] border-opacity-5 cursor-pointer hover:shadow-md transition-shadow ${
                    !item.isAvailable ? 'opacity-50 grayscale' : ''
                  }`}
                  onClick={() => item.isAvailable && openDrawer(item)}
                >
                  <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0 relative overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title || item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Coffee size={32} />
                      </div>
                    )}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                        ناموجود
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm line-clamp-1">{item.title || item.name}</h3>
                        {item.coffeeProfile && (
                          <span className="text-[var(--theme-accent)]" title="پروفایل قهوه">
                            <Star size={16} fill="currentColor" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-70 line-clamp-2 mt-1 min-h-[32px]">{item.description}</p>
                    </div>
                    
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex flex-col">
                        {(item.discountPrice || item.discountedPrice) ? (
                          <>
                            <span className="text-xs line-through opacity-50">{item.price.toLocaleString()}</span>
                            <span className="font-bold text-[var(--theme-accent)]">{(item.discountPrice || item.discountedPrice)?.toLocaleString()} تومان</span>
                          </>
                        ) : (
                          <span className="font-bold">{item.price.toLocaleString()} تومان</span>
                        )}
                      </div>
                      
                      <button 
                        disabled={cafe.workflowMode === 'VIEW_ONLY' || !item.isAvailable}
                        onClick={(e) => { e.stopPropagation(); if (item.isAvailable) addToCart(item, 1); }}
                        className="bg-[var(--theme-accent)] text-white p-1.5 rounded-lg disabled:opacity-50"
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/20 to-transparent z-40 pointer-events-none">
          <div className="bg-[var(--theme-accent)] text-white rounded-2xl p-4 shadow-xl flex items-center justify-between pointer-events-auto cursor-pointer" onClick={handleCheckout}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag size={24} />
                <span className="absolute -top-2 -right-2 bg-white text-[var(--theme-accent)] w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs opacity-80">سبد خرید</span>
                <span className="font-bold">{cartTotal.toLocaleString()} تومان</span>
              </div>
            </div>
            <div className="font-bold text-sm bg-black/20 px-4 py-2 rounded-xl flex items-center gap-2">
              تکمیل سفارش <ChevronDown size={16} className="rotate-90" />
            </div>
          </div>
        </div>
      )}

      {/* Table Service Hub FAB */}
      <div className="fixed bottom-24 right-4 z-40">
        {tableHubOpen && (
          <div className="absolute bottom-16 right-0 bg-[var(--theme-surface)] rounded-2xl shadow-xl p-2 w-48 border border-[var(--theme-text)] border-opacity-10 flex flex-col gap-1 origin-bottom-right animate-in zoom-in-95">
            <button onClick={() => handleTableService('WAITER')} className="flex items-center gap-3 p-3 hover:bg-[var(--theme-text)] hover:bg-opacity-5 rounded-xl text-sm font-medium transition-colors">
              <Bell size={18} className="text-amber-500" /> صدا زدن گارسون
            </button>
            <button onClick={() => handleTableService('BILL')} className="flex items-center gap-3 p-3 hover:bg-[var(--theme-text)] hover:bg-opacity-5 rounded-xl text-sm font-medium transition-colors">
              <Receipt size={18} className="text-emerald-500" /> درخواست صورتحساب
            </button>
            <button onClick={() => handleTableService('WATER')} className="flex items-center gap-3 p-3 hover:bg-[var(--theme-text)] hover:bg-opacity-5 rounded-xl text-sm font-medium transition-colors">
              <Droplets size={18} className="text-blue-500" /> درخواست آب
            </button>
            <button onClick={() => handleTableService('POS')} className="flex items-center gap-3 p-3 hover:bg-[var(--theme-text)] hover:bg-opacity-5 rounded-xl text-sm font-medium transition-colors">
              <CreditCard size={18} className="text-purple-500" /> درخواست کارتخوان
            </button>
          </div>
        )}
        <button 
          onClick={() => setTableHubOpen(!tableHubOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform ${tableHubOpen ? 'bg-red-500 rotate-45 text-white' : 'bg-[var(--theme-surface)] text-[var(--theme-text)] border border-[var(--theme-text)] border-opacity-10 hover:scale-105'}`}
        >
          <Bell size={24} />
        </button>
      </div>

      {/* Item Detail Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={closeDrawer} />
          
          <div className="bg-[var(--theme-surface)] w-full max-h-[85vh] rounded-t-3xl shadow-2xl overflow-y-auto pointer-events-auto flex flex-col animate-in slide-in-from-bottom-full duration-300">
            <div className="sticky top-0 bg-[var(--theme-surface)] z-10 p-4 border-b border-[var(--theme-text)] border-opacity-5 flex justify-between items-center">
              <h3 className="font-bold text-lg truncate pr-2">{selectedItem.title || selectedItem.name}</h3>
              <button onClick={closeDrawer} className="p-2 bg-gray-100 rounded-full text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              {selectedItem.imageUrl && (
                <img src={selectedItem.imageUrl} alt={selectedItem.title || selectedItem.name} className="w-full h-48 object-cover rounded-2xl mb-4" />
              )}
              
              <p className="text-sm opacity-80 leading-relaxed mb-6">{selectedItem.description}</p>
              
              {/* Coffee Profile Radar */}
              {selectedItem.coffeeProfile && (
                <div className="mb-6 bg-[var(--theme-text)] bg-opacity-5 rounded-2xl p-4">
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <Coffee size={16} /> پروفایل طعمی
                  </h4>
                  <CoffeeRadar profile={selectedItem.coffeeProfile} />
                </div>
              )}

              {/* Allergens */}
              {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-red-500">
                    <AlertTriangle size={16} /> حساسیت‌زا
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.allergens.map(a => (
                      <span key={a} className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-medium border border-red-100">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Modifiers */}
              {selectedItem.modifierGroups?.map(group => (
                <div key={group.id} className="mb-6">
                  <div className="flex justify-between items-end mb-3">
                    <h4 className="font-bold">{group.name}</h4>
                    {group.isRequired && <span className="text-xs bg-[var(--theme-accent)] bg-opacity-10 text-[var(--theme-accent)] px-2 py-0.5 rounded">اجباری</span>}
                  </div>
                  
                  <div className="space-y-2">
                    {group.options.map(opt => {
                      const isSelected = drawerModifiers.some(m => m.id === opt.id);
                      return (
                        <label key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border ${isSelected ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)] bg-opacity-5' : 'border-[var(--theme-text)] border-opacity-10'}`}>
                          <div className="flex items-center gap-3">
                            <input 
                              type={group.maxSelection === 1 ? 'radio' : 'checkbox'}
                              name={group.id}
                              checked={isSelected}
                              onChange={() => {
                                if (group.maxSelection === 1) {
                                  setDrawerModifiers(prev => [...prev.filter(m => !group.options.find(o => o.id === m.id)), { id: opt.id, name: opt.name, priceDelta: opt.priceDelta }]);
                                } else {
                                  if (isSelected) {
                                    setDrawerModifiers(prev => prev.filter(m => m.id !== opt.id));
                                  } else {
                                    if (!group.maxSelection || drawerModifiers.filter(m => group.options.find(o => o.id === m.id)).length < group.maxSelection) {
                                      setDrawerModifiers(prev => [...prev, { id: opt.id, name: opt.name, priceDelta: opt.priceDelta }]);
                                    }
                                  }
                                }
                              }}
                              className="accent-[var(--theme-accent)] w-4 h-4"
                            />
                            <span className="text-sm">{opt.name}</span>
                          </div>
                          {opt.priceDelta > 0 && <span className="text-xs opacity-70">+{opt.priceDelta.toLocaleString()}</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quantity */}
              <div className="flex items-center justify-between mt-8 p-4 bg-[var(--theme-text)] bg-opacity-5 rounded-2xl">
                <span className="font-bold text-sm">تعداد</span>
                <div className="flex items-center gap-4 bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-text)] border-opacity-10">
                  <button onClick={() => setDrawerQuantity(Math.max(1, drawerQuantity - 1))} className="p-2 text-[var(--theme-accent)]">
                    <Minus size={20} />
                  </button>
                  <span className="font-bold w-6 text-center">{drawerQuantity}</span>
                  <button onClick={() => setDrawerQuantity(drawerQuantity + 1)} className="p-2 text-[var(--theme-accent)]">
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--theme-text)] border-opacity-5 bg-[var(--theme-surface)] pb-safe">
              <button 
                onClick={() => addToCart(selectedItem, drawerQuantity, drawerModifiers)}
                disabled={cafe.workflowMode === 'VIEW_ONLY'}
                className="w-full bg-[var(--theme-accent)] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-between px-6 shadow-lg disabled:opacity-50"
              >
                <span>افزودن به سبد</span>
                <span>{((selectedItem.discountPrice || selectedItem.price) * drawerQuantity).toLocaleString()} تومان</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modals */}
      {checkoutModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCheckoutModal({ isOpen: false, type: '' })} />
          <div className="bg-[var(--theme-surface)] rounded-3xl p-6 w-full max-w-sm relative z-10 flex flex-col items-center text-center animate-in zoom-in-95">
            
            {checkoutModal.type === 'PAY_AT_COUNTER' && (
              <>
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <Check size={40} />
                </div>
                <h3 className="font-bold text-xl mb-2">سفارش ثبت شد</h3>
                <p className="opacity-70 text-sm mb-6">لطفا برای پرداخت به صندوق مراجعه کنید و کد زیر را اعلام نمایید:</p>
                <div className="bg-[var(--theme-text)] bg-opacity-5 w-full py-4 rounded-xl font-mono text-3xl font-bold tracking-widest text-[var(--theme-accent)] mb-6 border-2 border-dashed border-[var(--theme-accent)]">
                  {checkoutModal.orderCode}
                </div>
                <button onClick={() => setCheckoutModal({ isOpen: false, type: '' })} className="w-full bg-[var(--theme-accent)] text-white py-3 rounded-xl font-bold">
                  متوجه شدم
                </button>
              </>
            )}

            {checkoutModal.type === 'TABLE_TAB_SPLIT' && (
              <>
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Receipt size={40} />
                </div>
                <h3 className="font-bold text-xl mb-2">افزوده شد به تب میز</h3>
                <p className="opacity-70 text-sm mb-6">سفارش شما به لیست صورتحساب میز اضافه شد. در پایان می‌توانید هزینه را تقسیم یا پرداخت کنید.</p>
                
                <div className="w-full space-y-3">
                  <button onClick={() => setCheckoutModal({ isOpen: false, type: '' })} className="w-full bg-[var(--theme-text)] bg-opacity-5 py-3 rounded-xl font-bold">
                    بستن
                  </button>
                  <button onClick={() => {
                     alert('رفتن به صفحه پرداخت سهم من');
                     setCheckoutModal({ isOpen: false, type: '' });
                  }} className="w-full bg-[var(--theme-accent)] text-white py-3 rounded-xl font-bold">
                    پرداخت سهم من الان
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Global CSS fixes */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 1rem); }
      `}} />
    </div>
  );
}
