"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Phone, Lock, User, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    phone: "",
    password: "",
    fullName: "",
    role: "CUSTOMER" as "CUSTOMER" | "CAFE_OWNER",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "خطا در ثبت‌نام");
        return;
      }

      if (form.role === "CAFE_OWNER") router.push("/owner");
      else router.push("/");
    } catch {
      setError("خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)", padding: "var(--space-4)" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
          <a href="/" style={{ display: "inline-block" }}>
            <div style={{
              width: 56, height: 56,
              background: "var(--color-text)",
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto var(--space-4)",
              boxShadow: "var(--shadow-lg)",
            }}>
              <Coffee size={28} color="#FAF6ED" strokeWidth={1.5} />
            </div>
          </a>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-2)" }}>ایجاد حساب</h1>
          <p>به جامعه کافه‌چی بپیوندید</p>
        </div>

        <div className="card">
          <div className="card-body">
            {/* Role Toggle */}
            <div style={{
              display: "flex",
              background: "var(--color-bg-2)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-1)",
              marginBottom: "var(--space-6)",
            }}>
              {(["CUSTOMER", "CAFE_OWNER"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setForm((p) => ({ ...p, role }))}
                  style={{
                    flex: 1,
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "calc(var(--radius-md) - 2px)",
                    border: "none",
                    background: form.role === role ? "var(--color-surface)" : "transparent",
                    color: form.role === role ? "var(--color-text)" : "var(--color-text-2)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontFamily: "var(--font-persian)",
                    boxShadow: form.role === role ? "var(--shadow-xs)" : "none",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {role === "CUSTOMER" ? "مشتری" : "صاحب کافه"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {error && (
                <div style={{ padding: "var(--space-3) var(--space-4)", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "var(--radius-md)", color: "var(--color-red)", fontSize: "0.875rem", fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="label" htmlFor="fullName">نام و نام خانوادگی</label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", right: "var(--space-4)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-2)" }} />
                  <input id="fullName" className="input" placeholder="علی احمدی" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} style={{ paddingRight: "var(--space-10)" }} required />
                </div>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="phone">شماره تلفن</label>
                <div style={{ position: "relative" }}>
                  <Phone size={16} style={{ position: "absolute", right: "var(--space-4)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-2)" }} />
                  <input id="phone" type="tel" className="input" placeholder="09120000000" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} style={{ paddingRight: "var(--space-10)" }} dir="ltr" required />
                </div>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="password">رمز عبور</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", right: "var(--space-4)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-2)" }} />
                  <input id="password" type="password" className="input" placeholder="حداقل ۶ کاراکتر" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} style={{ paddingRight: "var(--space-10)" }} required minLength={6} />
                </div>
              </div>

              {form.role === "CAFE_OWNER" && (
                <div style={{
                  padding: "var(--space-4)",
                  background: "var(--color-sage-bg)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-sage)",
                  fontSize: "0.875rem",
                  color: "var(--color-sage)",
                  fontWeight: 600,
                }}>
                  پس از ثبت‌نام، تیم کافه‌چی کافه شما را بررسی و تأیید می‌کند.
                  تا تأیید ادمین، کافه در پلتفرم نمایش داده نمی‌شود.
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: "var(--space-2)" }}>
                {loading ? "در حال ثبت‌نام..." : (
                  <>
                    ایجاد حساب
                    <ArrowRight size={16} style={{ transform: "scaleX(-1)" }} />
                  </>
                )}
              </button>
            </form>

            <hr className="divider" />

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem" }}>
                حساب دارید؟{" "}
                <a href="/login" style={{ color: "var(--color-accent)", fontWeight: 700 }}>وارد شوید</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
