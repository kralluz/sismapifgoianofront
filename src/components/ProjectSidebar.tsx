import React, { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, MapPin } from "lucide-react";
import type { Project } from "../types";
import { descreverLocal } from "../locais";

interface ProjectSidebarProps {
  projects: Project[];
  loading: boolean;
  isAdmin: boolean;
  minimized: boolean;
  setMinimized: (v: boolean) => void;
  selectedProjectId: number | null;
  onSelect: (project: Project) => void;
  onCreate: () => void;
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Lista pesquisável de todos os trabalhos da feira
const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  loading,
  isAdmin,
  minimized,
  setMinimized,
  selectedProjectId,
  onSelect,
  onCreate,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = norm(query.trim().replace(/^#/, ""));
    if (!q) return projects;
    return projects.filter((p) => {
      const alvo = norm(`${p.number} ${p.title} ${p.local ? descreverLocal(p.local) : ""} ${p.complemento ?? ""}`);
      return q.split(/\s+/).every((t) => alvo.includes(t));
    });
  }, [projects, query]);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-white border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Search className="w-4 h-4" /> Trabalhos ({projects.length})
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside className="absolute top-4 left-4 bottom-4 z-30 w-[min(340px,calc(100%-2rem))] bg-white/95 backdrop-blur rounded-xl shadow-xl border border-gray-200 flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Trabalhos <span className="text-gray-400 font-normal">({projects.length})</span>
          </h2>
          <button onClick={() => setMinimized(true)} className="p-1 rounded hover:bg-gray-100" title="Recolher">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Número, título ou local…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        {isAdmin && (
          <button
            onClick={onCreate}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" /> Novo trabalho
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Carregando…</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            {projects.length === 0 ? "Nenhum trabalho cadastrado ainda." : "Nenhum trabalho encontrado."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onSelect(p)}
                  className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-gray-50 ${
                    selectedProjectId === p.id ? "bg-green-50" : ""
                  }`}
                >
                  <span className="inline-flex items-center justify-center min-w-[2.5rem] px-1.5 py-0.5 rounded-md text-xs font-bold bg-green-100 text-green-800">
                    #{p.number}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-gray-900 leading-snug line-clamp-2">{p.title}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {p.local ? descreverLocal(p.local) : p.localId}
                        {p.complemento ? ` · ${p.complemento}` : ""}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default ProjectSidebar;
