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

  const getSlaClass = (createdAt: string) => {
    const elapsedMinutes = (now - new Date(createdAt).getTime()) / 60000;
    if (elapsedMinutes < 5) return 'text-green-600 bg-green-50';
    if (elapsedMinutes < 10) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50 animate-pulse';
  };

  const renderOrderCard = (order: Order) => {
    let visibleItems = order.items || order.orderItems || [];
    if (station !== 'ALL' && station !== 'EXPEDITER') {
      visibleItems = visibleItems.filter((item: any) => item.station === station || item.stationId === station);
    }

    if (visibleItems.length === 0 && station !== 'ALL' && station !== 'EXPEDITER') return null;

    const tableNum = order.tableNumber || order.table?.tableNumber;

    return (
      <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4 mb-4 flex flex-col gap-3">
        <div className="flex justify-between items-center border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{order.code || order.orderCode}</span>
            {tableNum && (
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-sm">
                میز {tableNum}
              </span>
            )}
            {order.buzzerNumber && (
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">
                پیجر {order.buzzerNumber}
              </span>
            )}
          </div>
          <div className={`px-2 py-1 rounded flex items-center gap-1 ${getSlaClass(order.createdAt)}`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm" dir="ltr">
              {formatElapsedTime(order.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {visibleItems.map((item: any, idx: number) => (
            <div key={item.id || idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
              <div>
                <span className="font-medium">
                  {item.quantity}x {item.name}
                </span>
                {item.notes && <div className="text-sm text-gray-500 mt-1">{item.notes}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    item.stationStatus === 'DONE'
                      ? 'bg-green-100 text-green-700'
                      : item.stationStatus === 'IN_PROGRESS'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}
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
                    className="p-1 rounded hover:bg-gray-200 text-gray-600 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {station === 'EXPEDITER' || station === 'ALL' ? (
          <div className="mt-2 pt-2 border-t flex justify-end">
            <button
              onClick={() => advanceOrderStatus(order.id, order.status)}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              مرحله بعد
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans" dir="rtl">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 md:right-auto md:w-96 bg-gray-800 text-white p-4 rounded-lg shadow-lg flex items-center justify-between z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Table Service Banners */}
      <div className="fixed top-0 left-0 right-0 z-40 flex flex-col items-center gap-2 p-4 pointer-events-none">
        {tableServices.map((ts) => (
          <div
            key={ts.id}
            className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 pointer-events-auto animate-in slide-in-from-top-5"
          >
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
            <span className="font-bold">
              میز {ts.tableNumber}: {ts.requestType === 'REQUEST_BILL' || ts.type === 'REQUEST_BILL' ? 'درخواست صورتحساب' : ts.requestType === 'REQUEST_WATER' ? 'درخواست آب' : ts.requestType === 'REQUEST_POS' ? 'درخواست کارتخوان' : 'درخواست سرویس / گارسون'}
            </span>
            <button
              onClick={() => dismissTableService(ts.id)}
              className="bg-blue-700 hover:bg-blue-800 p-1.5 rounded-full transition"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 z-30 relative">
        <h1 className="text-xl font-bold text-gray-800">CafeChi KDS</h1>
        <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto w-full md:w-auto">
          {(Object.keys(STATION_LABELS) as Station[]).map((st) => (
            <button
              key={st}
              onClick={() => setStation(st)}
              className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition ${
                station === st ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {STATION_LABELS[st]}
            </button>
          ))}
        </div>
        <button
          onClick={loadMenuStock}
          className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Package className="w-5 h-5" />
          موجودی (86)
        </button>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {/* Column 1 */}
          <div className="w-80 flex flex-col bg-gray-50 rounded-xl p-3 h-full">
            <h2 className="font-bold text-gray-700 mb-4 px-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              جدید ({newOrders.length})
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {newOrders.map(renderOrderCard)}
            </div>
          </div>

          {/* Column 2 */}
          <div className="w-80 flex flex-col bg-gray-50 rounded-xl p-3 h-full">
            <h2 className="font-bold text-gray-700 mb-4 px-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              در حال آماده‌سازی ({inPrepOrders.length})
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {inPrepOrders.map(renderOrderCard)}
            </div>
          </div>

          {/* Column 3 */}
          <div className="w-80 flex flex-col bg-gray-50 rounded-xl p-3 h-full">
            <h2 className="font-bold text-gray-700 mb-4 px-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              آماده تحویل ({readyOrders.length})
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {readyOrders.map(renderOrderCard)}
            </div>
          </div>

          {/* Column 4 */}
          <div className="w-80 flex flex-col bg-gray-50 rounded-xl p-3 h-full opacity-70">
            <h2 className="font-bold text-gray-700 mb-4 px-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-500"></span>
              تحویل شد
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {deliveredOrders.map(renderOrderCard)}
            </div>
          </div>
        </div>
      </main>

      {/* Stock Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" />
                مدیریت موجودی (86)
              </h2>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {menuItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-0">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <button
                    onClick={() => toggleStock(item.id, item.isAvailable)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      item.isAvailable ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        item.isAvailable ? '-translate-x-1' : '-translate-x-6'
                      }`}
                    />
                  </button>
                </div>
              ))}
              {menuItems.length === 0 && (
                <div className="text-center text-gray-500 py-8">در حال بارگذاری...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
