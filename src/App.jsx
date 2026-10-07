--- original
+++ fixed
@@ -758,12 +758,33 @@
   return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
 }
 function todayISO() {
-  return new Date().toISOString().slice(0, 10);
+  const d = new Date();
+  const year = d.getFullYear();
+  const month = String(d.getMonth() + 1).padStart(2, "0");
+  const day = String(d.getDate()).padStart(2, "0");
+
+  return `${year}-${month}-${day}`;
+}
+// Date-only helpers. Invoice/payment/booking dates are stored as plain
+// "YYYY-MM-DD" strings — calendar dates, not timestamps — so they must
+// never be routed through UTC (toISOString / new Date("YYYY-MM-DD")),
+// which can shift them by one day depending on the device timezone.
+function dateToLocalISO(d) {
+  const year = d.getFullYear();
+  const month = String(d.getMonth() + 1).padStart(2, "0");
+  const day = String(d.getDate()).padStart(2, "0");
+  return `${year}-${month}-${day}`;
+}
+function parseDateValue(v) {
+  const m = typeof v === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null;
+  // Date-only string -> same calendar day in local time (no UTC shift).
+  // Anything else (full timestamps such as uploaded_at) is parsed as before.
+  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
 }
 function addOneMonth(dateStr) {
-  const d = new Date(dateStr || todayISO());
+  const d = parseDateValue(dateStr || todayISO());
   d.setMonth(d.getMonth() + 1);
-  return d.toISOString().slice(0, 10);
+  return dateToLocalISO(d);
 }
 function fmtMoney(n) {
   const v = Number(n) || 0;
@@ -771,7 +792,7 @@
 }
 function fmtDate(d) {
   if (!d) return "-";
-  const dt = new Date(d);
+  const dt = parseDateValue(d);
   return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
 }
 function fmtDateTime(d) {
@@ -1523,7 +1544,7 @@
   const activePromises = useMemo(() => promises.filter((p) => p.status !== "Deleted").map(promiseWithComputed), [promises]);
   const t = todayISO();
   const in7 = new Date(); in7.setDate(in7.getDate() + 7);
-  const in7ISO = in7.toISOString().slice(0, 10);
+  const in7ISO = dateToLocalISO(in7);
   const todaysPromises = activePromises.filter((p) => p.expectedDate === t && (p.status === "Pending" || p.status === "Partially Paid"));
   const upcomingPromises = activePromises.filter((p) => p.expectedDate > t && p.expectedDate <= in7ISO && (p.status === "Pending" || p.status === "Partially Paid"));
   const overduePromises = activePromises.filter((p) => p.status === "Broken Promise");
@@ -5674,7 +5695,7 @@
     if (commissionRangePreset === "Today") { setCommissionFrom(t); setCommissionTo(t); }
     else if (commissionRangePreset === "This Week") {
       const d = new Date(); const day = d.getDay(); const monday = new Date(d); monday.setDate(d.getDate() - ((day + 6) % 7));
-      setCommissionFrom(monday.toISOString().slice(0, 10)); setCommissionTo(t);
+      setCommissionFrom(dateToLocalISO(monday)); setCommissionTo(t);
     } else if (commissionRangePreset === "This Month") {
       setCommissionFrom(t.slice(0, 8) + "01"); setCommissionTo(t);
     }
