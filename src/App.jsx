import { useState, useMemo } from "react";

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const INITIAL_CATEGORIES = [
  { id: "c1", name: "🍔 Food",          budget: 400 },
  { id: "c2", name: "🏠 Rent",          budget: 1500 },
  { id: "c3", name: "🚗 Transport",     budget: 200 },
  { id: "c4", name: "💡 Utilities",     budget: 150 },
  { id: "c5", name: "🎯 Investments",   budget: 500 },
  { id: "c6", name: "🎉 Entertainment", budget: 100 },
  { id: "c7", name: "💊 Health",        budget: 120 },
  { id: "c8", name: "📦 Other",         budget: 100 },
];

const NOW = new Date();
const MONTHS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth() - i, 1);
  return {
    id: `m${i}`,
    label: d.toLocaleString("default", { month: "long", year: "numeric" }),
    year: d.getFullYear(),
    month: d.getMonth(),
  };
});

const INITIAL_TRANSACTIONS = [
  { id: "t1",  name: "Salary",          amount: 4200, type: "Income",  date: fmtDate(0,  1), categoryId: "c5", monthId: "m0" },
  { id: "t2",  name: "Grocery Run",     amount: 85,   type: "Expense", date: fmtDate(0,  3), categoryId: "c1", monthId: "m0" },
  { id: "t3",  name: "Monthly Rent",    amount: 1500, type: "Expense", date: fmtDate(0,  1), categoryId: "c2", monthId: "m0" },
  { id: "t4",  name: "Gas",             amount: 55,   type: "Expense", date: fmtDate(0,  4), categoryId: "c3", monthId: "m0" },
  { id: "t5",  name: "Netflix",         amount: 18,   type: "Expense", date: fmtDate(0,  2), categoryId: "c6", monthId: "m0" },
  { id: "t6",  name: "Freelance Work",  amount: 750,  type: "Income",  date: fmtDate(0,  8), categoryId: "c5", monthId: "m0" },
  { id: "t7",  name: "Dinner Out",      amount: 64,   type: "Expense", date: fmtDate(0,  9), categoryId: "c1", monthId: "m0" },
  { id: "t8",  name: "Index Fund",      amount: 300,  type: "Expense", date: fmtDate(0,  5), categoryId: "c5", monthId: "m0" },
  { id: "t9",  name: "Electric Bill",   amount: 92,   type: "Expense", date: fmtDate(0,  7), categoryId: "c4", monthId: "m0" },
  { id: "t10", name: "Pharmacy",        amount: 35,   type: "Expense", date: fmtDate(0, 10), categoryId: "c7", monthId: "m0" },
  { id: "t11", name: "Salary",          amount: 4200, type: "Income",  date: fmtDate(1,  1), categoryId: "c5", monthId: "m1" },
  { id: "t12", name: "Grocery Run",     amount: 110,  type: "Expense", date: fmtDate(1,  3), categoryId: "c1", monthId: "m1" },
  { id: "t13", name: "Monthly Rent",    amount: 1500, type: "Expense", date: fmtDate(1,  1), categoryId: "c2", monthId: "m1" },
  { id: "t14", name: "Concert Tickets", amount: 160,  type: "Expense", date: fmtDate(1, 15), categoryId: "c6", monthId: "m1" },
];

function fmtDate(monthsAgo, day) {
  const d = new Date(NOW.getFullYear(), NOW.getMonth() - monthsAgo, day);
  return d.toISOString().slice(0, 10);
}

// ─── FORMULA ENGINE ──────────────────────────────────────────────────────────
function cleanAmount(tx) {
  return tx.type === "Expense" ? -Math.abs(tx.amount) : Math.abs(tx.amount);
}

function progressBar(pct) {
  const filled = Math.min(Math.round(pct * 10), 10);
  return "■".repeat(filled) + "□".repeat(10 - filled);
}

function remainingBudget(budget, totalSpent) {
  if (!budget) return { text: "⚙️ No budget set", color: "#888", pct: 0 };
  const remaining = budget - totalSpent;
  const pct = Math.min(totalSpent / budget, 1);
  const bar = progressBar(pct);
  const pctLabel = Math.round(pct * 100) + "%";
  if (remaining < 0) {
    return {
      text: `🚨 OVER by $${Math.abs(remaining).toFixed(2)}  [${bar}] 100%+`,
      color: "#ff4d6d",
      pct: 1,
      over: true,
    };
  }
  const color = pct > 0.8 ? "#f59e0b" : pct > 0.6 ? "#f97316" : "#34d399";
  return {
    text: `✅ $${remaining.toFixed(2)} left  [${bar}] ${pctLabel}`,
    color,
    pct,
    over: false,
  };
}

