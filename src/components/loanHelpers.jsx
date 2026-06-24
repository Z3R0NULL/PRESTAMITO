/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/loanHelpers.jsx — Helpers compartidos del módulo de préstamos
 * ─────────────────────────────────────────────────────────────────────────────
 *  Reúne todo lo que se reutiliza entre Loans, LoanDetailPage y
 *  ClientLoanHistory para evitar duplicación:
 *    • Utilidades puras: addMonths, startOfToday, formatDate,
 *      progressFillClass, readFileAsDataURL.
 *    • getNextPaymentInfo(loan, stats, settings) → calcula próxima cuota y
 *      su nivel (overdue / today / soon / upcoming).
 *    • <Badge>, <NextPaymentChip>  → píldoras visuales de estado.
 *    • <NotifyButton> + plantillas de WhatsApp/email con variables ({NOMBRE},
 *      {MONTO}, {DIAS_ATRASO}, ...).
 *    • <AddPaymentForm> → formulario para registrar un nuevo pago.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { useStore } from "../store/useStore.jsx";
import { useCurrency } from "../store/useCurrency.js";
import { useSettings } from "../store/useSettings.jsx";
import { Btn, Field } from "./Modal";
import CurrencyInput from "./CurrencyInput.jsx";
import {
  Paperclip, X, Wallet, ArrowLeftRight, ChevronDown,
  MessageCircle, Bell, Mail, AlertTriangle, Clock, Calendar, CheckCircle2,
} from "lucide-react";

// ── shared utils ────────────────────────────────────────────────────────────
export const MAX_PAY_ATTACH_BYTES = 5 * 1024 * 1024;

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function addMonths(isoDate, months) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(y, (m - 1) + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  return target;
}

export function startOfToday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

// Semantic color for a progress bar fill based on % paid
export function progressFillClass(pct) {
  if (pct >= 100) return "bg-gradient-to-r from-emerald-500 to-teal-400";
  if (pct >= 66)  return "bg-gradient-to-r from-emerald-500 to-emerald-400";
  if (pct >= 33)  return "bg-gradient-to-r from-amber-500 to-yellow-400";
  return "bg-gradient-to-r from-rose-500 to-orange-400";
}

export function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (!date || isNaN(date.getTime())) return String(d ?? "");
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Devuelve información sobre la próxima cuota a pagar de un préstamo activo.
 * Retorna `null` si:
 *   • el préstamo no está activo,
 *   • ya pagó todas las cuotas,
 *   • la fecha de inicio es inválida.
 *
 * El nivel describe la urgencia visual:
 *   overdue  → ya vencida (diffDays < 0)
 *   today    → vence hoy
 *   soon     → vence en los próximos 7 días
 *   upcoming → vence en más de 7 días
 */
export function getNextPaymentInfo(loan, stats, settings = {}) {
  if (loan.status !== "active") return null;
  if (stats.paidInstallments >= loan.installments) return null;
  if (!loan.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(loan.startDate)) return null;
  const nextNumber = stats.paidInstallments + 1;
  const dueDate = addMonths(loan.startDate, nextNumber);
  if (isNaN(dueDate.getTime())) return null;
  const today = startOfToday();
  const diffDays = Math.round((dueDate - today) / 86400000);
  if (!Number.isFinite(diffDays)) return null;
  let level;
  if (diffDays < 0) level = "overdue";
  else if (diffDays === 0) level = "today";
  else if (diffDays <= 7) level = "soon";
  else level = "upcoming";

  const graceDays    = Number(settings.graceDays) || 0;
  const daysLate     = diffDays < 0 ? -diffDays : 0;

  return { dueDate, diffDays, level, nextNumber, daysLate, graceDays };
}

// ── badges ──────────────────────────────────────────────────────────────────
export function Badge({ status }) {
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

export function NextPaymentChip({ info }) {
  if (!info) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-700/30">
        <CheckCircle2 size={11} /> Al día
      </span>
    );
  }
  const map = {
    overdue:  { cls: "bg-rose-900/40 text-rose-300 border-rose-700/40",   icon: AlertTriangle, text: `Vencido hace ${-info.diffDays}d` },
    today:    { cls: "bg-amber-900/40 text-amber-300 border-amber-700/40", icon: AlertTriangle, text: "Vence hoy" },
    soon:     { cls: "bg-amber-900/30 text-amber-200 border-amber-700/30", icon: Clock,         text: `En ${info.diffDays}d` },
    upcoming: { cls: "bg-slate-800 text-slate-300 border-slate-700",       icon: Calendar,      text: `En ${info.diffDays}d` },
  };
  const { cls, icon: Icon, text } = map[info.level];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      <Icon size={11} /> {text}
    </span>
  );
}

