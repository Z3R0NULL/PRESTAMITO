/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/LoanDetailPage.jsx — Pantalla de detalle de un préstamo
 * ─────────────────────────────────────────────────────────────────────────────
 *  Vista completa de un préstamo. Compone varios bloques:
 *    1. Cabecera con datos del cliente y barra de progreso.
 *    2. Cards de KPIs (capital, total a pagar, cuota, interés).
 *    3. Contadores (cuotas pagas, restantes, total cobrado).
 *    4. Card de próximo pago con CTA para notificar al cliente.
 *    5. Indicador de pago parcial si la última cuota no se completó.
 *    6. Listado de pagos registrados con edición/eliminación inline.
 *    7. Formulario de alta de pago (AddPaymentForm).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { useStore } from "../store/useStore.jsx";
import { useCurrency } from "../store/useCurrency.js";
import Modal, { Btn } from "./Modal";
import {
  ArrowLeft, Trash2, Percent, Calendar, DollarSign, Paperclip, Download,
  AlertTriangle, CheckCircle2, Plus, Wallet, ArrowLeftRight, User, Pencil, Check, X,
  Phone, Mail, MapPin, IdCard,
} from "lucide-react";
import {
  Badge, NextPaymentChip, NotifyButton, AddPaymentForm,
  getNextPaymentInfo, formatDate, progressFillClass,
} from "./loanHelpers.jsx";
import { useSettings } from "../store/useSettings.jsx";

