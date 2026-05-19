import { useState } from "react";
import {
  LayoutDashboard, Users, HandCoins, CreditCard, Menu, X, TrendingUp,
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "loans", label: "Préstamos", icon: HandCoins },
  { id: "payments", label: "Pagos", icon: CreditCard },
];

export default function Layout({ page, setPage, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0a0e1a]">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0d1224] border-r border-slate-800 fixed h-full z-20">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">PrestaPro</p>
            <p className="text-xs text-slate-500">Gestión de Préstamos</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                page === id
                  ? "bg-gradient-to-r from-blue-600/30 to-violet-600/20 text-blue-300 border border-blue-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-600 text-center">v1.0 © 2026</p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#0d1224] border-b border-slate-800 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <TrendingUp size={15} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">PrestaPro</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-slate-400 p-1">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-20 pt-14">
          <div className="bg-[#0d1224] h-full border-r border-slate-800 w-64 px-3 py-4 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setPage(id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  page === id
                    ? "bg-gradient-to-r from-blue-600/30 to-violet-600/20 text-blue-300 border border-blue-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 bg-black/60 absolute inset-0 z-[-1]" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
