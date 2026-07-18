import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabaseClient.js";

/* ============================================================
   CHAUDHARY TRADERS — Browser ERP (Phase 1 + Phase 2 + Phase 3)
   Data persists via Supabase (shared across all devices) when
   configured, otherwise falls back to the browser's localStorage
   (see storeGet/storeSet below).
   ============================================================ */

const UNIT_OPTS = ["Bag", "Ton", "Trip", "Sq.Ft", "Piece"];
const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Won", "Lost"];
const BOOKING_STATUSES = ["Booked", "Partially Delivered", "Completed", "Cancelled"];
const ORDER_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"];
const AUDIENCE_TYPES = ["Builder", "Contractor", "Developer", "Housing Society"];
const VEHICLE_TYPES = ["Rickshaw", "Truck", "Mazda", "Loader Rickshaw", "Other"];
const PROMISE_STATUSES = ["Pending", "Partially Paid", "Completed", "Broken Promise", "Cancelled"];
const PROMISE_PAYMENT_METHODS = ["Cash", "Bank", "Online", "Cheque", "Other"];

const MESSAGE_TEMPLATES = {
  en: {
    Builder: (n, o) => `Assalam-o-Alaikum ${n},\n\nThis is Chaudhary Traders. We supply cement, bricks, sand and crush at competitive rates with reliable on-site delivery for your ongoing projects.${o > 0 ? `\n\nQuick reminder — your current outstanding balance is Rs ${o.toLocaleString()}. Kindly clear it at your convenience.` : ""}\n\nLet us know your next material requirement and we'll send a quote right away.`,
    Contractor: (n, o) => `Assalam-o-Alaikum ${n},\n\nChaudhary Traders here — bulk rates available on cement and building material for your sites, with same-day rickshaw/truck delivery.${o > 0 ? `\n\nAlso, a friendly reminder that Rs ${o.toLocaleString()} is outstanding on your account.` : ""}\n\nReply with your next order and we'll process it immediately.`,
    Developer: (n, o) => `Assalam-o-Alaikum ${n},\n\nFor your development project, Chaudhary Traders can offer volume pricing and a dedicated delivery schedule across all phases.${o > 0 ? `\n\nOutstanding balance on file: Rs ${o.toLocaleString()}.` : ""}\n\nHappy to set up a standing supply arrangement — let us know a good time to discuss.`,
    "Housing Society": (n, o) => `Assalam-o-Alaikum ${n},\n\nChaudhary Traders is offering society-wide supply rates for cement, bricks and sand for common infrastructure work.${o > 0 ? `\n\nOutstanding balance: Rs ${o.toLocaleString()}.` : ""}\n\nWe'd be glad to prepare a bulk quotation for the society.`,
  },
  ur: {
    Builder: (n, o) => `Assalam-o-Alaikum ${n},\n\nYe Chaudhary Traders hai. Hum cement, bricks, ret aur crush acchi rates par supply karte hain, saath hi site par time par delivery.${o > 0 ? `\n\nYaad dahani: aap ka outstanding balance Rs ${o.toLocaleString()} hai. Jaldi clear kar dein.` : ""}\n\nAgla order bata dein, foran quote bhej dete hain.`,
    Contractor: (n, o) => `Assalam-o-Alaikum ${n},\n\nChaudhary Traders — bulk rate cement aur material available hai, same-day delivery ke saath.${o > 0 ? `\n\nAap ka Rs ${o.toLocaleString()} outstanding hai, yaad dahani ke tor par bata rahe hain.` : ""}\n\nAgla order reply mein bata dein.`,
    Developer: (n, o) => `Assalam-o-Alaikum ${n},\n\nAap ke project ke liye Chaudhary Traders volume pricing aur dedicated delivery schedule offer kar sakta hai.${o > 0 ? `\n\nOutstanding balance: Rs ${o.toLocaleString()}.` : ""}\n\nStanding supply arrangement discuss karne ke liye waqt bata dein.`,
    "Housing Society": (n, o) => `Assalam-o-Alaikum ${n},\n\nChaudhary Traders society ke liye bulk rate offer kar raha hai cement, bricks aur ret par.${o > 0 ? `\n\nOutstanding balance: Rs ${o.toLocaleString()}.` : ""}\n\nSociety ke liye bulk quotation tayyar kar dete hain, bata dein.`,
  },
};

function waLink(phone, text) {
  const clean = (phone || "").replace(/[^0-9]/g, "");
  const withCountry = clean.startsWith("92") ? clean : clean.startsWith("0") ? "92" + clean.slice(1) : "92" + clean;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

function uid(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addOneMonth(dateStr) {
  const d = new Date(dateStr || todayISO());
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}
function fmtMoney(n) {
  const v = Number(n) || 0;
  return "Rs " + v.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}
function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Storage layer.
// If Supabase is configured (see src/supabaseClient.js + .env), data is
// stored in a shared "kv_store" table so admin + staff on ANY device see
// the same live data (synced in real time). If Supabase is NOT configured,
// the app falls back to the browser's localStorage (data stays on that
// device/browser only) so it still works out of the box.
const LS_PREFIX = "chaudhary_traders_erp:";

async function storeGet(key, fallback) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("kv_store").select("value").eq("key", key).maybeSingle();
      if (error) throw error;
      return data ? data.value : fallback;
    } catch (e) {
      console.error("supabase get failed, falling back to localStorage", key, e);
    }
  }
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
async function storeSet(key, value) {
  if (supabase) {
    try {
      const { error } = await supabase.from("kv_store").upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
      return;
    } catch (e) {
      console.error("supabase set failed, falling back to localStorage", key, e);
    }
  }
  try {
    window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("storage set failed", key, e);
  }
}

const DEFAULT_USERS = [
  { id: uid("u"), username: "admin", password: "admin123", role: "admin", name: "Admin" },
  { id: uid("u"), username: "staff", password: "staff123", role: "staff", name: "Staff" },
];
const DEFAULT_SETTINGS = {
  companyName: "Chaudhary Traders",
  companyAddress: "Lahore, Pakistan",
  companyPhone: "",
  invoiceCounter: 1,
  driverCounter: 1,
  bookingCounter: 1,
  orderCounter: 1,
  returnCounter: 1,
  exchangeCounter: 1,
  creditNoteCounter: 1,
  promiseCounter: 1,
  logoUrl: "",
};
const DEFAULT_BRANCHES = [{ id: "branch_main", name: "Main Branch" }];

