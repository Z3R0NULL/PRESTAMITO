import { useState } from "react";
import { useStore } from "../store/useStore.jsx";
import { useCurrency } from "../store/useCurrency.js";
import { Field, Btn } from "./Modal";
import CurrencyInput from "./CurrencyInput.jsx";
import { CreditCard, ArrowLeft } from "lucide-react";

const inputCls =
  "w-full bg-[#0d1224] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";

export default function NewPaymentPage({ setPage }) {
  const store = useStore();
  const fmt = useCurrency();
  const activeLoans = store.loans.filter((l) => l.status === "active");

  const [form, setForm] = useState({
    loanId: activeLoans[0]?.id ?? "",
    amountNumeric: null,
    amountDisplay: "",
    date: new Date().toISOString().slice(0, 10),
    installmentNumber: "",
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const selectedLoan = store.getLoan(form.loanId);
  const loanStats = selectedLoan ? store.getLoanStats(selectedLoan) : null;

  const suggestAmount = () => {
    if (loanStats)
      setForm((f) => ({
        ...f,
        amountNumeric: loanStats.installmentAmount,
        amountDisplay: String(loanStats.installmentAmount),
      }));
  };

  const suggestInstallment = () => {
    if (loanStats)
      setForm((f) => ({ ...f, installmentNumber: String(loanStats.paidInstallments + 1) }));
  };

  const submit = async () => {
    const errs = {};
    if (!form.loanId) errs.loanId = "Selecciona un préstamo";
    if (!form.amountNumeric || form.amountNumeric <= 0) errs.amount = "Monto inválido";
    if (loanStats && form.amountNumeric > loanStats.remaining + 0.01)
      errs.amount = `El monto excede el saldo pendiente (${fmt(loanStats.remaining)})`;
    if (!form.installmentNumber) errs.installmentNumber = "Número de cuota requerido";
    if (Object.keys(errs).length) return setErrors(errs);

    setSaving(true);
    try {
      await store.addPayment({
        loanId: form.loanId,
        amount: form.amountNumeric,
        date: form.date,
        installmentNumber: Number(form.installmentNumber),
        note: form.note,
      });
      setPage("payments");
    } catch (e) {
      console.error("Error al registrar pago:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPage("payments")}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Registrar pago</h1>
          <p className="text-slate-400 text-sm mt-0.5">Registra el pago de una cuota</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center">
            <CreditCard size={16} className="text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Información del pago</p>
        </div>

        <Field label="Préstamo *" error={errors.loanId}>
          <select
            value={form.loanId}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                loanId: e.target.value,
                amountNumeric: null,
                amountDisplay: "",
                installmentNumber: "",
              }))
            }
            className={inputCls}
          >
            {activeLoans.length === 0 ? (
              <option value="">— Sin préstamos activos —</option>
            ) : (
              activeLoans.map((l) => {
                const c = store.getClient(l.clientId);
                return (
                  <option key={l.id} value={l.id}>
                    {c?.name ?? "?"} – {fmt(l.amount)}
                  </option>
                );
              })
            )}
          </select>
        </Field>

        {loanStats && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-slate-500">Cuota sugerida</p>
              <p className="text-white font-semibold">{fmt(loanStats.installmentAmount)}</p>
            </div>
            <div>
              <p className="text-slate-500">Pagadas</p>
              <p className="text-white font-semibold">
                {loanStats.paidInstallments} / {selectedLoan.installments}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Pendiente</p>
              <p className="text-amber-300 font-semibold">{fmt(loanStats.remaining)}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="N° de cuota *" error={errors.installmentNumber}>
            <input
              type="number"
              value={form.installmentNumber}
              onChange={set("installmentNumber")}
              min="1"
              placeholder="Ej: 1"
              className={inputCls}
            />
            {loanStats && (
              <button
                onClick={suggestInstallment}
                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
              >
                Auto: cuota #{loanStats.paidInstallments + 1}
              </button>
            )}
          </Field>

          <Field label="Fecha">
            <input
              type="date"
              value={form.date}
              onChange={set("date")}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Monto pagado *" error={errors.amount}>
          <CurrencyInput
            value={form.amountDisplay}
            onChange={(numeric, display) =>
              setForm((f) => ({ ...f, amountNumeric: numeric, amountDisplay: display }))
            }
            className="w-full bg-[#0d1224] border border-slate-800 rounded-xl py-2.5 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {loanStats && (
            <button
              onClick={suggestAmount}
              className="text-xs text-blue-400 hover:text-blue-300 mt-1"
            >
              Usar cuota sugerida: {fmt(loanStats.installmentAmount)}
            </button>
          )}
        </Field>

        <Field label="Nota (opcional)">
          <input
            value={form.note}
            onChange={set("note")}
            placeholder="Ej: Pago en efectivo"
            className={inputCls}
          />
        </Field>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
          <Btn variant="secondary" onClick={() => setPage("payments")}>
            Cancelar
          </Btn>
          <Btn onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : "Registrar pago"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