// ── notify button (WhatsApp / email reminder) ───────────────────────────────
export const REMINDER_VARIABLES = [
  { key: "{NOMBRE}",      desc: "Primer nombre del cliente" },
  { key: "{CLIENTE}",     desc: "Nombre completo del cliente" },
  { key: "{MONTO}",       desc: "Monto de la cuota" },
  { key: "{FECHA}",       desc: "Fecha de vencimiento" },
  { key: "{CUOTA}",       desc: "Número de cuota" },
  { key: "{DIAS_ATRASO}", desc: "Días de atraso (0 si vence hoy)" },
  { key: "{DIAS_GRACIA}", desc: "Días de gracia configurados" },
  { key: "{ESTADO}",      desc: "Texto: 'venció hace Xd' / 'vence hoy' / 'vence mañana'" },
  { key: "{EMPRESA}",     desc: "Nombre de tu empresa" },
];

function buildVars({ client, due, installmentAmount, fmt, companyName }) {
  const fullName = client?.name || "";
  const firstName = fullName.split(" ")[0] || "";
  const fecha = due.dueDate.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const diasAtraso = due.diffDays < 0 ? -due.diffDays : 0;
  let estado;
  if (due.level === "overdue") estado = `venció hace ${diasAtraso} día${diasAtraso !== 1 ? "s" : ""}`;
  else if (due.level === "today") estado = "vence hoy";
  else if (due.diffDays === 1) estado = "vence mañana";
  else estado = `vence en ${due.diffDays} días`;
  return {
    "{NOMBRE}": firstName,
    "{CLIENTE}": fullName,
    "{MONTO}": fmt(installmentAmount),
    "{FECHA}": fecha,
    "{CUOTA}": String(due.nextNumber),
    "{DIAS_ATRASO}": String(diasAtraso),
    "{DIAS_GRACIA}": String(due.graceDays ?? 0),
    "{ESTADO}": estado,
    "{EMPRESA}": companyName || "",
  };
}

export function applyTemplate(template, vars) {
  if (!template) return "";
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.split(k).join(v),
    template
  );
}

