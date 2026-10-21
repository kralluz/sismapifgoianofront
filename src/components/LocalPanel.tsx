import React from "react";
import { X, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import type { Project } from "../types";
import { type Local, TIPO_LABEL } from "../locais";

interface LocalPanelProps {
  local: Local;
  projects: Project[];
  selectedProjectId: number | null;
  isAdmin: boolean;
  onClose: () => void;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

// Painel lateral com o local selecionado e os trabalhos expostos nele
const LocalPanel: React.FC<LocalPanelProps> = ({
  local,
  projects,
  selectedProjectId,
  isAdmin,
  onClose,
  onAddProject,
  onEditProject,
  onDeleteProject,
}) => (
  <aside className="absolute top-4 right-4 bottom-4 z-40 w-[min(360px,calc(100%-2rem))] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col">
    <div className="flex items-start justify-between gap-3 px-4 py-3 border-b">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-green-700">
          {local.bloco ? `Bloco ${local.bloco} · ` : ""}
          {TIPO_LABEL[local.tipo]}
        </p>
        <h2 className="text-lg font-semibold text-gray-900 truncate">{local.nome}</h2>
      </div>
      <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 flex-shrink-0" aria-label="Fechar">
        <X className="w-5 h-5 text-gray-500" />
      </button>
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
                <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800">
                  #{p.number}
                </span>
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
