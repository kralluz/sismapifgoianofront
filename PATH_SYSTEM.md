# Sistema de Navegação - Estrutura de Caminhos Múltiplos

## 📍 Visão Geral

O sistema de navegação do Campus Map suporta **caminhos com múltiplos pontos de passagem**, permitindo rotas complexas e realistas que passam por vários pontos estratégicos do campus.

## 🏗️ Estrutura de Dados

### 1. Pontos de Caminho (`{ x: number, y: number }`)
Cada ponto representa uma coordenada no mapa SVG (0-100):
```typescript
interface PathPoint {
  x: number;    // Coordenada X (0-100)
  y: number;    // Coordenada Y (0-100)
}
```

### 2. Caminhos (`Path`)
```typescript
interface Path {
  id: string;                    // ID único do caminho
  roomId: string;               // ID da sala de destino
  points: PathPoint[];          // Array de pontos sequenciais
}
```

### 3. Sistema Viário do Campus
```typescript
const mainNodes = {
  entrance: { x: 10, y: 10 },      // Entrada principal
  centralHub: { x: 50, y: 50 },    // Hub central
  northGate: { x: 50, y: 15 },     // Portão norte
  southGate: { x: 50, y: 85 },     // Portão sul
  eastGate: { x: 85, y: 50 },      // Portão leste
  westGate: { x: 15, y: 50 }       // Portão oeste
};
```

## 🛣️ Tipos de Caminhos

### 1. **Caminhos Automáticos** (Calculados)
Gerados pela função `getPathToRoom()` baseada na localização:

```typescript
// Exemplo: Caminho para Sala 101 (x: 25, y: 32)
[
  { x: 10, y: 10 },    // Entrada
  { x: 15, y: 50 },    // Via oeste
  { x: 50, y: 50 },    // Hub central
  { x: 50, y: 15 },    // Norte (rota otimizada)
  { x: 25, y: 29 },    // Aproximação
  { x: 25, y: 32 }     // Destino final
]
```

### 2. **Caminhos Customizados** (Editáveis)
Criados pelo usuário através do modo de edição:

```typescript
const customPath = {
  id: "path-1234567890",
  roomId: "biblioteca",
  points: [
    { x: 10, y: 10 },    // Entrada
    { x: 30, y: 20 },    // Ponto personalizado 1
    { x: 45, y: 35 },    // Ponto personalizado 2
    { x: 45, y: 65 }     // Biblioteca
  ]
};
```

## 🎯 Lógica de Roteamento

### Algoritmo de Caminhos Automáticos

```typescript
function getPathToRoom(roomId: string): PathPoint[] {
  // 1. Verifica se existe caminho customizado
  const customPath = customPaths.find(path => path.roomId === roomId);
  if (customPath) return customPath.points;

  // 2. Calcula rota baseada na localização
  const room = rooms.find(r => r.id === roomId);
  const destination = { x: room.x, y: room.y };

  // 3. Sempre começa da entrada
  let path = [mainNodes.entrance];

  // 4. Conecta ao hub central
  path.push(mainNodes.westGate);
  path.push(mainNodes.centralHub);

  // 5. Escolhe rota otimizada baseada na localização
  if (destination.x < 40 && destination.y < 50) {
    path.push(mainNodes.northGate);           // Rota norte
  } else if (destination.x > 60 && destination.y < 50) {
    path.push(mainNodes.northGate);
    path.push(mainNodes.eastGate);            // Rota norte-leste
  } else if (destination.x > 60 && destination.y > 50) {
    path.push(mainNodes.eastGate);            // Rota leste
  } else if (destination.x < 40 && destination.y > 50) {
    path.push(mainNodes.southGate);           // Rota sul
  }

  // 6. Adiciona pontos de aproximação
  path.push({ x: destination.x, y: destination.y - 3 });
  path.push(destination);

  return path;
}
```

## 🗺️ Zonas de Roteamento

### Divisão do Campus em Quadrantes:

```
┌─────────────┬─────────────┐
│   NORTE     │  NORTE-LESTE │
│  (x<40,     │  (x>60,     │
│   y<50)     │   y<50)     │
├─────────────┼─────────────┤
│   OESTE     │   CENTRAL   │
│  (x<40,     │  (x:40-60,  │
│   y>50)     │   y:40-60)  │
└─────────────┴─────────────┘
```

### Estratégias de Rota por Quadrante:

1. **Norte**: Entrada → Oeste → Central → Norte → Destino
2. **Norte-Leste**: Entrada → Oeste → Central → Norte → Leste → Destino
3. **Leste**: Entrada → Oeste → Central → Leste → Destino
4. **Sul/Oeste**: Entrada → Oeste → Central → Sul → Destino

## 🎨 Renderização Visual

### Caminhos no SVG:

```tsx
{/* Linhas conectando pontos sequenciais */}
{path.points.map((point, index) => {
  if (index === path.points.length - 1) return null;
  const nextPoint = path.points[index + 1];

  return (
    <line
      key={index}
      x1={point.x} y1={point.y}
      x2={nextPoint.x} y2={nextPoint.y}
      stroke="#f59e0b"
      strokeWidth="1.2"
      strokeDasharray="3,2"
    />
  );
})}

{/* Pontos de referência */}
{path.points.map((point, index) => (
  <circle
    key={`point-${index}`}
    cx={point.x} cy={point.y}
    r="1.2"
    fill="#fbbf24"
  />
))}
```

## 🔧 Funcionalidades Avançadas

### 1. **Criação de Caminhos Customizados**
- Modo de edição permite clicar no mapa para adicionar pontos
- Caminhos são salvos e reutilizados automaticamente
- Prioridade sobre caminhos automáticos

### 2. **Sistema de Priorização**
```typescript
// Caminhos customizados têm prioridade
const customPath = customPaths.find(path => path.roomId === roomId);
if (customPath) return customPath.points;  // ✅ Usado primeiro

// Fallback para cálculo automático
return calculateAutomaticPath(room);       // 🔄 Usado se não houver customizado
```

### 3. **Pontos de Aproximação**
- Sempre adiciona um ponto 3 unidades antes do destino
- Melhora a experiência visual da navegação
- Evita sobreposição com o ícone da sala

## 📊 Exemplos Práticos

### Caminho para Biblioteca (x:45, y:65):
```
Entrada (10,10) → Oeste (15,50) → Central (50,50) → Sul (50,85) → Aproximação (45,62) → Biblioteca (45,65)
```

### Caminho para Lab Info (x:68, y:28):
```
Entrada (10,10) → Oeste (15,50) → Central (50,50) → Norte (50,15) → Leste (85,50) → Aproximação (68,25) → Lab (68,28)
```

## 🚀 Extensões Futuras

### Possíveis Melhorias:
1. **Algoritmo A*** para rotas otimizadas
2. **Múltiplos andares** com elevadores/escadas
3. **Caminhos acessíveis** para pessoas com deficiência
4. **Integração GPS** para navegação em tempo real
5. **Cache de rotas** para performance
6. **Edição visual** de caminhos existentes

Este sistema permite caminhos complexos e realistas que podem passar por múltiplos pontos estratégicos do campus, oferecendo flexibilidade tanto para rotas automáticas quanto para personalização manual.</content>
<parameter name="filePath">c:\Users\chenr\Documents\sismapifgoianofront\sismapifgoianofront\PATH_SYSTEM.md