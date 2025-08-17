# MCPs (Model Context Protocols) - Funcionalidades Disponíveis

Este documento descreve as funcionalidades dos MCPs configurados no projeto StayFocus.

## 🗃️ Supabase MCP (`@supabase-community/supabase-mcp`)

O Supabase MCP fornece integração direta com o banco de dados Supabase, permitindo operações CRUD e gerenciamento do projeto.

### Funcionalidades Principais:

#### 📊 Gerenciamento de Dados
- **`list_tables`** - Lista todas as tabelas do banco de dados com suas colunas, constraints e relacionamentos
- **`execute_sql`** - Executa consultas SQL diretamente no banco de dados
- **`apply_migration`** - Aplica migrações DDL ao banco de dados
- **`list_migrations`** - Lista todas as migrações aplicadas

#### 🌿 Branches de Desenvolvimento
- **`list_branches`** - Lista todas as branches de desenvolvimento do projeto
- **`create_branch`** - Cria uma nova branch de desenvolvimento (requer confirmação de custo)
- **`delete_branch`** - Remove uma branch de desenvolvimento
- **`merge_branch`** - Faz merge de uma branch para produção
- **`reset_branch`** - Reseta uma branch para uma versão específica
- **`rebase_branch`** - Rebase uma branch com as mudanças de produção

#### 🔧 Configuração e Monitoramento
- **`list_extensions`** - Lista extensões instaladas no banco
- **`get_project_url`** - Obtém a URL da API do projeto
- **`get_anon_key`** - Obtém a chave anônima do projeto
- **`get_logs`** - Obtém logs do projeto (api, postgres, auth, storage, etc.)
- **`get_advisors`** - Obtém alertas de segurança e performance

#### ⚡ Edge Functions
- **`list_edge_functions`** - Lista todas as Edge Functions do projeto
- **`deploy_edge_function`** - Faz deploy de uma Edge Function

#### 🔍 Documentação
- **`search_docs`** - Busca na documentação oficial do Supabase usando GraphQL

#### 📝 TypeScript
- **`generate_typescript_types`** - Gera tipos TypeScript baseados no schema do banco

### Configuração Atual:
```json
{
  "command": "cmd",
  "args": [
    "/c", "npx", "-y", "@smithery/cli@latest", "run",
    "@supabase-community/supabase-mcp",
    "--key", "efc69848-d619-4ed1-98a8-00752144e4b0",
    "--profile", "tall-receptionist-W5AQW9"
  ]
}
```

---

## 🎭 Playwright Automation MCP (`@microsoft/playwright-mcp`)

O Playwright MCP fornece automação completa de navegador web para testes end-to-end e interações automatizadas.

### Funcionalidades Principais:

#### 🌐 Navegação
- **`navigate`** - Navega para uma URL específica
- **`navigate_back`** - Volta para a página anterior
- **`navigate_forward`** - Avança para a próxima página
- **`browser_close`** - Fecha o navegador

#### 🖱️ Interações
- **`click`** - Clica em elementos da página (esquerdo, direito, duplo)
- **`type`** - Digita texto em campos de entrada
- **`press_key`** - Pressiona teclas específicas do teclado
- **`hover`** - Passa o mouse sobre elementos
- **`drag`** - Arrasta e solta elementos
- **`select_option`** - Seleciona opções em dropdowns

#### 👀 Captura e Análise
- **`take_screenshot`** - Captura screenshots da página ou elementos específicos
- **`snapshot`** - Captura snapshot de acessibilidade da página
- **`console_messages`** - Retorna todas as mensagens do console
- **`network_requests`** - Lista todas as requisições de rede

#### 🗂️ Gerenciamento de Abas
- **`tab_list`** - Lista todas as abas abertas
- **`tab_new`** - Abre uma nova aba
- **`tab_select`** - Seleciona uma aba específica
- **`tab_close`** - Fecha uma aba

#### ⚙️ Configuração
- **`browser_resize`** - Redimensiona a janela do navegador
- **`browser_install`** - Instala o navegador especificado
- **`handle_dialog`** - Manipula diálogos (alert, confirm, prompt)

#### 📁 Upload e JavaScript
- **`file_upload`** - Faz upload de arquivos
- **`evaluate`** - Executa código JavaScript na página

#### ⏱️ Sincronização
- **`wait_for`** - Aguarda condições específicas (texto aparecer/desaparecer, tempo)

### Configuração Atual:
```json
{
  "type": "stdio",
  "command": "npx",
  "args": [
    "-y", "@smithery/cli@latest", "run",
    "@microsoft/playwright-mcp",
    "--key", "efc69848-d619-4ed1-98a8-00752144e4b0"
  ]
}
```

---

## 🚀 Casos de Uso Práticos

### Com Supabase MCP:
- ✅ Análise e debugging de dados em produção
- ✅ Aplicação de migrações e mudanças de schema
- ✅ Monitoramento de performance e logs
- ✅ Desenvolvimento seguro com branches
- ✅ Deploy de serverless functions
- ✅ Geração automática de tipos TypeScript

### Com Playwright MCP:
- ✅ Testes automatizados de interface
- ✅ Automação de fluxos de usuário
- ✅ Captura de evidências visuais
- ✅ Verificação de acessibilidade
- ✅ Monitoramento de performance frontend
- ✅ Automação de tarefas repetitivas

---

## 📋 Notas de Segurança

- **Supabase MCP**: Conecta diretamente ao banco de dados de produção - usar com cuidado
- **Playwright MCP**: Pode interagir com qualquer site - validar URLs antes de usar
- **Ambos MCPs**: Configurados com chaves de API que devem ser mantidas seguras

---

*Documento gerado automaticamente em: ${new Date().toLocaleString('pt-BR')}*
