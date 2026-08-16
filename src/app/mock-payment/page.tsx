"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Coffee, Bell, Loader } from "lucide-react";
import { Suspense } from "react";

interface Order {
  id: string;
  orderCode: string;
  buzzerNumber: number | null;
  status: string;
  totalAmount: number;
  paymentMode: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    item: { title: string };
  }>;
}

function MockPaymentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"loading" | "processing" | "success" | "failed">("loading");

  useEffect(() => {
    if (!orderId) {
      setPaymentStatus("failed");
      return;
    }

    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        const orderData = data.data || (data.success ? data : null);
        if (orderData) {
          setOrder(orderData);
        } else {
          setOrder({
            id: orderId,
            orderCode: "C-142",
            buzzerNumber: Math.floor(Math.random() * 89 + 10),
            status: "PENDING_PAYMENT",
            totalAmount: 115000,
            paymentMode: "PAY_UPFRONT_BUZZER",
            orderItems: [{ id: "oi-1", quantity: 1, unitPrice: 115000, totalPrice: 115000, item: { title: "قهوه سفارش مشتری" } }],
          });
        }
        setPaymentStatus("processing");
        setTimeout(() => {
          setPaymentStatus("success");
          fetch(`/api/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CONFIRMED" }),
          }).catch(() => {});
        }, 1500);
      })
      .catch(() => {
        setOrder({
          id: orderId,
          orderCode: "C-142",
          buzzerNumber: Math.floor(Math.random() * 89 + 10),
          status: "PENDING_PAYMENT",
          totalAmount: 115000,
          paymentMode: "PAY_UPFRONT_BUZZER",
          orderItems: [{ id: "oi-1", quantity: 1, unitPrice: 115000, totalPrice: 115000, item: { title: "قهوه سفارش مشتری" } }],
        });
        setPaymentStatus("processing");
        setTimeout(() => {
          setPaymentStatus("success");
        }, 1500);
      });
  }, [orderId]);

  if (paymentStatus === "loading") {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-20)" }}>
        <Loader size={40} className="skeleton" style={{ animation: "spin 1s linear infinite", color: "var(--color-text-2)" }} />
        <p style={{ marginTop: "var(--space-4)" }}>در حال بارگذاری...</p>
      </div>
    );
  }

  if (paymentStatus === "processing") {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-20)" }}>
        <div style={{
          width: 80, height: 80,
          background: "var(--color-bg-2)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto var(--space-6)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}>
          <Coffee size={36} color="var(--color-accent)" strokeWidth={1.5} />
        </div>
        <h2 style={{ marginBottom: "var(--space-3)" }}>در حال پردازش پرداخت...</h2>
        <p>لطفاً صبر کنید. این یک پرداخت شبیه‌سازی‌شده است.</p>
        <div style={{
          display: "inline-block",
          marginTop: "var(--space-6)",
          padding: "var(--space-3) var(--space-5)",
          background: "var(--color-bg-2)",
          borderRadius: "var(--radius-full)",
          fontSize: "0.8125rem",
          color: "var(--color-text-2)",
          fontWeight: 600,
        }}>
          درگاه پرداخت شبیه‌سازی‌شده — بدون API خارجی
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-20)" }}>
        <h2>سفارش یافت نشد</h2>
        <a href="/" className="btn btn-primary" style={{ marginTop: "var(--space-6)", display: "inline-flex" }}>بازگشت به خانه</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "var(--space-8) var(--space-4)" }}>
      {/* Success Icon */}
      <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
        <div style={{
          width: 96, height: 96,
          background: "var(--color-sage-bg)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto var(--space-6)",
          animation: "scale-in 0.5s ease-out",
        }}>
          <CheckCircle size={48} color="var(--color-sage)" strokeWidth={1.5} />
        </div>
        <h1 style={{ fontSize: "2rem", marginBottom: "var(--space-3)" }}>پرداخت موفق</h1>
        <p>سفارش شما ثبت شد و در حال آماده‌سازی است</p>
      </div>

      {/* Buzzer / Order Code */}
      {order.paymentMode === "PAY_UPFRONT_BUZZER" && order.buzzerNumber !== null ? (
        <div style={{
          background: "var(--color-text)",
          color: "var(--color-bg)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-8)",
          textAlign: "center",
          marginBottom: "var(--space-6)",
          animation: "buzzer-anim 1s ease-in-out infinite alternate",
        }}>
          <Bell size={32} strokeWidth={1.5} style={{ marginBottom: "var(--space-4)" }} />
          <div style={{ fontSize: "0.875rem", fontWeight: 700, opacity: 0.7, marginBottom: "var(--space-2)" }}>
            شماره پیجر شما
          </div>
          <div style={{
            fontSize: "5rem",
            fontWeight: 900,
            fontFamily: "var(--font-latin)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}>
            {order.buzzerNumber}
          </div>
          <div style={{ fontSize: "0.875rem", opacity: 0.6, marginTop: "var(--space-3)" }}>
            وقتی آماده شد، پیجر شما ارتعاش می‌گیرد
          </div>
        </div>
      ) : (
        <div style={{
          background: "var(--color-bg-2)",
          border: "2px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-6)",
          textAlign: "center",
          marginBottom: "var(--space-6)",
        }}>
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-2)", marginBottom: "var(--space-2)" }}>
            کد سفارش
          </div>
          <div style={{
            fontSize: "2.5rem",
            fontWeight: 900,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
            color: "var(--color-accent)",
          }}>
            {order.orderCode}
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-body">
          <h4 style={{ marginBottom: "var(--space-4)" }}>خلاصه سفارش</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {order.orderItems.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>
                  {item.quantity} × {item.item.title}
                </span>
                <span style={{ fontFamily: "var(--font-latin)", fontWeight: 700 }}>
                  {item.totalPrice.toLocaleString()} ت
                </span>
              </div>
            ))}
          </div>
          <hr className="divider" />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "1.1rem" }}>
            <span>مجموع</span>
            <span style={{ fontFamily: "var(--font-latin)", color: "var(--color-accent)" }}>
              {order.totalAmount.toLocaleString()} ت
            </span>
          </div>
        </div>
      </div>

      <a href="/" className="btn btn-secondary btn-full" style={{ display: "flex", justifyContent: "center" }}>
        بازگشت به صفحه اصلی
      </a>
    </div>
  );
}

export default function MockPaymentPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <Suspense fallback={<div style={{ padding: "var(--space-20)", textAlign: "center" }}>در حال بارگذاری...</div>}>
        <MockPaymentContent />
      </Suspense>
    </div>
  );
}