export default function LoanDetailPage({ loanId, setPage }) {
  const store = useStore();
  const fmt = useCurrency();
  const { settings } = useSettings();
  const [addingPayment, setAddingPayment] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editDraft, setEditDraft] = useState({ amount: "", date: "", installmentNumber: "", note: "", paymentMethod: "cash" });

  const loan = store.getLoan(loanId);

  if (!loan) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => setPage("loans")}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Volver a préstamos
        </button>
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl py-16 text-center">
          <p className="text-slate-500 text-sm">Préstamo no encontrado</p>
        </div>
      </div>
    );
  }

  const stats = store.getLoanStats(loan);
  const due = getNextPaymentInfo(loan, stats, settings);
  const client = store.getClient(loan.clientId);
  const payments = store.getLoanPayments(loan.id);
  const pct = stats.totalAmount > 0 ? Math.min(100, Math.round((stats.paid / stats.totalAmount) * 100)) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setPage("loans")}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Volver a préstamos
        </button>
        {client && (
          <button
            onClick={() => setShowClientInfo(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors"
          >
            <User size={14} /> Ver datos del cliente
          </button>
        )}
      </div>


      {/* Header card */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-blue-500/20 flex items-center justify-center text-blue-300 font-bold flex-shrink-0">
            {client?.name?.charAt(0) ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold text-white truncate">
                {client?.name ?? "Cliente eliminado"}
              </h1>
              <Badge status={loan.status} />
              {loan.status === "active" && <NextPaymentChip info={due} />}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <User size={11} /> {client?.dni || "Sin DNI"} · Inicio: {loan.startDate}
              <span className="text-slate-700">·</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${
                loan.paymentMethod === "transfer"
                  ? "bg-sky-900/30 text-sky-300 border-sky-700/40"
                  : "bg-emerald-900/30 text-emerald-300 border-emerald-700/40"
              }`}>
                {loan.paymentMethod === "transfer" ? "Transferencia" : "Efectivo"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${progressFillClass(pct)} rounded-full transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">{pct}% pagado</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Capital", value: fmt(loan.amount), icon: DollarSign },
          { label: "Total a pagar", value: fmt(stats.totalAmount), icon: DollarSign },
          { label: "Cuota mensual", value: fmt(stats.installmentAmount), icon: Calendar },
          { label: loan.interestType === "total" ? "Interés total" : "Interés mensual", value: `${loan.interestRate}%`, icon: Percent },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#0d1224] border border-slate-800 rounded-xl p-2.5 sm:p-3 min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 mb-1 truncate">{label}</p>
            <p className="text-xs sm:text-sm font-semibold text-white tabular-nums break-words">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-2.5 sm:p-3 min-w-0">
          <p className="text-[10px] sm:text-xs text-blue-400 mb-1 truncate">Cuotas completas</p>
          <p className="text-base sm:text-lg font-bold text-blue-300 tabular-nums">
            {stats.paidInstallments} <span className="text-[10px] sm:text-xs font-normal text-blue-500">/ {loan.installments}</span>
          </p>
        </div>
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-2.5 sm:p-3 min-w-0">
          <p className="text-[10px] sm:text-xs text-amber-400 mb-1 truncate">Cuotas restantes</p>
          <p className="text-base sm:text-lg font-bold text-amber-300 tabular-nums">{stats.remainingInstallments}</p>
        </div>
        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-2.5 sm:p-3 min-w-0">
          <p className="text-[10px] sm:text-xs text-emerald-400 mb-1 truncate">Total cobrado</p>
          <p className="text-xs sm:text-sm font-bold text-emerald-300 tabular-nums break-words">{fmt(stats.paid)}</p>
        </div>
      </div>



      {/* Next payment card */}
      {loan.status === "active" && (() => {
        if (!due) {
          return (
            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-sm text-emerald-200 font-medium">Préstamo al día — todas las cuotas pagadas</span>
            </div>
          );
        }
        const palette = {
          overdue:  { wrap: "bg-rose-950/40 border-rose-700/40",   label: "text-rose-400",   value: "text-rose-200",   hint: `Vencido hace ${-due.diffDays} día${-due.diffDays !== 1 ? "s" : ""}`, hintCls: "text-rose-300" },
          today:    { wrap: "bg-amber-950/40 border-amber-700/40", label: "text-amber-400",  value: "text-amber-200",  hint: "Vence hoy", hintCls: "text-amber-300" },
          soon:     { wrap: "bg-amber-950/30 border-amber-700/30", label: "text-amber-400",  value: "text-amber-100",  hint: `En ${due.diffDays} día${due.diffDays !== 1 ? "s" : ""}`, hintCls: "text-amber-300/80" },
          upcoming: { wrap: "bg-slate-900/60 border-slate-700",    label: "text-slate-400",  value: "text-white",      hint: `En ${due.diffDays} día${due.diffDays !== 1 ? "s" : ""}`, hintCls: "text-slate-400" },
        }[due.level];
        const showNotify = due.level === "overdue" || due.level === "today";
        return (
          <div className={`border rounded-xl px-4 py-3 ${palette.wrap}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {due.level === "overdue" || due.level === "today"
                  ? <AlertTriangle size={20} className={palette.label} />
                  : <Calendar size={20} className={palette.label} />}
                <div>
                  <p className={`text-xs uppercase tracking-wide ${palette.label}`}>Próximo pago · Cuota #{due.nextNumber}</p>
                  <p className={`text-sm font-semibold ${palette.value}`}>
                    {formatDate(due.dueDate)} <span className={`font-normal text-xs ml-1 ${palette.hintCls}`}>· {palette.hint}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${palette.value}`}>{fmt(stats.installmentAmount)}</p>
              </div>
            </div>
            {showNotify && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-3 flex-wrap">
                <p className={`text-xs ${palette.hintCls}`}>
                  {due.level === "overdue"
                    ? "El cliente está atrasado. Envíale un recordatorio."
                    : "Hoy debe pagar. Envíale un recordatorio."}
                </p>
                <NotifyButton client={client} due={due} installmentAmount={stats.installmentAmount} fmt={fmt} />
              </div>
            )}
          </div>
        );
      })()}

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

      {/* Payments */}
      {loan.status === "active" && (
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              Pagos registrados {payments.length > 0 && <span className="text-slate-500 font-normal">· {payments.length}</span>}
            </p>
            {!addingPayment && (
              <button
                onClick={() => setAddingPayment(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus size={16} /> Añadir pago
              </button>
            )}
          </div>

          {addingPayment && (
            <AddPaymentForm
              loan={loan}
              stats={stats}
              due={due}
              onCancel={() => setAddingPayment(false)}
              onDone={() => setAddingPayment(false)}
            />
          )}


          {payments.length === 0 && !addingPayment ? (
            <p className="text-slate-500 text-sm text-center py-6">Aún no hay pagos registrados</p>
          ) : payments.length > 0 ? (
            <div className="space-y-1.5">
              {payments.map((p) => {
                const isEditing = editingPaymentId === p.id;
                if (isEditing) {
                  return (
                    <div key={p.id} className="bg-slate-900/70 border border-blue-700/40 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <label className="text-[11px] text-slate-400 col-span-1">
                          Cuota #
                          <input
                            type="number" min="1" max={loan.installments}
                            value={editDraft.installmentNumber}
                            onChange={(e) => setEditDraft((d) => ({ ...d, installmentNumber: e.target.value }))}
                            className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                          />
                        </label>
                        <label className="text-[11px] text-slate-400 col-span-1">
                          Monto
                          <input
                            type="number" step="0.01" min="0"
                            value={editDraft.amount}
                            onChange={(e) => setEditDraft((d) => ({ ...d, amount: e.target.value }))}
                            className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                          />
                        </label>
                        <label className="text-[11px] text-slate-400 col-span-1">
                          Fecha
                          <input
                            type="date"
                            value={editDraft.date}
                            onChange={(e) => setEditDraft((d) => ({ ...d, date: e.target.value }))}
                            className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                          />
                        </label>
                        <label className="text-[11px] text-slate-400 col-span-1">
                          Método
                          <select
                            value={editDraft.paymentMethod}
                            onChange={(e) => setEditDraft((d) => ({ ...d, paymentMethod: e.target.value }))}
                            className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                          >
                            <option value="cash">Efectivo</option>
                            <option value="transfer">Transferencia</option>
                          </select>
                        </label>
                      </div>
                      <label className="block text-[11px] text-slate-400">
                        Nota
                        <input
                          type="text"
                          value={editDraft.note}
                          onChange={(e) => setEditDraft((d) => ({ ...d, note: e.target.value }))}
                          className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                        />
                      </label>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingPaymentId(null)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                        >
                          <X size={12} /> Cancelar
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await store.updatePayment(p.id, {
                                amount: Number(editDraft.amount) || 0,
                                date: editDraft.date,
                                installmentNumber: Math.max(1, Math.min(loan.installments, Number(editDraft.installmentNumber) || 1)),
                                note: editDraft.note,
                                paymentMethod: editDraft.paymentMethod,
                              });
                              setEditingPaymentId(null);
                            } catch (e) { console.error("Error al actualizar pago:", e); }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          <Check size={12} /> Guardar
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={p.id} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3 transition-colors">
                    <div className="flex items-center gap-3">
                      {/* Leading icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        p.paymentMethod === "transfer"
                          ? "bg-sky-900/30 border-sky-700/40 text-sky-300"
                          : "bg-emerald-900/30 border-emerald-700/40 text-emerald-300"
                      }`}>
                        {p.paymentMethod === "transfer" ? <ArrowLeftRight size={18} /> : <Wallet size={18} />}
                      </div>


                      {/* Middle info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">Cuota #{p.installmentNumber}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${
                            p.paymentMethod === "transfer"
                              ? "bg-sky-900/30 text-sky-300 border-sky-700/40"
                              : "bg-emerald-900/30 text-emerald-300 border-emerald-700/40"
                          }`}>
                            {p.paymentMethod === "transfer" ? "Transferencia" : "Efectivo"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <Calendar size={11} />
                          <span>{formatDate(p.date)}</span>
                          {p.note && <span className="truncate hidden sm:inline">· {p.note}</span>}
                        </div>
                      </div>

                      {/* Amount + actions */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-sm sm:text-base font-bold tabular-nums text-emerald-400">{fmt(p.amount)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditDraft({
                                amount: String(p.amount ?? ""),
                                date: p.date ?? "",
                                installmentNumber: String(p.installmentNumber ?? 1),
                                note: p.note ?? "",
                                paymentMethod: p.paymentMethod ?? "cash",
                              });
                              setEditingPaymentId(p.id);
                            }}
                            className="p-1.5 rounded-md bg-slate-800/60 text-slate-400 hover:bg-blue-900/40 hover:text-blue-300 transition-colors"
                            title="Editar pago"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={async () => {
                              try { await store.deletePayment(p.id); }
                              catch (e) { console.error("Error al eliminar pago:", e); }
                            }}
                            className="p-1.5 rounded-md bg-slate-800/60 text-slate-500 hover:bg-rose-900/40 hover:text-rose-300 transition-colors"
                            title="Eliminar pago"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Note on mobile (full width below) */}
                    {p.note && (
                      <p className="sm:hidden mt-2 text-[11px] text-slate-400 bg-slate-950/40 rounded-md px-2 py-1 truncate">
                        {p.note}
                      </p>
                    )}
                    {p.attachment && (
                      <div className="mt-1.5 flex items-center gap-2 text-xs">
                        <Paperclip size={11} className="text-emerald-400" />
                        <span className="text-slate-400 truncate flex-1">{p.attachmentName || "comprobante"}</span>
                        {p.attachmentType?.startsWith("image/") && (
                          <a href={p.attachment} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300">
                            Ver
                          </a>
                        )}
                        <a href={p.attachment} download={p.attachmentName || "comprobante"}
                          className="text-slate-400 hover:text-emerald-400 transition-colors" title="Descargar">
                          <Download size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}

      {/* Loan attachment */}
      {loan.attachment && (
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Archivo adjunto del préstamo</p>
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5">
            <Paperclip size={16} className="text-blue-400 flex-shrink-0" />
            <span className="text-sm text-slate-200 truncate flex-1">{loan.attachmentName || "archivo"}</span>
            {loan.attachmentType?.startsWith("image/") && (
              <a href={loan.attachment} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300">
                Ver
              </a>
            )}
            <a href={loan.attachment} download={loan.attachmentName || "archivo"}
              className="text-slate-400 hover:text-blue-400 transition-colors" title="Descargar">
              <Download size={15} />
            </a>
          </div>
        </div>
      )}

      {/* Notes */}
      {loan.notes && (
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Notas</p>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{loan.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
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
        <Btn variant="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={13} /> Eliminar
        </Btn>
      </div>

      {confirmDelete && (
        <Modal title="Eliminar préstamo" onClose={() => setConfirmDelete(false)}>
          <p className="text-slate-300 text-sm mb-6">
            ¿Eliminar el préstamo de <strong className="text-white">{client?.name}</strong>?
            Se perderán todos los pagos asociados.
          </p>
          <div className="flex gap-3 justify-end">
            <Btn variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Btn>
            <Btn variant="danger" onClick={async () => {
              try {
                await store.deleteLoan(loan.id);
                setPage("loans");
              } catch (e) {
                console.error("Error al eliminar préstamo:", e);
              }
            }}>Eliminar</Btn>
          </div>
        </Modal>
      )}

      {showClientInfo && client && (
        <Modal title="Datos del cliente" onClose={() => setShowClientInfo(false)}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-blue-500/20 flex items-center justify-center text-blue-300 font-bold flex-shrink-0">
                {client.name?.charAt(0) ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-white truncate">{client.name}</p>
                <p className="text-xs text-slate-500">Cliente</p>
              </div>
            </div>
            {[
              { icon: IdCard, label: "DNI", value: client.dni },
              { icon: Phone,  label: "Teléfono", value: client.phone },
              { icon: Mail,   label: "Email", value: client.email },
              { icon: MapPin, label: "Dirección", value: client.address },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <Icon size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className="text-slate-200 break-words">{value || <span className="text-slate-600">—</span>}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Btn variant="secondary" onClick={() => setShowClientInfo(false)}>Cerrar</Btn>
          </div>
        </Modal>
      )}
    </div>

  );
}