function resizeImageToDataUrl(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png", 0.9));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------------- Shell / Layout ---------------- */

function Sidebar({ page, setPage, role, onLogout, companyName, logoUrl }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: "◧" },
    { id: "customers", label: "Customers", icon: "◍" },
    { id: "invoices", label: "Invoices", icon: "▤" },
    { id: "invoiceHistory", label: "Invoice History", icon: "🕓" },
    { id: "returns", label: "Sales Return", icon: "↩" },
    { id: "exchange", label: "Exchange", icon: "🔄" },
    { id: "creditNotes", label: "Credit Notes", icon: "📝" },
    { id: "ledger", label: "Ledger", icon: "≡" },
    { id: "payments", label: "Payments", icon: "◎" },
    { id: "bookings", label: "Advance Booking", icon: "▦" },
    { id: "orders", label: "Daily Orders", icon: "☎" },
    { id: "promises", label: "Promise To Pay", icon: "🤝" },
    { id: "leads", label: "Leads", icon: "◔" },
    { id: "products", label: "Products", icon: "▧" },
    { id: "drivers", label: "Drivers", icon: "🚚" },
    { id: "offers", label: "Offers", icon: "🎁" },
    { id: "reports", label: "Reports", icon: "▥" },
    { id: "assistant", label: "Sales Assistant", icon: "◈" },
    { id: "estimator", label: "Cement Estimator", icon: "▨" },
  ];
  if (role === "admin") items.push({ id: "settings", label: "Settings", icon: "⚙" });

  return (
    <div className="w-56 shrink-0 bg-slate-900 text-slate-200 flex flex-col h-full">
      <div className="px-4 py-5 border-b border-slate-700 flex items-center gap-2">
        {logoUrl && <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain shrink-0" />}
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white font-bold">Trading Ledger</div>
          <div className="text-lg font-black uppercase tracking-tight text-white leading-tight">{companyName}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => setPage(it.id)}
            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors ${
              page === it.id
                ? "bg-white text-slate-900 font-bold"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span className="w-4 text-center">{it.icon}</span>
            {it.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="w-full text-xs uppercase tracking-wide font-bold text-slate-400 hover:text-white px-2 py-2"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="bg-white border border-slate-200 p-4 flex-1 min-w-[150px]">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">{label}</div>
      <div className={`text-2xl font-black mt-1 ${accent || "text-slate-900"}`}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white w-full ${wide ? "max-w-3xl" : "max-w-lg"} mt-8 mb-8 border-t-4 border-slate-900`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-black uppercase tracking-tight text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

function Btn({ children, onClick, variant = "primary", type = "button", small, disabled }) {
  const base = `${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"} font-bold uppercase tracking-wide transition-colors ${disabled ? "opacity-40 cursor-not-allowed" : ""}`;
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    dark: "bg-slate-900 text-white hover:bg-slate-700",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border border-slate-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

/* ---------------- Login ---------------- */

function Login({ users, customers, onLogin, companyName, logoUrl, onResetUsers }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [failCount, setFailCount] = useState(0);

  function submit() {
    const uname = username.trim().toLowerCase();
    const pass = password;
    const staffMatch = users.find((x) => x.username.toLowerCase() === uname && x.password === pass);
    if (staffMatch) { setError(""); onLogin(staffMatch); return; }
    const custMatch = customers.find((c) => c.portalUsername && c.portalUsername.toLowerCase() === uname && c.portalPassword === pass);
    if (custMatch) { setError(""); onLogin({ id: custMatch.id, name: custMatch.name, role: "customer", username: custMatch.portalUsername }); return; }
    setError("Galat username ya password.");
    setFailCount((n) => n + 1);
  }

  function resetDefaults() {
    onResetUsers();
    setResetMsg("Default logins wapas set ho gaye: admin/admin123, staff/staff123. Ab dobara try karein.");
    setFailCount(0);
  }

  function onKeyDown(e) {
    if (e.key === "Enter") submit();
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm border-t-4 border-slate-900">
        <div className="px-6 pt-6 pb-2">
          {logoUrl && <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain mb-2" />}
          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">Trading Ledger</div>
          <div className="text-2xl font-black uppercase tracking-tight text-slate-900">{companyName}</div>
        </div>
        <div className="p-6 pt-4">
          <Field label="Username">
            <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={onKeyDown} autoFocus />
          </Field>
          <Field label="Password">
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKeyDown} />
          </Field>
          {error && <div className="text-red-600 text-sm font-semibold mb-3">{error}</div>}
          <Btn onClick={submit}>Log In</Btn>
          {failCount >= 1 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <button type="button" onClick={resetDefaults} className="text-xs font-bold text-blue-700 hover:underline">
                Login nahi ho raha? Default logins reset karein
              </button>
              {resetMsg && <div className="text-emerald-600 text-xs font-semibold mt-2">{resetMsg}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Ledger computation ---------------- */

function isInvoiceCancelled(inv) {
  return inv.docStatus === "Cancelled";
}

// A payment is "linked" to an invoice either via the explicit invoiceId
// field (new invoices) or via the legacy `Against <number>` note text
// (invoices created before this field existed). Used so that cancelling
// an invoice also reverses the payment that was recorded against it.
function isPaymentLinkedToCancelledInvoice(payment, invoices) {
  if (payment.invoiceId) {
    const inv = invoices.find((i) => i.id === payment.invoiceId);
    return !!inv && isInvoiceCancelled(inv);
  }
  if (payment.note && payment.note.startsWith("Against ")) {
    const num = payment.note.replace("Against ", "").trim();
    const inv = invoices.find((i) => i.number === num);
    return !!inv && isInvoiceCancelled(inv);
  }
  return false;
}

// Phase 2: computeLedgerForCustomer optionally takes `returns` and
// `exchanges` arrays. Both params default to [] so every existing call
// site (that doesn't know about them yet) keeps working exactly as before.
// Phase 3: also optionally takes `promises` ([] default, same backward-
// compatible pattern) to add "Promise Created" / "Payment Against Promise"
// ledger lines (Feature 6). Promise-created lines are informational only
// (0 debit / 0 credit) so they never change the running balance; only the
// actual payment (already logged as a Payment entry) affects the balance.
function computeLedgerForCustomer(customer, invoices, payments, returns = [], exchanges = [], promises = []) {
  const entries = [];
  invoices
    .filter((i) => i.customerId === customer.id && !isInvoiceCancelled(i))
    .forEach((inv) =>
      entries.push({ date: inv.date, type: "Invoice", ref: inv.number, debit: inv.total, credit: 0, id: inv.id })
    );
  payments
    .filter((p) => p.customerId === customer.id && !isPaymentLinkedToCancelledInvoice(p, invoices))
    .forEach((p) =>
      entries.push({ date: p.date, type: p.promiseId ? "Payment Against Promise" : "Payment", ref: p.promiseId ? (promises.find((pr) => pr.id === p.promiseId)?.code || p.method || "Cash") : (p.method || "Cash"), debit: 0, credit: p.amount, id: p.id })
    );
  returns
    .filter((r) => r.customerId === customer.id && r.status !== "Deleted")
    .forEach((r) =>
      entries.push({ date: r.date, type: "Sales Return", ref: r.code, debit: 0, credit: r.amount, id: r.id })
    );
  exchanges
    .filter((ex) => ex.customerId === customer.id && ex.status !== "Deleted")
    .forEach((ex) => {
      if (ex.difference > 0) {
        entries.push({ date: ex.date, type: "Exchange (Extra Charge)", ref: ex.code, debit: ex.difference, credit: 0, id: ex.id });
      } else if (ex.difference < 0) {
        entries.push({ date: ex.date, type: "Exchange (Refund Credit)", ref: ex.code, debit: 0, credit: Math.abs(ex.difference), id: ex.id });
      }
    });
  promises
    .filter((p) => p.customerId === customer.id && p.status !== "Deleted")
    .forEach((p) =>
      entries.push({ date: p.promiseDate, type: `Promise Created (${p.status})`, ref: p.code, debit: 0, credit: 0, id: p.id })
    );
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  let bal = Number(customer.openingBalance) || 0;
  const withBalance = entries.map((e) => {
    bal = bal + e.debit - e.credit;
    return { ...e, balance: bal };
  });
  return { entries: withBalance, outstanding: bal };
}

/* ---------------- Invoice Return/Exchange status helpers (Phase 2 upgrade) ---------------- */

// Returns the list of active (non-deleted) Sales Returns for an invoice.
function returnsForInvoice(invoiceId, returns) {
  return returns.filter((r) => r.invoiceId === invoiceId && r.status !== "Deleted");
}
// Returns the list of active (non-deleted) Exchanges for an invoice.
function exchangesForInvoice(invoiceId, exchanges) {
  return exchanges.filter((ex) => ex.invoiceId === invoiceId && ex.status !== "Deleted");
}

// Per line-item remaining quantity = original qty - qty returned (via Sales
// Return) - qty returned-as-part-of-exchange (via Exchange's returnedItems).
// Matching is done by itemIndex (stamped onto return/exchange line items
// when they are created) so it stays correct even if two items share a name.
function computeInvoiceItemBreakdown(invoice, returns, exchanges) {
  const activeReturns = returnsForInvoice(invoice.id, returns);
  const activeExchanges = exchangesForInvoice(invoice.id, exchanges);
  return invoice.items.map((it, idx) => {
    const returnedQty = activeReturns.reduce((sum, r) => {
      const line = (r.items || []).find((x) => x.itemIndex === idx);
      return sum + (line ? Number(line.qtyReturned) || 0 : 0);
    }, 0);
    const exchangedQty = activeExchanges.reduce((sum, ex) => {
      const line = (ex.returnedItems || []).find((x) => x.itemIndex === idx);
      return sum + (line ? Number(line.qty) || 0 : 0);
    }, 0);
    const remainingQty = Math.max(0, Number(it.qty) - returnedQty - exchangedQty);
    return { ...it, itemIndex: idx, returnedQty, exchangedQty, remainingQty };
  });
}

// Computes the overall invoice status per Feature 4 / Feature 5:
// Normal, Partially Returned, Fully Returned, Partially Exchanged,
// Fully Exchanged, Returned + Exchanged.
function computeInvoiceReturnStatus(invoice, returns, exchanges) {
  const breakdown = computeInvoiceItemBreakdown(invoice, returns, exchanges);
  const totalOriginal = breakdown.reduce((s, it) => s + Number(it.qty), 0);
  const totalReturned = breakdown.reduce((s, it) => s + it.returnedQty, 0);
  const totalExchanged = breakdown.reduce((s, it) => s + it.exchangedQty, 0);
  const totalRemaining = breakdown.reduce((s, it) => s + it.remainingQty, 0);
  const hasReturn = totalReturned > 0;
  const hasExchange = totalExchanged > 0;
  const isFullyConsumed = totalRemaining <= 0 && totalOriginal > 0;

  let status = "Normal";
  if (hasReturn && hasExchange) {
    status = "Returned + Exchanged";
  } else if (hasExchange) {
    status = isFullyConsumed ? "Fully Exchanged" : "Partially Exchanged";
  } else if (hasReturn) {
    status = isFullyConsumed ? "Fully Returned" : "Partially Returned";
  }

  return {
    breakdown, totalOriginal, totalReturned, totalExchanged, totalRemaining,
    isFullyConsumed, isLocked: isFullyConsumed, status,
  };
}

const RETURN_STATUS_TONE = {
  "Normal": "bg-slate-100 text-slate-500",
  "Partially Returned": "bg-blue-100 text-blue-700",
  "Fully Returned": "bg-red-100 text-red-700",
  "Partially Exchanged": "bg-blue-100 text-blue-700",
  "Fully Exchanged": "bg-amber-100 text-amber-700",
  "Returned + Exchanged": "bg-purple-100 text-purple-700",
};

/* ---------------- Promise To Pay helpers (Phase 3) ---------------- */

const PROMISE_STATUS_TONE = {
  "Pending": "bg-blue-100 text-blue-700",
  "Partially Paid": "bg-amber-100 text-amber-700",
  "Completed": "bg-emerald-100 text-emerald-700",
  "Broken Promise": "bg-red-100 text-red-700",
  "Cancelled": "bg-slate-200 text-slate-600",
};

// Feature 11 — Auto Status. Given a raw promise record, derives the
// effective status: if manually Completed/Cancelled that's kept as-is;
// otherwise Pending/Partially Paid flips to "Broken Promise" once the
// Expected Payment Date has passed and money is still owed.
function computePromiseStatus(promise) {
  if (promise.status === "Completed" || promise.status === "Cancelled" || promise.status === "Deleted") {
    return promise.status;
  }
  const paid = Number(promise.paidAmount) || 0;
  const amount = Number(promise.amount) || 0;
  const remaining = Math.max(0, amount - paid);
  if (remaining <= 0) return "Completed";
  const isOverdue = promise.expectedDate && todayISO() > promise.expectedDate;
  if (isOverdue) return "Broken Promise";
  return paid > 0 ? "Partially Paid" : "Pending";
}

function promiseWithComputed(promise) {
  const paid = Number(promise.paidAmount) || 0;
  const amount = Number(promise.amount) || 0;
  const remaining = Math.max(0, amount - paid);
  return { ...promise, paidAmount: paid, remainingAmount: remaining, status: computePromiseStatus(promise) };
}

/* ---------------- Dashboard ---------------- */

function Dashboard({ customers, invoices, payments, returns, exchanges, promises, leads, bookings, onOpenPromises }) {
  const outstandingTotal = useMemo(() => {
    return customers.reduce((sum, c) => sum + computeLedgerForCustomer(c, invoices, payments, returns, exchanges, promises).outstanding, 0);
  }, [customers, invoices, payments, returns, exchanges, promises]);

  const todaySales = useMemo(() => {
    const t = todayISO();
    return invoices.filter((i) => i.date === t && !isInvoiceCancelled(i)).reduce((s, i) => s + i.total, 0);
  }, [invoices]);

  const monthSales = useMemo(() => {
    const m = todayISO().slice(0, 7);
    return invoices.filter((i) => i.date.startsWith(m) && !isInvoiceCancelled(i)).reduce((s, i) => s + i.total, 0);
  }, [invoices]);

  const activeLeads = leads.filter((l) => l.status !== "Won" && l.status !== "Lost").length;
  const openBookings = bookings.filter((b) => b.status === "Booked" || b.status === "Partially Delivered").length;

  const recentInvoices = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  // Feature 8 — Promise dashboard cards
  const activePromises = useMemo(() => promises.filter((p) => p.status !== "Deleted").map(promiseWithComputed), [promises]);
  const t = todayISO();
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in7ISO = in7.toISOString().slice(0, 10);
  const todaysPromises = activePromises.filter((p) => p.expectedDate === t && (p.status === "Pending" || p.status === "Partially Paid"));
  const upcomingPromises = activePromises.filter((p) => p.expectedDate > t && p.expectedDate <= in7ISO && (p.status === "Pending" || p.status === "Partially Paid"));
  const overduePromises = activePromises.filter((p) => p.status === "Broken Promise");
  const pendingPromises = activePromises.filter((p) => p.status === "Pending" || p.status === "Partially Paid");
  const completedPromises = activePromises.filter((p) => p.status === "Completed");
  const brokenPromises = activePromises.filter((p) => p.status === "Broken Promise");
  const totalPromisedAmount = activePromises.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const promiseCustomers = new Set(activePromises.map((p) => p.customerId)).size;

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Dashboard</h2>

      {/* Feature 9 — Home Alert: today's promise collections */}
      {todaysPromises.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-4 mb-4 cursor-pointer hover:bg-amber-100" onClick={onOpenPromises}>
          <div className="text-[11px] uppercase tracking-wide font-black text-amber-700 mb-2">Today's Promise Collection</div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {todaysPromises.map((p) => (
              <div key={p.id}><span className="font-bold">{p.customerName}</span> — <span className="font-black text-amber-700">{fmtMoney(p.remainingAmount)}</span></div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <Stat label="Today's Sales" value={fmtMoney(todaySales)} />
        <Stat label="This Month" value={fmtMoney(monthSales)} />
        <Stat label="Total Outstanding" value={fmtMoney(outstandingTotal)} accent="text-red-600" />
        <Stat label="Active Leads" value={activeLeads} />
        <Stat label="Open Bookings" value={openBookings} />
        <Stat label="Customers" value={customers.length} />
      </div>

      <div className="text-xs font-black uppercase tracking-wide text-slate-500 mb-2">Promise To Pay Overview</div>
      <div className="flex flex-wrap gap-3 mb-6">
        <Stat label="Today's Promises" value={todaysPromises.length} accent="text-blue-700" />
        <Stat label="Upcoming (7 Days)" value={upcomingPromises.length} />
        <Stat label="Overdue Promises" value={overduePromises.length} accent="text-red-600" />
        <Stat label="Pending Promises" value={pendingPromises.length} />
        <Stat label="Completed Promises" value={completedPromises.length} accent="text-emerald-600" />
        <Stat label="Broken Promises" value={brokenPromises.length} accent="text-red-600" />
        <Stat label="Total Promised Amount" value={fmtMoney(totalPromisedAmount)} />
        <Stat label="Promise Customers" value={promiseCustomers} />
      </div>

      <div className="bg-white border border-slate-200">
        <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">
          Recent Invoices
        </div>
        <table className="w-full text-sm">
          <tbody>
            {recentInvoices.length === 0 && (
              <tr><td className="px-4 py-6 text-slate-400 text-center" colSpan={4}>Koi invoice nahi bana abhi tak.</td></tr>
            )}
            {recentInvoices.map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-bold">{inv.number}</td>
                <td className="px-4 py-2">{inv.customerName}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(inv.date)}</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(inv.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Customers ---------------- */

function CustomerForm({ initial, branches, currentUser, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: "", phone: "", address: "", creditLimit: 0, openingBalance: 0, audienceType: "Builder", portalUsername: "", portalPassword: "", branchId: currentUser?.branchId || "" }
  );
  const isLocked = !!currentUser?.branchId;
  return (
    <div>
      <Field label="Customer Name">
        <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Phone (with WhatsApp, e.g. 03001234567)">
        <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </Field>
      <Field label="Address">
        <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </Field>
      {branches.length > 0 && (
        <Field label="Branch">
          {isLocked ? (
            <div className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2">
              {branches.find((b) => b.id === currentUser.branchId)?.name || "Your Branch"}
            </div>
          ) : (
            <select className={inputCls} value={form.branchId || ""} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">Unassigned (visible to Super Admin only)</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Credit Limit (Rs)">
          <input type="number" className={inputCls} value={form.creditLimit}
            onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} />
        </Field>
        <Field label="Opening Balance (Rs)">
          <input type="number" className={inputCls} value={form.openingBalance}
            onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })} />
        </Field>
      </div>
      <Field label="Audience Type (for Sales Assistant)">
        <select className={inputCls} value={form.audienceType || "Builder"} onChange={(e) => setForm({ ...form, audienceType: e.target.value })}>
          {AUDIENCE_TYPES.map((a) => <option key={a}>{a}</option>)}
        </select>
      </Field>
      <div className="border-t border-slate-200 mt-3 pt-3">
        <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-2">Customer Portal Login (optional)</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Portal Username">
            <input className={inputCls} value={form.portalUsername || ""} onChange={(e) => setForm({ ...form, portalUsername: e.target.value })} />
          </Field>
          <Field label="Portal Password">
            <input className={inputCls} value={form.portalPassword || ""} onChange={(e) => setForm({ ...form, portalPassword: e.target.value })} />
          </Field>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <Btn onClick={() => form.name.trim() && onSave(form)}>Save Customer</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function Customers({ customers, invoices, payments, returns, exchanges, promises, saveCustomer, deleteCustomer, openLedger, branches, currentUser }) {
  const [modal, setModal] = useState(null); // null | 'new' | customer object
  const [q, setQ] = useState("");

  const rows = customers
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone || "").includes(q))
    .map((c) => {
      const { outstanding } = computeLedgerForCustomer(c, invoices, payments, returns, exchanges, promises);
      return { ...c, outstanding };
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Customers</h2>
        <Btn onClick={() => setModal("new")}>+ New Customer</Btn>
      </div>
      <input
        className={`${inputCls} mb-3 max-w-xs`}
        placeholder="Search name or phone..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2 text-right">Credit Limit</th>
              <th className="px-4 py-2 text-right">Outstanding</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Koi customer nahi mila.</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-bold cursor-pointer hover:text-blue-700" onClick={() => openLedger(c.id)}>{c.name}</td>
                <td className="px-4 py-2 text-slate-500">{c.phone}</td>
                <td className="px-4 py-2 text-right">{fmtMoney(c.creditLimit)}</td>
                <td className={`px-4 py-2 text-right font-bold ${c.outstanding > (c.creditLimit || Infinity) ? "text-red-600" : ""}`}>
                  {fmtMoney(c.outstanding)}
                  {c.creditLimit > 0 && c.outstanding > c.creditLimit && (
                    <div className="text-[10px] font-bold text-red-600 uppercase">Over limit</div>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button className="text-xs font-bold text-slate-500 hover:text-blue-700 mr-3" onClick={() => setModal(c)}>Edit</button>
                  <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => { if (confirm(`Delete ${c.name}?`)) deleteCustomer(c.id); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === "new" ? "New Customer" : "Edit Customer"} onClose={() => setModal(null)}>
          <CustomerForm
            initial={modal === "new" ? null : modal}
            branches={branches}
            currentUser={currentUser}
            onCancel={() => setModal(null)}
            onSave={(data) => { saveCustomer(modal === "new" ? { ...data, id: uid("c") } : data); setModal(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Ledger view ---------------- */

function LedgerView({ customers, invoices, payments, returns, exchanges, promises, focusId, setFocusId, settings }) {
  const customer = customers.find((c) => c.id === focusId) || customers[0];
  if (!customer) return <div className="text-slate-400">Pehle koi customer add karein.</div>;
  const { entries, outstanding } = computeLedgerForCustomer(customer, invoices, payments, returns, exchanges, promises);
  const myPromises = (promises || []).filter((p) => p.customerId === customer.id && p.status !== "Deleted").map(promiseWithComputed);

  function downloadPDF() {
    window.print();
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Ledger</h2>
      <div className="flex gap-3 items-center mb-4 flex-wrap">
        <select className={`${inputCls} max-w-xs`} value={customer.id} onChange={(e) => setFocusId(e.target.value)}>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="text-sm">
          Outstanding: <span className={`font-black ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtMoney(outstanding)}</span>
        </div>
        <Btn variant="dark" onClick={downloadPDF}>Download PDF</Btn>
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Ref</th>
              <th className="px-4 py-2 text-right">Debit</th>
              <th className="px-4 py-2 text-right">Credit</th>
              <th className="px-4 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100 bg-slate-50">
              <td className="px-4 py-2 text-slate-500" colSpan={5}>Opening Balance</td>
              <td className="px-4 py-2 text-right font-bold">{fmtMoney(customer.openingBalance || 0)}</td>
            </tr>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{fmtDate(e.date)}</td>
                <td className="px-4 py-2">{e.type}</td>
                <td className="px-4 py-2 text-slate-500">{e.ref}</td>
                <td className="px-4 py-2 text-right text-red-600">{e.debit ? fmtMoney(e.debit) : ""}</td>
                <td className="px-4 py-2 text-right text-emerald-600">{e.credit ? fmtMoney(e.credit) : ""}</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(e.balance)}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Koi entry nahi.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Feature 5 — Customer Profile: Promise History */}
      <div className="mt-6 bg-white border border-slate-200 overflow-x-auto print:hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">Promise History</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Promise No</th><th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Promise Date</th><th className="px-4 py-2">Expected Date</th>
              <th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Paid</th><th className="px-4 py-2 text-right">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {myPromises.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Koi promise nahi.</td></tr>}
            {myPromises.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-black text-blue-700">{p.code}</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(p.amount)}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(p.promiseDate)}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(p.expectedDate)}</td>
                <td className="px-4 py-2"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${PROMISE_STATUS_TONE[p.status]}`}>{p.status}</span></td>
                <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmtMoney(p.paidAmount)}</td>
                <td className="px-4 py-2 text-right text-red-600 font-bold">{fmtMoney(p.remainingAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hidden printable ledger — only rendered visible during print/PDF export */}
      <div id="print-ledger" style={{ display: "none" }}>
        <div className="bg-white">
          <div className="flex justify-between items-start pb-4 border-b-4 border-slate-900 mb-4">
            <div className="flex items-center gap-3">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
              ) : (
                <div className="w-14 h-14 bg-slate-900 flex items-center justify-center font-black text-xl text-white">CT</div>
              )}
              <div>
                <div className="text-xl font-black uppercase tracking-tight text-slate-900">{settings?.companyName}</div>
                <div className="text-[11px] uppercase tracking-wide font-bold text-blue-700">Construction Materials Supplier</div>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{settings?.companyAddress}</div>
              {settings?.companyPhone && <div>Ph: {settings.companyPhone}</div>}
            </div>
          </div>

          <div className="flex justify-between items-start mb-4">
            <div className="text-sm">
              <div className="text-[11px] uppercase tracking-wide font-bold text-slate-400 mb-0.5">Customer Ledger</div>
              <div className="font-bold text-slate-900">{customer.name}</div>
              {customer.phone && <div className="text-slate-500">{customer.phone}</div>}
              {customer.address && <div className="text-slate-500">{customer.address}</div>}
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Date: <span className="font-bold text-slate-700">{fmtDate(todayISO())}</span></div>
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wide">
                <th className="py-2 px-2 text-left">Date</th>
                <th className="py-2 px-2 text-left">Type</th>
                <th className="py-2 px-2 text-left">Ref</th>
                <th className="py-2 px-2 text-right">Debit</th>
                <th className="py-2 px-2 text-right">Credit</th>
                <th className="py-2 px-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 bg-slate-50">
                <td className="py-2 px-2 text-slate-500" colSpan={5}>Opening Balance</td>
                <td className="py-2 px-2 text-right font-bold">{fmtMoney(customer.openingBalance || 0)}</td>
              </tr>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-slate-100">
                  <td className="py-2 px-2">{fmtDate(e.date)}</td>
                  <td className="py-2 px-2">{e.type}</td>
                  <td className="py-2 px-2 text-slate-500">{e.ref}</td>
                  <td className="py-2 px-2 text-right text-red-600">{e.debit ? fmtMoney(e.debit) : ""}</td>
                  <td className="py-2 px-2 text-right text-emerald-600">{e.credit ? fmtMoney(e.credit) : ""}</td>
                  <td className="py-2 px-2 text-right font-bold">{fmtMoney(e.balance)}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={6} className="py-4 px-2 text-center text-slate-400">Koi entry nahi.</td></tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-72 text-sm space-y-1.5">
              <div className="flex justify-between border-t-2 border-slate-900 pt-2 mt-1">
                <span className="font-black uppercase text-blue-700">Total Outstanding</span>
                <span className="font-black text-lg text-blue-700">{fmtMoney(outstanding)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Invoices ---------------- */

function InvoiceForm({ customers, products, drivers, bookings, invoices, payments, returns, exchanges, promises, prefill, editingInvoice, currentUser, onSave, onCancel, nextNumber }) {
  const isEdit = !!editingInvoice;
  const [customerId, setCustomerId] = useState(editingInvoice?.customerId || prefill?.customerId || customers[0]?.id || "");
  const [date, setDate] = useState(editingInvoice?.date || todayISO());
  const [items, setItems] = useState(
    editingInvoice
      ? editingInvoice.items.map((it) => ({ id: uid("it"), productId: "", name: it.name, unit: it.unit || "Bag", qty: it.qty, price: it.price }))
      : prefill
      ? [{ id: uid("it"), productId: prefill.productId || "", name: prefill.productName || "", unit: prefill.unit || "Bag", qty: prefill.qty || 1, price: prefill.rate || 0 }]
      : [{ id: uid("it"), productId: "", name: "", unit: "Bag", qty: 1, price: 0 }]
  );
  const [rickshawRent, setRickshawRent] = useState(editingInvoice?.rickshawRent || 0);
  const [deliveryCharges, setDeliveryCharges] = useState(editingInvoice?.deliveryCharges || 0);
  const [discount, setDiscount] = useState(editingInvoice?.discount || 0);
  const [driverIdInput, setDriverIdInput] = useState(editingInvoice?.driverId || "");
  const [manualDriverName, setManualDriverName] = useState(editingInvoice && !editingInvoice.driverId ? editingInvoice.driverName || "" : "");
  const [paymentReceived, setPaymentReceived] = useState(editingInvoice?.paymentReceived || 0);
  const [receivedBy, setReceivedBy] = useState(editingInvoice?.receivedBy || "");
  const [issuedToName, setIssuedToName] = useState(editingInvoice?.issuedTo?.name || "");
  const [issuedToPhone, setIssuedToPhone] = useState(editingInvoice?.issuedTo?.phone || "");
  const [issuedToRelation, setIssuedToRelation] = useState(editingInvoice?.issuedTo?.relation || "");
  const [issuedToRemarks, setIssuedToRemarks] = useState(editingInvoice?.issuedTo?.remarks || "");

  const matchedDriver = drivers.find((d) => d.code.toLowerCase() === driverIdInput.trim().toLowerCase());

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const previousOutstanding = isEdit
    ? (editingInvoice.previousOutstanding || 0)
    : selectedCustomer
    ? computeLedgerForCustomer(selectedCustomer, invoices, payments, returns, exchanges, promises).outstanding
    : 0;

  // Previously used "Issued To" names for this customer, so staff can
  // quickly re-select someone who has collected material before.
  const previousIssuedTo = Array.from(
    new Set(
      invoices
        .filter((inv) => inv.customerId === customerId && inv.issuedTo?.name && inv.id !== editingInvoice?.id)
        .map((inv) => inv.issuedTo.name)
    )
  );

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const total = subtotal + (Number(rickshawRent) || 0) + (Number(deliveryCharges) || 0) - (Number(discount) || 0);
  const balanceDue = total - (Number(paymentReceived) || 0);

  function updateItem(id, patch) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { id: uid("it"), productId: "", name: "", unit: "Bag", qty: 1, price: 0 }]);
  }
  function removeItem(id) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  }
  function pickProduct(id, productId) {
    const p = products.find((p) => p.id === productId);
    updateItem(id, { productId, name: p ? p.name : "", unit: p ? p.unit : "Bag", price: p ? p.price : 0 });
  }

  function submit() {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) { alert("Pehle customer select karein."); return; }
    const cleanItems = items.filter((it) => it.name && Number(it.qty) > 0);
    if (cleanItems.length === 0) { alert("Kam az kam ek item add karein."); return; }
    const issuedTo = issuedToName.trim()
      ? { name: issuedToName.trim(), phone: issuedToPhone.trim(), relation: issuedToRelation, remarks: issuedToRemarks.trim() }
      : null;

    const base = {
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone || "",
      customerAddress: customer.address || "",
      previousOutstanding,
      date,
      items: cleanItems.map((it) => ({ name: it.name, unit: it.unit || "", qty: Number(it.qty), price: Number(it.price), total: Number(it.qty) * Number(it.price) })),
      rickshawRent: Number(rickshawRent) || 0,
      deliveryCharges: Number(deliveryCharges) || 0,
      discount: Number(discount) || 0,
      driverId: matchedDriver ? matchedDriver.code : "",
      driverName: matchedDriver ? matchedDriver.name : manualDriverName,
      vehicleType: matchedDriver ? matchedDriver.vehicleType : "",
      vehicleNumber: matchedDriver ? matchedDriver.vehicleNumber : "",
      receivedBy,
      subtotal,
      total,
      paymentReceived: Number(paymentReceived) || 0,
      balanceDue,
      status: balanceDue <= 0 ? "Paid" : paymentReceived > 0 ? "Partial" : "Unpaid",
      issuedTo,
    };

    if (isEdit) {
      onSave({
        ...editingInvoice,
        ...base,
        // Preserve identity + lifecycle fields
        id: editingInvoice.id,
        number: editingInvoice.number,
      });
    } else {
      onSave({
        id: uid("inv"),
        number: nextNumber,
        ...base,
        docStatus: "Active",
        editHistory: [],
        fromBookingId: prefill?.sourceType === "booking" ? prefill.sourceId : "",
        bookingRef: prefill?.sourceType === "booking" ? prefill.sourceCode : "",
        fromOrderId: prefill?.sourceType === "order" ? prefill.sourceId : "",
        orderRef: prefill?.sourceType === "order" ? prefill.sourceCode : "",
      });
    }
  }

  return (
    <div>
      {prefill && (
        <div className="bg-blue-50 border border-blue-200 p-3 mb-3 text-xs">
          <div className="font-black uppercase text-blue-700">
            {prefill.sourceType === "booking" ? `Advance Booking ${prefill.sourceCode} se banaya ja raha hai` : `Order ${prefill.sourceCode} se banaya ja raha hai`}
          </div>
          {prefill.sourceType === "booking" && (
            <div className="text-blue-700 mt-0.5">Rate lock hai — is item ka daam invoice mein change na karein, warna customer se galat charge hoga.</div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Customer">
          <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      {selectedCustomer && (
        <div className="bg-slate-50 border border-slate-200 p-3 mb-3 text-sm">
          <div className="grid grid-cols-2 gap-y-1">
            <div><span className="text-slate-500">Phone:</span> <span className="font-bold">{selectedCustomer.phone || "-"}</span></div>
            <div><span className="text-slate-500">Credit Limit:</span> <span className="font-bold">{fmtMoney(selectedCustomer.creditLimit)}</span></div>
            <div className="col-span-2"><span className="text-slate-500">Address:</span> <span className="font-bold">{selectedCustomer.address || "-"}</span></div>
            <div className="col-span-2 pt-1 border-t border-slate-200 mt-1">
              <span className="text-slate-500">Current Outstanding {isEdit ? "(before this invoice, at time of creation)" : "(before this invoice)"}:</span>{" "}
              <span className={`font-black ${previousOutstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtMoney(previousOutstanding)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1 mt-3">Items</div>
      <div className="space-y-2 mb-2">
        {items.map((it) => (
          <div key={it.id} className="flex gap-2 items-center">
            <select className={`${inputCls} w-36`} value={it.productId} onChange={(e) => pickProduct(it.id, e.target.value)}>
              <option value="">Custom item</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className={`${inputCls} flex-1`} placeholder="Item name" value={it.name}
              onChange={(e) => updateItem(it.id, { name: e.target.value })} />
            <input list="unit-suggestions" className={`${inputCls} w-24`} placeholder="Unit" value={it.unit || ""} onChange={(e) => updateItem(it.id, { unit: e.target.value })} />
            <input type="number" className={`${inputCls} w-16`} placeholder="Qty" value={it.qty}
              onChange={(e) => updateItem(it.id, { qty: e.target.value })} />
            <input type="number" className={`${inputCls} w-24`} placeholder="Price" value={it.price}
              onChange={(e) => updateItem(it.id, { price: e.target.value })} />
            <div className="w-24 text-right text-sm font-bold">{fmtMoney((it.qty || 0) * (it.price || 0))}</div>
            <button onClick={() => removeItem(it.id)} className="text-slate-400 hover:text-red-600 text-lg leading-none">×</button>
          </div>
        ))}
      </div>
      <datalist id="unit-suggestions">{UNIT_OPTS.map((u) => <option key={u} value={u} />)}</datalist>
      <Btn variant="ghost" small onClick={addItem}>+ Add Item</Btn>

      <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1 mt-4">Rickshaw &amp; Delivery</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rickshaw Rent (Rs)">
          <input type="number" className={inputCls} value={rickshawRent} onChange={(e) => setRickshawRent(e.target.value)} />
        </Field>
        <Field label="Delivery Charges (Rs)">
          <input type="number" className={inputCls} value={deliveryCharges} onChange={(e) => setDeliveryCharges(e.target.value)} />
        </Field>
        <Field label="Driver ID">
          <input
            className={inputCls}
            list="driver-id-list"
            placeholder="e.g. DRV-0001"
            value={driverIdInput}
            onChange={(e) => setDriverIdInput(e.target.value)}
          />
          <datalist id="driver-id-list">
            {drivers.map((d) => <option key={d.id} value={d.code}>{d.name} — {d.vehicleType}</option>)}
          </datalist>
          {driverIdInput.trim() && (
            matchedDriver ? (
              <div className="text-xs text-emerald-600 font-bold mt-1">
                {matchedDriver.name} · {matchedDriver.vehicleType}{matchedDriver.vehicleNumber ? ` (${matchedDriver.vehicleNumber})` : ""}
              </div>
            ) : (
              <div className="text-xs text-red-600 font-bold mt-1">ID nahi mila — Drivers tab mein add karein, ya neeche naam type karein.</div>
            )
          )}
        </Field>
        {!matchedDriver && (
          <Field label="Driver Name (agar ID na ho)">
            <input className={inputCls} value={manualDriverName} onChange={(e) => setManualDriverName(e.target.value)} />
          </Field>
        )}
        <Field label="Payment Received By">
          <input className={inputCls} value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Discount (Rs)">
          <input type="number" className={inputCls} value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </Field>
        <Field label="Payment Received Now (Rs)">
          <input type="number" className={inputCls} value={paymentReceived} onChange={(e) => setPaymentReceived(e.target.value)} />
        </Field>
      </div>

      <div className="border-t border-slate-200 mt-3 pt-3">
        <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Material Issued To (agar account owner khud collect nahi kar raha)</div>
        <div className="text-[11px] text-slate-400 mb-2">Customer account waisa hi rahega — sirf ye note hoga ke material kis ne collect kiya.</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Issued To Name">
            <input className={inputCls} list="issued-to-list" placeholder="e.g. Aslam" value={issuedToName} onChange={(e) => setIssuedToName(e.target.value)} />
            <datalist id="issued-to-list">{previousIssuedTo.map((n) => <option key={n} value={n} />)}</datalist>
          </Field>
          <Field label="Mobile Number (Optional)">
            <input className={inputCls} value={issuedToPhone} onChange={(e) => setIssuedToPhone(e.target.value)} />
          </Field>
          <Field label="Relation">
            <select className={inputCls} value={issuedToRelation} onChange={(e) => setIssuedToRelation(e.target.value)}>
              <option value="">Select</option>
              <option>Worker</option><option>Mistri</option><option>Driver</option><option>Supervisor</option><option>Family</option><option>Other</option>
            </select>
          </Field>
          <Field label="Remarks">
            <input className={inputCls} value={issuedToRemarks} onChange={(e) => setIssuedToRemarks(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-3 mt-2 text-sm space-y-1">
        <div className="flex justify-between text-slate-500"><span>Previous Balance</span><span>{fmtMoney(previousOutstanding)}</span></div>
        <div className="flex justify-between"><span>New Purchase</span><span className="font-bold">{fmtMoney(subtotal)}</span></div>
        <div className="flex justify-between"><span>Rickshaw + Delivery</span><span className="font-bold">{fmtMoney((Number(rickshawRent) || 0) + (Number(deliveryCharges) || 0))}</span></div>
        <div className="flex justify-between"><span>Discount</span><span className="font-bold">-{fmtMoney(discount)}</span></div>
        <div className="flex justify-between"><span>Payment Received</span><span className="font-bold">-{fmtMoney(paymentReceived)}</span></div>
        <div className="flex justify-between text-base border-t border-slate-300 pt-1"><span className="font-bold">Outstanding Balance</span><span className="font-black text-red-600">{fmtMoney(previousOutstanding + balanceDue)}</span></div>
      </div>

      <div className="flex gap-2 mt-4">
        <Btn onClick={submit}>{isEdit ? `Save Changes to Invoice ${editingInvoice.number}` : `Save Invoice ${nextNumber}`}</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function invoiceStatusBanner(invoice) {
  if (invoice.docStatus === "Cancelled") return { text: "Invoice Cancelled — Reversed From Ledger", tone: "slate" };
  const thisPaid = invoice.balanceDue <= 0;
  const prevDue = (invoice.previousOutstanding || 0) > 0;
  if (thisPaid && !prevDue) return { text: "Paid in Full", tone: "emerald" };
  if (thisPaid && prevDue) return { text: "This Invoice Paid \u00B7 Previous Outstanding Still Due", tone: "amber" };
  if (invoice.paymentReceived > 0) return { text: `Partial Payment Received \u2014 Balance Due on Current Purchase${prevDue ? " \u00B7 Previous Outstanding Still Due" : ""}`, tone: "amber" };
  return { text: `Unpaid \u2014 Balance Due on Current Purchase${prevDue ? " \u00B7 Previous Outstanding Still Due" : ""}`, tone: "red" };
}

function InvoiceDetail({ invoice, settings, returns, exchanges, onClose, onEdit, onCancelInvoice, onGoToReturn, onGoToExchange, onCreateNewFromInvoice }) {
  const banner = invoiceStatusBanner(invoice);
  const bannerCls = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
    slate: "bg-slate-100 text-slate-600 border-slate-300",
  }[banner.tone];
  const outstandingNow = (invoice.previousOutstanding || 0) + invoice.balanceDue;
  const hasDelivery = invoice.rickshawRent > 0 || invoice.deliveryCharges > 0 || invoice.driverName || invoice.receivedBy;
  const isCancelled = invoice.docStatus === "Cancelled";

  const rs = (returns && exchanges) ? computeInvoiceReturnStatus(invoice, returns, exchanges) : null;
  const myReturns = returns ? returnsForInvoice(invoice.id, returns) : [];
  const myExchanges = exchanges ? exchangesForInvoice(invoice.id, exchanges) : [];

  return (
    <Modal title={`Invoice ${invoice.number}`} onClose={onClose} wide>
      <div id="print-invoice" className="bg-white">
        <div className="flex justify-between items-start pb-4 border-b-4 border-slate-900 mb-4">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
            ) : (
              <div className="w-14 h-14 bg-slate-900 flex items-center justify-center font-black text-xl text-white">CT</div>
            )}
            <div>
              <div className="text-xl font-black uppercase tracking-tight text-slate-900">{settings.companyName}</div>
              <div className="text-[11px] uppercase tracking-wide font-bold text-blue-700">Construction Materials Supplier</div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>{settings.companyAddress}</div>
            {settings.companyPhone && <div>Ph: {settings.companyPhone}</div>}
          </div>
        </div>

        <div className="flex justify-between items-start mb-4">
          <div className="text-sm">
            <div className="text-[11px] uppercase tracking-wide font-bold text-slate-400 mb-0.5">Bill To</div>
            <div className="font-bold text-slate-900">{invoice.customerName}</div>
            {invoice.customerPhone && <div className="text-slate-500">{invoice.customerPhone}</div>}
            {invoice.customerAddress && <div className="text-slate-500">{invoice.customerAddress}</div>}
            {invoice.issuedTo?.name && (
              <div className="mt-2 text-xs bg-blue-50 border border-blue-200 px-2 py-1 inline-block">
                <span className="text-blue-700 font-bold uppercase">Material Issued To:</span>{" "}
                <span className="font-bold text-slate-900">{invoice.issuedTo.name}</span>
                {invoice.issuedTo.relation && <span className="text-slate-500"> ({invoice.issuedTo.relation})</span>}
                {invoice.issuedTo.phone && <span className="text-slate-500"> · {invoice.issuedTo.phone}</span>}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white font-black px-3 py-1 text-sm">{invoice.number}</div>
            <div className="text-xs text-slate-500 mt-1">Date: <span className="font-bold text-slate-700">{fmtDate(invoice.date)}</span></div>
            {rs && rs.status !== "Normal" && (
              <div className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 ${RETURN_STATUS_TONE[rs.status]}`}>{rs.status}</div>
            )}
          </div>
        </div>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wide">
              <th className="py-2 px-2 text-left">Item</th>
              <th className="py-2 px-2 text-right">Qty</th>
              <th className="py-2 px-2 text-right">Unit</th>
              <th className="py-2 px-2 text-right">Rate</th>
              <th className="py-2 px-2 text-right">Amount</th>
              {rs && <th className="py-2 px-2 text-right">Remaining</th>}
            </tr>
          </thead>
          <tbody>
            {(rs ? rs.breakdown : invoice.items).map((it, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-2 px-2">{it.name}</td>
                <td className="py-2 px-2 text-right">{it.qty}</td>
                <td className="py-2 px-2 text-right text-slate-500">{it.unit || "-"}</td>
                <td className="py-2 px-2 text-right">{fmtMoney(it.price)}</td>
                <td className="py-2 px-2 text-right font-bold">{fmtMoney(it.total)}</td>
                {rs && <td className="py-2 px-2 text-right text-slate-500">{it.remainingQty}{(it.returnedQty > 0 || it.exchangedQty > 0) ? ` (of ${it.qty})` : ""}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {hasDelivery && (
          <div className="mb-4 text-sm">
            <div className="font-bold text-slate-900 mb-1">Rickshaw &amp; Delivery Details</div>
            <div className="text-xs text-slate-500 space-y-0.5">
              {invoice.driverName && (
                <div>
                  Driver: {invoice.driverName}
                  {invoice.driverId ? ` (${invoice.driverId})` : ""}
                  {invoice.vehicleType ? ` — ${invoice.vehicleType}` : ""}
                  {invoice.vehicleNumber ? ` [${invoice.vehicleNumber}]` : ""}
                </div>
              )}
              <div>Rickshaw Rent: {fmtMoney(invoice.rickshawRent)}</div>
              <div>Delivery Charges: {fmtMoney(invoice.deliveryCharges)}</div>
              <div>Payment Received By: {invoice.receivedBy || "-"}</div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <div className="w-72 text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-500">Previous Balance</span><span className="font-bold">{fmtMoney(invoice.previousOutstanding || 0)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">New Purchase</span><span className="font-bold">{fmtMoney(invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Rickshaw + Delivery</span><span className="font-bold">{fmtMoney((invoice.rickshawRent || 0) + (invoice.deliveryCharges || 0))}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-bold">-{fmtMoney(invoice.discount || 0)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Payment Received</span><span className="font-bold">-{fmtMoney(invoice.paymentReceived)}</span></div>
            <div className="flex justify-between border-t-2 border-slate-900 pt-2 mt-1">
              <span className="font-black uppercase text-blue-700">Outstanding Balance</span>
              <span className="font-black text-lg text-blue-700">{fmtMoney(outstandingNow)}</span>
            </div>
          </div>
        </div>

        <div className={`mt-4 border px-3 py-2 text-xs font-bold text-center ${bannerCls}`}>
          ⚠ {banner.text}
        </div>
      </div>

      {(myReturns.length > 0 || myExchanges.length > 0) && (
        <div className="mt-4 print:hidden">
          <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Sales Return &amp; Exchange History</div>
          <div className="border border-slate-200 divide-y divide-slate-100">
            {myReturns.map((r) => (
              <div key={r.id} className="px-3 py-2 text-xs flex justify-between items-center">
                <div>
                  <span className="font-black text-blue-700">{r.code}</span> — Sales Return
                  <div className="text-slate-400">{fmtDate(r.date)} · {r.reason}{r.status === "Deleted" ? " · DELETED" : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600">{fmtMoney(r.amount)}</span>
                  {onGoToReturn && <button className="font-bold text-blue-700 hover:underline" onClick={() => onGoToReturn(r)}>View</button>}
                </div>
              </div>
            ))}
            {myExchanges.map((ex) => (
              <div key={ex.id} className="px-3 py-2 text-xs flex justify-between items-center">
                <div>
                  <span className="font-black text-blue-700">{ex.code}</span> — Exchange
                  <div className="text-slate-400">{fmtDate(ex.date)} · {ex.reason}{ex.status === "Deleted" ? " · DELETED" : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${ex.difference >= 0 ? "text-red-600" : "text-emerald-600"}`}>{ex.difference >= 0 ? "+" : "-"}{fmtMoney(Math.abs(ex.difference))}</span>
                  {onGoToExchange && <button className="font-bold text-blue-700 hover:underline" onClick={() => onGoToExchange(ex)}>View</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rs && rs.isLocked && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-2 print:hidden">
          This invoice has been fully returned. Please create a new invoice.
          {onCreateNewFromInvoice && (
            <button className="ml-2 underline" onClick={() => onCreateNewFromInvoice(invoice)}>Create New Invoice</button>
          )}
        </div>
      )}

      {invoice.editHistory && invoice.editHistory.length > 0 && (
        <div className="mt-4 print:hidden">
          <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Edit History</div>
          <div className="border border-slate-200 divide-y divide-slate-100 max-h-40 overflow-y-auto">
            {[...invoice.editHistory].reverse().map((h, idx) => (
              <div key={idx} className="px-3 py-2 text-xs">
                <div className="font-bold text-slate-700">{h.action} — {h.editedBy}</div>
                <div className="text-slate-400">{fmtDateTime(h.editedAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2 flex-wrap print:hidden">
        <Btn onClick={() => window.print()}>Print / Save as PDF</Btn>
        <a href={waLink(invoice.customerPhone, buildInvoiceWaMessage(invoice, settings))} target="_blank" rel="noreferrer">
          <Btn variant="dark">Share on WhatsApp</Btn>
        </a>
        {!isCancelled && onEdit && <Btn variant="ghost" onClick={() => onEdit(invoice)}>Edit Invoice</Btn>}
        {!isCancelled && onCancelInvoice && (
          <Btn variant="danger" onClick={() => { if (confirm(`Invoice ${invoice.number} cancel karein? Ye ledger se reverse ho jayegi.`)) onCancelInvoice(invoice); }}>
            Cancel Invoice
          </Btn>
        )}
        <Btn variant="ghost" onClick={onClose}>Close</Btn>
      </div>
      {!invoice.customerPhone && (
        <div className="text-xs text-red-600 mt-2 print:hidden">Is customer ka phone number save nahi hai — WhatsApp share ke liye Customers tab mein add karein.</div>
      )}
    </Modal>
  );
}

function buildInvoiceWaMessage(invoice, settings) {
  const outstandingNow = (invoice.previousOutstanding || 0) + invoice.balanceDue;
  const lines = [
    `${settings.companyName} — Invoice ${invoice.number}${invoice.docStatus === "Cancelled" ? " (CANCELLED)" : ""}`,
    `Date: ${fmtDate(invoice.date)}`,
    `Customer: ${invoice.customerName}`,
    ...(invoice.issuedTo?.name ? [`Material Issued To: ${invoice.issuedTo.name}${invoice.issuedTo.relation ? ` (${invoice.issuedTo.relation})` : ""}`] : []),
    "",
    ...invoice.items.map((it) => `${it.name} x${it.qty}${it.unit ? " " + it.unit : ""} = ${fmtMoney(it.total)}`),
    "",
    `New Purchase: ${fmtMoney(invoice.subtotal)}`,
    `Received: ${fmtMoney(invoice.paymentReceived)}`,
    `Balance Due (this invoice): ${fmtMoney(invoice.balanceDue)}`,
    `Total Outstanding Balance: ${fmtMoney(outstandingNow)}`,
  ];
  return lines.join("\n");
}

function Invoices({ customers, products, drivers, invoices, payments, returns, exchanges, promises, bookings, settings, currentUser, saveInvoice, updateInvoice, cancelInvoice, prefill, onClearPrefill, onBookingFulfilled, onOrderFulfilled, focusInvoiceId, setFocusInvoiceId, onGoToReturn, onGoToExchange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewing, setViewing] = useState(null);
  const nextNumber = "CT-" + String(settings.invoiceCounter).padStart(4, "0");

  useEffect(() => {
    if (prefill) setShowForm(true);
  }, [prefill]);

  // Opened from global search / linked-record navigation.
  useEffect(() => {
    if (focusInvoiceId) {
      const inv = invoices.find((i) => i.id === focusInvoiceId);
      if (inv) setViewing(inv);
      setFocusInvoiceId(null);
    }
  }, [focusInvoiceId]);

  function closeForm() {
    setShowForm(false);
    setEditingInvoice(null);
    if (prefill) onClearPrefill();
  }

  function openEdit(inv) {
    setViewing(null);
    setEditingInvoice(inv);
    setShowForm(true);
  }

  function handleCancelInvoice(inv) {
    cancelInvoice(inv);
    setViewing({ ...inv, docStatus: "Cancelled" });
  }

  const sorted = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Invoices</h2>
        <Btn onClick={() => setShowForm(true)} disabled={customers.length === 0}>+ New Invoice</Btn>
      </div>
      {customers.length === 0 && <div className="text-slate-400 mb-3">Pehle Customers tab mein customer add karein.</div>}
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Number</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Date</th>
              <th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">Due</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Return/Exchange</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Koi invoice nahi bana.</td></tr>}
            {sorted.map((inv) => {
              const rs = computeInvoiceReturnStatus(inv, returns, exchanges);
              return (
                <tr key={inv.id} className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 ${inv.docStatus === "Cancelled" ? "opacity-50" : ""}`} onClick={() => setViewing(inv)}>
                  <td className="px-4 py-2 font-bold text-blue-700">{inv.number}</td>
                  <td className="px-4 py-2">{inv.customerName}</td>
                  <td className="px-4 py-2 text-slate-500">{fmtDate(inv.date)}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtMoney(inv.total)}</td>
                  <td className="px-4 py-2 text-right text-red-600 font-bold">{inv.docStatus !== "Cancelled" && inv.balanceDue > 0 ? fmtMoney(inv.balanceDue) : "-"}</td>
                  <td className="px-4 py-2">
                    {inv.docStatus === "Cancelled" ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-200 text-slate-600">Cancelled</span>
                    ) : (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${inv.status === "Paid" ? "bg-emerald-100 text-emerald-700" : inv.status === "Partial" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{inv.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {rs.status !== "Normal" && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${RETURN_STATUS_TONE[rs.status]}`}>{rs.status}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showForm && (
        <Modal title={editingInvoice ? `Edit Invoice ${editingInvoice.number}` : prefill ? `New Invoice — from ${prefill.sourceCode}` : "New Invoice"} onClose={closeForm} wide>
          <InvoiceForm
            customers={customers}
            products={products}
            drivers={drivers}
            bookings={bookings}
            invoices={invoices}
            payments={payments}
            returns={returns}
            exchanges={exchanges}
            promises={promises}
            prefill={editingInvoice ? null : prefill}
            editingInvoice={editingInvoice}
            currentUser={currentUser}
            nextNumber={nextNumber}
            onCancel={closeForm}
            onSave={(inv) => {
              if (editingInvoice) {
                updateInvoice(inv, editingInvoice);
              } else {
                saveInvoice(inv);
                if (prefill) {
                  if (prefill.sourceType === "order") onOrderFulfilled(prefill.sourceId);
                  else onBookingFulfilled(prefill.sourceId);
                  onClearPrefill();
                }
              }
              setShowForm(false);
              setEditingInvoice(null);
            }}
          />
        </Modal>
      )}
      {viewing && (
        <InvoiceDetail
          invoice={viewing}
          settings={settings}
          returns={returns}
          exchanges={exchanges}
          onClose={() => setViewing(null)}
          onEdit={openEdit}
          onCancelInvoice={handleCancelInvoice}
          onGoToReturn={onGoToReturn}
          onGoToExchange={onGoToExchange}
          onCreateNewFromInvoice={(inv) => { setViewing(null); setShowForm(true); }}
        />
      )}
    </div>
  );
}

/* ---------------- Invoice History (Phase 1) ---------------- */

function InvoiceHistoryPage({ invoices, auditLog }) {
  const rows = [];
  invoices.forEach((inv) => {
    (inv.editHistory || []).forEach((h) => {
      rows.push({ ...h, invoiceNumber: inv.number, customerName: inv.customerName, invoiceId: inv.id });
    });
  });
  rows.sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));

  const auditRows = [...(auditLog || [])].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Invoice History</h2>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Har invoice edit aur cancellation yahan log hoti hai — kis ne, kab, aur kya badla.
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Invoice</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Edited By</th><th className="px-4 py-2">Date/Time</th><th className="px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Abhi tak koi edit ya cancellation nahi hui.</td></tr>}
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t border-slate-100 align-top">
                <td className="px-4 py-2 font-bold text-blue-700">{r.invoiceNumber}</td>
                <td className="px-4 py-2">{r.customerName}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${r.action === "Cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{r.action}</span>
                </td>
                <td className="px-4 py-2">{r.editedBy}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDateTime(r.editedAt)}</td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {r.previousValues && r.newValues ? (
                    <div>
                      {Object.keys(r.newValues).map((k) => (
                        <div key={k}><span className="font-bold">{k}:</span> {String(r.previousValues[k])} → {String(r.newValues[k])}</div>
                      ))}
                    </div>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Audit Log</h2>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Sales Return, Exchange, Delete Return, Delete Exchange, Promise To Pay, aur Invoice Status Change ki har action yahan record hoti hai — user, date, time aur reason ke saath.
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Action</th><th className="px-4 py-2">Reference</th><th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Date/Time</th><th className="px-4 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {auditRows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Abhi tak koi audit entry nahi.</td></tr>}
            {auditRows.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-700">{a.action}</span>
                </td>
                <td className="px-4 py-2 font-bold text-blue-700">{a.reference}</td>
                <td className="px-4 py-2">{a.user}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDateTime(a.at)}</td>
                <td className="px-4 py-2 text-slate-500">{a.reason || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Sales Return (Phase 2 + Upgrade) ---------------- */

function SalesReturnPage({ customers, invoices, returns, exchanges, onCreateReturn, onDeleteReturn, currentUser }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [invoiceId, setInvoiceId] = useState("");
  const [returnQtys, setReturnQtys] = useState({});
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [returnDate, setReturnDate] = useState(todayISO());
  const [deletingReturn, setDeletingReturn] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  const customerInvoices = invoices.filter((i) => i.customerId === customerId && i.docStatus !== "Cancelled");
  const invoice = customerInvoices.find((i) => i.id === invoiceId);
  const rs = invoice ? computeInvoiceReturnStatus(invoice, returns, exchanges) : null;

  useEffect(() => { setInvoiceId(""); setReturnQtys({}); }, [customerId]);
  useEffect(() => { setReturnQtys({}); }, [invoiceId]);

  const returnAmount = invoice && rs
    ? rs.breakdown.reduce((sum, it) => sum + (Number(returnQtys[it.itemIndex]) || 0) * it.price, 0)
    : 0;

  function submit() {
    if (!invoice || !rs) { alert("Pehle invoice select karein."); return; }
    if (rs.isLocked) { alert("Ye invoice fully returned ho chuki hai. Nayi invoice banayein."); return; }
    const items = rs.breakdown
      .map((it) => ({ itemIndex: it.itemIndex, name: it.name, unit: it.unit, qtyReturned: Number(returnQtys[it.itemIndex]) || 0, price: it.price, total: (Number(returnQtys[it.itemIndex]) || 0) * it.price }))
      .filter((it) => it.qtyReturned > 0);
    if (items.length === 0) { alert("Kam az kam ek item ki return qty daalein."); return; }
    const invalidQty = items.some((it) => {
      const line = rs.breakdown.find((b) => b.itemIndex === it.itemIndex);
      return it.qtyReturned > line.remainingQty;
    });
    if (invalidQty) { alert("Return qty remaining quantity se zyada nahi ho sakti."); return; }
    if (!reason.trim()) { alert("Return ki wajah likhein."); return; }
    const customer = customers.find((c) => c.id === customerId);
    onCreateReturn({
      customerId, customerName: customer.name, invoiceId: invoice.id, invoiceNumber: invoice.number,
      date: returnDate, items, reason: reason.trim(), notes: notes.trim(), amount: returnAmount,
    });
    setInvoiceId(""); setReturnQtys({}); setReason(""); setNotes(""); setReturnDate(todayISO());
  }

  function confirmDelete() {
    if (!deleteReason.trim()) { alert("Delete ki wajah likhein."); return; }
    const blockingExchange = exchanges.find((ex) =>
      ex.status !== "Deleted" && ex.invoiceId === deletingReturn.invoiceId &&
      (ex.returnedItems || []).some((exi) => (deletingReturn.items || []).some((ri) => ri.itemIndex === exi.itemIndex))
    );
    if (blockingExchange) {
      alert("This Sales Return has linked Exchange records. Delete the Exchange first.");
      return;
    }
    onDeleteReturn(deletingReturn, deleteReason.trim());
    setDeletingReturn(null); setDeleteReason("");
  }

  const sorted = [...returns].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Sales Return</h2>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Customer se wapis aane wale items yahan record karein — outstanding balance turant kam ho jayega aur ek Credit Note ban jayegi.
      </div>

      <div className="bg-white border border-slate-200 p-4 mb-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer">
            <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Invoice">
            <select className={inputCls} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
              <option value="">Select Invoice</option>
              {customerInvoices.map((i) => {
                const s = computeInvoiceReturnStatus(i, returns, exchanges);
                return <option key={i.id} value={i.id} disabled={s.isLocked}>{i.number} — {fmtDate(i.date)} — {fmtMoney(i.total)}{s.isLocked ? " (Fully Returned)" : ""}</option>;
              })}
            </select>
          </Field>
        </div>

        {invoice && rs && rs.isLocked && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-2 mb-2">
            This invoice has been fully returned. Please create a new invoice.
          </div>
        )}

        {invoice && rs && !rs.isLocked && (
          <div className="mt-2">
            <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Items — Return Qty Daalein (Remaining Qty se zyada nahi)</div>
            <div className="space-y-2">
              {rs.breakdown.map((it) => (
                <div key={it.itemIndex} className="flex gap-2 items-center border border-slate-200 p-2">
                  <div className="flex-1 text-sm">
                    <div className="font-bold">{it.name}</div>
                    <div className="text-xs text-slate-400">Original Qty: {it.qty} {it.unit} · Remaining: {it.remainingQty} · Rate: {fmtMoney(it.price)}</div>
                  </div>
                  <input
                    type="number" min="0" max={it.remainingQty}
                    disabled={it.remainingQty <= 0}
                    className={`${inputCls} w-24`}
                    placeholder="Return Qty"
                    value={returnQtys[it.itemIndex] || ""}
                    onChange={(e) => setReturnQtys({ ...returnQtys, [it.itemIndex]: Math.min(Number(e.target.value) || 0, it.remainingQty) })}
                  />
                  <div className="w-24 text-right text-sm font-bold">{fmtMoney((Number(returnQtys[it.itemIndex]) || 0) * it.price)}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Field label="Return Date">
                <input type="date" className={inputCls} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </Field>
              <Field label="Return Reason">
                <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Extra order ho gaya tha" />
              </Field>
            </div>
            <Field label="Notes (optional)">
              <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <div className="bg-slate-50 border border-slate-200 p-3 mt-2 text-sm flex justify-between">
              <span className="font-bold">Total Return Amount</span>
              <span className="font-black text-emerald-600">{fmtMoney(returnAmount)}</span>
            </div>
            <Btn onClick={submit}>Save Return &amp; Generate Credit Note</Btn>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Return #</th><th className="px-4 py-2">Original Invoice</th><th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2">Date</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2">Reason</th><th className="px-4 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Koi return record nahi.</td></tr>}
            {sorted.map((r) => (
              <tr key={r.id} className={`border-t border-slate-100 ${r.status === "Deleted" ? "opacity-50" : ""}`}>
                <td className="px-4 py-2 font-black text-blue-700">{r.code}</td>
                <td className="px-4 py-2 text-slate-500">{r.invoiceNumber}</td>
                <td className="px-4 py-2 font-bold">{r.customerName}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(r.date)}</td>
                <td className="px-4 py-2 text-right font-bold text-emerald-600">{fmtMoney(r.amount)}</td>
                <td className="px-4 py-2 text-slate-500">{r.reason}</td>
                <td className="px-4 py-2">
                  {r.status === "Deleted" ? (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-200 text-slate-600">Deleted</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-700">Active</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {r.status !== "Deleted" && currentUser?.role === "admin" && (
                    <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => setDeletingReturn(r)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deletingReturn && (
        <Modal title={`Delete Return ${deletingReturn.code}`} onClose={() => setDeletingReturn(null)}>
          <div className="text-sm text-slate-600 mb-3">Ye return delete karne se ledger reverse ho jayega, invoice qty aur customer balance wapis restore ho jayega.</div>
          <Field label="Delete Reason">
            <input className={inputCls} value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-2">
            <Btn variant="danger" onClick={confirmDelete}>Confirm Delete</Btn>
            <Btn variant="ghost" onClick={() => setDeletingReturn(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Exchange (Phase 2 + Upgrade) ---------------- */

function ExchangePage({ customers, products, invoices, returns, exchanges, onCreateExchange, onDeleteExchange, currentUser }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [invoiceId, setInvoiceId] = useState("");
  const [returnQtys, setReturnQtys] = useState({});
  const [newItems, setNewItems] = useState([{ id: uid("ni"), productId: "", name: "", unit: "Bag", qty: 1, price: 0 }]);
  const [reason, setReason] = useState("");
  const [deletingExchange, setDeletingExchange] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  const customerInvoices = invoices.filter((i) => i.customerId === customerId && i.docStatus !== "Cancelled");
  const invoice = customerInvoices.find((i) => i.id === invoiceId);
  const rs = invoice ? computeInvoiceReturnStatus(invoice, returns, exchanges) : null;

  useEffect(() => { setInvoiceId(""); setReturnQtys({}); }, [customerId]);
  useEffect(() => { setReturnQtys({}); }, [invoiceId]);

  const returnedTotal = invoice && rs
    ? rs.breakdown.reduce((sum, it) => sum + (Number(returnQtys[it.itemIndex]) || 0) * it.price, 0)
    : 0;
  const newTotal = newItems.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const difference = newTotal - returnedTotal;

  function updateNewItem(id, patch) {
    setNewItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function addNewItem() {
    setNewItems((prev) => [...prev, { id: uid("ni"), productId: "", name: "", unit: "Bag", qty: 1, price: 0 }]);
  }
  function removeNewItem(id) {
    setNewItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  }
  function pickProduct(id, productId) {
    const p = products.find((p) => p.id === productId);
    updateNewItem(id, { productId, name: p ? p.name : "", unit: p ? p.unit : "Bag", price: p ? p.price : 0 });
  }

  function submit() {
    if (!invoice || !rs) { alert("Pehle invoice select karein."); return; }
    if (rs.isLocked) { alert("Ye invoice fully returned/exchanged ho chuki hai. Nayi invoice banayein."); return; }
    const returnedItems = rs.breakdown
      .map((it) => ({ itemIndex: it.itemIndex, name: it.name, unit: it.unit, qty: Number(returnQtys[it.itemIndex]) || 0, price: it.price, total: (Number(returnQtys[it.itemIndex]) || 0) * it.price }))
      .filter((it) => it.qty > 0);
    const cleanNewItems = newItems.filter((it) => it.name && Number(it.qty) > 0).map((it) => ({ name: it.name, unit: it.unit, qty: Number(it.qty), price: Number(it.price), total: Number(it.qty) * Number(it.price) }));
    if (returnedItems.length === 0) { alert("Kam az kam ek returned item ki qty daalein."); return; }
    const invalidQty = returnedItems.some((it) => {
      const line = rs.breakdown.find((b) => b.itemIndex === it.itemIndex);
      return it.qty > line.remainingQty;
    });
    if (invalidQty) { alert("Returned qty remaining quantity se zyada nahi ho sakti."); return; }
    if (cleanNewItems.length === 0) { alert("Kam az kam ek naya item daalein jo customer ko diya ja raha hai."); return; }
    if (!reason.trim()) { alert("Exchange ki wajah likhein."); return; }
    const customer = customers.find((c) => c.id === customerId);
    onCreateExchange({
      customerId, customerName: customer.name, invoiceId: invoice.id, invoiceNumber: invoice.number,
      date: todayISO(), returnedItems, newItems: cleanNewItems,
      returnedTotal, newTotal, difference, reason: reason.trim(),
    });
    setInvoiceId(""); setReturnQtys({}); setNewItems([{ id: uid("ni"), productId: "", name: "", unit: "Bag", qty: 1, price: 0 }]); setReason("");
  }

  function confirmDelete() {
    if (!deleteReason.trim()) { alert("Delete ki wajah likhein."); return; }
    onDeleteExchange(deletingExchange, deleteReason.trim());
    setDeletingExchange(null); setDeleteReason("");
  }

  const sorted = [...exchanges].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Exchange Items</h2>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Customer purane items wapis kar ke naye le raha hai — difference apne aap calculate ho kar ledger mein adjust ho jayega.
      </div>

      <div className="bg-white border border-slate-200 p-4 mb-6 max-w-3xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer">
            <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Original Invoice">
            <select className={inputCls} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
              <option value="">Select Invoice</option>
              {customerInvoices.map((i) => {
                const s = computeInvoiceReturnStatus(i, returns, exchanges);
                return <option key={i.id} value={i.id} disabled={s.isLocked}>{i.number} — {fmtDate(i.date)}{s.isLocked ? " (Fully Returned)" : ""}</option>;
              })}
            </select>
          </Field>
        </div>

        {invoice && rs && rs.isLocked && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-2 mb-2">
            This invoice has been fully returned. Please create a new invoice.
          </div>
        )}

        {invoice && rs && !rs.isLocked && (
          <div className="mt-2">
            <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Customer Kya Wapis Kar Raha Hai (Remaining Qty se zyada nahi)</div>
            <div className="space-y-2 mb-3">
              {rs.breakdown.map((it) => (
                <div key={it.itemIndex} className="flex gap-2 items-center border border-slate-200 p-2">
                  <div className="flex-1 text-sm">
                    <div className="font-bold">{it.name}</div>
                    <div className="text-xs text-slate-400">Original Qty: {it.qty} {it.unit} · Remaining: {it.remainingQty} · Rate: {fmtMoney(it.price)}</div>
                  </div>
                  <input type="number" min="0" max={it.remainingQty} disabled={it.remainingQty <= 0} className={`${inputCls} w-24`} placeholder="Return Qty"
                    value={returnQtys[it.itemIndex] || ""}
                    onChange={(e) => setReturnQtys({ ...returnQtys, [it.itemIndex]: Math.min(Number(e.target.value) || 0, it.remainingQty) })} />
                  <div className="w-24 text-right text-sm font-bold">{fmtMoney((Number(returnQtys[it.itemIndex]) || 0) * it.price)}</div>
                </div>
              ))}
            </div>

            <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-1">Customer Ko Kya Naya Mil Raha Hai</div>
            <div className="space-y-2 mb-2">
              {newItems.map((it) => (
                <div key={it.id} className="flex gap-2 items-center">
                  <select className={`${inputCls} w-36`} value={it.productId} onChange={(e) => pickProduct(it.id, e.target.value)}>
                    <option value="">Custom item</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className={`${inputCls} flex-1`} placeholder="Item name" value={it.name} onChange={(e) => updateNewItem(it.id, { name: e.target.value })} />
                  <input className={`${inputCls} w-20`} placeholder="Unit" value={it.unit} onChange={(e) => updateNewItem(it.id, { unit: e.target.value })} />
                  <input type="number" className={`${inputCls} w-16`} placeholder="Qty" value={it.qty} onChange={(e) => updateNewItem(it.id, { qty: e.target.value })} />
                  <input type="number" className={`${inputCls} w-24`} placeholder="Price" value={it.price} onChange={(e) => updateNewItem(it.id, { price: e.target.value })} />
                  <div className="w-24 text-right text-sm font-bold">{fmtMoney((it.qty || 0) * (it.price || 0))}</div>
                  <button onClick={() => removeNewItem(it.id)} className="text-slate-400 hover:text-red-600 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
            <Btn variant="ghost" small onClick={addNewItem}>+ Add Item</Btn>

            <Field label="Exchange Reason">
              <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>

            <div className="bg-slate-50 border border-slate-200 p-3 mt-2 text-sm space-y-1">
              <div className="flex justify-between"><span>Returned Value</span><span className="font-bold">-{fmtMoney(returnedTotal)}</span></div>
              <div className="flex justify-between"><span>New Items Value</span><span className="font-bold">{fmtMoney(newTotal)}</span></div>
              <div className="flex justify-between border-t border-slate-300 pt-1">
                <span className="font-bold">{difference >= 0 ? "Extra Charge to Customer" : "Refund Credit to Customer"}</span>
                <span className={`font-black ${difference >= 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtMoney(Math.abs(difference))}</span>
              </div>
            </div>
            <Btn onClick={submit}>Save Exchange</Btn>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Exchange #</th><th className="px-4 py-2">Original Invoice</th><th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2">Date</th><th className="px-4 py-2 text-right">Difference</th><th className="px-4 py-2">Reason</th><th className="px-4 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Koi exchange record nahi.</td></tr>}
            {sorted.map((ex) => (
              <tr key={ex.id} className={`border-t border-slate-100 ${ex.status === "Deleted" ? "opacity-50" : ""}`}>
                <td className="px-4 py-2 font-black text-blue-700">{ex.code}</td>
                <td className="px-4 py-2 text-slate-500">{ex.invoiceNumber}</td>
                <td className="px-4 py-2 font-bold">{ex.customerName}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(ex.date)}</td>
                <td className={`px-4 py-2 text-right font-bold ${ex.difference >= 0 ? "text-red-600" : "text-emerald-600"}`}>{ex.difference >= 0 ? "+" : "-"}{fmtMoney(Math.abs(ex.difference))}</td>
                <td className="px-4 py-2 text-slate-500">{ex.reason}</td>
                <td className="px-4 py-2">
                  {ex.status === "Deleted" ? (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-200 text-slate-600">Deleted</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-700">Active</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {ex.status !== "Deleted" && currentUser?.role === "admin" && (
                    <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => setDeletingExchange(ex)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deletingExchange && (
        <Modal title={`Delete Exchange ${deletingExchange.code}`} onClose={() => setDeletingExchange(null)}>
          <div className="text-sm text-slate-600 mb-3">Ye exchange delete karne se invoice bilkul waisa ho jayega jaisa exchange se pehle tha — ledger aur outstanding balance restore ho jayenge.</div>
          <Field label="Delete Reason">
            <input className={inputCls} value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-2">
            <Btn variant="danger" onClick={confirmDelete}>Confirm Delete</Btn>
            <Btn variant="ghost" onClick={() => setDeletingExchange(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Credit Notes (Phase 2) ---------------- */

function CreditNotesPage({ creditNotes, onLinkInvoice }) {
  const [linkingId, setLinkingId] = useState(null);
  const [linkInvoiceNumber, setLinkInvoiceNumber] = useState("");

  const sorted = [...creditNotes].sort((a, b) => new Date(b.date) - new Date(a.date));

  function startLink(cn) {
    setLinkingId(cn.id);
    setLinkInvoiceNumber("");
  }

  function confirmLink(cn) {
    if (!linkInvoiceNumber.trim()) return;
    onLinkInvoice(cn.id, linkInvoiceNumber.trim());
    setLinkingId(null);
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-2">Credit Notes</h2>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Har Sales Return ke baad yahan automatically ek Credit Note ban jati hai. Balance us waqt hi ledger mein adjust ho chuka hota hai — yahan aap sirf reference ke liye kisi future invoice se link kar sakte hain.
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Credit Note #</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2">Reason</th><th className="px-4 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Koi credit note nahi bani.</td></tr>}
            {sorted.map((cn) => (
              <tr key={cn.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-2 font-black text-blue-700">{cn.number}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(cn.date)}</td>
                <td className="px-4 py-2 font-bold">{cn.customerName}</td>
                <td className="px-4 py-2 text-right font-bold text-emerald-600">{fmtMoney(cn.amount)}</td>
                <td className="px-4 py-2 text-slate-500">{cn.reason}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${cn.status === "Reversed" ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>{cn.status}</span>
                  {cn.linkedInvoiceNumber && <div className="text-[10px] text-blue-700 font-bold mt-1">Ref: {cn.linkedInvoiceNumber}</div>}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {cn.status !== "Reversed" && (linkingId === cn.id ? (
                    <div className="flex gap-1 items-center justify-end">
                      <input className="text-xs border border-slate-300 px-1.5 py-1 w-24" placeholder="Invoice #" value={linkInvoiceNumber} onChange={(e) => setLinkInvoiceNumber(e.target.value)} />
                      <button className="text-xs font-bold text-blue-700 hover:underline" onClick={() => confirmLink(cn)}>Save</button>
                      <button className="text-xs font-bold text-slate-400 hover:underline" onClick={() => setLinkingId(null)}>×</button>
                    </div>
                  ) : (
                    <button className="text-xs font-bold text-blue-700 hover:underline" onClick={() => startLink(cn)}>Link to Invoice</button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Payments ---------------- */

function Payments({ customers, payments, promises, savePayment }) {
  const [form, setForm] = useState({ customerId: customers[0]?.id || "", date: todayISO(), amount: "", method: "Cash", note: "", promiseId: "" });
  const sorted = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Feature 7 — promises for the selected customer that still have a
  // remaining amount, so staff can apply this payment against one.
  const customerPromises = (promises || [])
    .filter((p) => p.customerId === form.customerId && p.status !== "Deleted")
    .map(promiseWithComputed)
    .filter((p) => p.remainingAmount > 0 && p.status !== "Cancelled");

  function submit() {
    if (!form.customerId || !Number(form.amount)) { alert("Customer aur amount zaroori hai."); return; }
    const customer = customers.find((c) => c.id === form.customerId);
    savePayment({
      id: uid("pay"), ...form, amount: Number(form.amount), customerName: customer.name,
      promiseId: form.promiseId || "",
      note: form.promiseId ? `Payment against Promise ${customerPromises.find((p) => p.id === form.promiseId)?.code || ""}${form.note ? " — " + form.note : ""}` : form.note,
    });
    setForm({ ...form, amount: "", note: "", promiseId: "" });
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Payments</h2>
      <div className="bg-white border border-slate-200 p-4 mb-6 max-w-xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer">
            <select className={inputCls} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value, promiseId: "" })}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (Rs)">
            <input type="number" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Method">
            <select className={inputCls} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option>Cash</option><option>Bank Transfer</option><option>Cheque</option><option>Easypaisa/JazzCash</option>
            </select>
          </Field>
        </div>
        {customerPromises.length > 0 && (
          <Field label="Apply Against Promise (optional)">
            <select className={inputCls} value={form.promiseId} onChange={(e) => setForm({ ...form, promiseId: e.target.value })}>
              <option value="">None — general payment</option>
              {customerPromises.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — Remaining {fmtMoney(p.remainingAmount)} (Due {fmtDate(p.expectedDate)})</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Note">
          <input className={inputCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </Field>
        <Btn onClick={submit}>Record Payment</Btn>
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Date</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Method</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2">Note</th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Koi payment record nahi.</td></tr>}
            {sorted.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{fmtDate(p.date)}</td>
                <td className="px-4 py-2 font-bold">{p.customerName}</td>
                <td className="px-4 py-2 text-slate-500">{p.method}</td>
                <td className="px-4 py-2 text-right font-bold text-emerald-600">{fmtMoney(p.amount)}</td>
                <td className="px-4 py-2 text-slate-500 text-xs">{p.note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Bookings ---------------- */

function Bookings({ customers, products, bookings, saveBooking, onCreateAdvanceBooking, onConvertToInvoice }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    productId: products[0]?.id || "",
    qty: 1,
    rate: products[0]?.price || 0,
    advanceAmount: 0,
    date: todayISO(),
    notes: "",
  });

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  function pickProduct(productId) {
    const p = products.find((p) => p.id === productId);
    setForm((f) => ({ ...f, productId, rate: p ? p.price : f.rate }));
  }

  function submit() {
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer) { alert("Customer select karein."); return; }
    if (!Number(form.qty) || !Number(form.rate)) { alert("Qty aur Locked Rate zaroori hai."); return; }
    const product = products.find((p) => p.id === form.productId);
    onCreateAdvanceBooking({
      customerId: form.customerId,
      customerName: customer.name,
      customerPhone: customer.phone || "",
      productId: form.productId,
      productName: product ? product.name : "Custom Item",
      unit: product ? product.unit : "",
      qty: Number(form.qty),
      rate: Number(form.rate),
      advanceAmount: Number(form.advanceAmount) || 0,
      date: form.date,
      notes: form.notes,
    });
    setShowForm(false);
    setForm({ customerId: customers[0]?.id || "", productId: products[0]?.id || "", qty: 1, rate: products[0]?.price || 0, advanceAmount: 0, date: todayISO(), notes: "" });
  }

  function updateStatus(id, status) {
    const b = bookings.find((b) => b.id === id);
    saveBooking({ ...b, status });
  }

  const sorted = [...bookings].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalValue = Number(form.qty || 0) * Number(form.rate || 0);
  const remaining = totalValue - Number(form.advanceAmount || 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black uppercase tracking-tight">Advance Booking</h2>
        <Btn onClick={() => setShowForm(true)}>+ New Advance Booking</Btn>
      </div>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Customer advance de kar rate lock kara sakta hai — booking ke 1 mahine ke andar wahi rate milega, chahe market rate badh jaye.
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Ref</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Item</th>
            <th className="px-4 py-2 text-right">Qty</th><th className="px-4 py-2 text-right">Locked Rate</th>
            <th className="px-4 py-2 text-right">Advance</th><th className="px-4 py-2 text-right">Remaining</th>
            <th className="px-4 py-2">Valid Till</th><th className="px-4 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-400">Koi advance booking nahi.</td></tr>}
            {sorted.map((b) => {
              const totalVal = (b.qty || 0) * (b.rate || 0);
              const rem = totalVal - (b.advanceAmount || 0);
              const isExpired = b.expiryDate && todayISO() > b.expiryDate && b.status === "Booked";
              return (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-black text-blue-700">{b.code || "-"}</td>
                  <td className="px-4 py-2 font-bold">{b.customerName}</td>
                  <td className="px-4 py-2">{b.productName || "-"} {b.unit ? `(${b.unit})` : ""}</td>
                  <td className="px-4 py-2 text-right">{b.qty}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtMoney(b.rate)}</td>
                  <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmtMoney(b.advanceAmount)}</td>
                  <td className="px-4 py-2 text-right text-red-600 font-bold">{fmtMoney(rem)}</td>
                  <td className="px-4 py-2">
                    {fmtDate(b.expiryDate)}
                    {isExpired && <div className="text-[10px] font-bold text-red-600 uppercase">Expired</div>}
                  </td>
                  <td className="px-4 py-2">
                    <select className="text-xs border border-slate-300 px-1.5 py-1" value={b.status} onChange={(e) => updateStatus(b.id, e.target.value)}>
                      {BOOKING_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {(b.status === "Booked" || b.status === "Partially Delivered") && (
                      <button className="text-xs font-bold text-blue-700 hover:underline" onClick={() => onConvertToInvoice(b)}>Convert to Invoice</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showForm && (
        <Modal title="New Advance Booking" onClose={() => setShowForm(false)}>
          <Field label="Customer">
            <select className={inputCls} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {selectedCustomer?.phone && <div className="text-xs text-slate-500 mb-3">Mobile: {selectedCustomer.phone}</div>}
          <Field label="Product">
            <select className={inputCls} value={form.productId} onChange={(e) => pickProduct(e.target.value)}>
              <option value="">Custom Item</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qty"><input type="number" className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>
            <Field label="Locked Rate (Rs/unit)"><input type="number" className={inputCls} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Advance Received Now (Rs)"><input type="number" className={inputCls} value={form.advanceAmount} onChange={(e) => setForm({ ...form, advanceAmount: e.target.value })} /></Field>
            <Field label="Booking Date"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          </div>
          <Field label="Notes"><input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>

          <div className="bg-slate-50 border border-slate-200 p-3 text-sm space-y-1 mb-3">
            <div className="flex justify-between"><span>Total Value (Qty × Rate)</span><span className="font-bold">{fmtMoney(totalValue)}</span></div>
            <div className="flex justify-between"><span>Advance Received</span><span className="font-bold text-emerald-600">{fmtMoney(form.advanceAmount)}</span></div>
            <div className="flex justify-between border-t border-slate-300 pt-1"><span className="font-bold">Remaining on Delivery</span><span className="font-black text-red-600">{fmtMoney(remaining)}</span></div>
            <div className="text-[11px] text-slate-400 pt-1">Valid till: {fmtDate(addOneMonth(form.date))} — is tareekh tak yehi rate lock rahega.</div>
          </div>

          <div className="flex gap-2"><Btn onClick={submit}>Save Advance Booking</Btn><Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Orders (Daily Call Orders) ---------------- */

function Orders({ customers, products, orders, onCreateOrder, saveOrder, onConvertToInvoice }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: customers[0]?.id || "",
    productId: products[0]?.id || "",
    qty: 1,
    requestedFor: "Kal Subah",
    date: todayISO(),
    notes: "",
  });

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  function submit() {
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer) { alert("Customer select karein."); return; }
    if (!Number(form.qty)) { alert("Qty zaroori hai."); return; }
    const product = products.find((p) => p.id === form.productId);
    onCreateOrder({
      customerId: form.customerId,
      customerName: customer.name,
      customerPhone: customer.phone || "",
      productId: form.productId,
      productName: product ? product.name : "Custom Item",
      unit: product ? product.unit : "",
      qty: Number(form.qty),
      requestedFor: form.requestedFor,
      date: form.date,
      notes: form.notes,
    });
    setShowForm(false);
    setForm({ customerId: customers[0]?.id || "", productId: products[0]?.id || "", qty: 1, requestedFor: "Kal Subah", date: todayISO(), notes: "" });
  }

  function updateStatus(id, status) {
    const o = orders.find((o) => o.id === id);
    saveOrder({ ...o, status });
  }

  const total = orders.length;
  const pending = orders.filter((o) => o.status === "Pending").length;
  const processing = orders.filter((o) => o.status === "Processing").length;
  const completed = orders.filter((o) => o.status === "Completed").length;

  const sorted = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black uppercase tracking-tight">Daily Orders</h2>
        <Btn onClick={() => setShowForm(true)} disabled={customers.length === 0}>+ New Order</Btn>
      </div>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Jab customer call kar ke order de ("mujhe subah cement chahiye"), yahan note kar lein — baad mein isi order se seedha invoice ban jayegi.
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Stat label="Total Orders" value={total} />
        <Stat label="Pending" value={pending} accent="text-red-600" />
        <Stat label="Processing" value={processing} accent="text-blue-700" />
        <Stat label="Completed" value={completed} accent="text-emerald-600" />
      </div>

      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="px-4 py-2">Ref</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Item</th><th className="px-4 py-2 text-right">Qty</th>
            <th className="px-4 py-2">Requested For</th><th className="px-4 py-2">Status</th><th></th>
          </tr></thead>
          <tbody>
            {sorted.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Koi order nahi.</td></tr>}
            {sorted.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-black text-blue-700">{o.code}</td>
                <td className="px-4 py-2 font-bold">{o.customerName}</td>
                <td className="px-4 py-2 text-slate-500">{o.customerPhone || "-"}</td>
                <td className="px-4 py-2">{o.productName || "-"} {o.unit ? `(${o.unit})` : ""}</td>
                <td className="px-4 py-2 text-right">{o.qty}</td>
                <td className="px-4 py-2 text-slate-500">{o.requestedFor || "-"}</td>
                <td className="px-4 py-2">
                  <select className="text-xs border border-slate-300 px-1.5 py-1" value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
                    {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {(o.status === "Pending" || o.status === "Processing") && (
                    <button className="text-xs font-bold text-blue-700 hover:underline" onClick={() => onConvertToInvoice(o)}>Convert to Invoice</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="New Order" onClose={() => setShowForm(false)}>
          <Field label="Customer">
            <select className={inputCls} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {selectedCustomer?.phone && <div className="text-xs text-slate-500 mb-3">Phone: {selectedCustomer.phone}</div>}
          <Field label="Product">
            <select className={inputCls} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Custom Item</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qty"><input type="number" className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>
            <Field label="Requested For">
              <input className={inputCls} placeholder="e.g. Kal Subah, Aaj Shaam" value={form.requestedFor} onChange={(e) => setForm({ ...form, requestedFor: e.target.value })} />
            </Field>
          </div>
          <Field label="Order Date (call received)"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Notes"><input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="flex gap-2"><Btn onClick={submit}>Save Order</Btn><Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Promise To Pay (Phase 3) ---------------- */

function PromiseForm({ customers, initial, currentUser, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      customerId: customers[0]?.id || "",
      amount: "",
      promiseDate: todayISO(),
      expectedDate: todayISO(),
      paymentMethod: "Cash",
      notes: "",
    }
  );
  const [error, setError] = useState("");

  function submit() {
    if (!form.customerId) { setError("Customer select karein."); return; }
    if (!Number(form.amount) || Number(form.amount) <= 0) { setError("Promise amount zaroori hai."); return; }
    if (!form.expectedDate) { setError("Expected Payment Date zaroori hai."); return; }
    const customer = customers.find((c) => c.id === form.customerId);
    onSave({ ...form, amount: Number(form.amount), customerName: customer?.name || "" });
  }

  return (
    <div>
      <Field label="Customer">
        <select className={inputCls} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Promise Amount (Rs)">
          <input type="number" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </Field>
        <Field label="Payment Method">
          <select className={inputCls} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
            {PROMISE_PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Promise Date">
          <input type="date" className={inputCls} value={form.promiseDate} onChange={(e) => setForm({ ...form, promiseDate: e.target.value })} />
        </Field>
        <Field label="Expected Payment Date">
          <input type="date" className={inputCls} value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} />
        </Field>
      </div>
      <Field label="Notes">
        <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
      <div className="text-[11px] text-slate-400 mb-3">Created By: <span className="font-bold text-slate-600">{currentUser?.name || currentUser?.username}</span> · Created Date: <span className="font-bold text-slate-600">{fmtDate(todayISO())}</span></div>
      {error && <div className="text-red-600 text-sm font-semibold mb-3">{error}</div>}
      <div className="flex gap-2">
        <Btn onClick={submit}>Save Promise</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

// Feature 10 — simple month-grid calendar. Clicking a date shows promises
// scheduled (by Expected Payment Date) for that day.
function PromiseCalendar({ promises }) {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate = {};
  promises.forEach((p) => {
    if (!p.expectedDate) return;
    byDate[p.expectedDate] = byDate[p.expectedDate] || [];
    byDate[p.expectedDate].push(p);
  });

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dateISO(d) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const selectedPromises = selectedDate ? (byDate[selectedDate] || []) : [];

  return (
    <div className="bg-white border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <button className="text-slate-500 hover:text-slate-900 font-bold px-2" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
        <div className="font-black uppercase tracking-tight">{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
        <button className="text-slate-500 hover:text-slate-900 font-bold px-2" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] font-bold uppercase text-slate-400 mb-1 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          if (!d) return <div key={idx} />;
          const iso = dateISO(d);
          const dayPromises = byDate[iso] || [];
          const isToday = iso === todayISO();
          const hasBroken = dayPromises.some((p) => p.status === "Broken Promise");
          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(iso === selectedDate ? null : iso)}
              className={`aspect-square border text-xs flex flex-col items-center justify-center relative ${
                selectedDate === iso ? "border-slate-900 bg-slate-900 text-white" : isToday ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="font-bold">{d}</span>
              {dayPromises.length > 0 && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${hasBroken ? "bg-red-500" : "bg-emerald-500"}`} />
              )}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-2">Promises on {fmtDate(selectedDate)}</div>
          {selectedPromises.length === 0 && <div className="text-slate-400 text-sm">Koi promise nahi.</div>}
          <div className="space-y-2">
            {selectedPromises.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-sm border border-slate-200 px-3 py-2">
                <div>
                  <div className="font-bold">{p.customerName}</div>
                  <div className="text-xs text-slate-400">{p.code}</div>
                </div>
                <div className="text-right">
                  <div className="font-black">{fmtMoney(p.remainingAmount)}</div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${PROMISE_STATUS_TONE[p.status]}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PromiseToPayPage({ customers, promises, currentUser, onCreatePromise, onUpdatePromise, onCancelPromise, onDeletePromise }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [view, setView] = useState("list"); // list | calendar
  const [deleting, setDeleting] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  const canDelete = currentUser?.role === "admin";
  const canCancel = currentUser?.role === "admin";

  const active = promises.filter((p) => p.status !== "Deleted").map(promiseWithComputed);

  const t = todayISO();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);
  const weekStart = new Date(); const day = weekStart.getDay();
  const weekBegin = new Date(weekStart); weekBegin.setDate(weekStart.getDate() - day);
  const weekEnd = new Date(weekBegin); weekEnd.setDate(weekBegin.getDate() + 6);
  const weekBeginISO = weekBegin.toISOString().slice(0, 10);
  const weekEndISO = weekEnd.toISOString().slice(0, 10);
  const monthPrefix = t.slice(0, 7);

  let filtered = active.filter((p) => {
    const matchesQ = !q.trim() || p.customerName.toLowerCase().includes(q.toLowerCase()) || p.code.toLowerCase().includes(q.toLowerCase()) || String(p.amount).includes(q) || p.promiseDate.includes(q) || p.status.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    let matchesDate = true;
    if (dateFilter === "Today") matchesDate = p.expectedDate === t;
    else if (dateFilter === "Tomorrow") matchesDate = p.expectedDate === tomorrowISO;
    else if (dateFilter === "This Week") matchesDate = p.expectedDate >= weekBeginISO && p.expectedDate <= weekEndISO;
    else if (dateFilter === "This Month") matchesDate = p.expectedDate.startsWith(monthPrefix);
    return matchesQ && matchesStatus && matchesDate;
  });
  filtered.sort((a, b) => new Date(b.promiseDate) - new Date(a.promiseDate));

  function openEdit(p) { setEditing(p); setShowForm(true); }

  function markCompleted(p) {
    if (!confirm(`Promise ${p.code} ko Completed mark karein?`)) return;
    onUpdatePromise({ ...p, status: "Completed", paidAmount: p.amount }, "Marked completed manually");
  }
  function cancelPromise(p) {
    if (!canCancel) { alert("Sirf Admin promise cancel kar sakta hai."); return; }
    const reason = prompt("Cancel karne ki wajah likhein:");
    if (reason === null) return;
    onCancelPromise(p, reason.trim());
  }
  function confirmDelete() {
    if (!deleteReason.trim()) { alert("Delete ki wajah likhein."); return; }
    onDeletePromise(deleting, deleteReason.trim());
    setDeleting(null); setDeleteReason("");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-xl font-black uppercase tracking-tight">Promise To Pay</h2>
        <div className="flex gap-2">
          <Btn variant={view === "list" ? "primary" : "ghost"} small onClick={() => setView("list")}>List</Btn>
          <Btn variant={view === "calendar" ? "primary" : "ghost"} small onClick={() => setView("calendar")}>Calendar</Btn>
          <Btn onClick={() => { setEditing(null); setShowForm(true); }} disabled={customers.length === 0}>+ New Promise</Btn>
        </div>
      </div>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Customer ka "wada" (promise) record karein — kab kitna payment karega. Due date guzarne par khud-ba-khud "Broken Promise" mark ho jata hai.
      </div>

      {view === "calendar" ? (
        <PromiseCalendar promises={active} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <input className={`${inputCls} max-w-xs`} placeholder="Search customer / promise # / amount / status..." value={q} onChange={(e) => setQ(e.target.value)} />
            <select className={`${inputCls} max-w-[160px]`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              {PROMISE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className={`${inputCls} max-w-[160px]`} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              {["All", "Today", "Tomorrow", "This Week", "This Month"].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2">Promise No</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Mobile</th>
                  <th className="px-4 py-2 text-right">Promise Amt</th><th className="px-4 py-2 text-right">Paid</th><th className="px-4 py-2 text-right">Remaining</th>
                  <th className="px-4 py-2">Promise Date</th><th className="px-4 py-2">Expected Date</th><th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Created By</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={11} className="px-4 py-6 text-center text-slate-400">Koi promise nahi mila.</td></tr>}
                {filtered.map((p) => {
                  const cust = customers.find((c) => c.id === p.customerId);
                  return (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-black text-blue-700">{p.code}</td>
                      <td className="px-4 py-2 font-bold">{p.customerName}</td>
                      <td className="px-4 py-2 text-slate-500">{cust?.phone || "-"}</td>
                      <td className="px-4 py-2 text-right font-bold">{fmtMoney(p.amount)}</td>
                      <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmtMoney(p.paidAmount)}</td>
                      <td className="px-4 py-2 text-right text-red-600 font-bold">{fmtMoney(p.remainingAmount)}</td>
                      <td className="px-4 py-2 text-slate-500">{fmtDate(p.promiseDate)}</td>
                      <td className="px-4 py-2 text-slate-500">{fmtDate(p.expectedDate)}</td>
                      <td className="px-4 py-2"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${PROMISE_STATUS_TONE[p.status]}`}>{p.status}</span></td>
                      <td className="px-4 py-2 text-slate-500">{p.createdBy}</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap space-x-2">
                        {(p.status === "Pending" || p.status === "Partially Paid" || p.status === "Broken Promise") && (
                          <>
                            <button className="text-xs font-bold text-slate-500 hover:text-blue-700" onClick={() => openEdit(p)}>Edit</button>
                            <button className="text-xs font-bold text-slate-500 hover:text-emerald-600" onClick={() => markCompleted(p)}>Complete</button>
                            <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => cancelPromise(p)}>Cancel</button>
                          </>
                        )}
                        {canDelete && (
                          <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => setDeleting(p)}>Delete</button>
                        )}
                        {waLink && cust?.phone && (
                          <a href={waLink(cust.phone, `Assalam-o-Alaikum ${p.customerName},\n\nYaad dahani: aap ne Rs ${p.remainingAmount.toLocaleString()} payment ka wada kiya tha (${p.code}), expected date ${fmtDate(p.expectedDate)}. Jaldi clear kar dein.`)} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 hover:underline">WA</a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <Modal title={editing ? `Edit Promise ${editing.code}` : "New Promise To Pay"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <PromiseForm
            customers={customers}
            initial={editing}
            currentUser={currentUser}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            onSave={(data) => {
              if (editing) onUpdatePromise({ ...editing, ...data }, "Edited");
              else onCreatePromise(data);
              setShowForm(false); setEditing(null);
            }}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title={`Delete Promise ${deleting.code}`} onClose={() => setDeleting(null)}>
          <div className="text-sm text-slate-600 mb-3">Ye promise delete karne se ledger se bhi hat jayega. Ye action reverse nahi ho sakta.</div>
          <Field label="Delete Reason">
            <input className={inputCls} value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} autoFocus />
          </Field>
          <div className="flex gap-2">
            <Btn variant="danger" onClick={confirmDelete}>Confirm Delete</Btn>
            <Btn variant="ghost" onClick={() => setDeleting(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Leads ---------------- */

function Leads({ leads, saveLead, deleteLead }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", source: "", status: "New", notes: "", followUpDate: "" });

  function submit() {
    if (!form.name.trim()) return;
    saveLead({ id: uid("ld"), ...form });
    setForm({ name: "", phone: "", source: "", status: "New", notes: "", followUpDate: "" });
    setShowForm(false);
  }
  function updateStatus(id, status) {
    const l = leads.find((l) => l.id === id);
    saveLead({ ...l, status });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Leads</h2>
        <Btn onClick={() => setShowForm(true)}>+ New Lead</Btn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {LEAD_STATUSES.map((status) => (
          <div key={status} className="bg-white border border-slate-200 min-h-[120px]">
            <div className="px-3 py-2 border-b border-slate-200 text-[11px] font-black uppercase tracking-wide text-slate-500">{status}</div>
            <div className="p-2 space-y-2">
              {leads.filter((l) => l.status === status).map((l) => (
                <div key={l.id} className="border border-slate-200 p-2 text-sm">
                  <div className="font-bold">{l.name}</div>
                  <div className="text-xs text-slate-500">{l.phone}</div>
                  {l.followUpDate && <div className="text-[10px] text-blue-700 font-bold">Follow-up: {fmtDate(l.followUpDate)}</div>}
                  <div className="flex gap-1 mt-1">
                    <select className="text-[10px] border border-slate-300 px-1 py-0.5 flex-1" value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)}>
                      {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => deleteLead(l.id)} className="text-slate-400 hover:text-red-600 text-xs">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <Modal title="New Lead" onClose={() => setShowForm(false)}>
          <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Source"><input className={inputCls} placeholder="Builder / Contractor / Referral..." value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></Field>
          <Field label="Follow-up Date"><input type="date" className={inputCls} value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} /></Field>
          <Field label="Notes"><input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="flex gap-2"><Btn onClick={submit}>Save Lead</Btn><Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Products ---------------- */

function Products({ products, saveProduct, deleteProduct }) {
  const [form, setForm] = useState({ name: "", unit: "Bag", price: "" });

  function submit() {
    if (!form.name.trim()) return;
    saveProduct({ id: uid("p"), ...form, price: Number(form.price) || 0 });
    setForm({ name: "", unit: "Bag", price: "" });
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Products</h2>
      <div className="bg-white border border-slate-200 p-4 mb-6 max-w-xl flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[150px]"><Field label="Product Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
        <div className="w-28"><Field label="Unit"><input list="unit-suggestions" className={inputCls} placeholder="e.g. Crush" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field></div>
        <div className="w-28"><Field label="Price (Rs)"><input type="number" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field></div>
        <Btn onClick={submit}>Add</Btn>
        <datalist id="unit-suggestions">{UNIT_OPTS.map((u) => <option key={u} value={u} />)}</datalist>
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto max-w-xl">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200"><th className="px-4 py-2">Name</th><th className="px-4 py-2">Unit</th><th className="px-4 py-2 text-right">Price</th><th></th></tr></thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Koi product nahi.</td></tr>}
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-bold">{p.name}</td>
                <td className="px-4 py-2 text-slate-500">{p.unit}</td>
                <td className="px-4 py-2 text-right">{fmtMoney(p.price)}</td>
                <td className="px-4 py-2 text-right"><button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => deleteProduct(p.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Offers ---------------- */

function OfferForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { text: "", bannerUrl: "", active: true });
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  async function handleBanner(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Sirf image file (PNG/JPG) upload karein."); return; }
    try {
      const dataUrl = await resizeImageToDataUrl(file, 800);
      setForm((f) => ({ ...f, bannerUrl: dataUrl }));
      setUploadError("");
    } catch {
      setUploadError("Banner upload nahi ho saka, dobara try karein.");
    }
  }

  function submit() {
    if (!form.text.trim()) { setError("Offer ka text zaroori hai."); return; }
    onSave(form);
  }

  return (
    <div>
      <Field label="Offer Text (scrolling ticker mein dikhega)">
        <input className={inputCls} placeholder="e.g. Is hafte cement par Rs 50/bag discount!" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} autoFocus />
      </Field>
      <Field label="Banner Image (optional)">
        <div className="flex items-center gap-3">
          {form.bannerUrl ? (
            <img src={form.bannerUrl} alt="Banner" className="w-24 h-14 object-cover border border-slate-200" />
          ) : (
            <div className="w-24 h-14 bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400">No Banner</div>
          )}
          <label className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer">
            {form.bannerUrl ? "Change" : "Upload"}
            <input type="file" accept="image/*" className="hidden" onChange={handleBanner} />
          </label>
          {form.bannerUrl && (
            <button type="button" className="text-xs font-bold text-red-600 hover:underline" onClick={() => setForm((f) => ({ ...f, bannerUrl: "" }))}>Remove</button>
          )}
        </div>
        {uploadError && <div className="text-xs text-red-600 font-semibold mt-1">{uploadError}</div>}
      </Field>
      <label className="flex items-center gap-2 mb-3 text-sm">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        Active (customer portal mein dikhaya jaye)
      </label>
      {error && <div className="text-red-600 text-sm font-semibold mb-3">{error}</div>}
      <div className="flex gap-2">
        <Btn onClick={submit}>Save Offer</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function Offers({ offers, saveOffer, deleteOffer }) {
  const [modal, setModal] = useState(null); // null | 'new' | offer object

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black uppercase tracking-tight">Offers</h2>
        <Btn onClick={() => setModal("new")}>+ New Offer</Btn>
      </div>
      <div className="text-xs text-slate-400 mb-4 max-w-2xl">
        Active offers customer ke self-service portal mein banner aur scrolling text ke tor par dikhte hain.
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto max-w-3xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Banner</th><th className="px-4 py-2">Text</th><th className="px-4 py-2">Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {offers.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Koi offer nahi bana.</td></tr>}
            {offers.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  {o.bannerUrl ? <img src={o.bannerUrl} alt="" className="w-16 h-10 object-cover border border-slate-200" /> : <span className="text-slate-300 text-xs">-</span>}
                </td>
                <td className="px-4 py-2 font-bold cursor-pointer hover:text-blue-700" onClick={() => setModal(o)}>{o.text}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${o.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{o.active ? "Active" : "Inactive"}</span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button className="text-xs font-bold text-slate-500 hover:text-blue-700 mr-3" onClick={() => setModal(o)}>Edit</button>
                  <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => deleteOffer(o.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === "new" ? "New Offer" : "Edit Offer"} onClose={() => setModal(null)}>
          <OfferForm
            initial={modal === "new" ? null : modal}
            onCancel={() => setModal(null)}
            onSave={(data) => { saveOffer(modal === "new" ? data : { ...modal, ...data }); setModal(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Drivers ---------------- */

function DriverForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: "", phone: "", vehicleType: "Rickshaw", vehicleNumber: "" });
  const [error, setError] = useState("");

  function submit() {
    if (!form.name.trim()) { setError("Driver ka naam zaroori hai."); return; }
    onSave(form);
  }

  return (
    <div>
      <Field label="Driver Name">
        <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
      </Field>
      <Field label="Phone">
        <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </Field>
      <Field label="Vehicle Type">
        <select className={inputCls} value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
          {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="Vehicle Number">
        <input className={inputCls} placeholder="e.g. LEA-1234" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
      </Field>
      {error && <div className="text-red-600 text-sm font-semibold mb-3">{error}</div>}
      <div className="flex gap-2 mt-2">
        <Btn onClick={submit}>Save Driver</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

function Drivers({ drivers, saveDriver, deleteDriver }) {
  const [modal, setModal] = useState(null); // null | 'new' | driver object

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tight">Drivers</h2>
        <Btn onClick={() => setModal("new")}>+ New Driver</Btn>
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto max-w-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Driver ID</th><th className="px-4 py-2">Name</th><th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Vehicle</th><th className="px-4 py-2">Number</th><th></th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Koi driver add nahi hua.</td></tr>}
            {drivers.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-black text-blue-700">{d.code}</td>
                <td className="px-4 py-2 font-bold cursor-pointer hover:text-blue-700" onClick={() => setModal(d)}>{d.name}</td>
                <td className="px-4 py-2 text-slate-500">{d.phone || "-"}</td>
                <td className="px-4 py-2">{d.vehicleType}</td>
                <td className="px-4 py-2 text-slate-500">{d.vehicleNumber || "-"}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button className="text-xs font-bold text-slate-500 hover:text-blue-700 mr-3" onClick={() => setModal(d)}>Edit</button>
                  <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => { if (confirm(`Delete ${d.name}?`)) deleteDriver(d.id); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-400 mt-3 max-w-2xl">
        Har driver ko save karte hi khud-ba-khud ek Driver ID (jaise DRV-0001) mil jata hai. Ye ID Invoice banate waqt "Driver ID" field mein daalein — naam aur vehicle apne aap fill ho jayenge.
      </div>
      {modal && (
        <Modal title={modal === "new" ? "New Driver" : "Edit Driver"} onClose={() => setModal(null)}>
          <DriverForm
            initial={modal === "new" ? null : modal}
            onCancel={() => setModal(null)}
            onSave={(data) => { saveDriver(modal === "new" ? data : { ...modal, ...data }); setModal(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Reports ---------------- */

function Reports({ customers, invoices, payments, returns, exchanges, promises, leads, bookings }) {
  const [from, setFrom] = useState(todayISO().slice(0, 8) + "01");
  const [to, setTo] = useState(todayISO());
  const [promiseTab, setPromiseTab] = useState("today");

  const inRange = invoices.filter((i) => i.date >= from && i.date <= to && !isInvoiceCancelled(i));
  const salesTotal = inRange.reduce((s, i) => s + i.total, 0);
  const collected = payments
    .filter((p) => p.date >= from && p.date <= to && !isPaymentLinkedToCancelledInvoice(p, invoices))
    .reduce((s, p) => s + p.amount, 0);

  const byCustomer = {};
  customers.forEach((c) => {
    const { outstanding } = computeLedgerForCustomer(c, invoices, payments, returns, exchanges, promises);
    if (outstanding !== 0) byCustomer[c.name] = outstanding;
  });

  function exportCSV() {
    const rows = [["Invoice", "Customer", "Date", "Total", "Received", "Balance", "Status"]];
    inRange.forEach((i) => rows.push([i.number, i.customerName, i.date, i.total, i.paymentReceived, i.balanceDue, i.status]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sales-report-${from}-to-${to}.csv`;
    a.click();
  }

  // Feature 15 — Promise Reports
  const activePromises = (promises || []).filter((p) => p.status !== "Deleted").map(promiseWithComputed);
  const t = todayISO();
  const promiseReportRows = {
    today: activePromises.filter((p) => p.expectedDate === t),
    upcoming: activePromises.filter((p) => p.expectedDate > t && (p.status === "Pending" || p.status === "Partially Paid")),
    broken: activePromises.filter((p) => p.status === "Broken Promise"),
    completed: activePromises.filter((p) => p.status === "Completed"),
    history: activePromises,
  }[promiseTab];

  function exportPromiseCSV() {
    const rows = [["Promise No", "Customer", "Amount", "Paid", "Remaining", "Promise Date", "Expected Date", "Status", "Created By"]];
    promiseReportRows.forEach((p) => rows.push([p.code, p.customerName, p.amount, p.paidAmount, p.remainingAmount, p.promiseDate, p.expectedDate, p.status, p.createdBy]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `promise-report-${promiseTab}-${todayISO()}.csv`;
    a.click();
  }

  function exportPromisePDF() {
    window.print();
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Reports</h2>
      <div className="flex gap-3 items-end mb-4 flex-wrap">
        <Field label="From"><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To"><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Btn variant="dark" onClick={exportCSV}>Export CSV</Btn>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <Stat label="Sales in Range" value={fmtMoney(salesTotal)} />
        <Stat label="Collected in Range" value={fmtMoney(collected)} accent="text-emerald-600" />
        <Stat label="Invoices" value={inRange.length} />
      </div>
      <div className="bg-white border border-slate-200 mb-8">
        <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">Customers with Outstanding Balance</div>
        <table className="w-full text-sm">
          <tbody>
            {Object.keys(byCustomer).length === 0 && <tr><td className="px-4 py-6 text-center text-slate-400">Koi outstanding nahi.</td></tr>}
            {Object.entries(byCustomer).sort((a, b) => b[1] - a[1]).map(([name, bal]) => (
              <tr key={name} className="border-t border-slate-100">
                <td className="px-4 py-2 font-bold">{name}</td>
                <td className="px-4 py-2 text-right font-bold text-red-600">{fmtMoney(bal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {[["today", "Today's Promises"], ["upcoming", "Upcoming Promises"], ["broken", "Broken Promises"], ["completed", "Completed Promises"], ["history", "Customer Promise History"]].map(([k, label]) => (
            <Btn key={k} variant={promiseTab === k ? "primary" : "ghost"} small onClick={() => setPromiseTab(k)}>{label}</Btn>
          ))}
        </div>
        <div className="flex gap-2">
          <Btn variant="dark" small onClick={exportPromiseCSV}>Export Excel (CSV)</Btn>
          <Btn variant="ghost" small onClick={exportPromisePDF}>Export PDF</Btn>
        </div>
      </div>
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2">Promise No</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-right">Paid</th><th className="px-4 py-2 text-right">Remaining</th>
              <th className="px-4 py-2">Promise Date</th><th className="px-4 py-2">Expected Date</th><th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {promiseReportRows.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Koi record nahi.</td></tr>}
            {promiseReportRows.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-black text-blue-700">{p.code}</td>
                <td className="px-4 py-2 font-bold">{p.customerName}</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(p.amount)}</td>
                <td className="px-4 py-2 text-right text-emerald-600 font-bold">{fmtMoney(p.paidAmount)}</td>
                <td className="px-4 py-2 text-right text-red-600 font-bold">{fmtMoney(p.remainingAmount)}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(p.promiseDate)}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDate(p.expectedDate)}</td>
                <td className="px-4 py-2"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${PROMISE_STATUS_TONE[p.status]}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Sales Assistant ---------------- */

function SalesAssistant({ customers, invoices, payments, returns, exchanges, promises }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [lang, setLang] = useState("ur");
  const [audience, setAudience] = useState("Builder");
  const [copied, setCopied] = useState(false);

  const customer = customers.find((c) => c.id === customerId);
  useEffect(() => { if (customer) setAudience(customer.audienceType || "Builder"); }, [customerId]);

  if (customers.length === 0) return <div className="text-slate-400">Pehle Customers tab mein customer add karein.</div>;

  const outstanding = customer ? computeLedgerForCustomer(customer, invoices, payments, returns, exchanges, promises).outstanding : 0;
  const message = MESSAGE_TEMPLATES[lang][audience](customer?.name || "", outstanding);

  function copy() {
    navigator.clipboard?.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Sales Assistant</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 max-w-3xl">
        <Field label="Customer">
          <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Audience Type">
          <select className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value)}>
            {AUDIENCE_TYPES.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Language">
          <select className={inputCls} value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="ur">Roman Urdu</option>
            <option value="en">English</option>
          </select>
        </Field>
      </div>
      <div className="bg-white border border-slate-200 p-4 max-w-2xl">
        <div className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-2">Generated Message</div>
        <textarea readOnly className="w-full border border-slate-300 p-3 text-sm h-56 focus:outline-none" value={message} />
        <div className="flex gap-2 mt-3">
          <a href={waLink(customer?.phone, message)} target="_blank" rel="noreferrer">
            <Btn>Send on WhatsApp</Btn>
          </a>
          <Btn variant="ghost" onClick={copy}>{copied ? "Copied!" : "Copy Text"}</Btn>
        </div>
        {!customer?.phone && <div className="text-xs text-red-600 mt-2">Is customer ka phone number nahi hai — WhatsApp link kaam nahi karega jab tak add na karein.</div>}
      </div>
    </div>
  );
}

/* ---------------- Cement Estimator ---------------- */

function CementEstimator() {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [floors, setFloors] = useState(1);
  const [ratePerBag, setRatePerBag] = useState(1650);

  const area = (Number(length) || 0) * (Number(width) || 0) * (Number(floors) || 1);
  // Standard rough construction estimation ratios (per sq.ft, single-storey slab-equivalent):
  const cementBags = area * 0.4;
  const sandCft = area * 0.8;
  const crushCft = area * 1.2;
  const steelKg = area * 3.5;
  const estimatedCost = cementBags * ratePerBag + sandCft * 90 + crushCft * 130 + steelKg * 280;

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Cement Estimator</h2>
      <div className="bg-white border border-slate-200 p-4 max-w-lg mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Length (ft)"><input type="number" className={inputCls} value={length} onChange={(e) => setLength(e.target.value)} /></Field>
          <Field label="Width (ft)"><input type="number" className={inputCls} value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
          <Field label="Floors"><input type="number" className={inputCls} value={floors} onChange={(e) => setFloors(e.target.value)} /></Field>
          <Field label="Cement Rate (Rs/bag)"><input type="number" className={inputCls} value={ratePerBag} onChange={(e) => setRatePerBag(e.target.value)} /></Field>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Stat label="Covered Area" value={`${area.toLocaleString()} sq.ft`} />
        <Stat label="Cement" value={`${Math.ceil(cementBags)} bags`} />
        <Stat label="Sand" value={`${Math.ceil(sandCft)} cft`} />
        <Stat label="Crush" value={`${Math.ceil(crushCft)} cft`} />
        <Stat label="Steel" value={`${Math.ceil(steelKg)} kg`} />
        <Stat label="Est. Cost" value={fmtMoney(estimatedCost)} accent="text-blue-700" />
      </div>
      <div className="text-xs text-slate-400 mt-4 max-w-lg">
        Ye rough estimate hai, standard ratios par based (0.4 bag/sq.ft cement, 0.8 cft/sq.ft sand, 1.2 cft/sq.ft crush, 3.5 kg/sq.ft steel). Actual site requirement structure design par depend karta hai.
      </div>
    </div>
  );
}

/* ---------------- Customer Portal ---------------- */

function CustomerPortal({ currentUser, customers, invoices, payments, returns, exchanges, promises, settings, offers, onLogout }) {
  const [viewing, setViewing] = useState(null);
  const customer = customers.find((c) => c.id === currentUser.id);
  if (!customer) return <div className="p-6">Account nahi mila, admin se rabta karein.</div>;
  const { entries, outstanding } = computeLedgerForCustomer(customer, invoices, payments, returns, exchanges, promises);
  const myInvoices = [...invoices].filter((i) => i.customerId === customer.id).sort((a, b) => new Date(b.date) - new Date(a.date));

  const activeOffers = (offers || []).filter((o) => o.active);
  const bannerOffer = activeOffers.find((o) => o.bannerUrl);
  const tickerText = activeOffers.map((o) => o.text).join("     ★     ");

  return (
    <div className="min-h-screen bg-slate-100">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-invoice, #print-invoice * { visibility: visible; }
          #print-invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .offer-ticker-track {
          display: inline-block;
          white-space: nowrap;
          animation: ticker-scroll 22s linear infinite;
        }
      `}</style>
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white font-bold">{settings.companyName} Portal</div>
          <div className="text-lg font-black">{customer.name}</div>
        </div>
        <button onClick={onLogout} className="text-xs uppercase tracking-wide font-bold text-slate-400 hover:text-white">Log out</button>
      </div>

      {activeOffers.length > 0 && (
        <div className="bg-slate-900 overflow-hidden whitespace-nowrap py-1.5">
          <span className="offer-ticker-track text-xs font-black uppercase tracking-wide text-white">{tickerText}</span>
        </div>
      )}

      {bannerOffer && (
        <div className="w-full">
          <img src={bannerOffer.bannerUrl} alt="Offer banner" className="w-full max-h-48 object-cover" />
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Stat label="Outstanding Balance" value={fmtMoney(outstanding)} accent={outstanding > 0 ? "text-red-600" : "text-emerald-600"} />
          <Stat label="Credit Limit" value={fmtMoney(customer.creditLimit)} />
          <Stat label="Total Invoices" value={myInvoices.length} />
        </div>

        <div className="bg-white border border-slate-200 mb-6">
          <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">My Invoices</div>
          <table className="w-full text-sm">
            <tbody>
              {myInvoices.length === 0 && <tr><td className="px-4 py-6 text-center text-slate-400">Koi invoice nahi.</td></tr>}
              {myInvoices.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => setViewing(inv)}>
                  <td className="px-4 py-2 font-bold text-blue-700">{inv.number}</td>
                  <td className="px-4 py-2 text-slate-500">{fmtDate(inv.date)}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtMoney(inv.total)}</td>
                  <td className="px-4 py-2 text-right text-red-600 font-bold">{inv.docStatus === "Cancelled" ? "Cancelled" : inv.balanceDue > 0 ? fmtMoney(inv.balanceDue) : "Paid"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200">
          <div className="px-4 py-2.5 border-b border-slate-200 font-black uppercase text-xs tracking-wide text-slate-500">Ledger</div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="bg-slate-50">
                <td className="px-4 py-2 text-slate-500" colSpan={3}>Opening Balance</td>
                <td className="px-4 py-2 text-right font-bold">{fmtMoney(customer.openingBalance || 0)}</td>
              </tr>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{fmtDate(e.date)}</td>
                  <td className="px-4 py-2">{e.type} {e.ref ? `(${e.ref})` : ""}</td>
                  <td className="px-4 py-2 text-right text-red-600">{e.debit ? fmtMoney(e.debit) : ""}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtMoney(e.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {viewing && <InvoiceDetail invoice={viewing} settings={settings} returns={returns} exchanges={exchanges} onClose={() => setViewing(null)} />}
    </div>
  );
}

/* ---------------- Settings ---------------- */

function Settings({ settings, saveSettings, users, saveUser, deleteUser, currentUser, allData, onRestore, branches, saveBranch, deleteBranch }) {
  const [form, setForm] = useState(settings);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "staff", name: "", branchId: currentUser?.branchId || "" });
  const [newBranchName, setNewBranchName] = useState("");
  const [restoreMsg, setRestoreMsg] = useState("");
  const isSuperAdmin = !currentUser?.branchId;

  function downloadBackup() {
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `chaudhary-traders-backup-${todayISO()}.json`;
    a.click();
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        onRestore(data);
        setRestoreMsg("Backup restore ho gaya.");
      } catch {
        setRestoreMsg("Ye file valid backup nahi hai.");
      }
    };
    reader.readAsText(file);
  }

  const [logoError, setLogoError] = useState("");

  async function handleLogoFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setLogoError("Sirf image file (PNG/JPG) upload karein."); return; }
    try {
      const dataUrl = await resizeImageToDataUrl(file, 300);
      setForm((f) => ({ ...f, logoUrl: dataUrl }));
      setLogoError("");
    } catch {
      setLogoError("Logo upload nahi ho saka, dobara try karein.");
    }
  }

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tight mb-4">Settings</h2>

      <div className="bg-white border border-slate-200 p-4 mb-6 max-w-lg">
        <div className="font-black uppercase text-xs tracking-wide text-slate-500 mb-3">Company Info</div>
        <Field label="Company Name"><input className={inputCls} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>
        <Field label="Address"><input className={inputCls} value={form.companyAddress} onChange={(e) => setForm({ ...form, companyAddress: e.target.value })} /></Field>
        <Field label="Phone"><input className={inputCls} value={form.companyPhone} onChange={(e) => setForm({ ...form, companyPhone: e.target.value })} /></Field>

        <Field label="Company Logo">
          <div className="flex items-center gap-3">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="w-14 h-14 object-contain border border-slate-200" />
            ) : (
              <div className="w-14 h-14 bg-slate-900 flex items-center justify-center font-black text-white">CT</div>
            )}
            <label className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer">
              {form.logoUrl ? "Change Logo" : "Upload Logo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            </label>
            {form.logoUrl && (
              <button type="button" className="text-xs font-bold text-red-600 hover:underline" onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))}>
                Remove
              </button>
            )}
          </div>
          {logoError && <div className="text-xs text-red-600 font-semibold mt-1">{logoError}</div>}
          <div className="text-[11px] text-slate-400 mt-1">Logo invoice header aur sidebar par nazar aayega. Chota, square-ish image behtar rahega.</div>
        </Field>

        <Btn onClick={() => saveSettings(form)}>Save</Btn>
      </div>

      <div className="bg-white border border-slate-200 p-4 max-w-lg">
        <div className="font-black uppercase text-xs tracking-wide text-slate-500 mb-3">Users (Admin / Staff)</div>
        <table className="w-full text-sm mb-4">
          <tbody>
            {users.filter((u) => isSuperAdmin || u.branchId === currentUser.branchId).map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="py-2 font-bold">
                  {u.name} <span className="text-[10px] uppercase text-slate-400">({u.role})</span>
                  <div className="text-[10px] text-blue-700 font-bold uppercase">
                    {u.branchId ? (branches.find((b) => b.id === u.branchId)?.name || "Unknown Branch") : "All Branches (Super Admin)"}
                  </div>
                </td>
                <td className="py-2 text-slate-500">{u.username}</td>
                <td className="py-2 text-right">
                  {u.id !== currentUser.id && (
                    <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => deleteUser(u.id)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} placeholder="Full name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          <select className={inputCls} value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
            <option value="staff">Staff</option><option value="admin">Admin</option>
          </select>
          <input className={inputCls} placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
          <input className={inputCls} placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
        </div>
        {isSuperAdmin ? (
          <div className="mt-2">
            <Field label="Branch">
              <select className={inputCls} value={newUser.branchId} onChange={(e) => setNewUser({ ...newUser, branchId: e.target.value })}>
                <option value="">Unassigned (Super Admin — sees all branches)</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          </div>
        ) : (
          <div className="text-xs text-slate-400 mt-2 mb-2">
            Ye user aapki branch ({branches.find((b) => b.id === currentUser.branchId)?.name || "-"}) mein hi add hoga.
          </div>
        )}
        <Btn onClick={() => {
          if (!newUser.username.trim() || !newUser.password.trim()) return;
          const branchId = isSuperAdmin ? newUser.branchId : currentUser.branchId;
          saveUser({ id: uid("u"), ...newUser, branchId });
          setNewUser({ username: "", password: "", role: "staff", name: "", branchId: currentUser?.branchId || "" });
        }}>+ Add User</Btn>
      </div>

      {isSuperAdmin && (
        <div className="bg-white border border-slate-200 p-4 max-w-lg mt-6">
          <div className="font-black uppercase text-xs tracking-wide text-slate-500 mb-3">Branches</div>
          <table className="w-full text-sm mb-4">
            <tbody>
              {branches.length === 0 && <tr><td className="py-2 text-slate-400">Koi branch nahi bani.</td></tr>}
              {branches.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="py-2 font-bold">{b.name}</td>
                  <td className="py-2 text-right">
                    <button className="text-xs font-bold text-slate-500 hover:text-red-600" onClick={() => { if (confirm(`Delete branch "${b.name}"? Us branch ke users ko dobara assign karna hoga.`)) deleteBranch(b.id); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Branch name (e.g. Okara Branch)" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
            <Btn onClick={() => {
              if (!newBranchName.trim()) return;
              saveBranch({ name: newBranchName.trim() });
              setNewBranchName("");
            }}>+ Add Branch</Btn>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Har branch ke customers, invoices, ledger, bookings, orders aur leads alag rahenge. Us branch ke admin/staff ko Users section se assign karein.
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="bg-white border border-slate-200 p-4 max-w-lg mt-6">
          <div className="font-black uppercase text-xs tracking-wide text-slate-500 mb-3">Backup</div>
          <div className="flex gap-2 items-center flex-wrap">
            <Btn variant="dark" onClick={downloadBackup}>Download Backup (JSON)</Btn>
            <label className="px-4 py-2 text-sm font-bold uppercase tracking-wide border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer">
              Restore from File
              <input type="file" accept="application/json" className="hidden" onChange={handleFile} />
            </label>
          </div>
          {restoreMsg && <div className="text-xs text-emerald-600 font-bold mt-2">{restoreMsg}</div>}
          <div className="text-xs text-slate-400 mt-2">Restore purana data overwrite kar dega (sab branches). Pehle current data ka backup le lein.</div>
        </div>
      )}
    </div>
  );
}

/* ---------------- App ---------------- */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [ledgerFocusId, setLedgerFocusId] = useState(null);
  const [invoicePrefill, setInvoicePrefill] = useState(null);
  const [focusInvoiceId, setFocusInvoiceId] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");

  const [users, setUsers] = useState(DEFAULT_USERS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [offers, setOffers] = useState([]);
  const [returns, setReturns] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [promises, setPromises] = useState([]);

  useEffect(() => {
    (async () => {
      const [u, s, c, p, i, pay, bk, ld, dr, ord, br, off, ret, exc, cn, al, pr] = await Promise.all([
        storeGet("ct-users", DEFAULT_USERS),
        storeGet("ct-settings", DEFAULT_SETTINGS),
        storeGet("ct-customers", []),
        storeGet("ct-products", []),
        storeGet("ct-invoices", []),
        storeGet("ct-payments", []),
        storeGet("ct-bookings", []),
        storeGet("ct-leads", []),
        storeGet("ct-drivers", []),
        storeGet("ct-orders", []),
        storeGet("ct-branches", DEFAULT_BRANCHES),
        storeGet("ct-offers", []),
        storeGet("ct-returns", []),
        storeGet("ct-exchanges", []),
        storeGet("ct-creditnotes", []),
        storeGet("ct-auditlog", []),
        storeGet("ct-promises", []),
      ]);
      setUsers(u); setSettings(s); setCustomers(c); setProducts(p);
      setInvoices(i); setPayments(pay); setBookings(bk); setLeads(ld); setDrivers(dr); setOrders(ord); setBranches(br); setOffers(off);
      setReturns(ret); setExchanges(exc); setCreditNotes(cn); setAuditLog(al); setPromises(pr);
      if (u.length === 0) { setUsers(DEFAULT_USERS); await storeSet("ct-users", DEFAULT_USERS); }
      setLoading(false);
    })();
  }, []);

  // Live sync: when Supabase is configured, pick up changes saved from
  // OTHER devices/browsers in real time (no manual refresh needed).
  useEffect(() => {
    if (!supabase) return;
    const setterByKey = {
      "ct-users": setUsers, "ct-settings": setSettings, "ct-customers": setCustomers,
      "ct-products": setProducts, "ct-invoices": setInvoices, "ct-payments": setPayments,
      "ct-bookings": setBookings, "ct-leads": setLeads, "ct-drivers": setDrivers,
      "ct-orders": setOrders, "ct-branches": setBranches, "ct-offers": setOffers,
      "ct-returns": setReturns, "ct-exchanges": setExchanges, "ct-creditnotes": setCreditNotes,
      "ct-auditlog": setAuditLog, "ct-promises": setPromises,
    };
    const channel = supabase
      .channel("kv_store-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "kv_store" }, (payload) => {
        const row = payload.new;
        if (row && setterByKey[row.key]) setterByKey[row.key](row.value);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // persist helpers
  const persist = {
    users: (v) => { setUsers(v); storeSet("ct-users", v); },
    settings: (v) => { setSettings(v); storeSet("ct-settings", v); },
    customers: (v) => { setCustomers(v); storeSet("ct-customers", v); },
    products: (v) => { setProducts(v); storeSet("ct-products", v); },
    invoices: (v) => { setInvoices(v); storeSet("ct-invoices", v); },
    payments: (v) => { setPayments(v); storeSet("ct-payments", v); },
    bookings: (v) => { setBookings(v); storeSet("ct-bookings", v); },
    leads: (v) => { setLeads(v); storeSet("ct-leads", v); },
    drivers: (v) => { setDrivers(v); storeSet("ct-drivers", v); },
    orders: (v) => { setOrders(v); storeSet("ct-orders", v); },
    branches: (v) => { setBranches(v); storeSet("ct-branches", v); },
    offers: (v) => { setOffers(v); storeSet("ct-offers", v); },
    returns: (v) => { setReturns(v); storeSet("ct-returns", v); },
    exchanges: (v) => { setExchanges(v); storeSet("ct-exchanges", v); },
    creditNotes: (v) => { setCreditNotes(v); storeSet("ct-creditnotes", v); },
    auditLog: (v) => { setAuditLog(v); storeSet("ct-auditlog", v); },
    promises: (v) => { setPromises(v); storeSet("ct-promises", v); },
  };

  function upsert(list, item) {
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx === -1) return [...list, item];
    const copy = [...list]; copy[idx] = item; return copy;
  }

  // Feature 13 (Phase 2) / Feature 16 (Phase 3): Audit Log helper. Records
  // every Return, Exchange, Delete Return, Delete Exchange, Promise
  // Created/Edited/Completed/Cancelled/Broken/Deleted, and Invoice Status
  // Change with user/date/time/reason.
  function logAudit(action, reference, reason) {
    const entry = {
      id: uid("al"), action, reference,
      user: currentUser?.name || currentUser?.username || "Unknown",
      at: new Date().toISOString(),
      reason: reason || "",
    };
    persist.auditLog([...auditLog, entry]);
  }

  const saveCustomer = (c) => {
    const finalBranchId = currentUser?.branchId ? currentUser.branchId : (c.branchId || "");
    persist.customers(upsert(customers, { ...c, branchId: finalBranchId }));
  };
  const deleteCustomer = (id) => persist.customers(customers.filter((c) => c.id !== id));
  const saveBranch = (b) => persist.branches(b.id ? upsert(branches, b) : [...branches, { id: uid("br"), ...b }]);
  const deleteBranch = (id) => persist.branches(branches.filter((b) => b.id !== id));
  const saveProduct = (p) => persist.products(upsert(products, p));
  const deleteProduct = (id) => persist.products(products.filter((p) => p.id !== id));
  const savePayment = (p) => {
    persist.payments([...payments, p]);
    // Feature 7 — applying a payment against a promise reduces the
    // promised amount / updates remaining amount / status automatically
    // (paidAmount is derived from summed linked payments below).
    if (p.promiseId) {
      const promise = promises.find((pr) => pr.id === p.promiseId);
      if (promise) {
        const newPaid = (Number(promise.paidAmount) || 0) + Number(p.amount);
        const updated = promiseWithComputed({ ...promise, paidAmount: newPaid });
        persist.promises(upsert(promises, updated));
        logAudit("Promise Payment", `${promise.code} — Rs ${Number(p.amount).toLocaleString()} applied`, "Payment applied against promise");
      }
    }
  };
  const saveBooking = (b) => persist.bookings(upsert(bookings, b));

  function createAdvanceBooking(data) {
    const counter = settings.bookingCounter || 1;
    const code = "ADV-" + String(counter).padStart(4, "0");
    const expiryDate = addOneMonth(data.date);
    const booking = { id: uid("bk"), code, expiryDate, status: "Booked", ...data };
    persist.bookings([...bookings, booking]);
    persist.settings({ ...settings, bookingCounter: counter + 1 });
    if (Number(data.advanceAmount) > 0) {
      persist.payments([...payments, {
        id: uid("pay"), customerId: data.customerId, customerName: data.customerName,
        date: data.date, amount: Number(data.advanceAmount), method: "Advance Booking",
        note: `Advance for booking ${code} (${data.productName || "item"})`,
      }]);
    }
  }

  function convertBookingToInvoice(booking) {
    setInvoicePrefill({
      sourceType: "booking",
      sourceId: booking.id,
      sourceCode: booking.code,
      customerId: booking.customerId,
      productId: booking.productId || "",
      productName: booking.productName,
      unit: booking.unit,
      qty: booking.qty,
      rate: booking.rate,
    });
    setPage("invoices");
  }

  function convertOrderToInvoice(order) {
    const product = products.find((p) => p.id === order.productId);
    setInvoicePrefill({
      sourceType: "order",
      sourceId: order.id,
      sourceCode: order.code,
      customerId: order.customerId,
      productId: order.productId || "",
      productName: order.productName,
      unit: order.unit,
      qty: order.qty,
      rate: product ? product.price : 0,
    });
    setPage("invoices");
  }

  function markBookingFulfilled(bookingId) {
    const b = bookings.find((x) => x.id === bookingId);
    if (b) persist.bookings(upsert(bookings, { ...b, status: "Completed" }));
  }

  function createOrder(data) {
    const counter = settings.orderCounter || 1;
    const code = "ORD-" + String(counter).padStart(4, "0");
    persist.orders([...orders, { id: uid("ord"), code, status: "Pending", ...data }]);
    persist.settings({ ...settings, orderCounter: counter + 1 });
  }
  const saveOrder = (o) => persist.orders(upsert(orders, o));
  const deleteOrder = (id) => persist.orders(orders.filter((o) => o.id !== id));
  function markOrderFulfilled(orderId) {
    const o = orders.find((x) => x.id === orderId);
    if (o) persist.orders(upsert(orders, { ...o, status: "Completed" }));
  }

  const saveLead = (l) => {
    const isNew = !leads.some((x) => x.id === l.id);
    const finalLead = isNew ? { ...l, branchId: currentUser?.branchId || l.branchId || "" } : l;
    persist.leads(upsert(leads, finalLead));
  };
  const deleteLead = (id) => persist.leads(leads.filter((l) => l.id !== id));
  const saveSettings = (s) => persist.settings(s);

  function saveDriver(driverData) {
    if (driverData.id) {
      persist.drivers(upsert(drivers, driverData));
      return;
    }
    const counter = settings.driverCounter || 1;
    const code = "DRV-" + String(counter).padStart(4, "0");
    persist.drivers([...drivers, { id: uid("drv"), code, ...driverData }]);
    persist.settings({ ...settings, driverCounter: counter + 1 });
  }
  const deleteDriver = (id) => persist.drivers(drivers.filter((d) => d.id !== id));
  const saveOffer = (o) => persist.offers(o.id ? upsert(offers, o) : [...offers, { id: uid("off"), ...o }]);
  const deleteOffer = (id) => persist.offers(offers.filter((o) => o.id !== id));
  const saveUser = (u) => persist.users(upsert(users, u));
  const deleteUser = (id) => persist.users(users.filter((u) => u.id !== id));

  function saveInvoice(inv) {
    persist.invoices([...invoices, inv]);
    persist.settings({ ...settings, invoiceCounter: settings.invoiceCounter + 1 });
    if (inv.paymentReceived > 0) {
      persist.payments([...payments, {
        id: uid("pay"), customerId: inv.customerId, customerName: inv.customerName,
        date: inv.date, amount: inv.paymentReceived, method: "Cash", note: `Against ${inv.number}`, invoiceId: inv.id,
      }]);
    }
  }

  function openLedger(customerId) { setLedgerFocusId(customerId); setPage("ledger"); }

  // ---------- Phase 2: Sales Return / Exchange / Credit Notes ----------

  function createSalesReturn(data) {
    const counter = settings.returnCounter || 1;
    const invoice = invoices.find((i) => i.id === data.invoiceId);
    const code = invoice ? `RET-${invoice.number.replace(/^CT-/, "")}-${String(counter).padStart(2, "0")}` : "RET-" + String(counter).padStart(4, "0");
    const ret = { id: uid("ret"), code, status: "Active", ...data };

    const cnCounter = settings.creditNoteCounter || 1;
    const cnNumber = "CN-" + String(cnCounter).padStart(4, "0");
    const creditNote = {
      id: uid("cn"), number: cnNumber, date: data.date, customerId: data.customerId, customerName: data.customerName,
      amount: data.amount, reason: `Sales Return ${code}`, status: "Issued", sourceReturnId: ret.id,
      linkedInvoiceNumber: "",
    };

    persist.returns([...returns, ret]);
    persist.creditNotes([...creditNotes, creditNote]);
    persist.settings({ ...settings, returnCounter: counter + 1, creditNoteCounter: cnCounter + 1 });
    logAudit("Sales Return", `${code} (Invoice ${data.invoiceNumber})`, data.reason);

    const inv = invoices.find((i) => i.id === data.invoiceId);
    if (inv) {
      const newStatus = computeInvoiceReturnStatus({ ...inv }, [...returns, ret], exchanges).status;
      logAudit("Invoice Status Change", `${inv.number} → ${newStatus}`, `Auto-updated after Sales Return ${code}`);
    }
  }

  // Delete Return (Feature 6): reverse ledger (automatic via computeLedger
  // excluding non-Active returns), restore invoice qty/status (automatic via
  // computeInvoiceReturnStatus), and reverse the linked Credit Note.
  function deleteSalesReturn(ret, reason) {
    const finalRet = {
      ...ret, status: "Deleted", deletedBy: currentUser?.name || currentUser?.username || "Unknown",
      deletedAt: new Date().toISOString(), deleteReason: reason,
    };
    persist.returns(upsert(returns, finalRet));
    const linkedCn = creditNotes.find((cn) => cn.sourceReturnId === ret.id);
    if (linkedCn) persist.creditNotes(upsert(creditNotes, { ...linkedCn, status: "Reversed" }));
    logAudit("Delete Return", `${ret.code} (Invoice ${ret.invoiceNumber})`, reason);
    const inv = invoices.find((i) => i.id === ret.invoiceId);
    if (inv) {
      const newStatus = computeInvoiceReturnStatus(inv, upsert(returns, finalRet), exchanges).status;
      logAudit("Invoice Status Change", `${inv.number} → ${newStatus}`, `Auto-updated after deleting Return ${ret.code}`);
    }
  }

  function createExchangeFn(data) {
    const counter = settings.exchangeCounter || 1;
    const invoice = invoices.find((i) => i.id === data.invoiceId);
    const code = invoice ? `EX-${invoice.number.replace(/^CT-/, "")}-${String(counter).padStart(2, "0")}` : "EXC-" + String(counter).padStart(4, "0");
    const exchange = { id: uid("exc"), code, status: "Active", ...data };
    persist.exchanges([...exchanges, exchange]);
    persist.settings({ ...settings, exchangeCounter: counter + 1 });
    logAudit("Exchange", `${code} (Invoice ${data.invoiceNumber})`, data.reason);
    const inv = invoices.find((i) => i.id === data.invoiceId);
    if (inv) {
      const newStatus = computeInvoiceReturnStatus(inv, returns, [...exchanges, exchange]).status;
      logAudit("Invoice Status Change", `${inv.number} → ${newStatus}`, `Auto-updated after Exchange ${code}`);
    }
  }

  // Delete Exchange (Feature 7): reverse ledger + restore quantities/status
  // automatically since computeLedgerForCustomer and
  // computeInvoiceReturnStatus both ignore non-Active exchanges.
  function deleteExchangeFn(exchange, reason) {
    const finalEx = {
      ...exchange, status: "Deleted", deletedBy: currentUser?.name || currentUser?.username || "Unknown",
      deletedAt: new Date().toISOString(), deleteReason: reason,
    };
    persist.exchanges(upsert(exchanges, finalEx));
    logAudit("Delete Exchange", `${exchange.code} (Invoice ${exchange.invoiceNumber})`, reason);
    const inv = invoices.find((i) => i.id === exchange.invoiceId);
    if (inv) {
      const newStatus = computeInvoiceReturnStatus(inv, returns, upsert(exchanges, finalEx)).status;
      logAudit("Invoice Status Change", `${inv.number} → ${newStatus}`, `Auto-updated after deleting Exchange ${exchange.code}`);
    }
  }

  function linkCreditNoteToInvoice(creditNoteId, invoiceNumber) {
    const cn = creditNotes.find((c) => c.id === creditNoteId);
    if (!cn) return;
    persist.creditNotes(upsert(creditNotes, { ...cn, linkedInvoiceNumber: invoiceNumber }));
  }

  // ---------- Phase 3: Promise To Pay ----------

  // Feature 2 / 3 — Create Promise (auto-numbered PTP-xxxx, one customer
  // can have many). Feature 14 — reminder fields prepared but unused.
  function createPromise(data) {
    const counter = settings.promiseCounter || 1;
    const code = "PTP-" + String(counter).padStart(4, "0");
    const promise = promiseWithComputed({
      id: uid("ptp"), code, ...data,
      paidAmount: 0,
      createdBy: currentUser?.name || currentUser?.username || "Unknown",
      createdAt: new Date().toISOString(),
      status: "Pending",
      lastReminderDate: "",
      reminderCount: 0,
      reminderStatus: "Not Sent",
    });
    persist.promises([...promises, promise]);
    persist.settings({ ...settings, promiseCounter: counter + 1 });
    logAudit("Promise Created", `${code} — ${data.customerName} — Rs ${Number(data.amount).toLocaleString()}`, "");
  }

  function updatePromiseFn(promise, reason) {
    const updated = promiseWithComputed(promise);
    persist.promises(upsert(promises, updated));
    const action = updated.status === "Completed" ? "Promise Completed" : "Promise Edited";
    logAudit(action, `${updated.code} — ${updated.customerName}`, reason || "");
  }

  function cancelPromiseFn(promise, reason) {
    const updated = { ...promise, status: "Cancelled" };
    persist.promises(upsert(promises, updated));
    logAudit("Promise Cancelled", `${promise.code} — ${promise.customerName}`, reason);
  }

  // Delete Promise (Feature 16 / admin-only per Feature 18): soft-delete so
  // it disappears from lists/ledger (computeLedgerForCustomer already
  // filters status !== "Deleted") without losing the audit trail.
  function deletePromiseFn(promise, reason) {
    const updated = {
      ...promise, status: "Deleted",
      deletedBy: currentUser?.name || currentUser?.username || "Unknown",
      deletedAt: new Date().toISOString(), deleteReason: reason,
    };
    persist.promises(upsert(promises, updated));
    logAudit("Promise Deleted", `${promise.code} — ${promise.customerName}`, reason);
  }

  // Feature 11 — Auto Status sweep. Runs whenever promises load/change so
  // that Pending/Partially Paid promises whose Expected Date has passed
  // flip to "Broken Promise" without requiring a manual save.
  useEffect(() => {
    if (loading || promises.length === 0) return;
    let changed = false;
    const swept = promises.map((p) => {
      if (p.status === "Completed" || p.status === "Cancelled" || p.status === "Deleted") return p;
      const computed = computePromiseStatus(p);
      if (computed !== p.status) { changed = true; return { ...p, status: computed }; }
      return p;
    });
    if (changed) persist.promises(swept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, promises.length]);

  // Feature 12: Global search — resolves INV-xxxx / RET-xxxx-xx / EX-xxxx-xx
  // to the linked invoice and opens its detail (with full Return/Exchange history).
  function runGlobalSearch(query) {
    const q = query.trim().toUpperCase();
    if (!q) return;
    let invoiceId = null;
    const invByNumber = invoices.find((i) => i.number.toUpperCase() === q);
    if (invByNumber) invoiceId = invByNumber.id;
    if (!invoiceId) {
      const retMatch = returns.find((r) => r.code.toUpperCase() === q);
      if (retMatch) invoiceId = retMatch.invoiceId;
    }
    if (!invoiceId) {
      const exMatch = exchanges.find((ex) => ex.code.toUpperCase() === q);
      if (exMatch) invoiceId = exMatch.invoiceId;
    }
    if (invoiceId) {
      setPage("invoices");
      setFocusInvoiceId(invoiceId);
    } else if (promises.some((p) => p.code.toUpperCase() === q)) {
      setPage("promises");
    } else {
      alert("Koi invoice, return, exchange ya promise is number se nahi mila.");
    }
  }

  function goToReturnInvoice(ret) { setPage("invoices"); setFocusInvoiceId(ret.invoiceId); }
  function goToExchangeInvoice(ex) { setPage("invoices"); setFocusInvoiceId(ex.invoiceId); }

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm font-bold uppercase tracking-wide">Loading...</div>;
  }
  if (!currentUser) {
    return (
      <Login
        users={users}
        customers={customers}
        onLogin={setCurrentUser}
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        onResetUsers={() => persist.users(DEFAULT_USERS)}
      />
    );
  }

  if (currentUser.role === "customer") {
    return (
      <CustomerPortal
        currentUser={currentUser}
        customers={customers}
        invoices={invoices}
        payments={payments}
        returns={returns}
        exchanges={exchanges}
        promises={promises}
        settings={settings}
        offers={offers}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  function handleRestore(data) {
    if (data.users) persist.users(data.users);
    if (data.settings) persist.settings(data.settings);
    if (data.customers) persist.customers(data.customers);
    if (data.products) persist.products(data.products);
    if (data.invoices) persist.invoices(data.invoices);
    if (data.payments) persist.payments(data.payments);
    if (data.bookings) persist.bookings(data.bookings);
    if (data.leads) persist.leads(data.leads);
    if (data.drivers) persist.drivers(data.drivers);
    if (data.orders) persist.orders(data.orders);
    if (data.branches) persist.branches(data.branches);
    if (data.offers) persist.offers(data.offers);
    if (data.returns) persist.returns(data.returns);
    if (data.exchanges) persist.exchanges(data.exchanges);
    if (data.creditNotes) persist.creditNotes(data.creditNotes);
    if (data.auditLog) persist.auditLog(data.auditLog);
    if (data.promises) persist.promises(data.promises);
  }

  // Invoice EDIT: recompute totals, keep number/id, tag docStatus, log history,
  // and sync the "payment received now" record so ledger stays accurate.
  function updateInvoice(newInv, oldInv) {
    const editedBy = currentUser?.name || currentUser?.username || "Unknown";
    const editedAt = new Date().toISOString();
    const previousValues = {
      customer: oldInv.customerName,
      date: oldInv.date,
      total: oldInv.total,
      discount: oldInv.discount,
      deliveryCharges: oldInv.deliveryCharges,
      paymentReceived: oldInv.paymentReceived,
    };
    const newValues = {
      customer: newInv.customerName,
      date: newInv.date,
      total: newInv.total,
      discount: newInv.discount,
      deliveryCharges: newInv.deliveryCharges,
      paymentReceived: newInv.paymentReceived,
    };
    const historyEntry = { action: "Edited", editedBy, editedAt, previousValues, newValues };
    const finalInv = {
      ...newInv,
      docStatus: oldInv.docStatus || "Active",
      editHistory: [...(oldInv.editHistory || []), historyEntry],
    };
    persist.invoices(upsert(invoices, finalInv));

    // Sync the payment record tied to this invoice (created at invoice time).
    const existingPayment = payments.find(
      (p) => p.invoiceId === oldInv.id || (p.note === `Against ${oldInv.number}` && p.customerId === oldInv.customerId)
    );
    let nextPayments = payments;
    if (Number(newInv.paymentReceived) > 0) {
      if (existingPayment) {
        nextPayments = upsert(payments, {
          ...existingPayment,
          amount: Number(newInv.paymentReceived),
          date: newInv.date,
          customerId: newInv.customerId,
          customerName: newInv.customerName,
          note: `Against ${newInv.number}`,
          invoiceId: newInv.id,
        });
      } else {
        nextPayments = [...payments, {
          id: uid("pay"), customerId: newInv.customerId, customerName: newInv.customerName,
          date: newInv.date, amount: Number(newInv.paymentReceived), method: "Cash",
          note: `Against ${newInv.number}`, invoiceId: newInv.id,
        }];
      }
    } else if (existingPayment) {
      nextPayments = payments.filter((p) => p.id !== existingPayment.id);
    }
    persist.payments(nextPayments);
  }

  // Invoice CANCEL: mark cancelled, log history. Ledger/dashboard update
  // automatically because computeLedgerForCustomer excludes cancelled
  // invoices (and their linked payment) from every calculation.
  function cancelInvoiceFn(inv) {
    const editedBy = currentUser?.name || currentUser?.username || "Unknown";
    const editedAt = new Date().toISOString();
    const historyEntry = {
      action: "Cancelled", editedBy, editedAt,
      previousValues: { status: "Active" }, newValues: { status: "Cancelled" },
    };
    const finalInv = { ...inv, docStatus: "Cancelled", editHistory: [...(inv.editHistory || []), historyEntry] };
    persist.invoices(upsert(invoices, finalInv));
    logAudit("Invoice Status Change", `${inv.number} → Cancelled`, "Manually cancelled");
  }

  // Branch scoping: users with a branchId only see their own branch's customer data.
  // Users with no branchId (Super Admin) see everything across all branches.
  const myBranchId = currentUser?.branchId || "";
  const myBranchName = branches.find((b) => b.id === myBranchId)?.name || "";
  const visibleCustomers = myBranchId ? customers.filter((c) => c.branchId === myBranchId) : customers;
  const visibleCustomerIds = new Set(visibleCustomers.map((c) => c.id));
  const visibleInvoices = myBranchId ? invoices.filter((i) => visibleCustomerIds.has(i.customerId)) : invoices;
  const visiblePayments = myBranchId ? payments.filter((p) => visibleCustomerIds.has(p.customerId)) : payments;
  const visibleBookings = myBranchId ? bookings.filter((b) => visibleCustomerIds.has(b.customerId)) : bookings;
  const visibleOrders = myBranchId ? orders.filter((o) => visibleCustomerIds.has(o.customerId)) : orders;
  const visibleLeads = myBranchId ? leads.filter((l) => l.branchId === myBranchId) : leads;
  const visibleReturns = myBranchId ? returns.filter((r) => visibleCustomerIds.has(r.customerId)) : returns;
  const visibleExchanges = myBranchId ? exchanges.filter((e) => visibleCustomerIds.has(e.customerId)) : exchanges;
  const visibleCreditNotes = myBranchId ? creditNotes.filter((c) => visibleCustomerIds.has(c.customerId)) : creditNotes;
  const visiblePromises = myBranchId ? promises.filter((p) => visibleCustomerIds.has(p.customerId)) : promises;

  const pages = {
    dashboard: <Dashboard customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments} returns={visibleReturns} exchanges={visibleExchanges} promises={visiblePromises} leads={visibleLeads} bookings={visibleBookings} onOpenPromises={() => setPage("promises")} />,
    customers: (
      <Customers
        customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments} returns={visibleReturns} exchanges={visibleExchanges} promises={visiblePromises}
        saveCustomer={saveCustomer} deleteCustomer={deleteCustomer} openLedger={openLedger}
        branches={branches} currentUser={currentUser}
      />
    ),
    invoices: (
      <Invoices
        customers={visibleCustomers} products={products} drivers={drivers} invoices={visibleInvoices} payments={visiblePayments}
        returns={visibleReturns} exchanges={visibleExchanges} promises={visiblePromises}
        bookings={visibleBookings} settings={settings} currentUser={currentUser} saveInvoice={saveInvoice}
        updateInvoice={updateInvoice} cancelInvoice={cancelInvoiceFn}
        prefill={invoicePrefill} onClearPrefill={() => setInvoicePrefill(null)} onBookingFulfilled={markBookingFulfilled} onOrderFulfilled={markOrderFulfilled}
        focusInvoiceId={focusInvoiceId} setFocusInvoiceId={setFocusInvoiceId}
        onGoToReturn={goToReturnInvoice} onGoToExchange={goToExchangeInvoice}
      />
    ),
    invoiceHistory: <InvoiceHistoryPage invoices={visibleInvoices} auditLog={auditLog} />,
    returns: <SalesReturnPage customers={visibleCustomers} invoices={visibleInvoices} returns={visibleReturns} exchanges={visibleExchanges} currentUser={currentUser} onCreateReturn={createSalesReturn} onDeleteReturn={deleteSalesReturn} />,
    exchange: <ExchangePage customers={visibleCustomers} products={products} invoices={visibleInvoices} returns={visibleReturns} exchanges={visibleExchanges} currentUser={currentUser} onCreateExchange={createExchangeFn} onDeleteExchange={deleteExchangeFn} />,
    creditNotes: <CreditNotesPage creditNotes={visibleCreditNotes} onLinkInvoice={linkCreditNoteToInvoice} />,
    ledger: <LedgerView customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments} returns={visibleReturns} exchanges={visibleExchanges} promises={visiblePromises} focusId={ledgerFocusId} setFocusId={setLedgerFocusId} settings={settings} />,
    payments: <Payments customers={visibleCustomers} payments={visiblePayments} promises={visiblePromises} savePayment={savePayment} />,
    bookings: (
      <Bookings
        customers={visibleCustomers} products={products} bookings={visibleBookings} saveBooking={saveBooking}
        onCreateAdvanceBooking={createAdvanceBooking} onConvertToInvoice={convertBookingToInvoice}
      />
    ),
    orders: (
      <Orders
        customers={visibleCustomers} products={products} orders={visibleOrders}
        onCreateOrder={createOrder} saveOrder={saveOrder} onConvertToInvoice={convertOrderToInvoice}
      />
    ),
    promises: (
      <PromiseToPayPage
        customers={visibleCustomers} promises={visiblePromises} currentUser={currentUser}
        onCreatePromise={createPromise} onUpdatePromise={updatePromiseFn}
        onCancelPromise={cancelPromiseFn} onDeletePromise={deletePromiseFn}
      />
    ),
    leads: <Leads leads={visibleLeads} saveLead={saveLead} deleteLead={deleteLead} />,
    products: <Products products={products} saveProduct={saveProduct} deleteProduct={deleteProduct} />,
    drivers: <Drivers drivers={drivers} saveDriver={saveDriver} deleteDriver={deleteDriver} />,
    offers: <Offers offers={offers} saveOffer={saveOffer} deleteOffer={deleteOffer} />,
    reports: <Reports customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments} returns={visibleReturns} exchanges={visibleExchanges} promises={visiblePromises} leads={visibleLeads} bookings={visibleBookings} />,
    assistant: <SalesAssistant customers={visibleCustomers} invoices={visibleInvoices} payments={visiblePayments} returns={visibleReturns} exchanges={visibleExchanges} promises={visiblePromises} />,
    estimator: <CementEstimator />,
    settings: (
      <Settings
        settings={settings} saveSettings={saveSettings} users={users} saveUser={saveUser} deleteUser={deleteUser}
        currentUser={currentUser} onRestore={handleRestore}
        allData={{ users, settings, customers, products, invoices, payments, bookings, leads, drivers, orders, branches, offers, returns, exchanges, creditNotes, auditLog, promises }}
        branches={branches} saveBranch={saveBranch} deleteBranch={deleteBranch}
      />
    ),
  };

  return (
    <div className="h-screen flex bg-slate-100 text-slate-900">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-invoice, #print-invoice * { visibility: visible; }
          #print-invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
          #print-ledger, #print-ledger * { visibility: visible; }
          #print-ledger { display: block !important; position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
        }
      `}</style>
      <Sidebar page={page} setPage={setPage} role={currentUser.role} onLogout={() => setCurrentUser(null)} companyName={settings.companyName} logoUrl={settings.logoUrl} />
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 gap-4">
          <div className="text-sm text-slate-500 whitespace-nowrap">
            Welcome, <span className="font-bold text-slate-900">{currentUser.name}</span>
            {myBranchName && <span className="ml-2 text-xs text-blue-700 font-bold uppercase">· {myBranchName}</span>}
            {!myBranchId && <span className="ml-2 text-xs text-blue-700 font-bold uppercase">· All Branches</span>}
          </div>
          <div className="flex-1 max-w-xs">
            <input
              className={`${inputCls} text-xs`}
              placeholder="Search INV-xxxx / RET-xxxx-xx / EX-xxxx-xx / PTP-xxxx..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { runGlobalSearch(globalSearch); setGlobalSearch(""); } }}
            />
          </div>
          <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400 whitespace-nowrap">{currentUser.role}</div>
        </div>
        <div className="p-6">{pages[page]}</div>
      </div>
    </div>
  );
}
