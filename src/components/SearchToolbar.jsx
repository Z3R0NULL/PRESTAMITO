/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/SearchToolbar.jsx — Barra de búsqueda + ordenamiento reutilizable
 * ─────────────────────────────────────────────────────────────────────────────
 *  Se usa en Clients y Loans. Recibe el valor controlado, opciones de orden y
 *  callbacks de cambio. El menú de orden se cierra al hacer click afuera.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useRef, useState } from "react";
import { Search, X, LayoutGrid, LayoutList, ArrowUpDown, ChevronDown, Check } from "lucide-react";

/**
 * Reusable search + view (grid/list) + sort toolbar.
 * If showView is false, hides the grid/list toggle (use for pages with a single layout).
 */
export default function SearchToolbar({
  search,
  setSearch,
  placeholder = "Buscar...",
  view,
  setView,
  showView = true,
  sort,
  setSort,
  sortOptions,
  accent = "indigo", // "indigo" | "blue"
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const ddRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const focusBorder = accent === "blue" ? "focus:border-blue-500" : "focus:border-indigo-500";
  const activeOpt   = accent === "blue" ? "bg-blue-900/30 text-blue-400" : "bg-indigo-900/30 text-indigo-400";

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-[#0d1224] border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none ${focusBorder} transition-colors`}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* View + Sort */}
      <div className="flex items-center gap-2 justify-end">
        <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
          {showView && (
            <>
              <button
                onClick={() => setView("grid")}
                title="Vista cuadrícula"
                className={`p-2 rounded-lg transition-colors ${
                  view === "grid" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setView("list")}
                title="Vista lista"
                className={`p-2 rounded-lg transition-colors ${
                  view === "list" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutList size={14} />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-0.5" />
            </>
          )}
          <div className="relative" ref={ddRef}>
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 pl-2 pr-2 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <ArrowUpDown size={13} className="text-slate-400" />
              <span className="hidden sm:inline text-xs">
                {sortOptions.find((o) => o.value === sort)?.label}
              </span>
              <ChevronDown size={11} className={`text-slate-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setSortOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm border-b border-slate-800 last:border-0 transition-colors ${
                      sort === opt.value ? `${activeOpt} font-medium` : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {sort === opt.value && <Check size={12} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
