import { useState, useEffect, createContext, useContext } from "react";

const StoreContext = createContext(null);

const STORAGE_KEY = "prestamos_app_v1";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    clients: [
      {
        id: "c1",
        name: "María González",
        phone: "0981-234567",
        email: "maria@email.com",
        address: "Av. España 123",
        createdAt: "2025-01-10",
      },
      {
        id: "c2",
        name: "Carlos Ramírez",
        phone: "0991-876543",
        email: "carlos@email.com",
        address: "Calle Palma 456",
        createdAt: "2025-02-05",
      },
      {
        id: "c3",
        name: "Ana Martínez",
        phone: "0971-112233",
        email: "ana@email.com",
        address: "San Lorenzo 789",
        createdAt: "2025-03-15",
      },
    ],
    loans: [
      {
        id: "l1",
        clientId: "c1",
        amount: 500000,
        interestRate: 5,
        installments: 12,
        startDate: "2025-02-01",
        status: "active",
        notes: "Préstamo personal",
      },
      {
        id: "l2",
        clientId: "c2",
        amount: 200000,
        interestRate: 4,
        installments: 6,
        startDate: "2025-03-01",
        status: "active",
        notes: "Capital de trabajo",
      },
      {
        id: "l3",
        clientId: "c3",
        amount: 800000,
        interestRate: 6,
        installments: 24,
        startDate: "2025-04-01",
        status: "active",
        notes: "Inversión negocio",
      },
    ],
    payments: [
      {
        id: "p1",
        loanId: "l1",
        amount: 47083,
        date: "2025-03-01",
        installmentNumber: 1,
        note: "Cuota 1",
      },
      {
        id: "p2",
        loanId: "l1",
        amount: 47083,
        date: "2025-04-01",
        installmentNumber: 2,
        note: "Cuota 2",
      },
      {
        id: "p3",
        loanId: "l2",
        amount: 37333,
        date: "2025-04-01",
        installmentNumber: 1,
        note: "Cuota 1",
      },
    ],
  };
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // CLIENTS
  const addClient = (client) => {
    setData((d) => ({
      ...d,
      clients: [...d.clients, { ...client, id: generateId(), createdAt: new Date().toISOString().slice(0, 10) }],
    }));
  };

  const updateClient = (id, updates) => {
    setData((d) => ({
      ...d,
      clients: d.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteClient = (id) => {
    setData((d) => ({
      ...d,
      clients: d.clients.filter((c) => c.id !== id),
    }));
  };

  // LOANS
  const addLoan = (loan) => {
    setData((d) => ({
      ...d,
      loans: [...d.loans, { ...loan, id: generateId(), status: "active" }],
    }));
  };

  const updateLoan = (id, updates) => {
    setData((d) => ({
      ...d,
      loans: d.loans.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };

  const deleteLoan = (id) => {
    setData((d) => ({
      ...d,
      loans: d.loans.filter((l) => l.id !== id),
      payments: d.payments.filter((p) => p.loanId !== id),
    }));
  };

  // PAYMENTS
  const addPayment = (payment) => {
    setData((d) => ({
      ...d,
      payments: [...d.payments, { ...payment, id: generateId() }],
    }));
  };

  const deletePayment = (id) => {
    setData((d) => ({
      ...d,
      payments: d.payments.filter((p) => p.id !== id),
    }));
  };

  // COMPUTED
  const getLoanPayments = (loanId) => data.payments.filter((p) => p.loanId === loanId);

  const getClientLoans = (clientId) => data.loans.filter((l) => l.clientId === clientId);

  const getClient = (id) => data.clients.find((c) => c.id === id);

  const getLoan = (id) => data.loans.find((l) => l.id === id);

  // Monthly installment with interest (flat rate)
  const calcInstallment = (amount, interestRate, installments) => {
    const totalInterest = (amount * (interestRate / 100)) * installments;
    const total = amount + totalInterest;
    return Math.round(total / installments);
  };

  const getLoanStats = (loan) => {
    const installmentAmount = calcInstallment(loan.amount, loan.interestRate, loan.installments);
    const totalAmount = installmentAmount * loan.installments;
    const paid = getLoanPayments(loan.id).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, totalAmount - paid);
    // Cuotas completadas = cuántas cuotas enteras cubre el monto pagado acumulado
    const paidInstallments = Math.min(loan.installments, Math.floor(paid / installmentAmount));
    const remainingInstallments = loan.installments - paidInstallments;
    return { installmentAmount, totalAmount, paid, remaining, paidInstallments, remainingInstallments };
  };

  const getDashboardStats = () => {
    const activeLoans = data.loans.filter((l) => l.status === "active");
    const totalLent = activeLoans.reduce((s, l) => s + l.amount, 0);
    const totalExpected = activeLoans.reduce((l_acc, l) => {
      const stats = getLoanStats(l);
      return l_acc + stats.totalAmount;
    }, 0);
    const totalCollected = data.payments.reduce((s, p) => s + p.amount, 0);
    const totalPending = activeLoans.reduce((acc, l) => {
      const stats = getLoanStats(l);
      return acc + stats.remaining;
    }, 0);
    return {
      clients: data.clients.length,
      activeLoans: activeLoans.length,
      totalLent,
      totalExpected,
      totalCollected,
      totalPending,
    };
  };

  return (
    <StoreContext.Provider
      value={{
        ...data,
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
