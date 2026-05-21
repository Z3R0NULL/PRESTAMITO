import { useState } from "react";
import { useStore } from "../store/useStore.jsx";
import Modal, { Field, Btn } from "./Modal";
import { PlusCircle, Trash2, CheckCircle, Search } from "lucide-react";

function fmt(n) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n);
}

export default function Payments() {
  const store = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const enriched = store.payments
    .map((p) => {
      const loan = store.getLoan(p.loanId);
      const client = loan ? store.getClient(loan.clientId) : null;
      return { ...p, loan, client };
    })
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.client?.name?.toLowerCase().includes(q) ||
        p.date?.includes(q) ||
        p.note?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalToday = store.payments
    .filter((p) => p.date === new Date().toISOString().slice(0, 10))
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pagos</h1>
          <p className="text-slate-400 text-sm mt-1">{store.payments.length} pago{store.payments.length !== 1 ? "s" : ""} registrado{store.payments.length !== 1 ? "s" : ""}</p>
        </div>
        <Btn onClick={() => setShowAdd(true)}>
          <PlusCircle size={15} /> Registrar pago
        </Btn>
      </div>

      {totalToday > 0 && (
        <div className="bg-emerald-950/40 border border-emerald-700/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle size={16} className="text-emerald-400" />
          <p className="text-sm text-emerald-300">
            Cobrado hoy: <span className="font-bold">{fmt(totalToday)}</span>
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, fecha o nota..."
          className="w-full bg-[#0d1224] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl overflow-hidden">
        {enriched.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500 text-sm">No se encontraron pagos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Préstamo</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cuota</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Monto</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((payment, i) => (
                  <tr
                    key={payment.id}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors ${i === enriched.length - 1 ? "border-b-0" : ""}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center flex-shrink-0">
                          <CheckCircle size={13} className="text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{payment.client?.name ?? "—"}</p>
                          {payment.note && <p className="text-xs text-slate-500">{payment.note}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-xs text-slate-400">
                        {payment.loan ? fmt(payment.loan.amount) : "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300 border border-blue-700/30 text-xs font-medium">
                        #{payment.installmentNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-300">{payment.date}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-emerald-400">{fmt(payment.amount)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setConfirmDelete(payment)}
                        className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Total */}
      {store.payments.length > 0 && (
        <div className="flex justify-end">
          <div className="bg-[#0d1224] border border-slate-800 rounded-xl px-5 py-3 flex items-center gap-4">
            <p className="text-sm text-slate-400">Total cobrado:</p>
            <p className="text-lg font-bold text-emerald-400">
              {fmt(store.payments.reduce((s, p) => s + p.amount, 0))}
            </p>
          </div>
        </div>
      )}

      {showAdd && (
        <PaymentForm
          onSave={async (data) => {
            try {
              await store.addPayment(data);
              setShowAdd(false);
            } catch (e) {
              console.error("Error al registrar pago:", e);
            }
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {confirmDelete && (
        <Modal title="Eliminar pago" onClose={() => setConfirmDelete(null)}>
          <p className="text-slate-300 text-sm mb-6">
            ¿Eliminar el pago de <strong className="text-white">{fmt(confirmDelete.amount)}</strong> del {confirmDelete.date}?
          </p>
          <div className="flex gap-3 justify-end">
            <Btn variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Btn>
            <Btn variant="danger" onClick={async () => {
              try {
                await store.deletePayment(confirmDelete.id);
              } catch (e) {
                console.error("Error al eliminar pago:", e);
              }
              setConfirmDelete(null);
            }}>
              Eliminar
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PaymentForm({ onSave, onClose }) {
  const store = useStore();
  const activeLoans = store.loans.filter((l) => l.status === "active");

  const [form, setForm] = useState({
    loanId: activeLoans[0]?.id ?? "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    installmentNumber: "",
    note: "",
  });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const selectedLoan = store.getLoan(form.loanId);
  const loanStats = selectedLoan ? store.getLoanStats(selectedLoan) : null;

  const suggestAmount = () => {
    if (loanStats) setForm((f) => ({ ...f, amount: String(loanStats.installmentAmount) }));
  };

  const suggestInstallment = () => {
    if (loanStats) setForm((f) => ({ ...f, installmentNumber: String(loanStats.paidInstallments + 1) }));
  };

  const submit = () => {
    const errs = {};
    if (!form.loanId) errs.loanId = "Selecciona un préstamo";
    const parsedAmount = Number(form.amount);
    if (!form.amount || isNaN(parsedAmount) || parsedAmount <= 0) errs.amount = "Monto inválido";
    if (loanStats && parsedAmount > loanStats.remaining + 0.01)
      errs.amount = `El monto excede el saldo pendiente (${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(loanStats.remaining)})`;
    if (!form.installmentNumber) errs.installmentNumber = "Número de cuota requerido";
    if (Object.keys(errs).length) return setErrors(errs);
    onSave({
      ...form,
      amount: parsedAmount,
      installmentNumber: Number(form.installmentNumber),
    });
  };

  return (
    <Modal title="Registrar pago" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Préstamo *" error={errors.loanId}>
          <select
            value={form.loanId}
            onChange={(e) => {
              setForm((f) => ({ ...f, loanId: e.target.value, amount: "", installmentNumber: "" }));
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            {activeLoans.length === 0 ? (
              <option value="">— Sin préstamos activos —</option>
            ) : (
              activeLoans.map((l) => {
                const c = store.getClient(l.clientId);
                return (
                  <option key={l.id} value={l.id}>
                    {c?.name ?? "?"} – {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(l.amount)}
                  </option>
                );
              })
            )}
          </select>
        </Field>

        {loanStats && (
          <div className="bg-slate-900/60 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-slate-500">Cuota sugerida</p>
              <p className="text-white font-semibold">{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(loanStats.installmentAmount)}</p>
            </div>
            <div>
              <p className="text-slate-500">Pagadas</p>
              <p className="text-white font-semibold">{loanStats.paidInstallments} / {selectedLoan.installments}</p>
            </div>
            <div>
              <p className="text-slate-500">Pendiente</p>
              <p className="text-amber-300 font-semibold">{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(loanStats.remaining)}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="N° de cuota *" error={errors.installmentNumber}>
            <div className="relative">
              <input
                type="number"
                value={form.installmentNumber}
                onChange={set("installmentNumber")}
                min="1"
                placeholder="Ej: 1"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            {loanStats && (
              <button onClick={suggestInstallment} className="text-xs text-blue-400 hover:text-blue-300 mt-1">
                Auto: cuota #{loanStats.paidInstallments + 1}
              </button>
            )}
          </Field>

          <Field label="Fecha">
            <input
              type="date"
              value={form.date}
              onChange={set("date")}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </Field>
        </div>

        <Field label="Monto pagado ($) *" error={errors.amount}>
          <input
            type="number"
            value={form.amount}
            onChange={set("amount")}
            placeholder="Ej: 500000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {loanStats && (
            <button onClick={suggestAmount} className="text-xs text-blue-400 hover:text-blue-300 mt-1">
              Usar cuota sugerida: {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(loanStats.installmentAmount)}
            </button>
          )}
        </Field>

        <Field label="Nota (opcional)">
          <input
            value={form.note}
            onChange={set("note")}
            placeholder="Ej: Pago en efectivo"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </Field>

        <div className="flex gap-3 justify-end pt-2">
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={submit}>Registrar pago</Btn>
        </div>
      </div>
    </Modal>
  );
}
