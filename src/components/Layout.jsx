import { useState } from "react";
import {
  LayoutDashboard, Users, HandCoins, CreditCard, Menu, X, LogOut, Settings, UserCog,
} from "lucide-react";
import { useAuth } from "../store/useAuth.jsx";
import { useSettings } from "../store/useSettings.jsx";
import SettingsModal from "./SettingsModal.jsx";

const baseNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "loans", label: "Préstamos", icon: HandCoins },
  { id: "payments", label: "Pagos", icon: CreditCard },
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
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-100 ${
          active ? "text-white font-medium" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0b0f1e] px-4 py-5">
      {/* Nav principal */}
      <div className="flex-1 space-y-0.5">
        <p className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase px-3 mb-2">
          {settings.companyName || "Menú"}
        </p>
        {mainItems.map((item) => (
          <NavButton key={item.id} {...item} />
        ))}

        {adminItems.length > 0 && (
          <>
            <div className="pt-4 pb-1">
              <p className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase px-3">
                Administración
              </p>
            </div>
            {adminItems.map((item) => (
              <NavButton key={item.id} {...item} />
            ))}
          </>
        )}
      </div>

      {/* Usuario + logout */}
      <div className="border-t border-slate-800 pt-4 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.username?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate leading-tight">{user?.username}</p>
            <p className="text-xs text-slate-500 leading-tight">{user?.role === "admin" ? "Administrador" : "Operador"}</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            title="Configuración"
            className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <Settings size={15} />
          </button>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:text-rose-300 transition-colors"
        >
          <LogOut size={15} />
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
      <aside className="hidden md:block w-56 fixed h-full z-20 border-r border-slate-800/60">
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
      <main className="flex-1 md:ml-56 pt-14 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
