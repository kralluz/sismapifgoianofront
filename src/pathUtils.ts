import type { Path, PathPoint, Room } from "./types";

export const CAMPUS_NODES = {
  entrance: {
    x: 10,
    y: 10,
    type: "entrance" as const,
    label: "Entrada Principal",
  },
  centralHub: {
    x: 50,
    y: 50,
    type: "intersection" as const,
    label: "Hub Central",
  },
  northGate: {
    x: 50,
    y: 15,
    type: "intersection" as const,
    label: "Portão Norte",
  },
  southGate: {
    x: 50,
    y: 85,
    type: "intersection" as const,
    label: "Portão Sul",
  },
  eastGate: {
    x: 85,
    y: 50,
    type: "intersection" as const,
    label: "Portão Leste",
  },
  westGate: {
    x: 15,
    y: 50,
    type: "intersection" as const,
    label: "Portão Oeste",
  },
} as const;

export const createPathPoint = (
  x: number,
  y: number,
  type: PathPoint["type"] = "waypoint",
  label?: string
): PathPoint => ({
  x,
  y,
  id: `point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  label,
});

export const calculateDistance = (
  point1: PathPoint,
  point2: PathPoint
): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const calculateEstimatedTime = (points: PathPoint[]): number => {
  if (points.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(points[i], points[i + 1]);
  }

  const distanceInMeters = totalDistance * 2;

  return Math.ceil(distanceInMeters / 84);
};

export const validatePath = (
  path: Path
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!path.id) errors.push("ID do caminho é obrigatório");
  if (!path.roomId) errors.push("ID da sala é obrigatório");
  if (!path.points || path.points.length < 2) {
    errors.push("Caminho deve ter pelo menos 2 pontos");
  }

  path.points?.forEach((point, index) => {
    if (typeof point.x !== "number" || typeof point.y !== "number") {
      errors.push(`Ponto ${index + 1} tem coordenadas inválidas`);
    }
    if (point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) {
      errors.push(`Ponto ${index + 1} está fora dos limites do mapa`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const createAutomaticPath = (room: Room): Path => {
  const destination: PathPoint = {
    ...createPathPoint(room.x, room.y, "destination"),
    label: room.name,
  };

  const points: PathPoint[] = [
    { ...CAMPUS_NODES.entrance },
    { ...CAMPUS_NODES.westGate },
    { ...CAMPUS_NODES.centralHub },
  ];

  if (room.x < 40 && room.y < 50) {
    points.push({ ...CAMPUS_NODES.northGate });
  } else if (room.x > 60 && room.y < 50) {
    points.push({ ...CAMPUS_NODES.northGate });
    points.push({ ...CAMPUS_NODES.eastGate });
  } else if (room.x > 60 && room.y > 50) {
    points.push({ ...CAMPUS_NODES.eastGate });
  } else if (room.x < 40 && room.y > 50) {
    points.push({ ...CAMPUS_NODES.southGate });
  }

  const approachPoint = createPathPoint(
    room.x,
    room.y - 3,
    "waypoint",
    `Aproximação para ${room.name}`
  );
  points.push(approachPoint);
  points.push(destination);

  const path: Path = {
    id: `auto-${room.id}-${Date.now()}`,
    roomId: room.id,
    name: `Caminho automático para ${room.name}`,
    description: `Rota otimizada gerada automaticamente`,
    points,
    type: "automatic",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    estimatedTime: calculateEstimatedTime(points),
    distance:
      points.reduce((total, point, index) => {
        if (index === 0) return total;
        return total + calculateDistance(points[index - 1], point);
      }, 0) * 2,
  };

  return path;
};

export const findBestPath = (
  roomId: number,
  customPaths: Path[]
): Path | null => {
  const customPath = customPaths.find(
    (path) => path.roomId === roomId && path.isActive
  );

  return customPath || null;
};

export const optimizePath = (path: Path): Path => {
  if (path.points.length <= 3) return path;

  const optimizedPoints: PathPoint[] = [path.points[0]];

  for (let i = 1; i < path.points.length - 1; i++) {
    const prevPoint = optimizedPoints[optimizedPoints.length - 1];
    const currentPoint = path.points[i];
    const nextPoint = path.points[i + 1];

    const angle = calculatePathAngle(prevPoint, currentPoint, nextPoint);

    if (currentPoint.type !== "waypoint" || Math.abs(angle) > 30) {
      optimizedPoints.push(currentPoint);
    }
  }

  optimizedPoints.push(path.points[path.points.length - 1]);

  return {
    ...path,
    points: optimizedPoints,
    updatedAt: new Date().toISOString(),
    estimatedTime: calculateEstimatedTime(optimizedPoints),
    distance:
      optimizedPoints.reduce((total, point, index) => {
        if (index === 0) return total;
        return total + calculateDistance(optimizedPoints[index - 1], point);
      }, 0) * 2,
  };
};

const calculatePathAngle = (
  point1: PathPoint,
  point2: PathPoint,
  point3: PathPoint
): number => {
  const vector1 = { x: point2.x - point1.x, y: point2.y - point1.y };
  const vector2 = { x: point3.x - point2.x, y: point3.y - point2.y };

  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
  const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2);
  const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2);

  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const angle =
    Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);

  return angle;
};

export const convertSimplePointsToPathPoints = (
  simplePoints: number[][],
  roomName?: string
): PathPoint[] => {
  return simplePoints.map((point, index) => {
    let type: PathPoint["type"] = "waypoint";
    let label = "";

    if (index === 0) {
      type = "entrance";
      label = "Entrada Principal";
    } else if (index === simplePoints.length - 1) {
      type = "destination";
      label = roomName || "Destino";
    }

    return createPathPoint(point[0], point[1], type, label);
  });
};

export const convertPathPointsToSimple = (points: PathPoint[]): number[][] => {
  return points.map((point) => [point.x, point.y]);
};
