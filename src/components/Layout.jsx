/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/Layout.jsx — Esqueleto de la app (sidebar + topbar + contenido)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Envuelve todas las páginas con:
 *    • Sidebar de navegación (Dashboard, Clientes, Préstamos, Usuarios).
 *    • Topbar con nombre de la empresa, configuración y logout.
 *    • Área principal donde se renderiza la página activa (children).
 *  La entrada "Usuarios" solo aparece para administradores.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import {
  LayoutDashboard, Users, HandCoins, Menu, X, LogOut, Settings, UserCog, TrendingUp,
} from "lucide-react";
import { useAuth } from "../store/useAuth.jsx";
import { useSettings } from "../store/useSettings.jsx";
import SettingsModal from "./SettingsModal.jsx";

const baseNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients",   label: "Clientes",  icon: Users },
  { id: "loans",     label: "Préstamos", icon: HandCoins },
];

const adminNavItems = [
  { id: "users", label: "Usuarios", icon: UserCog, adminOnly: true },
];

function SidebarContent({ page, setPage, onClose }) {
  const [showSettings, setShowSettings] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSettings();

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;
  const mainItems = navItems.filter((i) => !i.adminOnly);
  const adminItems = navItems.filter((i) => i.adminOnly);

  function NavButton({ id, label, icon: Icon }) {
    const active = page === id;
    return (
      <button
        onClick={() => { setPage(id); onClose?.(); }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-indigo-900/30 text-indigo-400"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        }`}
      >
        <Icon size={16} className="flex-shrink-0" />
        <span className="flex-1 text-left">{label}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700/60 w-64">

      {/* Logo header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={15} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm tracking-tight">
            {settings.companyName || "Prestamito"}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Gestión de Préstamos</p>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Principal
        </p>
        {mainItems.map((item) => (
          <NavButton key={item.id} {...item} />
        ))}

        {adminItems.length > 0 && (
          <div className="pt-4">
            <p className="px-3 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              Administración
            </p>
            {adminItems.map((item) => (
              <NavButton key={item.id} {...item} />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom: user card + logout */}
      <div className="px-3 py-4 border-t border-slate-700/60 space-y-1">
        <div className="flex items-center rounded-lg bg-slate-800/60 mb-2 overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-indigo-400 uppercase">
                {user?.username?.[0] ?? "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.username ?? "Admin"}</p>
              <p className="text-[11px] text-slate-400 capitalize">
                {user?.role === "admin" ? "Administrador" : "Operador"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            title="Configuración"
            className="p-2 mr-1 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-colors flex-shrink-0 flex items-center"
          >
            <Settings size={15} />
          </button>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
        >
          <LogOut size={16} className="flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function Layout({ page, setPage, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0a0e1a]">
      {/* Sidebar desktop */}
      <aside className="hidden md:block w-64 fixed h-full z-20">
        <SidebarContent page={page} setPage={setPage} />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#0b0f1e] border-b border-slate-800/60 flex items-center justify-between px-4 py-3">
        <span className="font-semibold text-white text-sm">Prestamito</span>
        <button onClick={() => setOpen(!open)} className="text-slate-400 p-1">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-20 flex">
          <div className="w-64 h-full flex flex-col pt-12">
            <SidebarContent page={page} setPage={setPage} onClose={() => setOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-w-0 overflow-x-hidden">
        <div className="p-3 sm:p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
