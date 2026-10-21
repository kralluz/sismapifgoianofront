import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Project, CreateProjectRequest } from "../types";
import { type Local, descreverLocal } from "../locais";

interface ProjectFormProps {
  locais: Local[];
  /** projeto em edição; ausente ao criar */
  project?: Project | null;
  /** local pré-selecionado ao criar a partir de uma sala */
  defaultLocalId?: string | null;
  onSubmit: (data: CreateProjectRequest) => Promise<void>;
  onClose: () => void;
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const ProjectForm: React.FC<ProjectFormProps> = ({
  locais,
  project,
  defaultLocalId,
  onSubmit,
  onClose,
}) => {
  const [number, setNumber] = useState(project?.number != null ? String(project.number) : "");
  const [title, setTitle] = useState(project?.title ?? "");
  const [localId, setLocalId] = useState(project?.localId ?? defaultLocalId ?? "");
  const [complemento, setComplemento] = useState(project?.complemento ?? "");
  const [filtro, setFiltro] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agrupa por bloco, já filtrado pela busca ("sala 08", "tenda", "lab info"…)
  const grupos = useMemo(() => {
    const termos = norm(filtro).split(/\s+/).filter(Boolean);
    const lista = locais.filter((l) => {
      const alvo = norm(`${descreverLocal(l)} ${l.tipo}`);
      return termos.every((t) => alvo.includes(t)) || l.id === localId;
    });
    const map = new Map<string, Local[]>();
    for (const l of lista) {
      const k = l.bloco ? `Bloco ${l.bloco}` : "Outros locais";
      map.set(k, [...(map.get(k) ?? []), l]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [locais, filtro, localId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Número em branco = item extra (estande, atividade)
    const n = number.trim() ? Number(number) : null;
    if (n !== null && (!Number.isInteger(n) || n < 1)) return setError("Número inválido.");
    if (title.trim().length < 2) return setError("Informe o título.");
    if (!localId) return setError("Escolha o local.");
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        number: n,
        title: title.trim(),
        localId,
        complemento: complemento.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar projeto.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {project ? `Editar trabalho${project.number != null ? ` #${project.number}` : ""}` : "Novo trabalho"}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="Fechar">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Número</span>
              <input
                type="number"
                min={1}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus={!project}
                placeholder="—"
                title="Deixe em branco para estandes e atividades sem número"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Título</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </label>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">Local</span>
            <input
              type="search"
              placeholder="Filtrar: sala 08, tenda 3, lab informática…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="mt-2 h-56 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {grupos.length === 0 && (
                <p className="p-3 text-sm text-gray-500">Nenhum local encontrado.</p>
              )}
              {grupos.map(([grupo, itens]) => (
                <div key={grupo}>
                  <p className="sticky top-0 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {grupo}
                  </p>
                  {itens.map((l) => (
                    <label
                      key={l.id}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer ${
                        localId === l.id ? "bg-green-50 text-green-800 font-medium" : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="local"
                        value={l.id}
                        checked={localId === l.id}
                        onChange={() => setLocalId(l.id)}
                        className="accent-green-600"
                      />
                      {l.nome}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Complemento (opcional)</span>
            <input
              type="text"
              placeholder="Ex.: Em frente à sala, ao lado do miniauditório"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? "Salvando…" : project ? "Salvar" : "Cadastrar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
