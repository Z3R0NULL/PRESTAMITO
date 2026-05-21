import { useStore } from "../store/useStore.jsx";
import { useCurrency } from "../store/useCurrency.js";
import { Users, HandCoins, Wallet, TrendingUp, Clock, CheckCircle } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={17} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ setPage }) {
  const fmt = useCurrency();
  const store = useStore();
  const stats = store.getDashboardStats();

  const recentLoans = [...store.loans]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 5);

  const recentPayments = [...store.payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Resumen general de tu cartera de préstamos</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Clientes" value={stats.clients}
          sub="Total registrados" color="bg-blue-600" />
        <StatCard icon={HandCoins} label="Préstamos activos" value={stats.activeLoans}
          sub="En curso" color="bg-violet-600" />
        <StatCard icon={TrendingUp} label="Capital prestado" value={fmt(stats.totalLent)}
          sub="Monto total otorgado" color="bg-emerald-600" />
        <StatCard icon={Wallet} label="Total a cobrar" value={fmt(stats.totalExpected)}
          sub="Capital + intereses" color="bg-amber-600" />
        <StatCard icon={CheckCircle} label="Cobrado" value={fmt(stats.totalCollected)}
          sub="Pagos recibidos" color="bg-teal-600" />
        <StatCard icon={Clock} label="Pendiente" value={fmt(stats.totalPending)}
          sub="Por cobrar" color="bg-rose-600" />
      </div>

      {/* Recent activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent loans */}
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Últimos préstamos</h2>
            <button onClick={() => setPage("loans")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Ver todos →
            </button>
          </div>
          {recentLoans.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Sin préstamos aún</p>
          ) : (
            <div className="space-y-3">
              {recentLoans.map((loan) => {
                const client = store.getClient(loan.clientId);
                const stats = store.getLoanStats(loan);
                const pct = Math.round((stats.paid / stats.totalAmount) * 100);
                return (
                  <div key={loan.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-blue-300 flex-shrink-0">
                      {client?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{client?.name ?? "—"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">{pct}%</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-white">{fmt(loan.amount)}</p>
                      <p className={`text-xs ${loan.status === "active" ? "text-emerald-400" : "text-slate-500"}`}>
                        {loan.status === "active" ? "Activo" : "Cerrado"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Últimos pagos</h2>
            <button onClick={() => setPage("payments")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Ver todos →
            </button>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Sin pagos aún</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => {
                const loan = store.getLoan(payment.loanId);
                const client = loan ? store.getClient(loan.clientId) : null;
                return (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center">
                        <CheckCircle size={15} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{client?.name ?? "—"}</p>
                        <p className="text-xs text-slate-500">Cuota #{payment.installmentNumber} · {payment.date}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">+{fmt(payment.amount)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
