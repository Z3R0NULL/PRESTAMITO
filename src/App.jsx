import { useState } from "react";
import { AuthProvider, useAuth } from "./store/useAuth.jsx";
import { StoreProvider, useStore } from "./store/useStore.jsx";
import { SettingsProvider } from "./store/useSettings.jsx";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Clients from "./components/Clients";
import Loans from "./components/Loans";
import Payments from "./components/Payments";
import Users from "./components/Users";
import LoginPage from "./components/LoginPage.jsx";
import NewClientPage from "./components/NewClientPage.jsx";
import NewLoanPage from "./components/NewLoanPage.jsx";
import NewPaymentPage from "./components/NewPaymentPage.jsx";
import ClientLoanHistory from "./components/ClientLoanHistory.jsx";

// ── Inner app (requires auth + store) ────────────────────────────────────────
function AppContent() {
  const [page, setPage] = useState("dashboard");
  const [historyClientId, setHistoryClientId] = useState(null);
  const { loading, error } = useStore();
  const { isAdmin } = useAuth();

  const goToHistory = (clientId) => {
    setHistoryClientId(clientId);
    setPage("client-history");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Cargando datos…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="bg-[#0d1224] border border-rose-800/50 rounded-2xl p-8 max-w-md text-center space-y-3">
          <p className="text-rose-400 font-semibold">Error de conexión</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const pages = {
    dashboard: <Dashboard setPage={setPage} />,
    clients: <Clients setPage={setPage} onViewHistory={goToHistory} />,
    loans: <Loans setPage={setPage} />,
    payments: <Payments setPage={setPage} />,
    "new-client": <NewClientPage setPage={setPage} />,
    "new-loan": <NewLoanPage setPage={setPage} />,
    "new-payment": <NewPaymentPage setPage={setPage} />,
    "client-history": <ClientLoanHistory clientId={historyClientId} setPage={setPage} />,
    ...(isAdmin && { users: <Users /> }),
  };

  return (
    <Layout page={page} setPage={setPage}>
      {pages[page] ?? pages.dashboard}
    </Layout>
  );
}

// ── Auth gate ─────────────────────────────────────────────────────────────────
function AuthGate() {
  const { user, ready, dbError } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Conectando a la base de datos…</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="bg-[#0d1224] border border-rose-800/50 rounded-2xl p-8 max-w-md text-center space-y-3">
          <p className="text-rose-400 font-semibold">Error de base de datos</p>
          <p className="text-slate-400 text-sm">{dbError}</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <StoreProvider userId={user.id}>
      <AppContent />
    </StoreProvider>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </SettingsProvider>
  );
}
