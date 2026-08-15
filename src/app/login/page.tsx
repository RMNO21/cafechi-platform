"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Coffee, Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "خطا در ورود");
        return;
      }

      const { role, cafeId } = data.data;

      if (role === "SUPER_ADMIN") router.push("/admin");
      else if (role === "CAFE_OWNER") router.push("/owner");
      else if (role === "STAFF") router.push(cafeId ? `/kds/${cafeId}` : "/kds");
      else router.push(from === "/login" ? "/" : from);
    } catch {
      setError("خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)", padding: "var(--space-4)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
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
          <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-2)" }}>خوش آمدید</h1>
          <p>وارد حساب کاربری خود شوید</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {error && (
                <div style={{
                  padding: "var(--space-3) var(--space-4)",
                  background: "#FEE2E2",
                  border: "1px solid #FECACA",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-red)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="label" htmlFor="phone">شماره تلفن</label>
                <div style={{ position: "relative" }}>
                  <Phone size={16} style={{ position: "absolute", right: "var(--space-4)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-2)" }} />
                  <input
                    id="phone"
                    type="tel"
                    className="input"
                    placeholder="09120000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ paddingRight: "var(--space-10)" }}
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="password">رمز عبور</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", right: "var(--space-4)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-2)" }} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="input"
                    placeholder="رمز عبور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: "var(--space-10)", paddingLeft: "var(--space-10)" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ position: "absolute", left: "var(--space-4)", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-2)" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
                style={{ marginTop: "var(--space-2)" }}
              >
                {loading ? "در حال ورود..." : (
                  <>
                    ورود
                    <ArrowRight size={16} style={{ transform: "scaleX(-1)" }} />
                  </>
                )}
              </button>
            </form>

            <div className="divider" />

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem" }}>
                حساب ندارید؟{" "}
                <a href="/register" style={{ color: "var(--color-accent)", fontWeight: 700 }}>
                  ثبت‌نام کنید
                </a>
              </p>
            </div>

            {/* Quick test credentials */}
            <div style={{
              marginTop: "var(--space-6)",
              padding: "var(--space-4)",
              background: "var(--color-bg-2)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-2)", marginBottom: "var(--space-3)" }}>
                ورود سریع برای تست:
              </p>
              {[
                { label: "سوپر ادمین", phone: "09120000000", pass: "admin123" },
                { label: "صاحب کافه", phone: "09121111111", pass: "owner123" },
                { label: "باریستا", phone: "09123333333", pass: "staff123" },
                { label: "مشتری", phone: "09124444444", pass: "customer123" },
              ].map((cred) => (
                <button
                  key={cred.phone}
                  onClick={() => { setPhone(cred.phone); setPassword(cred.pass); }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "right",
                    padding: "var(--space-2) var(--space-3)",
                    marginBottom: "var(--space-1)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    color: "var(--color-accent)",
                    fontWeight: 600,
                    fontFamily: "var(--font-persian)",
                    borderRadius: "var(--radius-sm)",
                    transition: "background var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  {cred.label} — {cred.phone}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>در حال بارگذاری...</div>}>
      <LoginForm />
    </Suspense>
  );
}
