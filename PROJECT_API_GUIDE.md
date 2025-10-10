# Guia da API de Projetos

Este documento descreve como utilizar a API de projetos no frontend do sistema.

## Endpoints Disponíveis

### 1. Criar um Novo Projeto
**POST** `/api/project/`

Cria um novo projeto no sistema associado a uma sala.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Novo Projeto",
  "type": "Banner",
  "startAt": "2025-09-25T10:00:00.000Z",
  "endAt": "2025-09-25T12:00:00.000Z",
  "roomId": 1
}
```

**Resposta (201):**
```json
{
  "id": 1,
  "title": "Novo Projeto",
  "type": "Banner",
  "startAt": "2025-09-25T10:00:00.000Z",
  "endAt": "2025-09-25T12:00:00.000Z",
  "roomId": 1,
  "room": {
    "id": 1,
    "name": "Sala de Reuniões A",
    "x": 10,
    "y": 20,
    "description": "Sala para reuniões pequenas",
    "capacity": 10,
    "type": "meeting",
    "floor": 1,
    "building": "Prédio Principal",
    "amenities": ["projetor", "quadro branco"],
    "path": [[20, 15]],
    "createdAt": "2025-10-09T22:30:05.582Z",
    "updatedAt": "2025-10-09T22:30:05.582Z"
  },
  "createdAt": "2025-10-09T22:30:05.582Z",
  "updatedAt": "2025-10-09T22:30:05.582Z"
}
```

### 2. Listar Todos os Projetos
**GET** `/api/project/`

Lista todos os projetos do sistema.

**Headers:**
```
Nenhum header de autenticação necessário (endpoint público)
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "title": "Apresentação de Projeto",
    "type": "palestra",
    "startAt": "2025-09-25T10:00:00.000Z",
    "endAt": "2025-09-25T12:00:00.000Z",
    "roomId": 1,
    "room": { /* dados da sala */ },
    "createdAt": "2025-10-09T22:30:05.589Z",
    "updatedAt": "2025-10-09T22:30:05.589Z"
  }
]
```

### 3. Buscar Projeto por ID
**GET** `/api/project/{id}`

Busca um projeto específico pelo ID.

**Headers:**
```
Authorization: Bearer {token}
```

**Parâmetros:**
- `id` (path) - ID do projeto a ser buscado

**Resposta (200):**
```json
{
  "id": 1,
  "title": "Apresentação de Projeto",
  "type": "palestra",
  "startAt": "2025-09-25T10:00:00.000Z",
  "endAt": "2025-09-25T12:00:00.000Z",
  "roomId": 1,
  "room": { /* dados da sala */ },
  "createdAt": "2025-10-09T22:30:05.595Z",
  "updatedAt": "2025-10-09T22:30:05.595Z"
}
```

### 4. Atualizar Projeto
**PUT** `/api/project/{id}`

Atualiza um projeto existente.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parâmetros:**
- `id` (path) - ID do projeto a ser atualizado

**Body:**
```json
{
  "title": "Projeto Atualizado",
  "type": "Banner",
  "startAt": "2025-09-25T10:00:00.000Z",
  "endAt": "2025-09-25T12:00:00.000Z",
  "roomId": 1
}
```

**Resposta (200):**
```json
{
  "id": 1,
  "title": "Projeto Atualizado",
  "type": "Banner",
  "startAt": "2025-09-25T10:00:00.000Z",
  "endAt": "2025-09-25T12:00:00.000Z",
  "roomId": 1,
  "room": { /* dados da sala */ },
  "createdAt": "2025-10-09T22:30:05.603Z",
  "updatedAt": "2025-10-09T22:30:05.603Z"
}
```

### 5. Deletar Projeto
**DELETE** `/api/project/{id}`

Remove um projeto do sistema.

**Headers:**
```
Authorization: Bearer {token}
```

**Parâmetros:**
- `id` (path) - ID do projeto a ser deletado

**Resposta (204):**
```
No Content
```

## Uso no Frontend

### Importação
```typescript
import { api } from '@/services/api';
import type { CreateProjectRequest, UpdateProjectRequest, Project } from '@/types';
```

### Exemplos de Uso

#### Criar um Projeto
```typescript
const createNewProject = async () => {
  try {
    const projectData: CreateProjectRequest = {
      title: "Workshop de React",
      type: "Workshop",
      startAt: "2025-10-15T14:00:00.000Z",
      endAt: "2025-10-15T18:00:00.000Z",
      roomId: 5
    };
    
    const project = await api.createProject(projectData);
    console.log('Projeto criado:', project);
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
  }
};
```

#### Listar Projetos
```typescript
const fetchAllProjects = async () => {
  try {
    const projects = await api.getProjects();
    console.log('Projetos:', projects);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
  }
};
```

#### Buscar Projeto Específico
```typescript
const fetchProjectById = async (projectId: string) => {
  try {
    const project = await api.getProject(projectId);
    console.log('Projeto encontrado:', project);
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
  }
};
```

#### Atualizar Projeto
```typescript
const updateExistingProject = async (projectId: string) => {
  try {
    const updateData: UpdateProjectRequest = {
      title: "Workshop de React - Atualizado",
      type: "Workshop Avançado"
    };
    
    const updatedProject = await api.updateProject(projectId, updateData);
    console.log('Projeto atualizado:', updatedProject);
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
  }
};
```

#### Deletar Projeto
```typescript
const removeProject = async (projectId: string) => {
  try {
    await api.deleteProject(projectId);
    console.log('Projeto deletado com sucesso');
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
  }
};
```

## Uso com Context Provider

O sistema fornece um `ProjectContext` que facilita o gerenciamento de estado dos projetos.

### Usando o ProjectContext

```typescript
import { useProject } from '@/provider/ProjectContext';

