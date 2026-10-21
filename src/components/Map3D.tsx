import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Project } from "../types";
import { type Local, MAP_W, MAP_H, descreverLocal } from "../locais";
import { type Rota, ENTRADA } from "../rota";

// Escala px do mapa -> unidades da cena
const S = 0.02;
const SCENE_W = MAP_W * S;
const SCENE_H = MAP_H * S;
// Pixels do mapa por metro (estimativa até o georreferenciamento)
const PX_PER_M = 25;

const COR_TIPO: Record<string, string> = {
  sala: "#f3efe6",
  laboratorio: "#e7eef7",
  administrativo: "#efe9f5",
  tenda: "#fff7d6",
  banheiro: "#e5e7eb",
  apoio: "#f1ede4",
  area: "#dcefd9",
  estrutura: "#d6d3cd",
};
const COR_COM_PROJETO = new THREE.Color("#86efac");
const COR_SELECIONADO = new THREE.Color("#16a34a");
const COR_HOVER = new THREE.Color("#93c5fd");

interface Map3DProps {
  locais: Local[];
  projetosPorLocal: Map<string, Project[]>;
  selectedLocalId: string | null;
  rota?: Rota | null;
  onLocalClick?: (local: Local) => void;
}

// Coordenada do mapa (px do SVG) -> cena. O y do mapa cresce para baixo e
// vira +z (em direção à câmera), então o topo do mapa fica "ao fundo".
const toScene = (mx: number, my: number) => ({
  x: mx * S - SCENE_W / 2,
  z: my * S - SCENE_H / 2,
});

const loadMapTexture = async (url: string, maxAniso: number) => {
  const img = new Image();
  img.src = url;
  await img.decode();
  // Rasteriza o SVG em alta resolução para o chão continuar nítido de perto
  const canvas = document.createElement("canvas");
  canvas.width = 4096;
  canvas.height = Math.round((4096 * MAP_H) / MAP_W);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
};

interface Volume {
  mesh: THREE.Mesh;
  local: Local;
}

