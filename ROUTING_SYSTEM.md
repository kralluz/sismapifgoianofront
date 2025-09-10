# Sistema de Roteamento - SisMap IF

## Funcionalidades Implementadas

### 🔐 Autenticação
- **Login**: Tela de login com autenticação de usuários
- **Registro**: Possibilidade de criar novos usuários (requer credenciais de admin)
- **Contexto de Autenticação**: Gerenciamento global do estado de autenticação

### 🧭 Rotas Implementadas

#### Rotas Públicas
- `/login` - Tela de login/registro

#### Rotas Protegidas (Requer Login)
- `/` - Página inicial (Mapa do Campus)
- `/mapa` - Mapa do Campus (todos os usuários autenticados)
- `/usuarios` - Listagem de usuários (**APENAS ADMINISTRADORES**)

### 👥 Controle de Acesso

#### Usuários Comuns
- ✅ Podem acessar o mapa do campus
- ✅ Podem fazer login/logout
- ❌ **NÃO** podem acessar listagem de usuários
- ❌ **NÃO** podem criar novos usuários

#### Administradores
- ✅ Podem acessar todas as funcionalidades de usuários comuns
- ✅ Podem acessar listagem de usuários
- ✅ Podem criar novos usuários
- ✅ Podem deletar usuários (exceto a própria conta)

### 🛠️ Componentes Criados

#### `AppRoutes.tsx`
- Gerenciamento principal das rotas
- Proteção de rotas baseada em autenticação
- Redirecionamento baseado em roles

#### `Layout.tsx`
- Layout principal da aplicação
- Navegação com menu responsivo
- Informações do usuário logado
- Botão de logout

#### `UserList.tsx`
- Listagem de usuários para administradores
- Busca de usuários
- Criação de novos usuários
- Exclusão de usuários
- Interface responsiva

#### `AuthContext.tsx`
- Contexto global de autenticação
- Gerenciamento de estado do usuário
- Funções de login/registro/logout
- Persistência no localStorage

### 🔧 API Services

#### `authAPI`
- Login de usuários
- Registro de usuários
- Endpoints: `/auth/login`, `/auth/register`, `/login`, `/register`

#### `userAPI`
- Listagem de usuários (admin)
- Criação de usuários (admin)
- Atualização de usuários (admin)
- Exclusão de usuários (admin)
- Endpoints: `/users/*`

### 🚀 Como Usar

1. **Primeiro Acesso**:
   - Acesse `http://localhost:5173/`
   - Será redirecionado para `/login`
   - Clique em "Não tem conta? Registre-se"
   - Preencha os dados e credenciais de admin
   - Após registro, será logado automaticamente

2. **Login Existente**:
   - Acesse `http://localhost:5173/login`
   - Insira email e senha
   - Será redirecionado para o mapa

3. **Administração (apenas admins)**:
   - No menu superior, clique em "Usuários"
   - Visualize, crie e gerencie usuários
   - Use a busca para encontrar usuários específicos

4. **Navegação**:
   - Use o menu superior para navegar
   - "Mapa" - Acesso ao mapa do campus
   - "Usuários" - Gerenciamento (só admins)
   - Ícone do usuário - Informações da conta
   - "Sair" - Logout

### 🔒 Segurança

- Rotas protegidas por autenticação
- Controle de acesso baseado em roles
- Validação de permissões no frontend
- Tokens de autenticação armazenados localmente
- Redirecionamento automático para login quando não autenticado

### 📱 Responsividade

- Interface totalmente responsiva
- Menu mobile com hamburger
- Tabelas adaptáveis em dispositivos móveis
- Formulários otimizados para touch

### 🛣️ Fluxo de Navegação

```
Usuário não logado → /login → (após login) → /mapa
Usuário comum → /mapa (acesso limitado)
Administrador → /mapa + /usuarios (acesso completo)
```

### ⚡ Principais Tecnologias

- **React Router DOM**: Gerenciamento de rotas
- **React Context**: Estado global de autenticação
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **Lucide React**: Ícones

O sistema está pronto para uso e expansão, seguindo as melhores práticas de React e segurança web!
