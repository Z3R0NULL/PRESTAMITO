/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  store/useStore.jsx — Estado global de datos (clientes, préstamos, pagos)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Es la fuente de la verdad para la UI. Al montar carga todo desde Turso
 *  con `Promise.all` y luego mantiene una copia local en memoria que se
 *  sincroniza tras cada mutación (optimistic update + persistencia).
 *
 *  Reglas importantes:
 *    • Los pagos con `isLateFee=true` (recargos por mora) NO suman al saldo
 *      del préstamo: solo se contabilizan aparte. Esto evita que un recargo
 *      cierre o adelante una cuota.
 *    • Un préstamo se cierra automáticamente cuando la suma de pagos NO-mora
 *      alcanza el total a pagar (capital + intereses).
 *
 *  Helpers expuestos:
 *    • CRUD: addClient / updateClient / deleteClient (idem loans, payments).
 *    • Lecturas derivadas: getLoanStats, getDashboardStats, getNextPayment...
 *    • Cálculo de cuota: `calcInstallment(amount, rate, n, interestType)`.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import {
  fetchClients, insertClient, patchClient, removeClient,
  fetchLoans,   insertLoan,   patchLoan,   removeLoan,
  fetchPayments, insertPayment, removePayment, patchPayment,
} from "../lib/db.js";

const StoreContext = createContext(null);

/**
 * Calcula el monto de una cuota.
 *   • interestType = "monthly" → la tasa se aplica cada cuota sobre el capital
 *                                (interés simple por período).
 *   • interestType = "total"   → la tasa se aplica una sola vez sobre el total.
 * Definida fuera del componente para poder reutilizarse sin re-crearse en
 * cada render.
 */
function calcInstallmentFn(amount, interestRate, installments, interestType = "monthly") {
  const n = Number(installments) || 0;
  const amt = Number(amount) || 0;
  const rate = Number(interestRate) || 0;
  if (n <= 0) return 0;
  const total =
    interestType === "total"
      ? amt * (1 + rate / 100)
      : amt + amt * (rate / 100) * n;
  return Math.round(total / n);
}

export function StoreProvider({ userId, children }) {
  const [clients, setClients]   = useState([]);
  const [loans, setLoans]       = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // ── initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [c, l, p] = await Promise.all([fetchClients(userId), fetchLoans(userId), fetchPayments(userId)]);
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
  }, [userId]);

  // ── auto-close fully paid loans (reconciliation) ────────────────────────────
  useEffect(() => {
    if (loading) return;
    const toClose = [];
    loans.forEach((loan) => {
      if (loan.status !== "active") return;
      const installmentAmount = calcInstallmentFn(loan.amount, loan.interestRate, loan.installments, loan.interestType ?? "monthly");
      const totalAmount = installmentAmount * loan.installments;
      // Only count installment payments (NOT late fees) toward closing the loan
      const totalPaid = payments
        .filter((p) => p.loanId === loan.id && !p.isLateFee)
        .reduce((s, p) => s + p.amount, 0);
      if (totalAmount > 0 && totalPaid >= totalAmount) toClose.push(loan.id);
    });
    if (toClose.length === 0) return;
    setLoans((prev) => prev.map((l) => (toClose.includes(l.id) ? { ...l, status: "closed" } : l)));
    toClose.forEach((id) => patchLoan(id, { status: "closed" }).catch(console.error));
  }, [loading, loans, payments]);

  // ── CLIENTS ─────────────────────────────────────────────────────────────────
  const addClient = useCallback(async (client) => {
    const created = await insertClient(client, userId);
    setClients((prev) => [created, ...prev]);
  }, [userId]);

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
    setPayments((prev) => {
      const updated = [created, ...prev];
      // Auto-close loan if fully paid (only installment payments count)
      setLoans((prevLoans) =>
        prevLoans.map((loan) => {
          if (loan.id !== payment.loanId || loan.status === "closed") return loan;
          const installmentAmount = calcInstallmentFn(loan.amount, loan.interestRate, loan.installments, loan.interestType ?? "monthly");
          const totalAmount = installmentAmount * loan.installments;
          const totalPaid = updated
            .filter((p) => p.loanId === loan.id && !p.isLateFee)
            .reduce((s, p) => s + p.amount, 0);
          if (totalPaid >= totalAmount) {
            patchLoan(loan.id, { status: "closed" }).catch(console.error);
            return { ...loan, status: "closed" };
          }
          return loan;
        })
      );
      return updated;
    });
  }, []);

  const deletePayment = useCallback(async (id) => {
    await removePayment(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updatePayment = useCallback(async (id, updates) => {
    await patchPayment(id, updates);
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    // Re-evaluate loan status (may need to reopen if amount reduced)
    setLoans((prevLoans) => {
      const target = prevLoans.find((l) => {
        const pay = payments.find((pp) => pp.id === id);
        return pay && l.id === pay.loanId;
      });
      if (!target) return prevLoans;
      return prevLoans;
    });
  }, [payments]);

  // ── COMPUTED ────────────────────────────────────────────────────────────────
  const getLoanPayments = (loanId) => payments.filter((p) => p.loanId === loanId);
  const getClientLoans  = (clientId) => loans.filter((l) => l.clientId === clientId);
  const getClient       = (id) => clients.find((c) => c.id === id);
  const getLoan         = (id) => loans.find((l) => l.id === id);

  // interestType: "monthly" → rate% por cuota sobre capital
  //               "total"   → rate% sobre el capital total (una sola vez)
  const calcInstallment = calcInstallmentFn;

  const getLoanStats = (loan) => {
    const installmentAmount = calcInstallment(loan.amount, loan.interestRate, loan.installments, loan.interestType ?? "monthly");
    const totalAmount = installmentAmount * loan.installments;
    const all = getLoanPayments(loan.id);
    const paid = all.filter((p) => !p.isLateFee).reduce((s, p) => s + p.amount, 0);
    const totalLateFees = all.filter((p) => p.isLateFee).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, totalAmount - paid);
    const paidInstallments = installmentAmount > 0
      ? Math.min(loan.installments, Math.floor(paid / installmentAmount))
      : 0;
    const remainingInstallments = loan.installments - paidInstallments;
    return { installmentAmount, totalAmount, paid, remaining, paidInstallments, remainingInstallments, totalLateFees };
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
        addPayment, deletePayment, updatePayment,
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
