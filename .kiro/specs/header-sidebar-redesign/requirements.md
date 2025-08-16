# Requirements Document

## Introduction

Este documento define os requisitos para redesenhar o header e sidebar da aplicação StayFocus, criando um header superior com ícones de navegação rápida e mantendo o sidebar lateral com a navegação completa. O objetivo é melhorar a experiência do usuário fornecendo acesso rápido às funcionalidades mais importantes através de um header fixo.

## Requirements

### Requirement 1

**User Story:** Como usuário da aplicação, eu quero ter um header fixo no topo da página com ícones de navegação rápida, para que eu possa acessar rapidamente as funcionalidades mais importantes sem precisar abrir o sidebar.

#### Acceptance Criteria

1. WHEN o usuário acessa qualquer página da aplicação THEN o sistema SHALL exibir um header fixo no topo da página
2. WHEN o usuário visualiza o header THEN o sistema SHALL mostrar ícones para: autenticação (chave), sono (cama), autoconhecimento (âncora), roadmap (interrogação) e configurações da conta (ícone U)
3. WHEN o usuário clica no ícone de chave THEN o sistema SHALL navegar para os componentes de autenticação
4. WHEN o usuário clica no ícone de cama THEN o sistema SHALL navegar para a rota /sono
5. WHEN o usuário clica no ícone de âncora THEN o sistema SHALL navegar para a rota /autoconhecimento
6. WHEN o usuário clica no ícone de interrogação THEN o sistema SHALL navegar para a rota /roadmap
7. WHEN o usuário clica no ícone U THEN o sistema SHALL navegar para as configurações da conta do usuário

### Requirement 2

**User Story:** Como usuário da aplicação, eu quero que o sidebar mantenha funcionalidade atual de navegação completa, para que eu ainda possa acessar todas as seções da aplicação de forma organizada.

#### Acceptance Criteria

1. WHEN o usuário visualiza o sidebar THEN o sistema SHALL manter todos os itens de navegação atuais
2. WHEN o usuário interage com o sidebar THEN o sistema SHALL manter o comportamento atual de navegação
3. WHEN o header é adicionado THEN o sistema SHALL ajustar o layout para que o sidebar não sobreponha o header
4. WHEN o usuário navega entre páginas THEN o sistema SHALL manter o estado do sidebar (aberto/fechado)

### Requirement 3

**User Story:** Como usuário da aplicação, eu quero que o header tenha um design consistente com o tema atual da aplicação, para que a interface permaneça coesa e profissional.

#### Acceptance Criteria

1. WHEN o header é exibido THEN o sistema SHALL usar as mesmas cores e estilos do tema atual (slate-800/slate-900)
2. WHEN o usuário visualiza os ícones do header THEN o sistema SHALL usar ícones apropriados da biblioteca Lucide React
3. WHEN o usuário passa o mouse sobre os ícones THEN o sistema SHALL exibir tooltips explicativos
4. WHEN o header é renderizado THEN o sistema SHALL ter altura fixa e não interferir no conteúdo da página

### Requirement 4

**User Story:** Como usuário da aplicação, eu quero que o header seja responsivo, para que eu possa usar a aplicação em diferentes tamanhos de tela mantendo a funcionalidade.

#### Acceptance Criteria

1. WHEN o usuário acessa a aplicação em dispositivos móveis THEN o sistema SHALL adaptar o header para telas menores
2. WHEN a tela é redimensionada THEN o sistema SHALL manter os ícones visíveis e funcionais
3. WHEN em telas pequenas THEN o sistema SHALL priorizar os ícones mais importantes
4. WHEN o layout é responsivo THEN o sistema SHALL manter a hierarquia visual adequada

### Requirement 5

**User Story:** Como desenvolvedor da aplicação, eu quero que as alterações sejam implementadas de forma modular, para que o código seja maintível e não quebre funcionalidades existentes.

#### Acceptance Criteria

1. WHEN as alterações são implementadas THEN o sistema SHALL criar um novo componente Header separado
2. WHEN o Header é criado THEN o sistema SHALL manter a compatibilidade com o AppSidebar existente
3. WHEN o layout é modificado THEN o sistema SHALL preservar todas as funcionalidades atuais do sidebar
4. WHEN os componentes são atualizados THEN o sistema SHALL manter a tipagem TypeScript adequada