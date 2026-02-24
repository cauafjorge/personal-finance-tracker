import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getMonthlySummary,
  Transaction,
  MonthlySummary,
} from "../api/finance";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CATEGORIES = ["Food", "Housing", "Transport", "Health", "Education", "Entertainment", "Work", "Other"];

export default function DashboardPage() {
  const { logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [form, setForm] = useState({ title: "", amount: "", type: "expense", category: "Food", date: new Date().toISOString().split("T")[0] });
  const [loading, setLoading] = useState(true);

  const now = new Date();

  const fetchData = async () => {
    const [txRes, sumRes] = await Promise.all([
      getTransactions({ limit: 20 }),
      getMonthlySummary(now.getFullYear(), now.getMonth() + 1),
    ]);
    setTransactions(txRes.data);
    setSummary(sumRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTransaction({
      ...form,
      amount: parseFloat(form.amount),
      date: new Date(form.date).toISOString(),
    } as any);
    setForm({ title: "", amount: "", type: "expense", category: "Food", date: new Date().toISOString().split("T")[0] });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    await deleteTransaction(id);
    fetchData();
  };

  const chartData = summary
    ? [
        { name: "Income", value: summary.total_income, color: "#48bb78" },
        { name: "Expenses", value: summary.total_expenses, color: "#fc8181" },
        { name: "Balance", value: summary.balance, color: "#4f46e5" },
      ]
    : [];

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>💰 Finance Tracker</h1>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={styles.content}>
        {/* Summary Cards */}
        {summary && (
          <div style={styles.cards}>
            <SummaryCard label="Income" value={summary.total_income} color="#48bb78" />
            <SummaryCard label="Expenses" value={summary.total_expenses} color="#fc8181" />
            <SummaryCard label="Balance" value={summary.balance} color="#4f46e5" />
          </div>
        )}

        {/* Chart */}
        {summary && (
          <div style={styles.chartBox}>
            <h3 style={styles.sectionTitle}>Monthly Overview</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                <Bar dataKey="value">
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Add Transaction Form */}
        <div style={styles.formBox}>
          <h3 style={styles.sectionTitle}>Add Transaction</h3>
          <form onSubmit={handleAddTransaction} style={styles.form}>
            <input style={styles.input} placeholder="Title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input style={styles.input} type="number" placeholder="Amount" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0" step="0.01" />
            <select style={styles.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select style={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input style={styles.input} type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <button style={styles.button} type="submit">Add Transaction</button>
          </form>
        </div>

        {/* Transactions List */}
        <div style={styles.listBox}>
          <h3 style={styles.sectionTitle}>Recent Transactions</h3>
          {transactions.length === 0 && <p style={{ color: "#718096" }}>No transactions yet.</p>}
          {transactions.map((tx) => (
            <div key={tx.id} style={styles.txRow}>
              <div>
                <p style={styles.txTitle}>{tx.title}</p>
                <p style={styles.txMeta}>{tx.category} · {new Date(tx.date).toLocaleDateString()}</p>
              </div>
              <div style={styles.txRight}>
                <p style={{ color: tx.type === "income" ? "#48bb78" : "#fc8181", fontWeight: 700 }}>
                  {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                </p>
                <button onClick={() => handleDelete(tx.id)} style={styles.deleteBtn}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <p style={styles.cardLabel}>{label}</p>
      <p style={{ ...styles.cardValue, color }}>${value.toFixed(2)}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f7fafc" },
  header: { background: "#4f46e5", color: "#fff", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { margin: 0 },
  logoutBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.5)", color: "#fff", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer" },
  content: { maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" },
  cards: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" },
  card: { background: "#fff", padding: "1.25rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
  cardLabel: { color: "#718096", margin: 0, fontSize: "0.875rem" },
  cardValue: { margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700 },
  chartBox: { background: "#fff", padding: "1.5rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: "1.5rem" },
  formBox: { background: "#fff", padding: "1.5rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: "1.5rem" },
  form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  input: { padding: "0.6rem", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.9rem" },
  button: { gridColumn: "1 / -1", padding: "0.75rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1rem", cursor: "pointer" },
  listBox: { background: "#fff", padding: "1.5rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
  sectionTitle: { margin: "0 0 1rem", color: "#2d3748" },
  txRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #f0f0f0" },
  txTitle: { margin: 0, fontWeight: 600, color: "#2d3748" },
  txMeta: { margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#a0aec0" },
  txRight: { display: "flex", alignItems: "center", gap: "1rem" },
  deleteBtn: { background: "transparent", border: "none", color: "#a0aec0", cursor: "pointer", fontSize: "1rem" },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "1.2rem" },
};
