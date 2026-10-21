// Rota "GPS" da entrada da feira até um local.
// public/mapa/caminhos.png é uma grade (1 pixel = CELL px do mapa):
//   255 = livre, 110 = traço de parede (passa, mas caro), 0 = bloqueado.
// Como a origem é sempre a entrada, um único Dijkstra a partir dela dá o
// melhor caminho para qualquer destino; cada rota depois sai na hora.
import type { Local } from "./locais";

const CELL = 12;
const CUSTO_PAREDE = 25;
/** Pixels do mapa por metro (estimativa até o georreferenciamento) */
export const PX_PER_M = 25;
/** Velocidade média de caminhada em m/min */
const PASSO_M_MIN = 70;
/** "Chegada", ao lado do Baú da Ciência */
export const ENTRADA = { x: 520, y: 2330 };

export interface Rota {
  /** pontos em px do mapa, da entrada até a porta do local */
  pontos: Array<{ x: number; y: number }>;
  metros: number;
  minutos: number;
}

interface Grade {
  w: number;
  h: number;
  livre: Uint8Array; // 1 = célula de corredor/rua
  dist: Float64Array; // custo acumulado a partir da entrada
  prev: Int32Array;
}

class Heap {
  private k: number[] = [];
  private v: number[] = [];
  get size() {
    return this.k.length;
  }
  push(key: number, val: number) {
    const { k, v } = this;
    let i = k.length;
    k.push(key);
    v.push(val);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (k[p] <= key) break;
      k[i] = k[p];
      v[i] = v[p];
      i = p;
    }
    k[i] = key;
    v[i] = val;
  }
  pop(): [number, number] {
    const { k, v } = this;
    const top: [number, number] = [k[0], v[0]];
    const lk = k.pop()!;
    const lv = v.pop()!;
    if (k.length) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= k.length) break;
        if (c + 1 < k.length && k[c + 1] < k[c]) c++;
        if (k[c] >= lk) break;
        k[i] = k[c];
        v[i] = v[c];
        i = c;
      }
      k[i] = lk;
      v[i] = lv;
    }
    return top;
  }
}

const carregarImagem = async (url: string) => {
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
};

let gradePromise: Promise<Grade> | null = null;

const carregarGrade = () => {
  gradePromise ??= carregarImagem(`${import.meta.env.BASE_URL}mapa/caminhos.png`).then((data) => {
    const { width: w, height: h } = data;
    const custo = new Float32Array(w * h);
    const livre = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const v = data.data[i * 4];
      custo[i] = v > 200 ? 1 : v > 50 ? CUSTO_PAREDE : Infinity;
      livre[i] = v > 200 ? 1 : 0;
    }

    // Dijkstra a partir da célula livre mais próxima da entrada
    const dist = new Float64Array(w * h).fill(Infinity);
    const prev = new Int32Array(w * h).fill(-1);
    const origem = celulaLivreProxima({ w, h, livre } as Grade, ENTRADA.x, ENTRADA.y);
    dist[origem] = 0;
    const heap = new Heap();
    heap.push(0, origem);
    const vizinhos = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
    ];
    while (heap.size) {
      const [d, i] = heap.pop();
      if (d > dist[i]) continue;
      const x = i % w;
      const y = (i - x) / w;
      for (const [dx, dy, passo] of vizinhos) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (custo[j] === Infinity) continue;
        // Diagonal não corta quina de parede
        if (dx && dy && (custo[y * w + nx] === Infinity || custo[ny * w + x] === Infinity)) continue;
        const nd = d + passo * custo[j];
        if (nd < dist[j]) {
          dist[j] = nd;
          prev[j] = i;
          heap.push(nd, j);
        }
      }
    }
    return { w, h, livre, dist, prev };
  }).catch((err) => {
    gradePromise = null;
    throw err;
  });
  return gradePromise;
};

