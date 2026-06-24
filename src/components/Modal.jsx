/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/Modal.jsx — Modal genérico + primitivos de formulario
 * ─────────────────────────────────────────────────────────────────────────────
 *  Exporta:
 *    • <Modal>     → contenedor con backdrop, título y cierre.
 *    • <Field>     → label + slot para input + mensaje de error.
 *    • <Input>     → input estilizado con la paleta oscura.
 *    • <Select>    → idem select.
 *    • <Textarea>  → idem textarea.
 *    • <Btn>       → botón con variantes: primary, secondary, danger, ghost.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { X } from "lucide-react";

/** Modal centrado con backdrop clickeable que invoca onClose. */
export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1224] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="font-semibold text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, error }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors resize-none ${className}`}
      {...props}
    />
  );
}

export function Btn({ variant = "primary", className = "", children, ...props }) {
  const base = "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-2 justify-center";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700",
    danger: "bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-700/40",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-800",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
