import React, { useMemo, useState } from "react";
import { Search, ChevronDown, ChevronRight, Plus, MapPin, X } from "lucide-react";
import type { Project } from "../types";
import { type Local, descreverLocal } from "../locais";

interface SidebarProps {
  locais: Local[];
  projetosPorLocal: Map<string, Project[]>;
  projects: Project[];
  loading: boolean;
  isAdmin: boolean;
  selectedLocalId: string | null;
  selectedProjectId: number | null;
  onSelectLocal: (local: Local) => void;
  onSelectProject: (project: Project) => void;
  onCreate: () => void;
  onClose?: () => void;
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Ordem natural: "Sala 2" antes de "Sala 10"
const natural = (a: string, b: string) => a.localeCompare(b, "pt-BR", { numeric: true });

const BLOCOS: Array<{ id: string; titulo: string }> = [
  { id: "A", titulo: "Bloco A" },
  { id: "B", titulo: "Bloco B" },
  { id: "C", titulo: "Bloco C · Laboratórios" },
  { id: "D", titulo: "Bloco D · Salas e tendas" },
  { id: "E", titulo: "Bloco E" },
  { id: "-", titulo: "Áreas externas e corredor principal" },
];

export const NumeroBadge: React.FC<{ n: number | null; className?: string }> = ({ n, className = "" }) => (
  <span
    className={`inline-flex items-center justify-center min-w-[2.6rem] h-6 px-1.5 rounded-md text-xs font-bold tabular-nums ${
      n == null ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
    } ${className}`}
  >
    {n == null ? "extra" : `#${n}`}
  </span>
);

const ProjetoItem: React.FC<{
  p: Project;
  ativo: boolean;
  mostrarLocal: boolean;
  onClick: () => void;
}> = ({ p, ativo, mostrarLocal, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 flex items-start gap-2.5 rounded-lg transition-colors ${
      ativo ? "bg-green-50 ring-1 ring-green-500" : "hover:bg-gray-50"
    }`}
  >
    <NumeroBadge n={p.number} />
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] text-gray-900 leading-snug line-clamp-2">{p.title}</span>
      {(mostrarLocal || p.complemento) && (
        <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">
            {mostrarLocal && p.local ? descreverLocal(p.local) : ""}
            {mostrarLocal && p.local && p.complemento ? " · " : ""}
            {p.complemento ?? ""}
          </span>
        </span>
      )}
    </span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({
  locais,
  projetosPorLocal,
  projects,
  loading,
  isAdmin,
  selectedLocalId,
  selectedProjectId,
  onSelectLocal,
  onSelectProject,
  onCreate,
  onClose,
}) => {
  const [aba, setAba] = useState<"locais" | "todos">("locais");
  const [query, setQuery] = useState("");
  const [abertos, setAbertos] = useState<Set<string>>(() => new Set(["D"]));

  const toggle = (id: string) =>
    setAbertos((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Locais selecionáveis agrupados por bloco, em ordem natural
  const grupos = useMemo(() => {
    const sel = locais.filter((l) => l.selecionavel);
    return BLOCOS.map((b) => ({
      ...b,
      locais: sel
        .filter((l) => (l.bloco ?? "-") === b.id)
        .sort((x, y) => {
          // locais com trabalhos primeiro, depois ordem natural
          const dx = projetosPorLocal.has(x.id) ? 0 : 1;
          const dy = projetosPorLocal.has(y.id) ? 0 : 1;
          return dx - dy || natural(x.nome, y.nome);
        }),
    })).filter((g) => g.locais.length);
  }, [locais, projetosPorLocal]);

  const termos = norm(query.trim().replace(/^#/, "")).split(/\s+/).filter(Boolean);
  const buscando = termos.length > 0;
  const casa = (texto: string) => {
    const alvo = norm(texto);
    return termos.every((t) => alvo.includes(t));
  };

  const resultadosProjetos = useMemo(
    () =>
      buscando
        ? projects.filter((p) =>
            casa(`${p.number ?? ""} ${p.title} ${p.local ? descreverLocal(p.local) : ""} ${p.complemento ?? ""}`)
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, query]
  );
  const resultadosLocais = useMemo(
    () => (buscando ? locais.filter((l) => l.selecionavel && casa(`${descreverLocal(l)} ${l.tipo}`)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locais, query]
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Busca */}
      <div className="p-3 border-b space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar trabalho, número ou sala…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 md:hidden" aria-label="Fechar lista">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
        {!buscando && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg text-sm font-medium">
            {([
              ["locais", "Por local"],
              ["todos", `Todos (${projects.length})`],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`py-1.5 rounded-md transition-colors ${
                  aba === id ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
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
        ) : buscando ? (
          <div className="p-2 space-y-3">
            {resultadosLocais.length > 0 && (
              <section>
                <h3 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Locais</h3>
                {resultadosLocais.slice(0, 8).map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onSelectLocal(l)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="flex-1 truncate">{descreverLocal(l)}</span>
                    <span className="text-xs text-gray-400">{projetosPorLocal.get(l.id)?.length ?? 0}</span>
                  </button>
                ))}
              </section>
            )}
            <section>
              <h3 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Trabalhos ({resultadosProjetos.length})
              </h3>
              {resultadosProjetos.length === 0 ? (
                <p className="px-2 py-1 text-sm text-gray-500">Nenhum trabalho encontrado.</p>
              ) : (
                resultadosProjetos.map((p) => (
                  <ProjetoItem
                    key={p.id}
                    p={p}
                    ativo={p.id === selectedProjectId}
                    mostrarLocal
                    onClick={() => onSelectProject(p)}
                  />
                ))
              )}
            </section>
          </div>
        ) : aba === "todos" ? (
          <div className="p-2">
            {projects.length === 0 && <p className="p-2 text-sm text-gray-500">Nenhum trabalho cadastrado ainda.</p>}
            {projects.map((p) => (
              <ProjetoItem
                key={p.id}
                p={p}
                ativo={p.id === selectedProjectId}
                mostrarLocal
                onClick={() => onSelectProject(p)}
              />
            ))}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {grupos.map((g) => {
              const total = g.locais.reduce((s, l) => s + (projetosPorLocal.get(l.id)?.length ?? 0), 0);
              const aberto = abertos.has(g.id);
              return (
                <section key={g.id} className="rounded-lg border border-gray-200">
                  <button
                    onClick={() => toggle(g.id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg"
                    aria-expanded={aberto}
                  >
                    {aberto ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="flex-1 font-semibold text-sm text-gray-900">{g.titulo}</span>
                    <span className="text-xs text-gray-500">
                      {total} trabalho{total === 1 ? "" : "s"}
                    </span>
                  </button>
                  {aberto && (
                    <ul className="pb-1">
                      {g.locais.map((l) => {
                        const lista = projetosPorLocal.get(l.id) ?? [];
                        const ativo = l.id === selectedLocalId;
                        return (
                          <li key={l.id}>
                            <button
                              onClick={() => onSelectLocal(l)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm ${
                                ativo ? "text-green-800 font-semibold" : "text-gray-700 hover:bg-gray-50"
                              } ${lista.length ? "" : "opacity-60"}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${lista.length ? "bg-green-500" : "bg-gray-300"}`}
                              />
                              <span className="flex-1 truncate">{l.nome}</span>
                              {lista.length > 0 && (
                                <span className="text-xs font-medium text-green-700 bg-green-50 rounded px-1.5">
                                  {lista.length}
                                </span>
                              )}
                            </button>
                            {ativo && lista.length > 0 && (
                              <div className="pl-5 pr-1 pb-1">
                                {lista.map((p) => (
                                  <ProjetoItem
                                    key={p.id}
                                    p={p}
                                    ativo={p.id === selectedProjectId}
                                    mostrarLocal={false}
                                    onClick={() => onSelectProject(p)}
                                  />
                                ))}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
