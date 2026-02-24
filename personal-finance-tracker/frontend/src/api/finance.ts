import api from "./client";

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description?: string;
  date: string;
  created_at: string;
}

export interface MonthlySummary {
  total_income: number;
  total_expenses: number;
  balance: number;
  transaction_count: number;
}

export interface TransactionCreate {
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description?: string;
  date: string;
}

// Auth
export const register = (data: { email: string; password: string; full_name: string }) =>
  api.post("/auth/register", data);

export const login = async (email: string, password: string): Promise<string> => {
  const res = await api.post("/auth/login", { email, password });
  return res.data.access_token;
};

// Transactions
export const getTransactions = (params?: { skip?: number; limit?: number; type?: string }) =>
  api.get<Transaction[]>("/transactions/", { params });

export const createTransaction = (data: TransactionCreate) =>
  api.post<Transaction>("/transactions/", data);

export const deleteTransaction = (id: number) =>
  api.delete(`/transactions/${id}`);

// Summary
export const getMonthlySummary = (year: number, month: number) =>
  api.get<MonthlySummary>("/summary/monthly", { params: { year, month } });
