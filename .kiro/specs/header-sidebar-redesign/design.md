# Design Document

## Overview

Este documento descreve o design técnico para implementar um header superior com navegação rápida na aplicação StayFocus, mantendo o sidebar lateral existente. A solução criará um layout híbrido que combina acesso rápido através do header com navegação completa através do sidebar.

## Architecture

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        Header                               │
│  [🔑] [🛏️] [⚓] [❓] [U]                                    │
├─────────────────────────────────────────────────────────────┤
│        │                                                   │
│ Side   │                Main Content                       │
│ bar    │                                                   │
│        │                                                   │
│        │                                                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

- **RootLayout** (app/layout.tsx)
  - **ThemeProvider**
    - **SidebarProvider**
      - **AppHeader** (novo componente)
      - **AppSidebar** (existente, com ajustes)
      - **SidebarInset**
        - **Main Content**

## Components and Interfaces

### 1. AppHeader Component

**Localização:** `components/app-header.tsx`

**Props Interface:**
```typescript
interface AppHeaderProps {
  className?: string
}
```

**Funcionalidades:**
- Renderização de ícones de navegação rápida
- Tooltips para cada ícone
- Navegação programática usando Next.js router
- Responsividade para diferentes tamanhos de tela
- Integração com sistema de autenticação

**Ícones e Rotas:**
- 🔑 (Key) → Componentes de autenticação (modal ou dropdown)
- 🛏️ (Bed) → `/sono`
- ⚓ (Anchor) → `/autoconhecimento`
- ❓ (HelpCircle) → `/roadmap`
- 👤 (User) → Configurações da conta (dropdown com opções)

### 2. AuthenticationDropdown Component

**Localização:** `components/authentication-dropdown.tsx`

**Funcionalidades:**
- Exibir status de autenticação atual
- Opções de login/logout
- Link para perfil do usuário
- Integração com hook useAuth existente

### 3. UserAccountDropdown Component

**Localização:** `components/user-account-dropdown.tsx`

**Funcionalidades:**
- Configurações da conta
- Preferências do usuário
- Link para perfil completo
- Opção de logout

## Data Models

### HeaderNavigation Type

```typescript
interface HeaderNavigationItem {
  id: string
  icon: LucideIcon
  tooltip: string
  action: 'navigate' | 'dropdown'
  route?: string
  component?: React.ComponentType
}

const HEADER_NAVIGATION: HeaderNavigationItem[] = [
  {
    id: 'auth',
    icon: Key,
    tooltip: 'Autenticação',
    action: 'dropdown',
    component: AuthenticationDropdown
  },
  {
    id: 'sleep',
    icon: Bed,
    tooltip: 'Sono',
    action: 'navigate',
    route: '/sono'
  },
  {
    id: 'self-knowledge',
    icon: Anchor,
    tooltip: 'Autoconhecimento',
    action: 'navigate',
    route: '/autoconhecimento'
  },
  {
    id: 'roadmap',
    icon: HelpCircle,
    tooltip: 'Roadmap',
    action: 'navigate',
    route: '/roadmap'
  },
  {
    id: 'account',
    icon: User,
    tooltip: 'Configurações da Conta',
    action: 'dropdown',
    component: UserAccountDropdown
  }
]
```

## Error Handling

### Navigation Errors
- **Problema:** Rota não encontrada
- **Solução:** Fallback para página 404 ou dashboard
- **Implementação:** Try-catch no router.push()

### Authentication Errors
- **Problema:** Usuário não autenticado tentando acessar recursos protegidos
- **Solução:** Redirect para login ou exibir modal de autenticação
- **Implementação:** Verificação no useAuth hook

### Component Loading Errors
- **Problema:** Falha no carregamento de dropdowns
- **Solução:** Fallback UI com mensagem de erro
- **Implementação:** Error boundaries nos componentes dropdown

## Testing Strategy

### Unit Tests
- **AppHeader Component:**
  - Renderização correta dos ícones
  - Tooltips funcionando
  - Navegação para rotas corretas
  - Responsividade

- **AuthenticationDropdown:**
  - Estados de autenticação
  - Ações de login/logout
  - Integração com useAuth

- **UserAccountDropdown:**
  - Opções de configuração
  - Links funcionais
  - Estado do usuário

### Integration Tests
- **Layout Integration:**
  - Header não sobrepõe sidebar
  - Responsividade do layout completo
  - Navegação entre páginas mantém estado

- **Authentication Flow:**
  - Login através do header
  - Logout através do header
  - Estados de autenticação refletidos corretamente

### E2E Tests
- **User Journey:**
  - Navegação completa usando header
  - Combinação de header e sidebar
  - Fluxo de autenticação completo
  - Responsividade em diferentes dispositivos

## Styling and Theme

### CSS Classes Structure
```scss
.app-header {
  @apply fixed top-0 left-0 right-0 z-50;
  @apply bg-slate-800 border-b border-slate-700;
  @apply h-14 px-4;
  @apply flex items-center justify-between;
}

.header-nav {
  @apply flex items-center gap-4;
}

.header-nav-item {
  @apply p-2 rounded-lg;
  @apply text-slate-300 hover:text-white;
  @apply hover:bg-slate-700;
  @apply transition-colors duration-200;
}

.header-dropdown {
  @apply absolute top-full right-0 mt-2;
  @apply bg-slate-800 border border-slate-700;
  @apply rounded-lg shadow-lg;
  @apply min-w-48;
}
```

### Responsive Breakpoints
- **Mobile (< 768px):** Ícones menores, tooltips adaptados
- **Tablet (768px - 1024px):** Layout padrão
- **Desktop (> 1024px):** Layout completo com todos os elementos

## Layout Adjustments

### Sidebar Integration
- **Padding Top:** Adicionar `pt-14` ao SidebarInset para compensar header fixo
- **Z-Index:** Header com z-50, sidebar com z-40
- **Overlap Prevention:** Header com width 100%, sidebar com top offset

### Content Area
- **Main Content:** Adicionar padding-top para compensar header fixo
- **Scroll Behavior:** Manter scroll natural do conteúdo
- **Mobile Adaptation:** Header responsivo que não interfere na navegação mobile

## Performance Considerations

### Lazy Loading
- Dropdowns carregados apenas quando necessário
- Ícones otimizados através do tree-shaking do Lucide

### Memoization
- Componentes header memoizados para evitar re-renders desnecessários
- Callbacks de navegação memoizados

### Bundle Size
- Import específico de ícones Lucide
- Componentes dropdown em chunks separados se necessário