const MyComponent = () => {
  const {
    projects,
    currentProject,
    isLoading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    clearError,
    setCurrentProject
  } = useProject();

  // Carregar projetos ao montar o componente
  useEffect(() => {
    fetchProjects();
  }, []);

  // Criar um novo projeto
  const handleCreateProject = async () => {
    try {
      const newProject = await createProject({
        title: "Novo Projeto",
        type: "Palestra",
        startAt: "2025-10-15T14:00:00.000Z",
        endAt: "2025-10-15T16:00:00.000Z",
        roomId: 3
      });
      alert('Projeto criado com sucesso!');
    } catch (err) {
      alert('Erro ao criar projeto');
    }
  };

  return (
    <div>
      {isLoading && <p>Carregando...</p>}
      {error && <p>Erro: {error}</p>}
      
      <button onClick={handleCreateProject}>
        Criar Projeto
      </button>

      <ul>
        {projects.map(project => (
          <li key={project.id}>
            {project.title} - {project.type}
            <button onClick={() => deleteProject(project.id)}>
              Deletar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## Tipos TypeScript

### Project
```typescript
interface Project {
  id: number;
  title: string;
  type: string;
  startAt: string; // ISO 8601 date string
  endAt: string;   // ISO 8601 date string
  roomId: number;
  room?: Room;     // Dados da sala (incluídos na resposta)
  createdAt?: string;
  updatedAt?: string;
}
```

### CreateProjectRequest
```typescript
interface CreateProjectRequest {
  title: string;
  type: string;
  startAt: string; // ISO 8601 date string
  endAt: string;   // ISO 8601 date string
  roomId: number;
}
```

### UpdateProjectRequest
```typescript
interface UpdateProjectRequest {
  title?: string;
  type?: string;
  startAt?: string; // ISO 8601 date string
  endAt?: string;   // ISO 8601 date string
  roomId?: number;
}
```

## Códigos de Status HTTP

### Sucesso
- **200 OK** - Operação bem-sucedida (GET, PUT)
- **201 Created** - Projeto criado com sucesso (POST)
- **204 No Content** - Projeto deletado com sucesso (DELETE)

### Erro
- **400 Bad Request** - Dados inválidos
- **401 Unauthorized** - Autenticação necessária
- **403 Forbidden** - Sem permissão
- **404 Not Found** - Projeto não encontrado
- **500 Internal Server Error** - Erro no servidor

## Observações Importantes

1. **Autenticação**: Todos os endpoints de modificação (POST, PUT, DELETE) requerem autenticação via Bearer token
2. **Listagem Pública**: O endpoint GET `/api/project/` é público e não requer autenticação
3. **Formato de Datas**: Use o formato ISO 8601 para `startAt` e `endAt` (ex: "2025-09-25T10:00:00.000Z")
4. **Relacionamento com Sala**: Todo projeto deve estar associado a uma sala existente (`roomId`)
5. **Dados da Sala**: A resposta da API inclui os dados completos da sala relacionada no campo `room`

## Tratamento de Erros

```typescript
try {
  const project = await api.createProject(projectData);
  // Sucesso
} catch (error) {
  if (error instanceof Error) {
    switch (error.message) {
      case 'Erro ao criar projeto':
        // Tratar erro genérico
        break;
      // Adicionar mais casos específicos conforme necessário
    }
  }
}
```

## Formulário de Criação

O componente `ProjectForm` já está configurado para criar projetos. Ele pode ser usado em duas modalidades:

1. **Com sala pré-selecionada**: Passa o `roomId` como prop
2. **Seleção de sala**: Exibe um select para escolher a sala

```typescript
import ProjectForm from '@/components/SimpleMap/ProjectForm';

// Uso com sala pré-selecionada
<ProjectForm
  roomId={5}
  roomName="Auditório Principal"
  onSubmit={handleCreateProject}
  onCancel={() => setShowForm(false)}
/>

// Uso com seleção de sala
<ProjectForm
  rooms={availableRooms}
  onSubmit={handleCreateProject}
  onCancel={() => setShowForm(false)}
/>
```
