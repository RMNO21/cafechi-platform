"use client";

import { useState, useEffect } from "react";
import { Coffee, Users, Store, ShieldCheck, Settings, LogOut, CheckCircle, XCircle, Eye } from "lucide-react";

interface Cafe {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  workflowMode: string;
  themeId: string;
  isApproved: boolean;
  isActive: boolean;
  owner: { fullName: string; phone: string };
  _count?: { orders: number };
}

interface User {
  id: string;
  phone: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export default function AdminPage() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"cafes" | "users">("cafes");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/cafes").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ]).then(([cafesData, usersData]) => {
      if (cafesData.success) setCafes(cafesData.data);
      if (usersData.success) setUsers(usersData.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const approveCafe = async (cafeId: string, isApproved: boolean) => {
    const res = await fetch(`/api/admin/cafes/${cafeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved }),
    });
    if ((await res.json()).success) {
      setCafes((prev) => prev.map((c) => c.id === cafeId ? { ...c, isApproved } : c));
    }
  };

  const pendingCafes = cafes.filter((c) => !c.isApproved);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: "var(--color-text)",
        color: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        zIndex: 30,
      }}>
        <div style={{ padding: "var(--space-6)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "0.9rem" }}>پنل مدیریت</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>کافه‌چی</div>
            </div>
          </div>
        </div>

        {pendingCafes.length > 0 && (
          <div style={{ margin: "var(--space-4)", padding: "var(--space-3) var(--space-4)", background: "var(--color-amber)", color: "var(--color-text)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", fontWeight: 700 }}>
            {pendingCafes.length} کافه منتظر تأیید
          </div>
        )}

        <nav style={{ flex: 1, padding: "var(--space-4) var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {[
            { id: "cafes", label: "کافه‌ها", icon: <Store size={18} /> },
            { id: "users", label: "کاربران", icon: <Users size={18} /> },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as "cafes" | "users")}
              style={{
                display: "flex", alignItems: "center", gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                background: activeTab === id ? "rgba(255,255,255,0.15)" : "transparent",
                color: activeTab === id ? "white" : "rgba(255,255,255,0.6)",
                border: "none", cursor: "pointer",
                fontFamily: "var(--font-persian)", fontWeight: 700,
                fontSize: "0.9rem", width: "100%", textAlign: "right",
                transition: "all var(--transition-fast)",
              }}
            >
              {icon}{label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "var(--space-4) var(--space-3)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
            style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-persian)", width: "100%" }}
          >
            <LogOut size={15} /> خروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginRight: 220, padding: "var(--space-8)" }}>
        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
          {[
            { label: "کل کافه‌ها", value: cafes.length, color: "var(--color-accent)" },
            { label: "تأیید شده", value: cafes.filter((c) => c.isApproved).length, color: "var(--color-sage)" },
            { label: "در انتظار تأیید", value: pendingCafes.length, color: "var(--color-amber)" },
            { label: "کل کاربران", value: users.length, color: "var(--color-text)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card">
              <div className="card-body" style={{ padding: "var(--space-5)" }}>
                <div style={{ fontSize: "2rem", fontWeight: 900, color, fontFamily: "var(--font-latin)", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginTop: "var(--space-2)", fontWeight: 600 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {activeTab === "cafes" && (
          <div>
            <h2 style={{ marginBottom: "var(--space-6)" }}>مدیریت کافه‌ها</h2>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
              </div>
            ) : (
              <div className="card">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--color-border)", background: "var(--color-bg-2)" }}>
                      {["کافه", "صاحب", "تم / مد", "وضعیت", "عملیات"].map((h) => (
                        <th key={h} style={{ padding: "var(--space-4)", textAlign: "right", fontSize: "0.8125rem", fontWeight: 800, color: "var(--color-text-2)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cafes.map((cafe) => (
                      <tr key={cafe.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "var(--space-4)" }}>
                          <div style={{ fontWeight: 800 }}>{cafe.name}</div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-2)", fontFamily: "var(--font-latin)" }}>/{cafe.slug}</div>
                        </td>
                        <td style={{ padding: "var(--space-4)" }}>
                          <div style={{ fontWeight: 600 }}>{cafe.owner.fullName}</div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-2)", fontFamily: "var(--font-latin)" }}>{cafe.owner.phone}</div>
                        </td>
                        <td style={{ padding: "var(--space-4)" }}>
                          <span className="badge badge-gray" style={{ marginBottom: "4px", display: "block" }}>{cafe.themeId}</span>
                          <span className="badge badge-gray">{cafe.workflowMode}</span>
                        </td>
                        <td style={{ padding: "var(--space-4)" }}>
                          <span className={`badge ${cafe.isApproved ? "badge-green" : "badge-amber"}`}>
                            {cafe.isApproved ? "تأیید شده" : "در انتظار"}
                          </span>
                        </td>
                        <td style={{ padding: "var(--space-4)" }}>
                          <div style={{ display: "flex", gap: "var(--space-2)" }}>
                            <a
                              href={`/c/${cafe.slug}`}
                              target="_blank"
                              className="btn btn-secondary btn-sm"
                              title="مشاهده منو"
                            >
                              <Eye size={15} />
                            </a>
                            {!cafe.isApproved ? (
                              <button
                                onClick={() => approveCafe(cafe.id, true)}
                                className="btn btn-sm"
                                style={{ background: "var(--color-sage)", color: "white", border: "none" }}
                                title="تأیید"
                              >
                                <CheckCircle size={15} />
                              </button>
                            ) : (
                              <button
                                onClick={() => approveCafe(cafe.id, false)}
                                className="btn btn-sm"
                                style={{ background: "var(--color-red)", color: "white", border: "none" }}
                                title="لغو تأیید"
                              >
                                <XCircle size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h2 style={{ marginBottom: "var(--space-6)" }}>مدیریت کاربران</h2>
            <div className="card">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)", background: "var(--color-bg-2)" }}>
                    {["نام", "شماره تلفن", "نقش", "تاریخ ثبت"].map((h) => (
                      <th key={h} style={{ padding: "var(--space-4)", textAlign: "right", fontSize: "0.8125rem", fontWeight: 800, color: "var(--color-text-2)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "var(--space-4)", fontWeight: 700 }}>{user.fullName}</td>
                      <td style={{ padding: "var(--space-4)", fontFamily: "var(--font-latin)" }}>{user.phone}</td>
                      <td style={{ padding: "var(--space-4)" }}>
                        <span className={`badge ${user.role === "SUPER_ADMIN" ? "badge-red" : user.role === "CAFE_OWNER" ? "badge-amber" : user.role === "STAFF" ? "badge-accent" : "badge-gray"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: "var(--space-4)", fontSize: "0.875rem", color: "var(--color-text-2)", fontFamily: "var(--font-latin)" }}>
                        {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
