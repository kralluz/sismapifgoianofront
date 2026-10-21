import React from "react";
import { X, Plus, Pencil, Trash2, MapPin, Navigation, Footprints, Maximize2 } from "lucide-react";
import type { Project } from "../types";
import { type Local, TIPO_LABEL } from "../locais";
import type { Rota } from "../rota";
import { NumeroBadge } from "./Sidebar";

interface LocalPanelProps {
  local: Local;
  projects: Project[];
  selectedProjectId: number | null;
  isAdmin: boolean;
  rota: Rota | null;
  rotaVisivel: boolean;
  calculandoRota: boolean;
  onToggleRota: () => void;
  onVerRota: () => void;
  onClose: () => void;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

// Painel do local selecionado: rota a partir da entrada e trabalhos expostos.
// No celular vira uma gaveta na parte de baixo da tela.
const LocalPanel: React.FC<LocalPanelProps> = ({
  local,
  projects,
  selectedProjectId,
  isAdmin,
  rota,
  rotaVisivel,
  calculandoRota,
  onToggleRota,
  onVerRota,
  onClose,
  onAddProject,
  onEditProject,
  onDeleteProject,
}) => (
  <aside
    className="absolute z-40 bg-white shadow-2xl border border-gray-200 flex flex-col
      inset-x-0 bottom-0 max-h-[55%] rounded-t-2xl
      md:inset-x-auto md:top-4 md:right-4 md:bottom-4 md:max-h-none md:w-[380px] md:rounded-xl"
  >
    <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-3 border-b">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-green-700">
          {local.bloco ? `Bloco ${local.bloco} · ` : ""}
          {TIPO_LABEL[local.tipo]}
        </p>
        <h2 className="text-lg font-semibold text-gray-900 truncate">{local.nome}</h2>
        <p className="text-xs text-gray-500">
          {projects.length} trabalho{projects.length === 1 ? "" : "s"} neste local
        </p>
      </div>
      <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 flex-shrink-0" aria-label="Fechar">
        <X className="w-5 h-5 text-gray-500" />
      </button>
    </div>

    {/* Rota a partir da entrada */}
    <div className="px-4 py-3 border-b bg-blue-50/60">
      {calculandoRota ? (
        <p className="text-sm text-blue-800">Calculando rota a partir da entrada…</p>
      ) : rota ? (
        <div className="flex items-center gap-3">
          <Footprints className="w-5 h-5 text-blue-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900">
              ~{rota.metros} m · {rota.minutos} min a pé
            </p>
            <p className="text-xs text-blue-800/80">da entrada (Chegada, ao lado do Baú da Ciência)</p>
          </div>
          <button
            onClick={onToggleRota}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
              rotaVisivel ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-blue-700 border border-blue-300 hover:bg-blue-50"
            }`}
          >
            <Navigation className="w-3.5 h-3.5" /> {rotaVisivel ? "Ocultar" : "Como chegar"}
          </button>
          {rotaVisivel && (
            <button onClick={onVerRota} className="p-1.5 rounded-lg hover:bg-blue-100" title="Ver a rota inteira">
              <Maximize2 className="w-4 h-4 text-blue-700" />
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Rota indisponível para este local.</p>
      )}
    </div>

    <div className="flex-1 overflow-y-auto">
      {projects.length === 0 ? (
        <p className="p-4 text-sm text-gray-500">Nenhum trabalho cadastrado neste local.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {projects.map((p) => (
            <li
              key={p.id}
              className={`px-4 py-3 ${selectedProjectId === p.id ? "bg-green-50" : ""}`}
            >
              <div className="flex items-start gap-3">
                <NumeroBadge n={p.number} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{p.title}</p>
                  {p.complemento && (
                    <p className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {p.complemento}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => onEditProject(p)}
                      className="p-1.5 rounded hover:bg-gray-100"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onDeleteProject(p)}
                      className="p-1.5 rounded hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>

    {isAdmin && (
      <div className="p-3 border-t">
        <button
          onClick={onAddProject}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
        >
          <Plus className="w-4 h-4" /> Adicionar trabalho aqui
        </button>
      </div>
    )}
  </aside>
);

export default LocalPanel;
