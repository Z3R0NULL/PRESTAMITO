/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/Dashboard.jsx — Pantalla principal con KPIs y resumen
 * ─────────────────────────────────────────────────────────────────────────────
 *  Es la primera vista tras iniciar sesión. Calcula totales agregados con
 *  useMemo sobre clientes, préstamos y pagos del store, y muestra:
 *    • Cards de KPIs (capital prestado, esperado, cobrado, pendiente).
 *    • Listado corto de próximos vencimientos / atrasos.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useMemo, useState } from "react";
import { useStore } from "../store/useStore.jsx";
import { useCurrency } from "../store/useCurrency.js";
import { Users, HandCoins, Wallet, TrendingUp, Clock, CheckCircle, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { addMonths, startOfToday, progressFillClass } from "./loanHelpers.jsx";

function PaymentsCalendar({ loans, getClient, getLoanStats, fmt }) {
  const today = startOfToday();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const dueByDay = useMemo(() => {
    const map = new Map();
    for (const loan of loans) {
      if (loan.status !== "active") continue;
      const stats = getLoanStats(loan);
      for (let n = stats.paidInstallments + 1; n <= loan.installments; n++) {
        const d = addMonths(loan.startDate, n);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          if (!map.has(day)) map.set(day, []);
          map.get(day).push({
            loan, stats, number: n,
            client: getClient(loan.clientId),
          });
        }
      }
    }
    return map;
  }, [loans, year, month, getClient, getLoanStats]);

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const [selectedDay, setSelectedDay] = useState(null);
  const selectedItems = selectedDay ? dueByDay.get(selectedDay) || [] : [];

  const isToday = (day) =>
    day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const shift = (delta) => {
    setSelectedDay(null);
    setCursor(new Date(year, month + delta, 1));
  };

  const totalMonth = useMemo(() => {
    let sum = 0;
    for (const items of dueByDay.values())
      for (const it of items) sum += it.stats.installmentAmount;
    return sum;
  }, [dueByDay]);

  return (
    <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-white">Cobros del mes</h2>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">{monthLabel} · {fmt(totalMonth)} a cobrar</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(null); }}
            className="px-2.5 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-xs text-slate-300 transition-colors">
            Hoy
          </button>
          <button onClick={() => shift(1)} className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1 max-w-sm mx-auto">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-slate-500 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 max-w-sm mx-auto">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-9" />;
          const items = dueByDay.get(day);
          const has = !!items;
          const todayCell = isToday(day);
          const isSelected = selectedDay === day;
          const overdue = has && new Date(year, month, day) < today;
          const base = "relative h-9 rounded-lg text-xs flex items-center justify-center transition-colors border";
          let cls;
          if (isSelected)       cls = "bg-blue-600 text-white border-blue-400";
          else if (todayCell)   cls = "bg-blue-500/15 text-white border-blue-400 ring-1 ring-blue-400/60 font-bold";
          else if (has && overdue) cls = "bg-rose-900/40 text-rose-200 border-rose-700/40 hover:bg-rose-900/60";
          else if (has)         cls = "bg-emerald-900/30 text-emerald-200 border-emerald-700/40 hover:bg-emerald-900/50";
          else                  cls = "text-slate-400 border-transparent hover:bg-slate-800/40";
          return (
            <button key={i} onClick={() => has && setSelectedDay(day)} className={`${base} ${cls}`}>
              <span>{day}</span>
              {has && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full bg-blue-500 text-[9px] font-bold text-white">
                  {items.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-300 mb-2">
            Vencen el {selectedDay} de {cursor.toLocaleDateString("es-ES", { month: "long" })}
          </p>
          <div className="space-y-2">
            {selectedItems.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{it.client?.name ?? "—"}</p>
                  <p className="text-[11px] text-slate-500">Cuota #{it.number} de {it.loan.installments}</p>
                </div>
                <p className="text-sm font-semibold text-emerald-400">{fmt(it.stats.installmentAmount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-slate-400 truncate">{label}</p>
        <div className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-lg sm:text-2xl font-bold text-white leading-tight break-words tabular-nums">{value}</p>
      {sub && <p className="text-[11px] sm:text-xs text-slate-500 truncate">{sub}</p>}
    </div>
  );
}


export default function Dashboard({ setPage }) {
  const fmt = useCurrency();
  const fmt0 = (n) => fmt(Math.round(n ?? 0)).replace(/[.,]00(?!\d)/, "");
  const store = useStore();
  const stats = store.getDashboardStats();

  const recentLoans = [...store.loans]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 5);

  const recentPayments = [...store.payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const topClients = useMemo(() => {
    const totals = new Map();
    for (const p of store.payments) {
      const loan = store.getLoan(p.loanId);
      if (!loan) continue;
      const cur = totals.get(loan.clientId) ?? 0;
      totals.set(loan.clientId, cur + (p.amount ?? 0));
    }
    return [...totals.entries()]
      .map(([clientId, total]) => ({ client: store.getClient(clientId), total }))
      .filter((r) => r.client)
      .sort((a, b) => b.total - a.total);
  }, [store.payments, store.clients, store.loans]);

  const topMax = topClients[0]?.total ?? 0;


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
        <StatCard icon={TrendingUp} label="Capital prestado" value={fmt0(stats.totalLent)}
          sub="Monto total otorgado" color="bg-emerald-600" />
        <StatCard icon={Wallet} label="Total a cobrar" value={fmt0(stats.totalExpected)}
          sub="Capital + intereses" color="bg-amber-600" />
        <StatCard icon={CheckCircle} label="Cobrado" value={fmt0(stats.totalCollected)}
          sub="Pagos recibidos" color="bg-teal-600" />
        <StatCard icon={Clock} label="Pendiente" value={fmt0(stats.totalPending)}
          sub="Por cobrar" color="bg-rose-600" />
      </div>


      {/* Calendar of monthly dues */}
      <PaymentsCalendar
        loans={store.loans}
        getClient={store.getClient}
        getLoanStats={store.getLoanStats}
        fmt={fmt}
      />

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
                const pct = stats.totalAmount > 0 ? Math.min(100, Math.round((stats.paid / stats.totalAmount) * 100)) : 0;
                return (
                  <div key={loan.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-blue-300 flex-shrink-0">
                      {client?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{client?.name ?? "—"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${progressFillClass(pct)} rounded-full`} style={{ width: `${pct}%` }} />
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
            <button onClick={() => setPage("loans")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Ver préstamos →
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

      {/* Top clientes */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Trophy size={15} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Top clientes</h2>
              <p className="text-xs text-slate-500">Ranking por total pagado</p>
            </div>
          </div>
          <button onClick={() => setPage("clients")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Ver todos →
          </button>
        </div>
        {topClients.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">Aún no hay pagos registrados</p>
        ) : (
          <div className="space-y-3">
            {topClients.slice(0, 10).map((row, idx) => {
              const pct = topMax > 0 ? Math.max(4, Math.round((row.total / topMax) * 100)) : 0;
              const medal =
                idx === 0 ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                idx === 1 ? "bg-slate-400/20 text-slate-200 border-slate-400/40" :
                idx === 2 ? "bg-orange-700/30 text-orange-300 border-orange-600/40" :
                "bg-slate-800 text-slate-400 border-slate-700";
              return (
                <div key={row.client.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0 ${medal}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{row.client.name}</p>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400 flex-shrink-0 tabular-nums">{fmt0(row.total)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
