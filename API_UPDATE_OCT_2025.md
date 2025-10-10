# 🔄 Atualização da API de Projetos - 9 de outubro de 2025

## 📋 Resumo da Atualização

A API de projetos foi **significativamente simplificada**, removendo campos relacionados a datas e tipo, mantendo apenas as informações essenciais do projeto.

---

## 🆚 Comparação: Versão Antiga vs Nova

### Versão Antiga (Removida)
```typescript
interface Project {
  id: number;
  title: string;
  type: string;           // ❌ REMOVIDO
  startAt: string;        // ❌ REMOVIDO
  endAt: string;          // ❌ REMOVIDO
  roomId: number;
  room?: Room;            // ❌ REMOVIDO
  createdAt?: string;
  updatedAt?: string;
}
```

### Versão Nova (Atual)
```typescript
interface Project {
  id: number;
  number: number;         // ✅ ADICIONADO
  title: string;
  roomId: number;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 📊 Mudanças Detalhadas

### ❌ Campos Removidos
1. **`type`** - Tipo do projeto (Workshop, Palestra, Curso, etc.)
2. **`startAt`** - Data/hora de início
3. **`endAt`** - Data/hora de término
4. **`room`** - Objeto completo da sala relacionada

### ✅ Campos Adicionados
1. **`number`** - Número identificador do projeto (obrigatório)

### 🔄 Campos Mantidos
1. **`id`** - ID único do projeto
2. **`title`** - Título do projeto
3. **`roomId`** - ID da sala relacionada
4. **`createdAt`** - Data de criação
5. **`updatedAt`** - Data de atualização

---

## 📝 Especificação da API Atualizada

### POST `/api/project/`
**Criar novo projeto**

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "number": 1,
  "title": "Novo Projeto",
  "roomId": 1
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "number": 1,
  "title": "Novo Projeto",
  "roomId": 1,
  "createdAt": "2025-10-09T22:41:51.461Z",
  "updatedAt": "2025-10-09T22:41:51.461Z"
}
```

**Códigos de Status:**
- 201: Projeto criado com sucesso
- 400: Erro ao criar projeto
- 401: Não autorizado
- 403: Sem permissão

---

### GET `/api/project/`
**Listar todos os projetos**

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "number": 1,
    "title": "Apresentação de Projeto",
    "roomId": 1,
    "createdAt": "2025-10-09T22:41:51.464Z",
    "updatedAt": "2025-10-09T22:41:51.464Z"
  }
]
```

**Códigos de Status:**
- 200: Projetos listados com sucesso
- 500: Erro ao listar projetos

---

### GET `/api/project/{id}`
**Buscar projeto por ID**

**Response (200 OK):**
```json
{
  "id": 1,
  "number": 1,
  "title": "Apresentação de Projeto",
  "roomId": 1,
  "createdAt": "2025-10-09T22:41:51.467Z",
  "updatedAt": "2025-10-09T22:41:51.467Z"
}
```

**Códigos de Status:**
- 200: Projeto encontrado com sucesso
- 404: Projeto não encontrado
- 500: Erro ao buscar projeto

---

### PUT `/api/project/{id}`
**Atualizar projeto**

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "number": 2,
  "title": "Projeto Atualizado",
  "roomId": 1
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "number": 2,
  "title": "Projeto Atualizado",
  "roomId": 1,
  "createdAt": "2025-10-09T22:41:51.474Z",
  "updatedAt": "2025-10-09T22:41:51.474Z"
}
```

**Códigos de Status:**
- 200: Projeto atualizado com sucesso
- 400: Erro ao atualizar projeto
- 401: Não autorizado
- 403: Sem permissão
- 404: Projeto não encontrado

---

### DELETE `/api/project/{id}`
**Deletar projeto**

**Headers:**
```
Authorization: Bearer {token}
```

**Response (204 No Content):**
```
(sem conteúdo)
```

**Códigos de Status:**
- 204: Projeto deletado com sucesso
- 400: Erro ao deletar projeto
- 401: Não autorizado
- 403: Sem permissão

---

## 🔧 Alterações no Frontend

### 1. Tipos TypeScript (`src/types.ts`)

**Antes:**
```typescript
export interface CreateProjectRequest {
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  roomId: number;
}
```

**Depois:**
```typescript
export interface CreateProjectRequest {
  number: number;
  title: string;
  roomId: number;
}
```

---

### 2. Formulários de Projeto

#### Campos Removidos:
- ❌ Campo "Tipo" (input de texto)
- ❌ Campo "Data/Hora Início" (datetime-local)
- ❌ Campo "Data/Hora Fim" (datetime-local)

#### Campos Adicionados:
- ✅ Campo "Número do Projeto" (input numérico)

#### Funcionalidades Removidas:
- ❌ Conversão de datas para ISO 8601
- ❌ Validação de data fim > data início
- ❌ Tratamento de timezone

#### Exemplo do Novo Formulário:

