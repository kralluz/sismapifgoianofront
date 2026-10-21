import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from "react";
import { Plus, Minus, RotateCcw, LogOut, LogIn, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../provider/AuthContext";
import { api } from "../services/api";
import type { Project, CreateProjectRequest } from "../types";
import { type Local, loadLocais, mapToViewBox, MAP_W, MAP_H } from "../locais";
import { type Rota, calcularRota, preCarregarRotas, ENTRADA } from "../rota";
import Sidebar from "./Sidebar";
import LocalPanel from "./LocalPanel";
import ProjectForm from "./ProjectForm";
import institutoLogo from "../assets/intitutoLogo.png";

// three.js só é baixado quando o usuário abre a visão 3D
const Map3D = lazy(() => import("./Map3D"));

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 12;
const FOCUS_ZOOM = 4;

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

  // Seleção, rota e formulários
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [hoveredLocalId, setHoveredLocalId] = useState<string | null>(null);
  const [rota, setRota] = useState<Rota | null>(null);
  const [rotaVisivel, setRotaVisivel] = useState(true);
  const [calculandoRota, setCalculandoRota] = useState(false);
  const [form, setForm] = useState<{ project: Project | null; localId: string | null } | null>(null);
  const [listaAberta, setListaAberta] = useState(false); // gaveta no celular
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

  // Centro visível do mapa no viewBox: desconta o painel do local no desktop
  const centroVisivel = useCallback(() => {
    const m = getViewBoxMetrics();
    if (!m || window.innerWidth < 768) return { x: 50, y: 50 };
    const painel = 396; // largura do painel + margem, em px
    const cx = (m.rect.width - painel) / 2;
    return { x: (cx - m.ox) / m.s, y: 50 };
  }, [getViewBoxMetrics]);

  // Centraliza a câmera 2D num ponto do mapa (px)
  const focusPonto = useCallback(
    (x: number, y: number, z: number) => {
      const c = mapToViewBox(x, y);
      const alvo = centroVisivel();
      viewRef.current = { zoom: z, pan: { x: alvo.x - c.x * z, y: alvo.y - c.y * z } };
      commitView();
    },
    [commitView, centroVisivel]
  );

  // Enquadra a rota inteira (entrada -> sala)
  const enquadrarRota = useCallback(
    (r: Rota) => {
      const xs = r.pontos.map((p) => p.x);
      const ys = r.pontos.map((p) => p.y);
      const a = mapToViewBox(Math.min(...xs), Math.min(...ys));
      const b = mapToViewBox(Math.max(...xs), Math.max(...ys));
      const m = getViewBoxMetrics();
      const largura = m ? (m.rect.width - (window.innerWidth < 768 ? 0 : 396)) / m.s : 100;
      const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min((largura * 0.8) / (b.x - a.x || 1), 80 / (b.y - a.y || 1))));
      focusPonto((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, z);
    },
    [focusPonto, getViewBoxMetrics]
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
    preCarregarRotas();
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
        // contador logo abaixo do nome da sala, sem cobri-lo
        badge: mapToViewBox(l.centro.x, l.centro.y + (l.poligono ? 62 : 0)),
      })),
    [selecionaveis]
  );
  const rotaD = useMemo(
    () =>
      rota
        ? "M" + rota.pontos.map((p) => {
            const v = mapToViewBox(p.x, p.y);
            return `${v.x.toFixed(3)},${v.y.toFixed(3)}`;
          }).join("L")
        : null,
    [rota]
  );

  const selectedLocal = selectedLocalId ? locaisPorId.get(selectedLocalId) ?? null : null;

  // Seleciona o local, aproxima a câmera e calcula a rota desde a entrada
  const abrirLocal = useCallback(
    (local: Local, projectId: number | null) => {
      setSelectedLocalId(local.id);
      setSelectedProjectId(projectId);
      setListaAberta(false);
      setRotaVisivel(true);
      focusPonto(local.centro.x, local.centro.y, Math.max(viewRef.current.zoom, FOCUS_ZOOM));
      setRota(null);
      setCalculandoRota(true);
      calcularRota(local)
        .then((r) => setRota(r))
        .catch(() => setRota(null))
        .finally(() => setCalculandoRota(false));
    },
    [focusPonto]
  );

  const selectProject = (project: Project) => {
    const local = locaisPorId.get(project.localId);
    if (local) abrirLocal(local, project.id);
  };

  const fecharLocal = () => {
    setSelectedLocalId(null);
    setSelectedProjectId(null);
    setRota(null);
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

  // Toque: arrastar com um dedo, pinça com dois
  const touchRef = useRef<{ dist: number; panX: number; panY: number; x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    hasDraggedRef.current = false;
    const t = e.touches;
    const x = t.length > 1 ? (t[0].clientX + t[1].clientX) / 2 : t[0].clientX;
    const y = t.length > 1 ? (t[0].clientY + t[1].clientY) / 2 : t[0].clientY;
    touchRef.current = {
      dist: t.length > 1 ? Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) : 0,
      panX: viewRef.current.pan.x,
      panY: viewRef.current.pan.y,
      x,
      y,
    };
  };
  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    const st = touchRef.current;
    if (!st) return;
    const t = e.touches;
    const s = getViewBoxMetrics()?.s ?? 1;
    if (t.length > 1 && st.dist) {
      const dist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      const mx = (t[0].clientX + t[1].clientX) / 2;
      const my = (t[0].clientY + t[1].clientY) / 2;
      const p = clientToViewBox(mx, my);
      zoomAt(dist / st.dist, p.x, p.y);
      st.dist = dist;
      hasDraggedRef.current = true;
      return;
    }
    const dx = t[0].clientX - st.x;
    const dy = t[0].clientY - st.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDraggedRef.current = true;
    viewRef.current = { zoom: viewRef.current.zoom, pan: { x: st.panX + dx / s, y: st.panY + dy / s } };
    commitView();
  };

  // Clique num local (ignora se o gesto foi um arraste do mapa)
  const handleLocalClick = (local: Local) => {
    if (hasDraggedRef.current) return;
    abrirLocal(local, null);
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
    const rotulo = data.number != null ? `Trabalho #${data.number}` : "Trabalho";
    if (form?.project) {
      await api.updateProject(form.project.id, data);
      setSuccessMessage(`${rotulo} atualizado.`);
    } else {
      await api.createProject(data);
      setSuccessMessage(`${rotulo} cadastrado.`);
    }
    setForm(null);
    await loadProjects();
    setSelectedLocalId(data.localId);
  };

  const handleDeleteProject = async (project: Project) => {
    const rotulo = project.number != null ? `#${project.number} ` : "";
    if (!confirm(`Excluir o trabalho ${rotulo}"${project.title}"?`)) return;
    try {
      await api.deleteProject(project.id);
      setSuccessMessage("Trabalho excluído.");
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir trabalho");
    }
  };

  const panelOpen = Boolean(selectedLocal);
  const entradaVB = mapToViewBox(ENTRADA.x, ENTRADA.y);
  const rotaNoMapa = rota && rotaVisivel ? rota : null;

  const sidebar = (
    <Sidebar
      locais={locais}
      projetosPorLocal={projetosPorLocal}
      projects={projects}
      loading={loading}
      isAdmin={isAdmin}
      selectedLocalId={selectedLocalId}
      selectedProjectId={selectedProjectId}
      onSelectLocal={(l) => abrirLocal(l, null)}
      onSelectProject={selectProject}
      onCreate={() => setForm({ project: null, localId: selectedLocalId })}
      onClose={() => setListaAberta(false)}
    />
  );

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-gray-100 overflow-hidden">
      {/* Cabeçalho */}
      <header className="h-14 flex-shrink-0 flex items-center gap-3 px-3 md:px-4 bg-white border-b border-gray-200 z-40">
        <button
          onClick={() => setListaAberta(true)}
          className="md:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100"
          aria-label="Abrir lista de trabalhos"
        >
          <List className="w-5 h-5 text-gray-700" />
        </button>
        <img src={institutoLogo} alt="IF Goiano" className="h-8 w-auto hidden sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="text-sm md:text-base font-semibold text-gray-900 truncate">
            XXVII Feira de Ciência e Tecnologia
          </h1>
          <p className="text-xs text-gray-500 truncate">IF Goiano · Campus Ceres · Mapa dos trabalhos</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5 text-sm font-medium">
          {(["2d", "3d"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === mode ? "bg-green-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
              }`}
              aria-pressed={viewMode === mode}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
        {user ? (
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
            title="Sair"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sair</span>
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            title="Entrar (organização)"
          >
            <LogIn className="w-4 h-4" />
          </button>
        )}
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {/* Lista: coluna fixa no desktop, gaveta no celular */}
        <div className="hidden md:block w-[360px] flex-shrink-0 border-r border-gray-200 z-30">{sidebar}</div>
        {listaAberta && (
          <div className="md:hidden absolute inset-0 z-50 flex">
            <div className="w-[88%] max-w-sm h-full shadow-2xl">{sidebar}</div>
            <button className="flex-1 bg-black/30" onClick={() => setListaAberta(false)} aria-label="Fechar lista" />
          </div>
        )}

        {/* Área do mapa */}
        <div className="flex-1 relative min-w-0">
          {(successMessage || error) && (
            <div
              className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white ${
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
                  rota={rotaNoMapa}
                  onLocalClick={(l) => abrirLocal(l, null)}
                />
              </Suspense>
            </div>
          )}

          {/* Controles de zoom */}
          <div
            className={`absolute bottom-6 z-10 flex flex-col gap-2 ${
              panelOpen ? "right-4 md:right-[400px] max-md:hidden" : "right-4"
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
          </div>

          {/* Legenda */}
          {viewMode === "2d" && (
            <div className="absolute bottom-6 left-4 z-10 bg-white/95 border border-gray-200 rounded-lg shadow px-3 py-2 text-xs text-gray-700 space-y-1 max-md:hidden">
              <p className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-green-500/40 border border-green-600" /> Local com trabalhos
              </p>
              <p className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-blue-600" /> Rota a partir da entrada
              </p>
            </div>
          )}

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

          {/* Camada interativa: locais clicáveis e rota por cima do mapa */}
          <svg
            ref={svgRef}
            className={`absolute inset-0 w-full h-full touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => (touchRef.current = null)}
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
                    fill={ativo ? "#16a34a" : hover ? "#3b82f6" : temProjetos ? "#22c55e" : "transparent"}
                    fillOpacity={ativo ? 0.4 : hover ? 0.2 : temProjetos ? 0.16 : 0}
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

              {/* Rota: traço branco por baixo e azul animado por cima */}
              {rotaNoMapa && rotaD && (
                <g pointerEvents="none">
                  <path d={rotaD} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <path d={rotaD} fill="none" stroke="#2563eb" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <path
                    d={rotaD}
                    fill="none"
                    stroke="#bfdbfe"
                    strokeWidth={2}
                    strokeDasharray="2 14"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    className="rota-anim"
                  />
                </g>
              )}

              {/* Contagem de trabalhos por local; locais pontuais viram marcador */}
              {formas.map(({ local, badge: c, d }) => {
                const n = projetosPorLocal.get(local.id)?.length ?? 0;
                if (!n && d) return null;
                const r = (n ? 1.4 : 0.8) / zoom;
                const ativo = local.id === selectedLocalId;
                return (
                  <g key={`m-${local.id}`} className="cursor-pointer" onClick={() => handleLocalClick(local)}>
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

              {/* Entrada da feira */}
              <g pointerEvents="none">
                <circle cx={entradaVB.x} cy={entradaVB.y} r={1.3 / zoom} fill="#2563eb" stroke="#fff" strokeWidth={0.3 / zoom} />
                <text
                  x={entradaVB.x}
                  y={entradaVB.y - 2.2 / zoom}
                  textAnchor="middle"
                  fontSize={1.6 / zoom}
                  fontWeight={700}
                  fill="#1e3a8a"
                  stroke="#fff"
                  strokeWidth={0.5 / zoom}
                  paintOrder="stroke"
                >
                  Entrada
                </text>
              </g>
            </g>
          </svg>

          {selectedLocal && (
            <LocalPanel
              local={selectedLocal}
              projects={projetosPorLocal.get(selectedLocal.id) ?? []}
              selectedProjectId={selectedProjectId}
              isAdmin={isAdmin}
              rota={rota}
              rotaVisivel={rotaVisivel}
              calculandoRota={calculandoRota}
              onToggleRota={() => {
                const mostrar = !rotaVisivel;
                setRotaVisivel(mostrar);
                if (mostrar && rota) enquadrarRota(rota);
              }}
              onVerRota={() => rota && enquadrarRota(rota)}
              onClose={fecharLocal}
              onAddProject={() => setForm({ project: null, localId: selectedLocal.id })}
              onEditProject={(p) => setForm({ project: p, localId: p.localId })}
              onDeleteProject={handleDeleteProject}
            />
          )}
        </div>
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
