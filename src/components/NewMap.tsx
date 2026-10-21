import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from "react";
import { Plus, Minus, RotateCcw, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../provider/AuthContext";
import { api } from "../services/api";
import type { Project, CreateProjectRequest } from "../types";
import { type Local, loadLocais, mapToViewBox, MAP_W, MAP_H } from "../locais";
import ProjectSidebar from "./ProjectSidebar";
import LocalPanel from "./LocalPanel";
import ProjectForm from "./ProjectForm";
import institutoLogo from "../assets/intitutoLogo.png";

// three.js só é baixado quando o usuário abre a visão 3D
const Map3D = lazy(() => import("./Map3D"));

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 12;
const FOCUS_ZOOM = 3.5;

const NewMap: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const svgRef = useRef<SVGSVGElement>(null);

  // Dados
  const [locais, setLocais] = useState<Local[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Seleção e formulários
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [hoveredLocalId, setHoveredLocalId] = useState<string | null>(null);
  const [form, setForm] = useState<{ project: Project | null; localId: string | null } | null>(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  // Estados de pan e zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedRef = useRef(false);

  // Valores "vivos" de zoom/pan: os eventos escrevem aqui e o estado é
  // sincronizado uma vez por frame, evitando re-render a cada evento
  const viewRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } });
  const dragRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });
  const rafRef = useRef<number | null>(null);
  const mapImgRef = useRef<HTMLImageElement>(null);
  const settleTimerRef = useRef<number | null>(null);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  const commitView = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setZoom(viewRef.current.zoom);
      setPan({ ...viewRef.current.pan });
    });
  }, []);

  // Escala px/unidade do viewBox (0-100, preserveAspectRatio meet) e offsets
  const getViewBoxMetrics = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const s = Math.min(rect.width, rect.height) / 100;
    return {
      rect,
      s,
      ox: (rect.width - 100 * s) / 2,
      oy: (rect.height - 100 * s) / 2,
    };
  }, []);

  // Coordenada de tela -> coordenada do viewBox (antes de zoom/pan)
  const clientToViewBox = useCallback(
    (clientX: number, clientY: number) => {
      const m = getViewBoxMetrics();
      if (!m) return { x: 0, y: 0 };
      return {
        x: (clientX - m.rect.left - m.ox) / m.s,
        y: (clientY - m.rect.top - m.oy) / m.s,
      };
    },
    [getViewBoxMetrics]
  );

  const zoomAt = useCallback(
    (factor: number, vx: number, vy: number) => {
      const { zoom: z, pan: p } = viewRef.current;
      const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * factor));
      const k = nz / z;
      viewRef.current = {
        zoom: nz,
        pan: { x: vx - (vx - p.x) * k, y: vy - (vy - p.y) * k },
      };
      commitView();
    },
    [commitView]
  );

  // Centraliza a câmera 2D num local
  const focusLocal = useCallback(
    (local: Local) => {
      const c = mapToViewBox(local.centro.x, local.centro.y);
      const z = Math.max(viewRef.current.zoom, FOCUS_ZOOM);
      viewRef.current = { zoom: z, pan: { x: 50 - c.x * z, y: 50 - c.y * z } };
      commitView();
    },
    [commitView]
  );

  const loadProjects = useCallback(async () => {
    setProjects(await api.getProjects());
  }, []);

  useEffect(() => {
    Promise.all([loadLocais(), api.getProjects()])
      .then(([l, p]) => {
        setLocais(l);
        setProjects(p);
      })
      .catch(() => setError("Erro ao carregar o mapa"))
      .finally(() => setLoading(false));
  }, []);

  // Limpar mensagens
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  // Configurar wheel listener com { passive: false } para evitar warning
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Fator proporcional ao delta: suave no trackpad, firme na roda do mouse
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const factor = Math.exp(-Math.max(-100, Math.min(100, dy)) * 0.002);
      const { x, y } = clientToViewBox(e.clientX, e.clientY);
      zoomAt(factor, x, y);
    };

    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [clientToViewBox, zoomAt]);

  // Acompanhar tamanho do SVG para posicionar a imagem do mapa
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSvgSize({ w: width, h: height });
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  // Posiciona o <img> do mapa via transform de GPU. Durante o gesto usa
  // will-change (fluido); ao parar, remove para o navegador re-rasterizar nítido
  useEffect(() => {
    const img = mapImgRef.current;
    if (!img || !svgSize.w) return;
    const s = Math.min(svgSize.w, svgSize.h) / 100;
    const ox = (svgSize.w - 100 * s) / 2;
    const oy = (svgSize.h - 100 * s) / 2;
    const topLeft = mapToViewBox(0, 0);
    const bottomRight = mapToViewBox(MAP_W, MAP_H);
    img.style.width = `${(bottomRight.x - topLeft.x) * s}px`;
    img.style.height = `${(bottomRight.y - topLeft.y) * s}px`;
    const left = ox + s * (pan.x + zoom * topLeft.x);
    const top = oy + s * (pan.y + zoom * topLeft.y);
    img.style.willChange = "transform";
    img.style.transform = `translate(${left}px, ${top}px) scale(${zoom})`;
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      img.style.willChange = "auto";
    }, 200);
  }, [zoom, pan, svgSize]);

  // Índices derivados
  const locaisPorId = useMemo(() => new Map(locais.map((l) => [l.id, l])), [locais]);
  const projetosPorLocal = useMemo(() => {
    const m = new Map<string, Project[]>();
    for (const p of projects) m.set(p.localId, [...(m.get(p.localId) ?? []), p]);
    return m;
  }, [projects]);
  const selecionaveis = useMemo(() => locais.filter((l) => l.selecionavel), [locais]);
  const formas = useMemo(
    () =>
      selecionaveis.map((l) => ({
        local: l,
        d: l.poligono
          ? "M" + l.poligono.map(([x, y]) => {
              const p = mapToViewBox(x, y);
              return `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
            }).join("L") + "Z"
          : null,
        c: mapToViewBox(l.centro.x, l.centro.y),
      })),
    [selecionaveis]
  );

  const selectedLocal = selectedLocalId ? locaisPorId.get(selectedLocalId) ?? null : null;

  const selectLocal = (local: Local, focus = false) => {
    setSelectedLocalId(local.id);
    setSelectedProjectId(null);
    if (focus) focusLocal(local);
  };

  const selectProject = (project: Project) => {
    const local = locaisPorId.get(project.localId);
    setSelectedProjectId(project.id);
    if (!local) return;
    setSelectedLocalId(local.id);
    focusLocal(local);
  };

  // Handlers de mouse do mapa 2D
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: viewRef.current.pan.x,
      panY: viewRef.current.pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const drag = dragRef.current;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDraggedRef.current = true;
    // Pixels -> unidades do viewBox (mesma escala nos dois eixos)
    const s = getViewBoxMetrics()?.s ?? 1;
    viewRef.current = {
      zoom: viewRef.current.zoom,
      pan: { x: drag.panX + dx / s, y: drag.panY + dy / s },
    };
    commitView();
  };

  const stopDragging = () => setIsDragging(false);

  // Clique num local (ignora se o gesto foi um arraste do mapa)
  const handleLocalClick = (local: Local) => {
    if (hasDraggedRef.current) return;
    selectLocal(local);
  };

  // Botões aproximam/afastam em torno do centro da tela
  const zoomIn = () => zoomAt(1.25, 50, 50);
  const zoomOut = () => zoomAt(1 / 1.25, 50, 50);
  const resetView = () => {
    viewRef.current = { zoom: 1, pan: { x: 0, y: 0 } };
    commitView();
  };

  // CRUD de projetos
  const handleSubmitProject = async (data: CreateProjectRequest) => {
    if (form?.project) {
      await api.updateProject(form.project.id, data);
      setSuccessMessage(`Trabalho #${data.number} atualizado.`);
    } else {
      await api.createProject(data);
      setSuccessMessage(`Trabalho #${data.number} cadastrado.`);
    }
    setForm(null);
    await loadProjects();
    setSelectedLocalId(data.localId);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Excluir o trabalho #${project.number} "${project.title}"?`)) return;
    try {
      await api.deleteProject(project.id);
      setSuccessMessage(`Trabalho #${project.number} excluído.`);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir trabalho");
    }
  };

  const panelOpen = Boolean(selectedLocal);

  return (
    <div className="h-screen w-full bg-gray-100 flex overflow-hidden relative">
      <ProjectSidebar
        projects={projects}
        loading={loading}
        isAdmin={isAdmin}
        minimized={sidebarMinimized}
        setMinimized={setSidebarMinimized}
        selectedProjectId={selectedProjectId}
        onSelect={selectProject}
        onCreate={() => setForm({ project: null, localId: selectedLocalId })}
      />

      <div className="absolute inset-0">
        {/* Alternância 2D / 3D */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex bg-white border border-gray-300 rounded-lg shadow-md overflow-hidden text-sm font-medium">
          {(["2d", "3d"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 transition-colors ${
                viewMode === mode ? "bg-green-600 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
              aria-pressed={viewMode === mode}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Login / sair */}
        {!panelOpen &&
          (user ? (
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg shadow-md text-sm"
              title="Sair"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          ) : (
            <img
              src={institutoLogo}
              alt="Logo Instituto"
              onDoubleClick={() => navigate("/login")}
              className="absolute top-4 right-4 z-30 h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              title="Duplo clique para fazer login"
            />
          ))}

        {/* Mensagens */}
        {(successMessage || error) && (
          <div
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white ${
              error ? "bg-red-500" : "bg-green-600"
            }`}
            role="status"
          >
            {error ?? successMessage}
          </div>
        )}

        {viewMode === "3d" && (
          <div className="absolute inset-0 z-20 bg-white">
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-600">
                  Carregando visão 3D…
                </div>
              }
            >
              <Map3D
                locais={locais}
                projetosPorLocal={projetosPorLocal}
                selectedLocalId={selectedLocalId}
                onLocalClick={(l) => selectLocal(l)}
              />
            </Suspense>
          </div>
        )}

        {/* Controles de zoom */}
        <div
          className={`absolute bottom-6 z-10 flex flex-col gap-2 transition-[right] ${
            panelOpen ? "right-[392px]" : "right-6"
          } ${viewMode === "3d" ? "hidden" : ""}`}
        >
          <button onClick={zoomIn} className="bg-white border border-gray-300 rounded-lg p-2 shadow-md hover:bg-gray-50" title="Aproximar">
            <Plus className="w-5 h-5 text-gray-700" />
          </button>
          <button onClick={zoomOut} className="bg-white border border-gray-300 rounded-lg p-2 shadow-md hover:bg-gray-50" title="Afastar">
            <Minus className="w-5 h-5 text-gray-700" />
          </button>
          <button onClick={resetView} className="bg-white border border-gray-300 rounded-lg p-2 shadow-md hover:bg-gray-50" title="Ver mapa inteiro">
            <RotateCcw className="w-5 h-5 text-gray-700" />
          </button>
          <div className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 shadow-md text-xs text-gray-600 text-center">
            {(zoom * 100).toFixed(0)}%
          </div>
        </div>

        {/* Mapa base como <img>: composto na GPU, posicionado pelo efeito de zoom/pan */}
        <div className="absolute inset-0 overflow-hidden bg-white pointer-events-none">
          <img
            ref={mapImgRef}
            src={`${import.meta.env.BASE_URL}mapa/mapa-feira-2026.svg`}
            alt="Mapa da feira"
            draggable={false}
            className="absolute left-0 top-0 max-w-none select-none"
            style={{ transformOrigin: "0 0" }}
          />
        </div>

        {/* Camada interativa: locais clicáveis por cima do mapa */}
        <svg
          ref={svgRef}
          className={`absolute inset-0 w-full h-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: "none" }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {formas.map(({ local, d }) => {
              if (!d) return null;
              const temProjetos = projetosPorLocal.has(local.id);
              const ativo = local.id === selectedLocalId;
              const hover = local.id === hoveredLocalId;
              return (
                <path
                  key={local.id}
                  d={d}
                  fill={ativo ? "#16a34a" : temProjetos ? "#22c55e" : hover ? "#3b82f6" : "transparent"}
                  fillOpacity={ativo ? 0.35 : temProjetos ? 0.18 : hover ? 0.15 : 0}
                  stroke={ativo ? "#15803d" : hover ? "#2563eb" : "none"}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredLocalId(local.id)}
                  onMouseLeave={() => setHoveredLocalId((h) => (h === local.id ? null : h))}
                  onClick={() => handleLocalClick(local)}
                >
                  <title>{local.bloco ? `Bloco ${local.bloco} · ${local.nome}` : local.nome}</title>
                </path>
              );
            })}

            {/* Contagem de trabalhos por local; locais pontuais viram marcador */}
            {formas.map(({ local, c, d }) => {
              const n = projetosPorLocal.get(local.id)?.length ?? 0;
              if (!n && d) return null;
              const r = (n ? 1.4 : 0.8) / zoom;
              const ativo = local.id === selectedLocalId;
              return (
                <g
                  key={`m-${local.id}`}
                  className="cursor-pointer"
                  onClick={() => handleLocalClick(local)}
                >
                  <title>{local.nome}</title>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={r}
                    fill={n ? (ativo ? "#15803d" : "#16a34a") : "#6b7280"}
                    stroke="#fff"
                    strokeWidth={0.25 / zoom}
                  />
                  {n > 0 && (
                    <text
                      x={c.x}
                      y={c.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={1.5 / zoom}
                      fontWeight={700}
                      fill="#fff"
                      pointerEvents="none"
                    >
                      {n}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {selectedLocal && (
          <LocalPanel
            local={selectedLocal}
            projects={projetosPorLocal.get(selectedLocal.id) ?? []}
            selectedProjectId={selectedProjectId}
            isAdmin={isAdmin}
            onClose={() => {
              setSelectedLocalId(null);
              setSelectedProjectId(null);
            }}
            onAddProject={() => setForm({ project: null, localId: selectedLocal.id })}
            onEditProject={(p) => setForm({ project: p, localId: p.localId })}
            onDeleteProject={handleDeleteProject}
          />
        )}
      </div>

      {form && (
        <ProjectForm
          locais={selecionaveis}
          project={form.project}
          defaultLocalId={form.localId}
          onSubmit={handleSubmitProject}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
};

export default NewMap;
