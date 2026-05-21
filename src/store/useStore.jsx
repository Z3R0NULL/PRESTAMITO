import { useState, useEffect, useCallback, createContext, useContext } from "react";
import {
  fetchClients, insertClient, patchClient, removeClient,
  fetchLoans,   insertLoan,   patchLoan,   removeLoan,
  fetchPayments, insertPayment, removePayment,
} from "../lib/db.js";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [clients, setClients]   = useState([]);
  const [loans, setLoans]       = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // ── initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [c, l, p] = await Promise.all([fetchClients(), fetchLoans(), fetchPayments()]);
        setClients(c);
        setLoans(l);
        setPayments(p);
      } catch (err) {
        console.error("Turso load error:", err);
        setError(err.message ?? "Error connecting to database");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── CLIENTS ─────────────────────────────────────────────────────────────────
  const addClient = useCallback(async (client) => {
    const created = await insertClient(client);
    setClients((prev) => [created, ...prev]);
  }, []);

  const updateClient = useCallback(async (id, updates) => {
    await patchClient(id, updates);
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteClient = useCallback(async (id) => {
    await removeClient(id);
    const loanIds = loans.filter((l) => l.clientId === id).map((l) => l.id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    setLoans((prev) => prev.filter((l) => l.clientId !== id));
    setPayments((prev) => prev.filter((p) => !loanIds.includes(p.loanId)));
  }, [loans]);

  // ── LOANS ───────────────────────────────────────────────────────────────────
  const addLoan = useCallback(async (loan) => {
    const created = await insertLoan(loan);
    setLoans((prev) => [created, ...prev]);
  }, []);

  const updateLoan = useCallback(async (id, updates) => {
    await patchLoan(id, updates);
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  const deleteLoan = useCallback(async (id) => {
    await removeLoan(id);
    setLoans((prev) => prev.filter((l) => l.id !== id));
    setPayments((prev) => prev.filter((p) => p.loanId !== id));
  }, []);

  // ── PAYMENTS ────────────────────────────────────────────────────────────────
  const addPayment = useCallback(async (payment) => {
    const created = await insertPayment(payment);
    setPayments((prev) => [created, ...prev]);
  }, []);

  const deletePayment = useCallback(async (id) => {
    await removePayment(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── COMPUTED ────────────────────────────────────────────────────────────────
  const getLoanPayments = (loanId) => payments.filter((p) => p.loanId === loanId);
  const getClientLoans  = (clientId) => loans.filter((l) => l.clientId === clientId);
  const getClient       = (id) => clients.find((c) => c.id === id);
  const getLoan         = (id) => loans.find((l) => l.id === id);

  // interestType: "monthly" → rate% por cuota sobre capital
  //               "total"   → rate% sobre el capital total (una sola vez)
  const calcInstallment = (amount, interestRate, installments, interestType = "monthly") => {
    const total =
      interestType === "total"
        ? amount * (1 + interestRate / 100)
        : amount + amount * (interestRate / 100) * installments;
    return Math.round(total / installments);
  };

  const getLoanStats = (loan) => {
    const installmentAmount = calcInstallment(loan.amount, loan.interestRate, loan.installments, loan.interestType ?? "monthly");
    const totalAmount = installmentAmount * loan.installments;
    const paid = getLoanPayments(loan.id).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, totalAmount - paid);
    const paidInstallments = Math.min(loan.installments, Math.floor(paid / installmentAmount));
    const remainingInstallments = loan.installments - paidInstallments;
    return { installmentAmount, totalAmount, paid, remaining, paidInstallments, remainingInstallments };
  };

  const getDashboardStats = () => {
    const activeLoans = loans.filter((l) => l.status === "active");
    const totalLent = activeLoans.reduce((s, l) => s + l.amount, 0);
    const totalExpected = activeLoans.reduce((acc, l) => acc + getLoanStats(l).totalAmount, 0);
    const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
    const totalPending = activeLoans.reduce((acc, l) => acc + getLoanStats(l).remaining, 0);
    return { clients: clients.length, activeLoans: activeLoans.length, totalLent, totalExpected, totalCollected, totalPending };
  };

  return (
    <StoreContext.Provider
      value={{
        clients, loans, payments,
        loading, error,
        addClient, updateClient, deleteClient,
        addLoan, updateLoan, deleteLoan,
        addPayment, deletePayment,
        getLoanPayments, getClientLoans, getClient, getLoan,
        calcInstallment, getLoanStats, getDashboardStats,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
