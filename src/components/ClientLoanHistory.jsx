/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/ClientLoanHistory.jsx — Historial de préstamos de un cliente
 * ─────────────────────────────────────────────────────────────────────────────
 *  Pantalla a la que se llega desde la lista de clientes ("Ver historial").
 *  Muestra todos los préstamos del cliente con su progreso y totales,
 *  incluyendo los cerrados.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useMemo } from "react";
import { useStore } from "../store/useStore.jsx";
import { useCurrency } from "../store/useCurrency.js";
import Modal, { Btn } from "./Modal";
import {
  ArrowLeft, PlusCircle, Trash2, ChevronDown, ChevronUp,
  Percent, Calendar, DollarSign, Phone, Mail, MapPin, CreditCard,
} from "lucide-react";
import { progressFillClass } from "./loanHelpers.jsx";

const AVATAR_COLORS = [
  "bg-indigo-900/50 text-indigo-300",
  "bg-violet-900/50 text-violet-300",
  "bg-emerald-900/50 text-emerald-300",
  "bg-amber-900/50  text-amber-300",
  "bg-rose-900/50   text-rose-300",
  "bg-sky-900/50    text-sky-300",
];

function getInitials(name) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function Badge({ status }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === "active"
        ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/30"
        : "bg-slate-800 text-slate-400 border border-slate-700"
    }`}>
      {status === "active" ? "Activo" : "Cerrado"}
    </span>
  );
}

export default function ClientLoanHistory({ clientId, setPage }) {
  const store = useStore();
  const fmt = useCurrency();

  const client = store.getClient(clientId);
  const color = AVATAR_COLORS[((client?.name?.charCodeAt(0)) || 0) % AVATAR_COLORS.length];

  const [filter, setFilter] = useState("all"); // "all" | "active" | "closed"
  const [expanded, setExpanded] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const allLoans = useMemo(
    () => store.getClientLoans(clientId).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [store.loans, clientId]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return allLoans;
    return allLoans.filter((l) => l.status === filter);
  }, [allLoans, filter]);

  const activeCount = allLoans.filter((l) => l.status === "active").length;
  const closedCount = allLoans.filter((l) => l.status === "closed").length;

  const toggle = (id) => setExpanded((e) => (e === id ? null : id));

  if (!client) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>Cliente no encontrado.</p>
        <button onClick={() => setPage("clients")} className="mt-3 text-indigo-400 hover:underline text-sm">
          Volver a clientes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => setPage("clients")}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft size={15} /> Volver a clientes
      </button>

      {/* Client card */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-xl p-5 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${color}`}>
          {getInitials(client.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white">{client.name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {client.dni && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CreditCard size={11} /> DNI {client.dni}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Phone size={11} /> {client.phone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Mail size={11} /> {client.email}
              </span>
            )}
            {client.address && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={11} /> {client.address}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setPage("new-loan")}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
        >
          <PlusCircle size={14} /> Nuevo préstamo
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
        {[
          { key: "all",    label: "Todos",    count: allLoans.length },
          { key: "active", label: "Activos",  count: activeCount },
          { key: "closed", label: "Cerrados", count: closedCount },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              filter === key ? "bg-indigo-500/50 text-indigo-100" : "bg-slate-800 text-slate-500"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Loans list */}
      {filtered.length === 0 ? (
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl py-16 text-center">
          <p className="text-slate-500 text-sm">
            {filter === "all" ? "Este cliente no tiene préstamos registrados" :
             filter === "active" ? "No hay préstamos activos" : "No hay préstamos cerrados"}
          </p>
          {filter === "all" && (
            <button
              onClick={() => setPage("new-loan")}
              className="mt-3 text-sm text-indigo-400 hover:underline"
            >
              Registrar primer préstamo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((loan) => {
            const stats = store.getLoanStats(loan);
            const pct = Math.min(100, Math.round((stats.paid / stats.totalAmount) * 100));
            const isOpen = expanded === loan.id;
            const payments = store.getLoanPayments(loan.id);

            return (
              <div key={loan.id} className="bg-[#0d1224] border border-slate-800 rounded-2xl overflow-hidden">
                {/* Header row */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition-colors text-left"
                  onClick={() => toggle(loan.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{loan.startDate}</span>
                      <Badge status={loan.status} />
                      {loan.notes && (
                        <span className="text-xs text-slate-500 truncate max-w-[160px]">{loan.notes}</span>
                      )}
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
                      {loan.installments} cuotas · {loan.interestRate}%{" "}
                      {loan.interestType === "total" ? "total" : "mens."}
                    </p>
                  </div>
                  <div className="text-slate-500 flex-shrink-0">
                    {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-800 px-5 py-5 space-y-5">
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Capital", value: fmt(loan.amount), icon: DollarSign },
                        { label: "Total a pagar", value: fmt(stats.totalAmount), icon: DollarSign },
                        { label: "Cuota mensual", value: fmt(stats.installmentAmount), icon: Calendar },
                        {
                          label: loan.interestType === "total" ? "Interés total" : "Interés mensual",
                          value: `${loan.interestRate}%`,
                          icon: Percent,
                        },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-slate-900/60 rounded-xl p-3">
                          <p className="text-xs text-slate-500 mb-1">{label}</p>
                          <p className="text-sm font-semibold text-white">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Installments summary */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-3">
                        <p className="text-xs text-blue-400 mb-1">Cuotas completas</p>
                        <p className="text-lg font-bold text-blue-300">
                          {stats.paidInstallments}{" "}
                          <span className="text-xs font-normal text-blue-500">/ {loan.installments}</span>
                        </p>
                      </div>
                      <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
                        <p className="text-xs text-amber-400 mb-1">Cuotas restantes</p>
                        <p className="text-lg font-bold text-amber-300">{stats.remainingInstallments}</p>
                      </div>
                      <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-3">
                        <p className="text-xs text-emerald-400 mb-1">Total cobrado</p>
                        <p className="text-sm font-bold text-emerald-300">{fmt(stats.paid)}</p>
                      </div>
                    </div>

                    {/* Partial installment */}
                    {(() => {
                      const partialPaid = stats.paid % stats.installmentAmount;
                      if (partialPaid > 0 && stats.paidInstallments < loan.installments) {
                        const faltante = stats.installmentAmount - partialPaid;
                        return (
                          <div className="bg-violet-900/20 border border-violet-700/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm">
                            <span className="text-violet-300">Pago parcial en cuota #{stats.paidInstallments + 1}</span>
                            <span className="text-violet-200 font-semibold">
                              {fmt(partialPaid)} / {fmt(stats.installmentAmount)}
                              <span className="text-xs text-violet-400 ml-2">(faltan {fmt(faltante)})</span>
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Payments list */}
                    {payments.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Pagos registrados</p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {payments.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2"
                            >
                              <div>
                                <span className="text-xs font-medium text-slate-300">Cuota #{p.installmentNumber}</span>
                                {p.note && <span className="text-xs text-slate-500 ml-2">· {p.note}</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500">{p.date}</span>
                                <span className="text-xs font-semibold text-emerald-400">{fmt(p.amount)}</span>
                                <button
                                  onClick={async () => {
                                    try { await store.deletePayment(p.id); }
                                    catch (e) { console.error(e); }
                                  }}
                                  className="text-slate-600 hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs text-slate-500">Inicio: {loan.startDate}</div>
                      <div className="flex gap-2">
                        <Btn
                          variant={loan.status === "active" ? "secondary" : "primary"}
                          onClick={async () => {
                            try {
                              await store.updateLoan(loan.id, {
                                status: loan.status === "active" ? "closed" : "active",
                              });
                            } catch (e) { console.error(e); }
                          }}
                        >
                          {loan.status === "active" ? "Cerrar préstamo" : "Reabrir"}
                        </Btn>
                        <Btn variant="danger" onClick={() => setConfirmDelete(loan)}>
                          <Trash2 size={13} /> Eliminar
                        </Btn>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <Modal title="Eliminar préstamo" onClose={() => setConfirmDelete(null)}>
          <p className="text-slate-300 text-sm mb-6">
            ¿Eliminar el préstamo del{" "}
            <strong className="text-white">{confirmDelete.startDate}</strong>? Se perderán todos los pagos asociados.
          </p>
          <div className="flex gap-3 justify-end">
            <Btn variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Btn>
            <Btn
              variant="danger"
              onClick={async () => {
                try { await store.deleteLoan(confirmDelete.id); }
                catch (e) { console.error(e); }
                setConfirmDelete(null);
              }}
            >
              Eliminar
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
