import { useState } from "react";
import { useStore } from "../store/useStore.jsx";
import Modal, { Field, Btn } from "./Modal";
import { PlusCircle, Trash2, Eye, ChevronDown, ChevronUp, Percent, Calendar, DollarSign } from "lucide-react";

function fmt(n) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n);
}

function Badge({ status }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === "active" ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/30"
        : "bg-slate-800 text-slate-400 border border-slate-700"
    }`}>
      {status === "active" ? "Activo" : "Cerrado"}
    </span>
  );
}

export default function Loans() {
  const store = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const toggle = (id) => setExpanded((e) => (e === id ? null : id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Préstamos</h1>
          <p className="text-slate-400 text-sm mt-1">{store.loans.length} préstamo{store.loans.length !== 1 ? "s" : ""} registrado{store.loans.length !== 1 ? "s" : ""}</p>
        </div>
        <Btn onClick={() => setShowAdd(true)}>
          <PlusCircle size={15} /> Nuevo préstamo
        </Btn>
      </div>

      {store.loans.length === 0 ? (
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl py-16 text-center">
          <p className="text-slate-500 text-sm">No hay préstamos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...store.loans].sort((a, b) => b.startDate.localeCompare(a.startDate)).map((loan) => {
            const client = store.getClient(loan.clientId);
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-blue-500/20 flex items-center justify-center text-blue-300 font-bold flex-shrink-0">
                    {client?.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{client?.name ?? "Cliente eliminado"}</p>
                      <Badge status={loan.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-xs">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{pct}% pagado</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-base font-bold text-white">{fmt(loan.amount)}</p>
                    <p className="text-xs text-slate-500">{loan.installments} cuotas · {loan.interestRate}% {loan.interestType === "total" ? "total" : "mens."}</p>
                  </div>
                  <div className="text-slate-500 flex-shrink-0">
                    {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-800 px-5 py-5 space-y-5">
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Capital", value: fmt(loan.amount), icon: DollarSign },
                        { label: "Total a pagar", value: fmt(stats.totalAmount), icon: DollarSign },
                        { label: "Cuota mensual", value: fmt(stats.installmentAmount), icon: Calendar },
                        { label: loan.interestType === "total" ? "Interés total" : "Interés mensual", value: `${loan.interestRate}%`, icon: Percent },
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
                        <p className="text-lg font-bold text-blue-300">{stats.paidInstallments} <span className="text-xs font-normal text-blue-500">/ {loan.installments}</span></p>
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
                    {/* Partial installment indicator */}
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
                            <div key={p.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2">
                              <div>
                                <span className="text-xs font-medium text-slate-300">Cuota #{p.installmentNumber}</span>
                                {p.note && <span className="text-xs text-slate-500 ml-2">· {p.note}</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500">{p.date}</span>
                                <span className="text-xs font-semibold text-emerald-400">{fmt(p.amount)}</span>
                                <button
                                  onClick={async () => {
                                    try {
                                      await store.deletePayment(p.id);
                                    } catch (e) {
                                      console.error("Error al eliminar pago:", e);
                                    }
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
                              await store.updateLoan(loan.id, { status: loan.status === "active" ? "closed" : "active" });
                            } catch (e) {
                              console.error("Error al actualizar préstamo:", e);
                            }
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

      {showAdd && (
        <LoanForm
          onSave={async (data) => {
            try {
              await store.addLoan(data);
              setShowAdd(false);
            } catch (e) {
              console.error("Error al guardar préstamo:", e);
            }
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {confirmDelete && (
        <Modal title="Eliminar préstamo" onClose={() => setConfirmDelete(null)}>
          <p className="text-slate-300 text-sm mb-6">
            ¿Eliminar el préstamo de <strong className="text-white">{store.getClient(confirmDelete.clientId)?.name}</strong>?
            Se perderán todos los pagos asociados.
          </p>
          <div className="flex gap-3 justify-end">
            <Btn variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Btn>
            <Btn variant="danger" onClick={async () => {
              try {
                await store.deleteLoan(confirmDelete.id);
              } catch (e) {
                console.error("Error al eliminar préstamo:", e);
              }
              setConfirmDelete(null);
            }}>Eliminar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function LoanForm({ onSave, onClose }) {
  const store = useStore();
  const [form, setForm] = useState({
    clientId: store.clients[0]?.id ?? "",
    amount: "",
    interestRate: "5",
    interestType: "monthly",
    installments: "12",
    startDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const preview = form.amount && form.installments
    ? store.calcInstallment(Number(form.amount), Number(form.interestRate || 0), Number(form.installments), form.interestType)
    : null;

  const totalPreview = preview ? preview * Number(form.installments) : null;
  const interestPreview = totalPreview ? totalPreview - Number(form.amount) : null;

  const interestLabel = form.interestType === "monthly" ? "Interés mensual (%)" : "Interés total (%)";
  const interestHint  = form.interestType === "monthly"
    ? "Se aplica por cuota sobre el capital"
    : "Se aplica una sola vez sobre el capital total";

  const submit = () => {
    const errs = {};
    if (!form.clientId) errs.clientId = "Selecciona un cliente";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) errs.amount = "Monto inválido";
    if (!form.installments || isNaN(Number(form.installments)) || Number(form.installments) <= 0) errs.installments = "Cuotas inválidas";
    if (Object.keys(errs).length) return setErrors(errs);
    onSave({ ...form, amount: Number(form.amount), interestRate: Number(form.interestRate), installments: Number(form.installments) });
  };

  return (
    <Modal title="Nuevo préstamo" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Cliente *" error={errors.clientId}>
          <select
            value={form.clientId}
            onChange={set("clientId")}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            {store.clients.length === 0 ? (
              <option value="">— Sin clientes —</option>
            ) : (
              store.clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            )}
          </select>
        </Field>

        <Field label="Monto del préstamo ($) *" error={errors.amount}>
          <input
            type="number"
            value={form.amount}
            onChange={set("amount")}
            placeholder="Ej: 1000000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </Field>

        {/* Interest type toggle */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Tipo de interés</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "monthly", label: "Mensual", desc: "% por cuota" },
              { value: "total",   label: "Total",   desc: "% sobre capital" },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, interestType: value }))}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all text-left ${
                  form.interestType === value
                    ? "bg-violet-600/20 border-violet-500/60 text-violet-300"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                <span className="block">{label}</span>
                <span className={`block text-xs font-normal mt-0.5 ${form.interestType === value ? "text-violet-400" : "text-slate-600"}`}>{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={interestLabel} error={errors.interestRate}>
            <div className="relative">
              <input
                type="number"
                value={form.interestRate}
                onChange={set("interestRate")}
                step="0.5"
                min="0"
                max="100"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pr-8 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{interestHint}</p>
          </Field>
          <Field label="N° de cuotas" error={errors.installments}>
            <input
              type="number"
              value={form.installments}
              onChange={set("installments")}
              min="1"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </Field>
        </div>

        <Field label="Fecha de inicio">
          <input
            type="date"
            value={form.startDate}
            onChange={set("startDate")}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </Field>

        <Field label="Notas (opcional)">
          <textarea
            value={form.notes}
            onChange={set("notes")}
            rows={2}
            placeholder="Motivo del préstamo..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </Field>

        {/* Preview */}
        {preview !== null && Number(form.amount) > 0 && (
          <div className="bg-blue-950/40 border border-blue-700/30 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-blue-400">Cuota mensual</p>
              <p className="text-sm font-bold text-blue-200">{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(preview)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-400">Total intereses</p>
              <p className="text-sm font-bold text-blue-200">{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(interestPreview)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-400">Total a pagar</p>
              <p className="text-sm font-bold text-blue-200">{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(totalPreview)}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={submit}>Registrar préstamo</Btn>
        </div>
      </div>
    </Modal>
  );
}
