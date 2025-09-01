# Campus Map - Estrutura de Dados

Este projeto simula uma aplicação de mapa interativo do campus, com dados organizados em arquivos JSON para facilitar a manutenção e simular respostas de API.

## Estrutura de Arquivos

```
src/
├── CampusMap.tsx          # Componente principal do mapa
├── types.ts              # Definições de tipos TypeScript
├── campusMapData.json    # Dados simulados da API
└── App.tsx               # Componente raiz
```

## Dados da API (campusMapData.json)

O arquivo `campusMapData.json` contém os dados estruturados que simulam uma resposta de API:

```json
{
  "rooms": [
    {
      "id": "string",
      "name": "string",
      "x": number,
      "y": number,
      "description": "string",
      "capacity": number,
      "type": "classroom|lab|library|auditorium|restaurant|office",
      "floor": number,
      "building": "string",
      "amenities": ["string"],
      "isCustom": boolean
    }
  ],
  "events": [
    {
      "id": number,
      "title": "string",
      "room": "string",
      "time": "string",
      "date": "string",
      "attendees": number,
      "type": "string",
      "status": "ongoing|confirmed|cancelled",
      "speaker": "string",
      "priority": "high|medium|low"
    }
  ]
}
```

## Tipos TypeScript (types.ts)

Os tipos estão definidos em `types.ts` para melhor organização:

- `Room`: Interface para salas/locais
- `Event`: Interface para eventos
- `RoomType`: Union type para tipos de sala
- `Path`: Interface para caminhos personalizados
- `PopoverPosition`: Interface para posicionamento de popovers

## Como Usar

1. **Adicionar novas salas**: Edite o array `rooms` no `campusMapData.json`
2. **Adicionar eventos**: Edite o array `events` no `campusMapData.json`
3. **Modificar tipos**: Atualize as interfaces em `types.ts`
4. **Personalizar dados**: O componente carrega automaticamente os dados do JSON

## Simulação de API

Para simular uma API real, você pode:

1. Criar um arquivo `api.ts` com funções assíncronas
2. Usar `fetch` para carregar dados de um endpoint
3. Implementar cache e tratamento de erros
4. Adicionar loading states

Exemplo de implementação futura:

```typescript
// api.ts
export const fetchCampusData = async (): Promise<CampusMapData> => {
  const response = await fetch('/api/campus-data');
  return response.json();
};
```