```tsx
<form onSubmit={handleSubmit}>
  {errorMessage && (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-sm text-red-800">{errorMessage}</p>
    </div>
  )}

  {/* Campo Número */}
  <div>
    <label>Número do Projeto *</label>
    <input
      type="number"
      value={formData.number}
      onChange={(e) => setFormData({ 
        ...formData, 
        number: parseInt(e.target.value) || 0 
      })}
      placeholder="Ex: 2025, 1, 2, etc."
      min="1"
    />
  </div>

  {/* Campo Título */}
  <div>
    <label>Título do Projeto *</label>
    <input
      type="text"
      value={formData.title}
      onChange={(e) => setFormData({ 
        ...formData, 
        title: e.target.value 
      })}
      placeholder="Ex: Projeto de Extensão"
    />
  </div>

  <button type="submit">Criar Projeto</button>
</form>
```

---

### 3. Componentes Atualizados

#### ✅ `src/components/SimpleMap/ProjectForm.tsx`
- Atualizado para nova estrutura
- Campo número adicionado
- Campos de data removidos
- Validação de datas removida

#### ✅ `src/components/MapComponents/ProjectForm.tsx`
- Atualizado para nova estrutura
- Campo número adicionado
- Campos de data removidos
- Validação de datas removida

---

## 💡 Uso Atualizado

### Criar um Projeto

```typescript
import { api } from '@/services/api';

const createProject = async () => {
  try {
    const project = await api.createProject({
      number: 1,                    // ✅ Agora obrigatório
      title: "Projeto 2025",
      roomId: 5
    });
    
    console.log('Projeto criado:', project);
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

### Atualizar um Projeto

```typescript
const updateProject = async (projectId: string) => {
  try {
    const updated = await api.updateProject(projectId, {
      number: 2,                    // ✅ Pode atualizar o número
      title: "Projeto Atualizado"
    });
    
    console.log('Projeto atualizado:', updated);
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

---

## 🎯 Benefícios da Simplificação

### ✅ Vantagens:
1. **Modelo Mais Simples** - Menos campos para gerenciar
2. **Menos Validações** - Não precisa validar datas e timezones
3. **Mais Flexível** - O campo `number` pode ser usado de várias formas
4. **Menos Complexidade** - Código mais limpo e direto
5. **Melhor Performance** - Menos dados para transmitir

### ⚠️ Considerações:
1. **Perda de Funcionalidade** - Não rastreia mais datas de eventos
2. **Menos Informação** - Tipo do projeto não é mais armazenado
3. **Responsabilidade Externa** - Se precisar de datas, deve ser em outra entidade

---

## 📚 Exemplos Práticos

### Exemplo 1: Projeto Simples
```typescript
// Criar projeto com número sequencial
const project = await api.createProject({
  number: 1,
  title: "Projeto de Pesquisa em IA",
  roomId: 3
});

// Resposta:
{
  id: 15,
  number: 1,
  title: "Projeto de Pesquisa em IA",
  roomId: 3,
  createdAt: "2025-10-09T22:41:51.461Z",
  updatedAt: "2025-10-09T22:41:51.461Z"
}
```

### Exemplo 2: Usando Ano como Número
```typescript
// Usar o ano como número do projeto
const currentYear = new Date().getFullYear();

const project = await api.createProject({
  number: currentYear,          // 2025
  title: "Projeto Anual",
  roomId: 7
});
```

### Exemplo 3: Listagem e Filtragem
```typescript
// Buscar todos os projetos
const allProjects = await api.getProjects();

// Filtrar projetos por número (no frontend)
const projectsOf2025 = allProjects.filter(p => p.number === 2025);

// Filtrar projetos por sala
const roomProjects = allProjects.filter(p => p.roomId === 5);
```

---

## 🔍 Validações no Frontend

### Campo `number`
- ✅ Deve ser um número inteiro
- ✅ Deve ser maior que 0
- ✅ É obrigatório

### Campo `title`
- ✅ Deve ser uma string não vazia
- ✅ É obrigatório

### Campo `roomId`
- ✅ Deve ser um ID válido de sala existente
- ✅ É obrigatório

---

## 🚀 Status da Implementação

### ✅ Concluído
- [x] Tipos TypeScript atualizados
- [x] API service mantém tratamento de erros robusto
- [x] Formulários simplificados e funcionais
- [x] Validações básicas implementadas
- [x] Exibição de erros inline
- [x] Documentação atualizada

### 📝 Pronto para Uso
O sistema está completamente funcional e alinhado com a nova especificação da API!

---

## 📖 Referências

- [API_IMPLEMENTATION_SUMMARY.md](./API_IMPLEMENTATION_SUMMARY.md) - Resumo anterior
- [PROJECT_API_GUIDE.md](./PROJECT_API_GUIDE.md) - Guia da versão anterior
- [src/types.ts](./src/types.ts) - Tipos atualizados
- [src/services/api.ts](./src/services/api.ts) - API service
- [src/provider/ProjectContext.tsx](./src/provider/ProjectContext.tsx) - Context provider

---

## 🎉 Conclusão

A API foi **simplificada com sucesso** e todos os componentes do frontend foram atualizados para refletir a nova estrutura. O sistema está pronto para uso em produção!

**Mudança Principal:** Projetos agora são identificados por `number` ao invés de gerenciar tipo e datas de evento.
