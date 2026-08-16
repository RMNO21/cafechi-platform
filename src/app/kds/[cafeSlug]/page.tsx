'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { Bell, CheckCircle, Clock, AlertTriangle, X, ChevronRight, Package, Zap } from 'lucide-react';
import type { Order, OrderItemPublic, KdsEvent, TableServiceRequest } from '@/types';

type Station = 'ALL' | 'HOT_BAR' | 'COLD_BAR' | 'KITCHEN' | 'PASTRY' | 'EXPEDITER';

const STATION_LABELS: Record<Station, string> = {
  ALL: 'همه',
  HOT_BAR: 'بار گرم',
  COLD_BAR: 'بار سرد',
  KITCHEN: 'آشپزخانه',
  PASTRY: 'قنادی',
  EXPEDITER: 'اکسپدایتر',
};

// Assuming these types based on the requirements if they are not fully matching @/types
// but using the generic names given in prompt
type OrderStatus = 'CONFIRMED' | 'PENDING_PAYMENT' | 'IN_PREPARATION' | 'READY' | 'DELIVERED';
type StationStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';

interface PageProps {
  params: Promise<{ cafeSlug: string }>;
}

const FALLBACK_KDS_ORDERS: any[] = [
  {
    id: "ord-101",
    orderCode: "A-101",
    code: "A-101",
    buzzerNumber: 12,
    status: "CONFIRMED",
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    totalAmount: 210000,
    paymentMode: "PAY_UPFRONT_BUZZER",
    orderItems: [
      { id: "oi-1", quantity: 1, unitPrice: 85000, totalPrice: 85000, stationStatus: "IN_PROGRESS", stationType: "HOT_BAR", item: { id: "item-espresso", title: "اسپرسو تخصصی (اتیوپی)" } },
      { id: "oi-2", quantity: 1, unitPrice: 125000, totalPrice: 125000, stationStatus: "PENDING", stationType: "HOT_BAR", item: { id: "item-v60", title: "دم‌آوری دستی V60 (کنیا)" } },
    ]
  },
  {
    id: "ord-102",
    orderCode: "B-102",
    code: "B-102",
    buzzerNumber: 5,
    status: "IN_PREPARATION",
    createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    totalAmount: 230000,
    paymentMode: "PAY_AT_COUNTER",
    orderItems: [
      { id: "oi-3", quantity: 1, unitPrice: 135000, totalPrice: 135000, stationStatus: "IN_PROGRESS", stationType: "COLD_BAR", item: { id: "item-coldbrew", title: "کلد برو ۲۴ ساعته" } },
      { id: "oi-4", quantity: 1, unitPrice: 95000, totalPrice: 95000, stationStatus: "DONE", stationType: "PASTRY", item: { id: "item-croissant", title: "کروسان کره‌ای" } },
    ]
  },
  {
    id: "ord-103",
    orderCode: "C-103",
    code: "C-103",
    tableNumber: "۴",
    status: "READY",
    createdAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    totalAmount: 145000,
    paymentMode: "TABLE_TAB_SPLIT",
    orderItems: [
      { id: "oi-5", quantity: 1, unitPrice: 145000, totalPrice: 145000, stationStatus: "DONE", stationType: "PASTRY", item: { id: "item-cheesecake", title: "چیزکیک نیویورکی" } },
    ]
  }
];

