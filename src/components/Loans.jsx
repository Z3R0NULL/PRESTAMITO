/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/Loans.jsx — Listado de préstamos
 * ─────────────────────────────────────────────────────────────────────────────
 *  Lista todos los préstamos del usuario actual con filtros (estado,
 *  búsqueda) y ordenamientos. Cada fila muestra: cliente, monto, progreso,
 *  próxima cuota y acciones rápidas (ver detalle, avisar al cliente).
 *  El detalle se abre en LoanDetailPage via onViewLoan(loanId).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useMemo } from "react";
import { useStore } from "../store/useStore.jsx";
import { useCurrency } from "../store/useCurrency.js";
import { Btn } from "./Modal";
import SearchToolbar from "./SearchToolbar";
import { PlusCircle, Eye, AlertTriangle } from "lucide-react";
import { Badge, NextPaymentChip, getNextPaymentInfo, progressFillClass } from "./loanHelpers.jsx";
import { useSettings } from "../store/useSettings.jsx";

const LOAN_SORT_OPTIONS = [
  { value: "newest",      label: "Más recientes" },
  { value: "oldest",      label: "Más antiguos" },
  { value: "due_soon",    label: "Próximos a vencer" },
  { value: "due_late",    label: "Más atrasados" },
  { value: "amount_desc", label: "Mayor monto" },
  { value: "amount_asc",  label: "Menor monto" },
  { value: "client_az",   label: "Cliente A→Z" },
];

export default function Loans({ setPage, onViewLoan }) {
  const store = useStore();
  const fmt = useCurrency();
  const { settings } = useSettings();
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [sort, setSort] = useState("due_soon");

  // Pre-compute due info per loan and group alerts
  const loansWithInfo = useMemo(() => {
    return store.loans.map((loan) => {
      const stats = store.getLoanStats(loan);
      const due = getNextPaymentInfo(loan, stats, settings);
      const client = store.getClient(loan.clientId);
      return { loan, stats, due, client };
    });
  }, [store.loans, store.clients, store.payments, settings.graceDays, settings.lateFeePerDay]);

  const overdue = loansWithInfo.filter((x) => x.due?.level === "overdue");
  const dueToday = loansWithInfo.filter((x) => x.due?.level === "today");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = loansWithInfo.filter(({ loan, client }) => {
      if (!q) return true;
      return (
        client?.name?.toLowerCase().includes(q) ||
        client?.dni?.toLowerCase().includes(q) ||
        loan.notes?.toLowerCase().includes(q) ||
        String(loan.amount).includes(q)
      );
    });
    list.sort((a, b) => {
      switch (sort) {
        case "oldest":      return a.loan.startDate.localeCompare(b.loan.startDate);
        case "amount_desc": return b.loan.amount - a.loan.amount;
        case "amount_asc":  return a.loan.amount - b.loan.amount;
        case "client_az":   return (a.client?.name || "").localeCompare(b.client?.name || "");
        case "due_soon":
        case "due_late": {
          const da = a.due?.diffDays ?? Infinity;
          const db = b.due?.diffDays ?? Infinity;
          return da - db;
        }
        default: return b.loan.startDate.localeCompare(a.loan.startDate);
      }
    });
    return list;
  }, [loansWithInfo, search, sort]);

  const openLoan = (id) => onViewLoan?.(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Préstamos</h1>
          <p className="text-slate-400 text-sm mt-1">
            {store.loans.length} préstamo{store.loans.length !== 1 ? "s" : ""} registrado{store.loans.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Btn onClick={() => setPage("new-loan")}>
          <PlusCircle size={15} /> Nuevo préstamo
        </Btn>
      </div>

      {(overdue.length > 0 || dueToday.length > 0) && (
        <div className="space-y-2">
          {overdue.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-700/40 rounded-2xl px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-rose-200 font-semibold">
                  {overdue.length} cuota{overdue.length !== 1 ? "s" : ""} vencida{overdue.length !== 1 ? "s" : ""}
                </p>
                <p className="text-rose-300/80 text-xs mt-0.5">
                  {overdue.map(({ loan, due }) => {
                    const c = store.getClient(loan.clientId);
                    return `${c?.name ?? "Cliente"} (${-due.diffDays}d)`;
                  }).join(" · ")}
                </p>
              </div>
            </div>
          )}
          {dueToday.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-700/40 rounded-2xl px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-200 font-semibold">
                  {dueToday.length} cuota{dueToday.length !== 1 ? "s" : ""} vence{dueToday.length !== 1 ? "n" : ""} hoy
                </p>
                <p className="text-amber-300/80 text-xs mt-0.5">
                  {dueToday.map(({ loan }) => store.getClient(loan.clientId)?.name ?? "Cliente").join(" · ")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <SearchToolbar
        search={search}
        setSearch={setSearch}
        placeholder="Buscar por cliente, DNI, monto o nota..."
        view={view}
        setView={setView}
        sort={sort}
        setSort={setSort}
        sortOptions={LOAN_SORT_OPTIONS}
        accent="blue"
      />

      {store.loans.length === 0 ? (
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl py-16 text-center">
          <p className="text-slate-500 text-sm">No hay préstamos registrados</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl py-16 text-center">
          <p className="text-slate-500 text-sm">No hay préstamos que coincidan con la búsqueda</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ loan, stats, due, client }) => {
            const pct = stats.totalAmount > 0 ? Math.min(100, Math.round((stats.paid / stats.totalAmount) * 100)) : 0;
            return (
              <div
                key={loan.id}
                className="bg-[#0d1224] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-blue-500/20 flex items-center justify-center text-blue-300 font-bold flex-shrink-0">
                      {client?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{client?.name ?? "Cliente eliminado"}</p>
                      <p className="text-xs text-slate-500">{loan.installments} cuotas · {loan.interestRate}%</p>
                    </div>
                  </div>
                  <Badge status={loan.status} />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{fmt(loan.amount)}</p>
                  <p className="text-xs text-slate-500">Cuota: {fmt(stats.installmentAmount)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${progressFillClass(pct)} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-500">{pct}%</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  {loan.status === "active"
                    ? <NextPaymentChip info={due} />
                    : <span className="text-xs text-slate-500">Cerrado</span>}
                  <button
                    onClick={() => openLoan(loan.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                    title="Ver detalle"
                    aria-label="Ver detalle"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>

            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ loan, stats, due, client }) => {
            const pct = stats.totalAmount > 0 ? Math.min(100, Math.round((stats.paid / stats.totalAmount) * 100)) : 0;
            return (
              <div key={loan.id} className="bg-[#0d1224] border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-blue-500/20 flex items-center justify-center text-blue-300 font-bold flex-shrink-0">
                    {client?.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{client?.name ?? "Cliente eliminado"}</p>
                      <Badge status={loan.status} />
                      {loan.status === "active" && <NextPaymentChip info={due} />}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-xs">
                        <div
                          className={`h-full ${progressFillClass(pct)} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{pct}% pagado</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-base font-bold text-white">{fmt(loan.amount)}</p>
                    <p className="text-xs text-slate-500">
                      {loan.installments} cuotas · {loan.interestRate}% {loan.interestType === "total" ? "total" : "mens."}
                    </p>
                  </div>
                  <button

                    onClick={() => openLoan(loan.id)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors flex-shrink-0"
                    title="Ver detalle"
                    aria-label="Ver detalle"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
