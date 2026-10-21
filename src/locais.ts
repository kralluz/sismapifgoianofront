// Catálogo fixo de locais da feira (salas, laboratórios, tendas, áreas),
// lido de public/mapa/salas.geojson. As coordenadas estão em pixels do
// SVG do mapa (MAP_W x MAP_H, y para baixo).
export const MAP_W = 4650;
export const MAP_H = 6573;

export type TipoLocal =
  | "sala"
  | "laboratorio"
  | "administrativo"
  | "tenda"
  | "banheiro"
  | "apoio"
  | "area"
  | "estrutura";

export interface Local {
  id: string;
  nome: string;
  bloco: string | null;
  tipo: TipoLocal;
  selecionavel: boolean;
  altura: number;
  /** contorno em px do mapa; ausente nos locais pontuais */
  poligono: Array<[number, number]> | null;
  /** ponto de referência para pinos e foco da câmera, em px do mapa */
  centro: { x: number; y: number };
}

interface Feature {
  properties: Omit<Local, "poligono" | "centro">;
  geometry:
    | { type: "Polygon"; coordinates: Array<Array<[number, number]>> }
    | { type: "Point"; coordinates: [number, number] };
}

// Centroide de área (fórmula do polígono); cai para a média se degenerar
const centroide = (pts: Array<[number, number]>) => {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  if (Math.abs(a) < 1e-6) {
    const n = pts.length;
    return { x: pts.reduce((s, p) => s + p[0], 0) / n, y: pts.reduce((s, p) => s + p[1], 0) / n };
  }
  return { x: cx / (3 * a), y: cy / (3 * a) };
};

let cache: Promise<Local[]> | null = null;

export const loadLocais = () => {
  cache ??= fetch(`${import.meta.env.BASE_URL}mapa/salas.geojson`)
    .then((r) => {
      if (!r.ok) throw new Error(`salas.geojson ${r.status}`);
      return r.json();
    })
    .then((fc: { features: Feature[] }) =>
      fc.features.map((f) => {
        const poligono = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : null;
        const centro = poligono
          ? centroide(poligono)
          : { x: (f.geometry.coordinates as [number, number])[0], y: (f.geometry.coordinates as [number, number])[1] };
        return { ...f.properties, poligono, centro } as Local;
      })
    )
    .catch((err) => {
      cache = null; // permite tentar de novo
      throw err;
    });
  return cache;
};

export const TIPO_LABEL: Record<TipoLocal, string> = {
  sala: "Sala",
  laboratorio: "Laboratório",
  administrativo: "Administrativo",
  tenda: "Tenda",
  banheiro: "Banheiro",
  apoio: "Apoio",
  area: "Área externa",
  estrutura: "Estrutura",
};

export const descreverLocal = (l: Pick<Local, "nome" | "bloco">) =>
  l.bloco ? `Bloco ${l.bloco} · ${l.nome}` : l.nome;

// No mapa 2D a imagem ocupa o quadrado 0-100 do viewBox em modo "meet"
const FIT = Math.min(100 / MAP_W, 100 / MAP_H);
const OFF_X = (100 - MAP_W * FIT) / 2;
const OFF_Y = (100 - MAP_H * FIT) / 2;

export const mapToViewBox = (x: number, y: number) => ({ x: OFF_X + x * FIT, y: OFF_Y + y * FIT });

/** escala px do mapa -> unidades do viewBox */
export const VIEWBOX_PER_PX = FIT;