function netSavings(income, expenses) {
  const net = income - expenses;
  if (net >= 0) return { text: `💰 Profit: $${net.toFixed(2)}`, color: "#34d399", net };
  return { text: `⚠️ Deficit: $${Math.abs(net).toFixed(2)}`, color: "#ff4d6d", net };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function uid() {
  return "id_" + Math.random().toString(36).slice(2, 9);
}

function inferMonth(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const label = d.toLocaleString("default", { month: "long", year: "numeric" });
  return MONTHS.find((m) => m.label === label)?.id ?? null;
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = {
  plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
  ),
  chart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  wallet: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h2"/></svg>
  ),
  tag: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>
  ),
  calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
};

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function FinanceTracker() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].id);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [txForm, setTxForm] = useState({ name: "", amount: "", type: "Expense", date: NOW.toISOString().slice(0, 10), categoryId: categories[0].id });
  const [catForm, setCatForm] = useState({ name: "", budget: "" });

  // ── COMPUTED / ROLLUPS ──────────────────────────────────────────────────────
  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.monthId === selectedMonth),
    [transactions, selectedMonth]
  );

  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const catTxs = monthTransactions.filter((t) => t.categoryId === cat.id && t.type === "Expense");
      const totalSpent = catTxs.reduce((s, t) => s + t.amount, 0);
      const rb = remainingBudget(cat.budget, totalSpent);
      return { ...cat, totalSpent, ...rb };
    });
  }, [categories, monthTransactions]);

  const monthlySummaries = useMemo(() => {
    return MONTHS.map((m) => {
      const mTxs = transactions.filter((t) => t.monthId === m.id);
      const income = mTxs.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
      const expenses = mTxs.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
      const ns = netSavings(income, expenses);
      return { ...m, income, expenses, ...ns };
    });
  }, [transactions]);

  const currentSummary = monthlySummaries.find((m) => m.id === selectedMonth);

  // ── ACTIONS ─────────────────────────────────────────────────────────────────
  function addTransaction() {
    if (!txForm.name || !txForm.amount) return;
    const monthId = inferMonth(txForm.date) ?? selectedMonth;
    setTransactions((p) => [...p, { ...txForm, id: uid(), amount: parseFloat(txForm.amount), monthId }]);
    setTxForm({ name: "", amount: "", type: "Expense", date: NOW.toISOString().slice(0, 10), categoryId: categories[0].id });
    setShowAddTx(false);
  }

  function deleteTransaction(id) {
    setTransactions((p) => p.filter((t) => t.id !== id));
  }

  function addCategory() {
    if (!catForm.name) return;
    setCategories((p) => [...p, { id: uid(), name: catForm.name, budget: parseFloat(catForm.budget) || 0 }]);
    setCatForm({ name: "", budget: "" });
    setShowAddCat(false);
  }

  function updateBudget(id, val) {
    setCategories((p) => p.map((c) => (c.id === id ? { ...c, budget: parseFloat(val) || 0 } : c)));
  }

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const css = {
    app: {
      minHeight: "100vh",
      background: "#0d0f14",
      color: "#e8eaf0",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "0",
    },
    header: {
      background: "linear-gradient(135deg, #13151d 0%, #1a1d2e 100%)",
      borderBottom: "1px solid #1e2236",
      padding: "20px 28px 0",
    },
    headerTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "16px",
      flexWrap: "wrap",
      gap: "12px",
    },
    logo: {
      fontSize: "22px",
      fontWeight: "800",
      letterSpacing: "-0.5px",
      background: "linear-gradient(90deg, #7c6af7, #4fc8e8)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    monthSelect: {
      background: "#1e2236",
      border: "1px solid #2a2f4a",
      color: "#e8eaf0",
      borderRadius: "10px",
      padding: "8px 14px",
      fontSize: "13px",
      cursor: "pointer",
    },
    tabs: {
      display: "flex",
      gap: "2px",
      marginTop: "4px",
    },
    tab: (active) => ({
      padding: "10px 18px",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      border: "none",
      background: "none",
      color: active ? "#7c6af7" : "#666d8e",
      borderBottom: active ? "2px solid #7c6af7" : "2px solid transparent",
      transition: "all 0.2s",
      letterSpacing: "0.2px",
    }),
    body: {
      padding: "24px 28px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    grid3: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "16px",
      marginBottom: "24px",
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
    },
    statCard: (accent) => ({
      background: "linear-gradient(135deg, #13151d, #1a1d2e)",
      border: `1px solid ${accent}33`,
      borderRadius: "16px",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }),
    statAccentBar: (accent) => ({
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "3px",
      background: accent,
    }),
    statLabel: {
      fontSize: "11px",
      fontWeight: "700",
      letterSpacing: "1px",
      textTransform: "uppercase",
      color: "#666d8e",
      marginBottom: "8px",
    },
    statValue: (color) => ({
      fontSize: "28px",
      fontWeight: "800",
      color: color || "#e8eaf0",
      letterSpacing: "-1px",
    }),
    statSub: {
      fontSize: "12px",
      color: "#4a5070",
      marginTop: "4px",
    },
    card: {
      background: "#13151d",
      border: "1px solid #1e2236",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "16px",
    },
    cardTitle: {
      fontSize: "13px",
      fontWeight: "700",
      letterSpacing: "0.5px",
      color: "#a0a8c8",
      marginBottom: "16px",
      textTransform: "uppercase",
    },
    btn: (variant) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: variant === "sm" ? "6px 12px" : "10px 18px",
      borderRadius: "10px",
      fontSize: variant === "sm" ? "12px" : "13px",
      fontWeight: "600",
      cursor: "pointer",
      border: "none",
      transition: "all 0.15s",
      background: variant === "danger" ? "#ff4d6d22" : variant === "ghost" ? "#1e2236" : "linear-gradient(135deg, #7c6af7, #5b54d4)",
      color: variant === "danger" ? "#ff4d6d" : "#fff",
    }),
    txRow: (type) => ({
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 14px",
      borderRadius: "12px",
      marginBottom: "8px",
      background: "#1a1d2e",
      border: "1px solid #1e2236",
      transition: "background 0.15s",
    }),
    txDot: (type) => ({
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: type === "Income" ? "#34d399" : "#ff4d6d",
      flexShrink: 0,
    }),
    txName: {
      flex: 1,
      fontSize: "13px",
      fontWeight: "500",
    },
    txAmt: (type) => ({
      fontSize: "14px",
      fontWeight: "700",
      color: type === "Income" ? "#34d399" : "#ff4d6d",
      minWidth: "80px",
      textAlign: "right",
    }),
    txMeta: {
      fontSize: "11px",
      color: "#4a5070",
    },
    badge: (type) => ({
      fontSize: "10px",
      fontWeight: "700",
      padding: "3px 7px",
      borderRadius: "20px",
      background: type === "Income" ? "#34d39922" : "#ff4d6d22",
      color: type === "Income" ? "#34d399" : "#ff4d6d",
    }),
    catRow: {
      padding: "14px",
      borderRadius: "12px",
      marginBottom: "10px",
      background: "#1a1d2e",
      border: "1px solid #1e2236",
    },
    catTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "8px",
    },
    catName: {
      fontSize: "14px",
      fontWeight: "600",
    },
    catBudgetInput: {
      background: "#13151d",
      border: "1px solid #2a2f4a",
      color: "#e8eaf0",
      borderRadius: "8px",
      padding: "4px 10px",
      width: "90px",
      fontSize: "13px",
      textAlign: "right",
    },
    progressTrack: {
      height: "6px",
      background: "#1e2236",
      borderRadius: "99px",
      overflow: "hidden",
      marginBottom: "6px",
    },
    progressFill: (pct, color) => ({
      height: "100%",
      width: `${Math.min(pct * 100, 100)}%`,
      background: color,
      borderRadius: "99px",
      transition: "width 0.5s ease",
    }),
    formulaText: {
      fontSize: "11px",
      color: "#666d8e",
      fontFamily: "monospace",
    },
    modal: {
      position: "fixed",
      inset: 0,
      background: "#000a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
      padding: "20px",
    },
    modalBox: {
      background: "#13151d",
      border: "1px solid #2a2f4a",
      borderRadius: "20px",
      padding: "28px",
      width: "100%",
      maxWidth: "440px",
    },
    modalTitle: {
      fontSize: "18px",
      fontWeight: "800",
      marginBottom: "20px",
      letterSpacing: "-0.3px",
    },
    field: {
      marginBottom: "14px",
    },
    label: {
      fontSize: "11px",
      fontWeight: "700",
      letterSpacing: "0.8px",
      textTransform: "uppercase",
      color: "#666d8e",
      marginBottom: "6px",
      display: "block",
    },
    input: {
      width: "100%",
      background: "#1a1d2e",
      border: "1px solid #2a2f4a",
      color: "#e8eaf0",
      borderRadius: "10px",
      padding: "10px 14px",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    select: {
      width: "100%",
      background: "#1a1d2e",
      border: "1px solid #2a2f4a",
      color: "#e8eaf0",
      borderRadius: "10px",
      padding: "10px 14px",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    typeToggle: {
      display: "flex",
      gap: "8px",
    },
    typeBtn: (active, type) => ({
      flex: 1,
      padding: "10px",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "13px",
      background: active ? (type === "Income" ? "#34d39922" : "#ff4d6d22") : "#1a1d2e",
      color: active ? (type === "Income" ? "#34d399" : "#ff4d6d") : "#666d8e",
      outline: active ? `1px solid ${type === "Income" ? "#34d399" : "#ff4d6d"}` : "none",
      transition: "all 0.15s",
    }),
    monthCard: (net) => ({
      background: "#13151d",
      border: `1px solid ${net >= 0 ? "#34d39933" : "#ff4d6d33"}`,
      borderRadius: "14px",
      padding: "16px",
      marginBottom: "10px",
    }),
    sectionHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "16px",
    },
    sectionTitle: {
      fontSize: "16px",
      fontWeight: "800",
      letterSpacing: "-0.3px",
    },
  };

  // ── RENDER TABS ──────────────────────────────────────────────────────────────
  const catLookup = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div style={css.app}>
      {/* HEADER */}
      <div style={css.header}>
        <div style={css.headerTop}>
          <div style={css.logo}>◈ FinanceTracker</div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              style={css.monthSelect}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {MONTHS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={css.tabs}>
          {[
            { id: "dashboard", icon: "◈", label: "Dashboard" },
            { id: "transactions", icon: "↕", label: "Transactions" },
            { id: "categories", icon: "◉", label: "Categories" },
            { id: "history", icon: "◷", label: "History" },
          ].map((t) => (
            <button
              key={t.id}
              style={css.tab(activeTab === t.id)}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={css.body}>

        {/* ─── DASHBOARD ──────────────────────────────────────────────── */}
        {activeTab === "dashboard" && currentSummary && (
          <>
            {/* Stat Cards */}
            <div style={css.grid3}>
              <div style={css.statCard("#34d399")}>
                <div style={css.statAccentBar("#34d399")} />
                <div style={css.statLabel}>Total Income</div>
                <div style={css.statValue("#34d399")}>${currentSummary.income.toLocaleString()}</div>
                <div style={css.statSub}>{monthTransactions.filter((t) => t.type === "Income").length} transactions</div>
              </div>
              <div style={css.statCard("#ff4d6d")}>
                <div style={css.statAccentBar("#ff4d6d")} />
                <div style={css.statLabel}>Total Expenses</div>
                <div style={css.statValue("#ff4d6d")}>${currentSummary.expenses.toLocaleString()}</div>
                <div style={css.statSub}>{monthTransactions.filter((t) => t.type === "Expense").length} transactions</div>
              </div>
              <div style={css.statCard(currentSummary.net >= 0 ? "#7c6af7" : "#f59e0b")}>
                <div style={css.statAccentBar(currentSummary.net >= 0 ? "#7c6af7" : "#f59e0b")} />
                <div style={css.statLabel}>Net Savings</div>
                <div style={css.statValue(currentSummary.net >= 0 ? "#7c6af7" : "#f59e0b")}>
                  {currentSummary.net >= 0 ? "+" : "-"}${Math.abs(currentSummary.net).toLocaleString()}
                </div>
                <div style={css.statSub}>{currentSummary.text}</div>
              </div>
            </div>

            <div style={css.grid2}>
              {/* Recent Transactions */}
              <div style={css.card}>
                <div style={css.sectionHeader}>
                  <div style={css.sectionTitle}>Recent Transactions</div>
                  <button style={css.btn("sm")} onClick={() => setShowAddTx(true)}>
                    <Icon.plus /> Add
                  </button>
                </div>
                {monthTransactions.length === 0 && (
                  <div style={{ color: "#4a5070", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                    No transactions this month
                  </div>
                )}
                {[...monthTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).map((tx) => (
                  <div key={tx.id} style={css.txRow(tx.type)}>
                    <div style={css.txDot(tx.type)} />
                    <div style={{ flex: 1 }}>
                      <div style={css.txName}>{tx.name}</div>
                      <div style={css.txMeta}>{catLookup[tx.categoryId]} · {tx.date}</div>
                    </div>
                    <div style={css.txAmt(tx.type)}>
                      {tx.type === "Expense" ? "-" : "+"}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Category Progress */}
              <div style={css.card}>
                <div style={css.sectionTitle}>Budget Progress</div>
                {categoryStats.filter((c) => c.totalSpent > 0 || c.budget > 0).map((cat) => (
                  <div key={cat.id} style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "600" }}>{cat.name}</span>
                      <span style={{ fontSize: "12px", color: cat.color }}>
                        ${cat.totalSpent.toFixed(0)} / ${cat.budget}
                      </span>
                    </div>
                    <div style={css.progressTrack}>
                      <div style={css.progressFill(cat.pct, cat.color)} />
                    </div>
                    {cat.over && (
                      <div style={{ fontSize: "11px", color: "#ff4d6d" }}>🚨 Over budget</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── TRANSACTIONS ───────────────────────────────────────────── */}
        {activeTab === "transactions" && (
          <>
            <div style={css.sectionHeader}>
              <div style={css.sectionTitle}>💳 Transactions — {MONTHS.find(m => m.id === selectedMonth)?.label}</div>
              <button style={css.btn()} onClick={() => setShowAddTx(true)}>
                <Icon.plus /> Add Transaction
              </button>
            </div>
            {monthTransactions.length === 0 && (
              <div style={{ ...css.card, textAlign: "center", color: "#4a5070", padding: "40px" }}>
                No transactions for this month yet. Add one!
              </div>
            )}
            {[...monthTransactions].sort((a, b) => b.date.localeCompare(a.date)).map((tx) => (
              <div key={tx.id} style={css.txRow(tx.type)}>
                <div style={css.txDot(tx.type)} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={css.txName}>{tx.name}</span>
                    <span style={css.badge(tx.type)}>{tx.type}</span>
                  </div>
                  <div style={css.txMeta}>{catLookup[tx.categoryId]} · {tx.date} · Clean: {cleanAmount(tx) > 0 ? "+" : ""}${cleanAmount(tx).toFixed(2)}</div>
                </div>
                <div style={css.txAmt(tx.type)}>
                  {tx.type === "Expense" ? "-" : "+"}${tx.amount.toFixed(2)}
                </div>
                <button style={{ ...css.btn("danger"), padding: "6px 8px" }} onClick={() => deleteTransaction(tx.id)}>
                  <Icon.trash />
                </button>
              </div>
            ))}
          </>
        )}

        {/* ─── CATEGORIES ─────────────────────────────────────────────── */}
        {activeTab === "categories" && (
          <>
            <div style={css.sectionHeader}>
              <div style={css.sectionTitle}>💼 Categories & Budgets</div>
              <button style={css.btn()} onClick={() => setShowAddCat(true)}>
                <Icon.plus /> Add Category
              </button>
            </div>
            {categoryStats.map((cat) => (
              <div key={cat.id} style={css.catRow}>
                <div style={css.catTop}>
                  <span style={css.catName}>{cat.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#666d8e" }}>Budget $</span>
                    <input
                      style={css.catBudgetInput}
                      type="number"
                      value={cat.budget}
                      onChange={(e) => updateBudget(cat.id, e.target.value)}
                    />
                  </div>
                </div>
                <div style={css.progressTrack}>
                  <div style={css.progressFill(cat.pct, cat.color)} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", color: cat.color }}>{cat.text.split("  ")[0]}</span>
                  <span style={css.txMeta}>Spent: ${cat.totalSpent.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ─── HISTORY ────────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <>
            <div style={{ ...css.sectionTitle, marginBottom: "16px" }}>◷ Monthly History</div>
            {monthlySummaries.map((m) => {
              const mTxs = transactions.filter((t) => t.monthId === m.id);
              return (
                <div key={m.id} style={css.monthCard(m.net)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700" }}>{m.label}</div>
                      <div style={{ fontSize: "12px", color: "#666d8e", marginTop: "2px" }}>{mTxs.length} transactions</div>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: m.color }}>{m.text}</div>
                  </div>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#666d8e" }}>INCOME</div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#34d399" }}>${m.income.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#666d8e" }}>EXPENSES</div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#ff4d6d" }}>${m.expenses.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#666d8e" }}>SAVINGS RATE</div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#7c6af7" }}>
                        {m.income > 0 ? Math.round((m.net / m.income) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ─── ADD TRANSACTION MODAL ──────────────────────────────────────── */}
      {showAddTx && (
        <div style={css.modal} onClick={(e) => { if (e.target === e.currentTarget) setShowAddTx(false); }}>
          <div style={css.modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={css.modalTitle}>+ New Transaction</div>
              <button style={{ background: "none", border: "none", color: "#666d8e", cursor: "pointer" }} onClick={() => setShowAddTx(false)}><Icon.close /></button>
            </div>
            <div style={css.field}>
              <label style={css.label}>Type</label>
              <div style={css.typeToggle}>
                {["Income", "Expense"].map((t) => (
                  <button
                    key={t}
                    style={css.typeBtn(txForm.type === t, t)}
                    onClick={() => setTxForm((p) => ({ ...p, type: t }))}
                  >
                    {t === "Income" ? "↑ Income" : "↓ Expense"}
                  </button>
                ))}
              </div>
            </div>
            <div style={css.field}>
              <label style={css.label}>Name</label>
              <input style={css.input} placeholder="e.g. Grocery Run" value={txForm.name} onChange={(e) => setTxForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={css.field}>
              <label style={css.label}>Amount ($)</label>
              <input style={css.input} type="number" placeholder="0.00" value={txForm.amount} onChange={(e) => setTxForm((p) => ({ ...p, amount: e.target.value }))} />
            </div>
            <div style={css.field}>
              <label style={css.label}>Date</label>
              <input style={css.input} type="date" value={txForm.date} onChange={(e) => setTxForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div style={css.field}>
              <label style={css.label}>Category</label>
              <select style={css.select} value={txForm.categoryId} onChange={(e) => setTxForm((p) => ({ ...p, categoryId: e.target.value }))}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {txForm.amount && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", background: "#1a1d2e", borderRadius: "10px" }}>
                <div style={css.formulaText}>
                  Formula → Clean Amount:{" "}
                  <span style={{ color: txForm.type === "Expense" ? "#ff4d6d" : "#34d399", fontWeight: "bold" }}>
                    {txForm.type === "Expense" ? "-" : "+"}${parseFloat(txForm.amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={{ ...css.btn(), flex: 1 }} onClick={addTransaction}>Save Transaction</button>
              <button style={{ ...css.btn("ghost") }} onClick={() => setShowAddTx(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD CATEGORY MODAL ─────────────────────────────────────────── */}
      {showAddCat && (
        <div style={css.modal} onClick={(e) => { if (e.target === e.currentTarget) setShowAddCat(false); }}>
          <div style={css.modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={css.modalTitle}>+ New Category</div>
              <button style={{ background: "none", border: "none", color: "#666d8e", cursor: "pointer" }} onClick={() => setShowAddCat(false)}><Icon.close /></button>
            </div>
            <div style={css.field}>
              <label style={css.label}>Category Name</label>
              <input style={css.input} placeholder="e.g. 🎸 Hobbies" value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={css.field}>
              <label style={css.label}>Monthly Budget ($)</label>
              <input style={css.input} type="number" placeholder="0.00" value={catForm.budget} onChange={(e) => setCatForm((p) => ({ ...p, budget: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={{ ...css.btn(), flex: 1 }} onClick={addCategory}>Save Category</button>
              <button style={{ ...css.btn("ghost") }} onClick={() => setShowAddCat(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