const Map3D: React.FC<Map3DProps> = ({ locais, projetosPorLocal, selectedLocalId, rota, onLocalClick }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    volumes: Map<string, Volume>;
    pins: THREE.Group;
    rota: THREE.Group;
    hoveredId: string | null;
  } | null>(null);
  const onLocalClickRef = useRef(onLocalClick);
  const stateRef = useRef({ projetosPorLocal, selectedLocalId });
  const [hovered, setHovered] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  onLocalClickRef.current = onLocalClick;
  stateRef.current = { projetosPorLocal, selectedLocalId };

  // Cor de cada volume conforme seleção, hover e trabalhos cadastrados
  const pintar = () => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    const { projetosPorLocal: ppl, selectedLocalId: sel } = stateRef.current;
    for (const { mesh, local } of ctx.volumes.values()) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (local.id === sel) mat.color.copy(COR_SELECIONADO);
      else if (local.id === ctx.hoveredId) mat.color.copy(COR_HOVER);
      else if (ppl.has(local.id)) mat.color.copy(COR_COM_PROJETO);
      else mat.color.set(COR_TIPO[local.tipo] ?? COR_TIPO.apoio);
    }
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || locais.length === 0) return;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#eef2f6");

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.5, 2000);
    camera.position.set(0, 95, 85);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.15; // não deixa a câmera ir para baixo do chão
    controls.minDistance = 8;
    controls.maxDistance = 220;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-60, 120, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -SCENE_W / 1.4;
    sc.right = SCENE_W / 1.4;
    sc.top = SCENE_H / 1.4;
    sc.bottom = -SCENE_H / 1.4;
    scene.add(sun);

    // Chão: o próprio mapa vetorial como textura
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(SCENE_W, SCENE_H),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    loadMapTexture(`${import.meta.env.BASE_URL}mapa/mapa-feira-2026.svg`, renderer.capabilities.getMaxAnisotropy())
      .then((tex) => {
        if (disposed) return tex.dispose();
        const mat = ground.material as THREE.MeshStandardMaterial;
        mat.map = tex;
        mat.needsUpdate = true;
        setLoading(false);
      })
      .catch(() => {
        if (!disposed) {
          setError("Não foi possível carregar o mapa base.");
          setLoading(false);
        }
      });

    // Volumes dos locais
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x5b6573 });
    const volumes = new Map<string, Volume>();
    const pickables: THREE.Object3D[] = [];
    for (const local of locais) {
      if (!local.poligono) continue;
      // Shape no plano XY com y = -z, para após girar -90° em X a
      // extrusão apontar para cima e o polígono cair no lugar certo
      const shape = new THREE.Shape(
        local.poligono.map(([mx, my]) => {
          const p = toScene(mx, my);
          return new THREE.Vector2(p.x, -p.z);
        })
      );
      const altura = Math.max(local.altura, 0.1) * PX_PER_M * S;
      const geom = new THREE.ExtrudeGeometry(shape, { depth: altura, bevelEnabled: false });
      geom.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(
        geom,
        new THREE.MeshStandardMaterial({ color: COR_TIPO[local.tipo] ?? COR_TIPO.apoio, roughness: 0.85 })
      );
      mesh.castShadow = local.tipo !== "estrutura";
      mesh.receiveShadow = true;
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geom, 30), edgeMat));
      scene.add(mesh);
      if (local.selecionavel) {
        mesh.userData = { localId: local.id };
        volumes.set(local.id, { mesh, local });
        pickables.push(mesh);
      }
    }

    const pins = new THREE.Group();
    scene.add(pins);
    const rotaGroup = new THREE.Group();
    scene.add(rotaGroup);

    // Marcador fixo da entrada
    const e = toScene(ENTRADA.x, ENTRADA.y);
    const entrada = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.5, 24),
      new THREE.MeshStandardMaterial({ color: 0x2563eb })
    );
    entrada.position.set(e.x, 0.25, e.z);
    scene.add(entrada);

    sceneRef.current = { volumes, pins, rota: rotaGroup, hoveredId: null };
    pintar();

    // Hover e clique via raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const locaisPorId = new Map(locais.map((l) => [l.id, l]));
    let downAt = { x: 0, y: 0 };

    const pick = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...pins.children, ...pickables], false)[0];
      const id = hit?.object.userData.localId as string | undefined;
      return id ? locaisPorId.get(id) ?? null : null;
    };

    const onMove = (e: PointerEvent) => {
      const local = pick(e);
      const ctx = sceneRef.current!;
      if (ctx.hoveredId !== (local?.id ?? null)) {
        ctx.hoveredId = local?.id ?? null;
        pintar();
      }
      if (local) {
        const n = stateRef.current.projetosPorLocal.get(local.id)?.length ?? 0;
        setHovered(`${descreverLocal(local)}${n ? ` · ${n} trabalho${n > 1 ? "s" : ""}` : ""}`);
      } else {
        setHovered(null);
      }
      renderer.domElement.style.cursor = local ? "pointer" : "grab";
    };
    const onDown = (e: PointerEvent) => {
      downAt = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      // Ignora o clique se foi um arraste de câmera
      if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) return;
      const local = pick(e);
      if (local) onLocalClickRef.current?.(local);
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            (m as THREE.MeshStandardMaterial).map?.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, [locais]);

  // Recolore quando mudam seleção ou trabalhos, e recria os pinos:
  // locais pontuais sempre têm pino; os demais só quando têm trabalhos
  useEffect(() => {
    pintar();
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.pins.children.forEach((c) => {
      const m = c as THREE.Mesh;
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
    ctx.pins.clear();
    for (const local of locais) {
      if (!local.selecionavel) continue;
      const n = projetosPorLocal.get(local.id)?.length ?? 0;
      if (local.poligono && n === 0) continue;
      const p = toScene(local.centro.x, local.centro.y);
      const topo = (local.poligono ? local.altura : 0) * PX_PER_M * S;
      const pin = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 2.4, 16),
        new THREE.MeshStandardMaterial({
          color: local.id === selectedLocalId ? 0x15803d : n ? 0x16a34a : 0x6b7280,
          emissive: 0x052e16,
        })
      );
      pin.rotation.x = Math.PI; // ponta para baixo
      pin.position.set(p.x, topo + 1.6, p.z);
      pin.castShadow = true;
      pin.userData = { localId: local.id };
      ctx.pins.add(pin);
    }
  }, [locais, projetosPorLocal, selectedLocalId, loading]);

  // Rota: tubo azul rente ao chão, da entrada até o local
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    ctx.rota.children.forEach((c) => {
      const m = c as THREE.Mesh;
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
    ctx.rota.clear();
    if (!rota || rota.pontos.length < 2) return;
    const caminho = new THREE.CurvePath<THREE.Vector3>();
    const pts = rota.pontos.map((p) => {
      const s = toScene(p.x, p.y);
      return new THREE.Vector3(s.x, 0.6, s.z);
    });
    for (let i = 1; i < pts.length; i++) caminho.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
    const tubo = new THREE.Mesh(
      new THREE.TubeGeometry(caminho, pts.length * 12, 0.35, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x1d4ed8, emissiveIntensity: 0.4 })
    );
    ctx.rota.add(tubo);
  }, [rota, loading]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-600 bg-white/60">
          Carregando maquete 3D…
        </div>
      )}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow text-sm">
          {error}
        </div>
      )}
      {hovered && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/85 text-white px-3 py-1.5 rounded-md text-sm pointer-events-none">
          {hovered}
        </div>
      )}
      <div className="absolute bottom-6 right-6 bg-white/90 border border-gray-300 rounded-lg px-3 py-2 shadow text-xs text-gray-600 pointer-events-none">
        Arrastar: girar · Botão direito: mover · Roda: zoom
      </div>
    </div>
  );
};

export default Map3D;