function buildWhatsAppLink(client, message) {
  if (!client?.phone) return null;
  const digits = String(client.phone).replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function buildMailtoLink(client, subject, body) {
  if (!client?.email) return null;
  return `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function NotifyButton({ client, due, installmentAmount, fmt }) {
  const [open, setOpen] = useState(false);
  const { settings } = useSettings();

  const vars = buildVars({ client, due, installmentAmount, fmt, companyName: settings.companyName });
  const waMessage    = applyTemplate(settings.reminderWhatsapp, vars);
  const mailSubject  = applyTemplate(settings.reminderEmailSubject, vars);
  const mailBody     = applyTemplate(settings.reminderEmailBody, vars);

  const wa   = buildWhatsAppLink(client, waMessage);
  const mail = buildMailtoLink(client, mailSubject, mailBody);

  if (!wa && !mail) {
    return <span className="text-xs text-slate-400 italic">Sin contacto</span>;
  }

  const baseBtn = "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors";

  if (!wa || !mail) {
    const href = wa || mail;
    const Icon = wa ? MessageCircle : Mail;
    const label = wa ? "Avisar" : "Avisar";
    const color = wa ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500";
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`${baseBtn} ${color} text-white`}>
        <Icon size={13} /> {label}
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`${baseBtn} bg-emerald-600 hover:bg-emerald-500 text-white`}
      >
        <Bell size={13} /> Avisar
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-52 bg-[#0d1224] border border-slate-700 rounded-xl shadow-lg overflow-hidden z-20">
          <a href={wa} target="_blank" rel="noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-200 hover:bg-emerald-600/15"
            onMouseDown={(e) => e.preventDefault()}>
            <MessageCircle size={15} className="text-emerald-400" /> WhatsApp
          </a>
          <a href={mail}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-200 hover:bg-blue-600/15 border-t border-slate-800"
            onMouseDown={(e) => e.preventDefault()}>
            <Mail size={15} className="text-blue-400" /> Email
          </a>
        </div>
      )}
    </div>
  );
}

// Should the "Avisar" shortcut appear in the loans list?
export function shouldShowNotify(due) {
  if (!due) return false;
  return due.level === "overdue" || due.level === "today" || due.diffDays === 1;
}

// ── add payment form ────────────────────────────────────────────────────────
const payInputCls =
  "w-full bg-[#0d1224] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors";

export function AddPaymentForm({ loan, stats, due, onDone, onCancel }) {
  const store = useStore();
  const fmt = useCurrency();
  const [form, setForm] = useState({
    amountNumeric: stats.installmentAmount,
    amountDisplay: String(stats.installmentAmount),
    date: new Date().toISOString().slice(0, 10),
    installmentNumber: String(Math.min(loan.installments, stats.paidInstallments + 1)),
    note: "",
    paymentMethod: "cash",
    attachment: null,
    attachmentName: null,
    attachmentType: null,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PAY_ATTACH_BYTES) {
      setErrors((er) => ({ ...er, attachment: "Archivo demasiado grande (máx. 5 MB)" }));
      e.target.value = "";
      return;
    }
    try {
      const dataUrl = await readFileAsDataURL(file);
      setForm((f) => ({
        ...f,
        attachment: dataUrl,
        attachmentName: file.name,
        attachmentType: file.type || "application/octet-stream",
      }));
      setErrors((er) => ({ ...er, attachment: undefined }));
    } catch {
      setErrors((er) => ({ ...er, attachment: "No se pudo leer el archivo" }));
    }
  };

  const clearFile = () =>
    setForm((f) => ({ ...f, attachment: null, attachmentName: null, attachmentType: null }));

  const submit = async () => {
    const errs = {};
    if (!form.amountNumeric || form.amountNumeric <= 0) errs.amount = "Monto inválido";
    if (form.amountNumeric > stats.remaining + 0.01)
      errs.amount = `El monto excede el saldo pendiente (${fmt(stats.remaining)})`;
    if (!form.installmentNumber) errs.installmentNumber = "N° de cuota requerido";
    if (Object.keys(errs).length) return setErrors(errs);

    setSaving(true);
    try {
      const instNumber = Number(form.installmentNumber);
      await store.addPayment({
        loanId: loan.id,
        amount: form.amountNumeric,
        date: form.date,
        installmentNumber: instNumber,
        note: form.note,
        paymentMethod: form.paymentMethod,
        attachment: form.attachment,
        attachmentName: form.attachmentName,
        attachmentType: form.attachmentType,
      });
      onDone?.();
    } catch (e) {
      console.error("Error al registrar pago:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-emerald-950/20 border border-emerald-700/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-emerald-300">Registrar nuevo pago</p>
        <button onClick={onCancel} className="text-slate-500 hover:text-rose-400 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto *" error={errors.amount}>
          <CurrencyInput
            value={form.amountDisplay}
            onChange={(numeric, display) =>
              setForm((f) => ({ ...f, amountNumeric: numeric, amountDisplay: display }))
            }
            className="w-full bg-[#0d1224] border border-slate-800 rounded-xl py-2 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </Field>
        <Field label="N° cuota *" error={errors.installmentNumber}>
          <input type="number" min="1" value={form.installmentNumber}
            onChange={setField("installmentNumber")} className={payInputCls} />
        </Field>
      </div>

      <Field label="Fecha">
        <input type="date" value={form.date} onChange={setField("date")} className={payInputCls} />
      </Field>

      <div>
        <p className="text-xs text-slate-400 mb-1.5">Método de pago</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "cash",     label: "Efectivo",      Icon: Wallet },
            { value: "transfer", label: "Transferencia", Icon: ArrowLeftRight },
          ].map(({ value, label, Icon }) => (
            <button key={value} type="button"
              onClick={() => setForm((f) => ({ ...f, paymentMethod: value }))}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 justify-center ${
                form.paymentMethod === value
                  ? "bg-emerald-600/20 border-emerald-500/60 text-emerald-200"
                  : "bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Comprobante (opcional)" error={errors.attachment}>
        {!form.attachment ? (
          <label className="flex items-center gap-2 cursor-pointer bg-[#0d1224] border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
            <Paperclip size={14} />
            <span>Adjuntar imagen, PDF u otro (máx. 5 MB)</span>
            <input type="file" onChange={onPickFile}
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" />
          </label>
        ) : (
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2">
            <Paperclip size={14} className="text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-slate-200 truncate flex-1">{form.attachmentName}</span>
            <button type="button" onClick={clearFile} className="text-slate-500 hover:text-rose-400">
              <X size={14} />
            </button>
          </div>
        )}
      </Field>

      <Field label="Nota (opcional)">
        <input value={form.note} onChange={setField("note")}
          placeholder="Ej: pago recibido en sucursal" className={payInputCls} />
      </Field>





      <div className="flex justify-end gap-2 pt-1">
        <Btn variant="secondary" onClick={onCancel}>Cancelar</Btn>
        <Btn onClick={submit} disabled={saving}>{saving ? "Guardando…" : "Registrar pago"}</Btn>
      </div>
    </div>
  );
}