export default function KDSPage(props: PageProps) {
  const params = use(props.params);
  const cafeSlug = params.cafeSlug;

  const [orders, setOrders] = useState<Order[]>(FALLBACK_KDS_ORDERS);
  const [station, setStation] = useState<Station>('ALL');
  const [now, setNow] = useState(Date.now());
  const [tableServices, setTableServices] = useState<TableServiceRequest[]>([]);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]); // simplified for this scope

  // Timer for SLA
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // SSE Connection
  useEffect(() => {
    const sseUrl = `/api/kds/stream/${cafeSlug}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as KdsEvent;
        handleEvent(data);
      } catch (err) {
        console.error('Error parsing SSE event', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [cafeSlug]);

  const handleEvent = (event: KdsEvent) => {
    switch (event.type) {
      case 'INITIAL_STATE':
        if (event.payload?.orders) {
          setOrders(event.payload.orders);
        }
        break;
      case 'NEW_ORDER':
        if (event.payload?.order) {
          setOrders((prev) => [...prev, event.payload.order]);
          playChime();
          showToast(`سفارش جدید: ${event.payload.order.code || event.payload.order.orderCode}`);
        }
        break;
      case 'ITEM_STATUS_UPDATE':
        if (event.payload) {
          const { orderId, orderItemId, stationStatus } = event.payload;
          setOrders((prev) =>
            prev.map((order) =>
              order.id === orderId
                ? {
                    ...order,
                    orderItems: (order.orderItems || order.items || []).map((item: any) =>
                      item.id === orderItemId ? { ...item, stationStatus } : item
                    ),
                    items: (order.items || order.orderItems || []).map((item: any) =>
                      item.id === orderItemId ? { ...item, stationStatus } : item
                    ),
                  }
                : order
            )
          );
        }
        break;
      case 'TABLE_SERVICE':
        if (event.payload?.request) {
          setTableServices((prev) => [...prev, event.payload.request]);
          playChime();
        }
        break;
      case 'ITEM_86ED':
        if (event.payload?.itemId) {
          showToast(`آیتم ناموجود شد: ${event.payload.itemName || event.payload.itemId}`);
        }
        break;
      case 'ORDER_READY':
        if (event.payload?.orderId) {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === event.payload.orderId ? { ...order, status: 'READY' } : order
            )
          );
        }
        break;
    }
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const frequencies = [523, 659, 784];
      const duration = 0.15;

      frequencies.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const startTime = audioCtx.currentTime + index * duration;
        osc.start(startTime);
        osc.stop(startTime + duration);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(1, startTime + duration / 2);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      });
    } catch (e) {
      console.error('Audio chime failed', e);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const advanceOrderStatus = async (orderId: string, currentStatus: string) => {
    const statusMap: Record<string, string> = {
      CONFIRMED: 'IN_PREPARATION',
      PENDING_PAYMENT: 'IN_PREPARATION', // Assuming paid
      IN_PREPARATION: 'READY',
      READY: 'DELIVERED',
    };
    const nextStatus = statusMap[currentStatus];
    if (!nextStatus) return;

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as OrderStatus } : o))
      );
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const advanceItemStatus = async (orderId: string, itemId: string, currentStatus: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
    };
    const nextStatus = statusMap[currentStatus];
    if (!nextStatus) return;

    try {
      await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationStatus: nextStatus }),
      });
      // Optimistic update
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                orderItems: (order.orderItems || order.items || []).map((item: any) =>
                  item.id === itemId ? { ...item, stationStatus: nextStatus } : item
                ),
                items: (order.items || order.orderItems || []).map((item: any) =>
                  item.id === itemId ? { ...item, stationStatus: nextStatus } : item
                ),
              }
            : order
        )
      );
    } catch (err) {
      console.error('Failed to update item status', err);
    }
  };

  const dismissTableService = async (id: string) => {
    try {
      await fetch(`/api/table-service/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      setTableServices((prev) => prev.filter((ts) => ts.id !== id));
    } catch (err) {
      console.error('Failed to dismiss table service', err);
    }
  };

  const loadMenuStock = async () => {
    setIsStockModalOpen(true);
    try {
      const res = await fetch(`/api/stock?cafeSlug=${cafeSlug}`);
      const data = await res.json();
      setMenuItems(data.items || []);
    } catch (err) {
      console.error('Failed to load stock', err);
    }
  };

  const toggleStock = async (itemId: string, currentAvail: boolean) => {
    try {
      await fetch(`/api/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, isAvailable: !currentAvail }),
      });
      setMenuItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isAvailable: !currentAvail } : item))
      );
    } catch (err) {
      console.error('Failed to update stock', err);
    }
  };

  // Grouping orders for Kanban
  const newOrders = orders.filter(
    (o) => o.status === 'CONFIRMED' || (o.status === 'PENDING_PAYMENT' && (o.paid || o.paymentStatus === 'PAID'))
  );
  const inPrepOrders = orders.filter((o) => o.status === 'IN_PREPARATION');
  const readyOrders = orders.filter((o) => o.status === 'READY');
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').slice(-5); // last 5

  const formatElapsedTime = (createdAt: string) => {
    const elapsed = Math.floor((now - new Date(createdAt).getTime()) / 1000);
    if (elapsed < 0) return '00:00';
    const m = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getSlaBadgeStyle = (createdAt: string) => {
    const elapsedMinutes = (now - new Date(createdAt).getTime()) / 60000;
    if (elapsedMinutes < 5) return { color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' };
    if (elapsedMinutes < 10) return { color: '#F59E0B', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' };
    return { color: '#EF4444', background: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.4)', animation: 'pulse 1.5s infinite' };
  };

  const renderOrderCard = (order: Order) => {
    let visibleItems = order.items || order.orderItems || [];
    if (station !== 'ALL' && station !== 'EXPEDITER') {
      visibleItems = visibleItems.filter((item: any) => item.station === station || item.stationId === station || item.stationType === station);
    }

    if (visibleItems.length === 0 && station !== 'ALL' && station !== 'EXPEDITER') return null;

    const tableNum = order.tableNumber || (order as any).table?.tableNumber;

    return (
      <div 
        key={order.id} 
        style={{ 
          background: '#1E293B', 
          borderRadius: '12px', 
          border: '1px solid #334155', 
          padding: '16px', 
          marginBottom: '14px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          color: '#F8FAFC'
        }}
      >
        {/* Header: Code, Table/Buzzer & SLA Timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#F8FAFC', letterSpacing: '1px' }}>
              {order.code || order.orderCode}
            </span>
            {tableNum && (
              <span style={{ background: '#334155', color: '#94A3B8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                میز {tableNum}
              </span>
            )}
            {order.buzzerNumber && (
              <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                پیجر {order.buzzerNumber}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 800, ...getSlaBadgeStyle(order.createdAt) }}>
            <Clock size={15} />
            <span dir="ltr" style={{ fontFamily: 'monospace' }}>
              {formatElapsedTime(order.createdAt)}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visibleItems.map((item: any, idx: number) => (
            <div 
              key={item.id || idx} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: '#0F172A', 
                padding: '10px 12px', 
                borderRadius: '8px',
                border: '1px solid #1E293B'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#F1F5F9' }}>
                  {item.quantity}x {item.item?.title || item.item?.name || item.title || item.name}
                </div>
                {item.notes && <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{item.notes}</div>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    ...(item.stationStatus === 'DONE'
                      ? { background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }
                      : item.stationStatus === 'IN_PROGRESS'
                      ? { background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)' }
                      : { background: '#334155', color: '#CBD5E1' })
                  }}
                >
                  {item.stationStatus === 'DONE'
                    ? 'آماده'
                    : item.stationStatus === 'IN_PROGRESS'
                    ? 'در حال آماده‌سازی'
                    : 'در انتظار'}
                </span>
                {item.stationStatus !== 'DONE' && (
                  <button
                    onClick={() => advanceItemStatus(order.id, item.id, item.stationStatus)}
                    style={{ background: '#334155', color: '#F8FAFC', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="تغییر وضعیت آیتم"
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {(station === 'EXPEDITER' || station === 'ALL') && order.status !== 'DELIVERED' && (
          <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => advanceOrderStatus(order.id, order.status)}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Zap size={16} />
              مرحله بعد
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F19', color: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'IRANSans, system-ui, sans-serif' }} dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', maxWidth: '400px', background: '#1E293B', color: '#F8FAFC', padding: '14px 18px', borderRadius: '12px', border: '1px solid #3B82F6', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} style={{ color: '#F59E0B' }} />
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Table Service Alerts Floating Banner */}
      {tableServices.length > 0 && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '8px', width: '90%', maxWidth: '500px' }}>
          {tableServices.map((ts) => (
            <div
              key={ts.id}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                padding: '12px 18px',
                borderRadius: '50px',
                boxShadow: '0 10px 30px rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #60A5FA'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} style={{ color: '#FDE047' }} />
                <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>
                  میز {ts.tableNumber}: {ts.requestType === 'REQUEST_BILL' || ts.type === 'REQUEST_BILL' ? 'درخواست صورتحساب' : ts.requestType === 'REQUEST_WATER' ? 'درخواست آب' : ts.requestType === 'REQUEST_POS' ? 'درخواست کارتخوان' : 'درخواست سرویس / سالن‌کار'}
                </span>
              </div>
              <button
                onClick={() => dismissTableService(ts.id)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFFFFF', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="تأیید و رسیدگی"
              >
                <CheckCircle size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Top Navigation Bar */}
      <header style={{ background: '#1E293B', borderBottom: '1px solid #334155', padding: '16px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#2563EB', color: '#FFFFFF', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
            KDS
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#F8FAFC' }}>کافه‌چی — پنل نمایش سفارشات باریستا</h1>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{cafeSlug}</span>
          </div>
        </div>

        {/* Station Filter Tabs */}
        <div style={{ display: 'flex', background: '#0F172A', padding: '4px', borderRadius: '10px', gap: '4px', overflowX: 'auto' }}>
          {(Object.keys(STATION_LABELS) as Station[]).map((st) => {
            const isActive = station === st;
            return (
              <button
                key={st}
                onClick={() => setStation(st)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: isActive ? '#2563EB' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.2s ease'
                }}
              >
                {STATION_LABELS[st]}
              </button>
            );
          })}
        </div>

        {/* Stock 86 Toggle Button */}
        <button
          onClick={loadMenuStock}
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#F87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Package size={18} />
          مدیریت موجودی (86)
        </button>
      </header>

      {/* Main Kanban Board (4 Columns Grid) */}
      <main style={{ flex: 1, padding: '24px', overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(290px, 1fr))', gap: '20px', minWidth: '1200px', height: '100%' }}>
          
          {/* Column 1: New Orders */}
          <div style={{ background: '#0F172A', borderRadius: '14px', border: '1px solid #1E293B', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #3B82F6' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3B82F6' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: '#F8FAFC' }}>
                جدید ({newOrders.length})
              </h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {newOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '40px 0', fontSize: '0.875rem' }}>سفارش جدیدی ثبت نشده</div>
              ) : (
                newOrders.map(renderOrderCard)
              )}
            </div>
          </div>

          {/* Column 2: In Preparation */}
          <div style={{ background: '#0F172A', borderRadius: '14px', border: '1px solid #1E293B', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #F59E0B' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: '#F8FAFC' }}>
                در حال آماده‌سازی ({inPrepOrders.length})
              </h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {inPrepOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '40px 0', fontSize: '0.875rem' }}>آیتمی در حال آماده‌سازی نیست</div>
              ) : (
                inPrepOrders.map(renderOrderCard)
              )}
            </div>
          </div>

          {/* Column 3: Ready Orders */}
          <div style={{ background: '#0F172A', borderRadius: '14px', border: '1px solid #1E293B', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #10B981' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: '#F8FAFC' }}>
                آماده تحویل ({readyOrders.length})
              </h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {readyOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '40px 0', fontSize: '0.875rem' }}>سفارشی آماده تحویل نیست</div>
              ) : (
                readyOrders.map(renderOrderCard)
              )}
            </div>
          </div>

          {/* Column 4: Delivered Orders */}
          <div style={{ background: '#0F172A', borderRadius: '14px', border: '1px solid #1E293B', padding: '16px', display: 'flex', flexDirection: 'column', opacity: 0.85 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #64748B' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#64748B' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: '#F8FAFC' }}>
                تحویل شد ({deliveredOrders.length})
              </h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {deliveredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '40px 0', fontSize: '0.875rem' }}>سفارش اخیر تحویل‌شده‌‌ای نیست</div>
              ) : (
                deliveredOrders.map(renderOrderCard)
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Stock Modal (86 Toggle) */}
      {isStockModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#1E293B', borderRadius: '16px', border: '1px solid #334155', width: '100%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#F8FAFC' }}>
                <Package size={20} style={{ color: '#EF4444' }} />
                مدیریت موجودی منو (عدم موجودی - 86)
              </h3>
              <button onClick={() => setIsStockModalOpen(false)} style={{ background: '#0F172A', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {menuItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#0F172A', borderRadius: '10px', border: '1px solid #334155' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#F8FAFC' }}>{item.title || item.name}</span>
                  <button
                    onClick={() => toggleStock(item.id, item.isAvailable)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: item.isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: item.isAvailable ? '#34D399' : '#F87171',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: item.isAvailable ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    {item.isAvailable ? 'موجود است' : 'ناموجود (86)'}
                  </button>
                </div>
              ))}
              {menuItems.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '30px 0' }}>در حال دریافت لیست آیتم‌های منو...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