const celulaLivreProxima = (g: Pick<Grade, "w" | "h" | "livre">, x: number, y: number) => {
  const cx = Math.floor(x / CELL);
  const cy = Math.floor(y / CELL);
  for (let r = 0; r < 80; r++) {
    let melhor = -1;
    let melhorD = Infinity;
    for (let j = Math.max(0, cy - r); j <= Math.min(g.h - 1, cy + r); j++) {
      for (let i = Math.max(0, cx - r); i <= Math.min(g.w - 1, cx + r); i++) {
        if (!g.livre[j * g.w + i]) continue;
        const d = (i - cx) ** 2 + (j - cy) ** 2;
        if (d < melhorD) {
          melhorD = d;
          melhor = j * g.w + i;
        }
      }
    }
    if (melhor >= 0) return melhor;
  }
  return cy * g.w + cx;
};

// Porta de entrada do local: entre as células livres que encostam no
// contorno (ou no ponto), a que fica mais perto da entrada da feira
const destino = (g: Grade, local: Local) => {
  const raio = 6; // células
  const amostras: Array<[number, number]> = local.poligono ?? [[local.centro.x, local.centro.y]];
  let melhor = -1;
  let melhorD = Infinity;
  for (let k = 0; k < amostras.length; k++) {
    const [ax, ay] = amostras[k];
    const [bx, by] = amostras[(k + 1) % amostras.length];
    const passos = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / CELL));
    for (let s = 0; s < passos; s++) {
      const px = ax + ((bx - ax) * s) / passos;
      const py = ay + ((by - ay) * s) / passos;
      const cx = Math.floor(px / CELL);
      const cy = Math.floor(py / CELL);
      for (let j = cy - raio; j <= cy + raio; j++) {
        for (let i = cx - raio; i <= cx + raio; i++) {
          if (i < 0 || j < 0 || i >= g.w || j >= g.h) continue;
          const idx = j * g.w + i;
          // penaliza levemente a distância até o contorno
          const d = g.livre[idx] ? g.dist[idx] + Math.hypot(i - cx, j - cy) * 2 : Infinity;
          if (d < melhorD) {
            melhorD = d;
            melhor = idx;
          }
        }
      }
    }
  }
  return melhor;
};

// Linha reta entre duas células só passando por células livres
const visivel = (g: Grade, a: number, b: number) => {
  let x0 = a % g.w;
  let y0 = (a - x0) / g.w;
  const x1 = b % g.w;
  const y1 = (b - x1) / g.w;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    if (!g.livre[y0 * g.w + x0]) return false;
    if (x0 === x1 && y0 === y1) return true;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
};

export const calcularRota = async (local: Local): Promise<Rota | null> => {
  const g = await carregarGrade();
  const fim = destino(g, local);
  if (fim < 0 || g.dist[fim] === Infinity) return null;

  const celulas: number[] = [];
  for (let c = fim; c >= 0; c = g.prev[c]) celulas.push(c);
  celulas.reverse();

  // Suaviza: liga cada ponto ao mais distante que ele "enxerga" em linha reta
  const suave = [celulas[0]];
  let i = 0;
  while (i < celulas.length - 1) {
    let j = celulas.length - 1;
    while (j > i + 1 && !visivel(g, celulas[i], celulas[j])) j--;
    suave.push(celulas[j]);
    i = j;
  }

  const centro = (c: number) => {
    const x = c % g.w;
    return { x: (x + 0.5) * CELL, y: ((c - x) / g.w + 0.5) * CELL };
  };
  const pontos = [ENTRADA, ...suave.map(centro), local.centro];
  let px = 0;
  for (let k = 1; k < pontos.length - 1; k++) {
    px += Math.hypot(pontos[k].x - pontos[k - 1].x, pontos[k].y - pontos[k - 1].y);
  }
  const metros = Math.round(px / PX_PER_M / 5) * 5;
  return { pontos, metros, minutos: Math.max(1, Math.round(metros / PASSO_M_MIN)) };
};

/** Começa a montar a grade em segundo plano (evita espera no 1º clique) */
export const preCarregarRotas = () => {
  carregarGrade().catch(() => undefined);
};
