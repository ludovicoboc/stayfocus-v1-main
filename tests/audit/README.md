# 📋 Sistema de Auditoria Completo - StayFocus

Este sistema fornece auditorias automatizadas para todas as páginas da aplicação StayFocus, testando funcionalidades, usabilidade, performance e acessibilidade.

## 🏗️ Estrutura

```
tests/audit/
├── base-audit.ts              # Classe base comum para todas as auditorias
├── run-all-audits.ts          # Script principal para executar todas as auditorias
├── home-audit.ts              # Auditoria da página inicial
├── auth-audit.ts              # Auditoria da página de autenticação
├── alimentacao-audit.ts       # Auditoria da página de alimentação
├── concursos-audit.ts         # Auditoria da página de concursos (existente)
├── estudos-audit.ts           # Auditoria da página de estudos
├── receitas-audit.ts          # Auditoria da página de receitas
├── financas-audit.ts          # Auditoria da página de finanças
└── README.md                  # Esta documentação
```

## 🚀 Como Usar

### Executar Todas as Auditorias

```typescript
import { runAllPageAudits } from './tests/audit/run-all-audits';

// Usar configuração padrão
await runAllPageAudits();

// Ou personalizar configuração
await runAllPageAudits({
  baseUrl: 'https://meusite.com',
  credentials: {
    email: 'teste@exemplo.com',
    password: 'minhasenha'
  },
  screenshots: true
});
```

### Executar Auditoria Individual

```typescript
import { HomeAudit } from './tests/audit/home-audit';

const config = {
  baseUrl: 'http://localhost:3000',
  credentials: { email: 'teste@exemplo.com', password: 'senha123' },
  timeouts: { navigation: 30000, interaction: 5000, loading: 10000 },
  screenshots: true
};

const audit = new HomeAudit(config);
const results = await audit.runFullAudit();
console.log(audit.generateReport());
```

## 📊 Páginas Auditadas

### 🏠 Home (`/`)
- **Funcionalidades testadas:**
  - Layout do dashboard principal
  - Cards de navegação
  - Links de acesso rápido
  - Widgets informativos

### 🔐 Autenticação (`/auth`)
- **Funcionalidades testadas:**
  - Formulário de login
  - Formulário de registro
  - Recuperação de senha
  - Validações e segurança
  - Login social

### 🍽️ Alimentação (`/alimentacao`)
- **Funcionalidades testadas:**
  - Registro de refeições
  - Histórico alimentar
  - Cálculos nutricionais
  - Acompanhamento de metas
  - Integração com planejador

### 📚 Concursos (`/concursos`)
- **Funcionalidades testadas:**
  - Lista de concursos
  - Adição manual de concursos
  - Importação via JSON
  - Navegação e detalhes

### 📖 Estudos (`/estudos`)
- **Funcionalidades testadas:**
  - Acesso a simulados
  - Simulado personalizado
  - Cronograma de estudos
  - Estatísticas de performance
  - Materiais de estudo

### 🍳 Receitas (`/receitas`)
- **Funcionalidades testadas:**
  - Lista de receitas
  - Adição e edição de receitas
  - Detalhes de receitas
  - Lista de compras
  - Busca e filtros

### 💰 Finanças (`/financas`)
- **Funcionalidades testadas:**
  - Dashboard financeiro
  - Gestão de receitas/despesas
  - Relatórios financeiros
  - Metas financeiras
  - Categorias de transações

## 🧪 Tipos de Testes

### ✅ Testes Básicos (Todas as Páginas)
- **Acesso**: Carregamento da página
- **Autenticação**: Login funcional
- **Layout**: Estrutura básica (header, nav, main)
- **Responsividade**: Mobile, tablet, desktop
- **Performance**: Tempo de carregamento, recursos
- **Acessibilidade**: Labels, botões, contraste
- **Erros**: Tratamento de páginas 404

### 🎯 Testes Específicos por Página
Cada página possui testes customizados para suas funcionalidades únicas.

## 📋 Resultados e Relatórios

### Status dos Testes
- **✅ PASS**: Teste passou com sucesso
- **❌ FAIL**: Teste falhou (problema crítico)
- **⚠️ WARNING**: Teste passou com ressalvas

### Relatório Consolidado
```
📊 RELATÓRIO CONSOLIDADO DE AUDITORIA
===============================

📋 Resultados por Página:
  Home            |  8 ✅ |  0 ❌ |  2 ⚠️ | 80.0% | 1500ms
  Autenticação    |  6 ✅ |  1 ❌ |  1 ⚠️ | 75.0% | 2100ms
  Alimentação     |  7 ✅ |  0 ❌ |  3 ⚠️ | 70.0% | 1800ms

📊 Estatísticas Gerais:
  Total de Páginas: 7
  Taxa de Sucesso: 75.2%
  Tempo Total: 12500ms
```

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# .env
BASE_URL=http://localhost:3000
TEST_EMAIL=teste@exemplo.com
TEST_PASSWORD=senha123
```

### Configuração Personalizada
```typescript
const config: AuditConfig = {
  baseUrl: 'https://meusite.com',
  credentials: {
    email: 'usuario@teste.com',
    password: 'senhasegura'
  },
  timeouts: {
    navigation: 30000,    // Tempo limite para navegação
    interaction: 5000,    // Tempo limite para interações
    loading: 10000        // Tempo limite para carregamento
  },
  screenshots: true       // Capturar screenshots
};
```

## 🛠️ Extensão e Personalização

### Adicionar Nova Página
1. Crie um novo arquivo `nova-pagina-audit.ts`
2. Estenda a classe `BaseAudit`
3. Implemente o método `runPageSpecificTests()`
4. Adicione no `run-all-audits.ts`

```typescript
import { BaseAudit, AuditConfig } from './base-audit';

export class NovaPageAudit extends BaseAudit {
  constructor(config: AuditConfig) {
    super(config, 'Nova Página');
  }

  protected getPageUrl(): string {
    return `${this.config.baseUrl}/nova-pagina`;
  }

  protected async runPageSpecificTests(): Promise<void> {
    await this.testFuncionalidadeEspecifica();
  }

  private async testFuncionalidadeEspecifica(): Promise<void> {
    // Implementar teste específico
  }
}
```

### Adicionar Novo Teste
```typescript
private async testNovaFuncionalidade(): Promise<void> {
  const startTime = Date.now();

  try {
    console.log('🔧 Testando nova funcionalidade...');

    const elementos = await this.evaluate(() => {
      return {
        temFuncionalidade: !!document.querySelector('.funcionalidade'),
        temBotao: !!document.querySelector('button.acao')
      };
    });

    if (elementos.temFuncionalidade && elementos.temBotao) {
      this.addResult('NOVA_FUNCIONALIDADE', 'PASS', 'Funcionalidade implementada', Date.now() - startTime);
    } else {
      this.addResult('NOVA_FUNCIONALIDADE', 'WARNING', 'Funcionalidade incompleta', Date.now() - startTime);
    }

  } catch (error) {
    this.addResult('NOVA_FUNCIONALIDADE', 'FAIL', `Erro: ${error}`, Date.now() - startTime);
  }
}
```

## 📝 Logs e Debugging

O sistema fornece logs detalhados durante a execução:

```
🚀 Iniciando Auditoria Completa da Aplicação StayFocus
📋 Total de 7 páginas para auditar

🔍 Iniciando auditoria: Home
🏠 Testando layout do dashboard...
✅ DASHBOARD_LAYOUT: Layout do dashboard carregado corretamente (850ms)
🗂️ Testando cards de navegação...
✅ NAVIGATION_CARDS: 6/8 cards funcionais (420ms)
```

## 🚀 Integração com CI/CD

Para usar em pipelines automatizados:

```yaml
# .github/workflows/audit.yml
- name: Run Page Audits
  run: |
    npm install
    npm run audit:pages
```

## 📊 Métricas Monitoradas

- **Performance**: Tempo de carregamento, recursos carregados
- **Funcionalidade**: Botões, formulários, navegação
- **Usabilidade**: Responsividade, acessibilidade
- **Conteúdo**: Presença de elementos essenciais
- **Interatividade**: Cliques, submissões, navegação

## 🎯 Objetivos

1. **Qualidade**: Garantir que todas as páginas funcionem corretamente
2. **Usabilidade**: Verificar experiência do usuário
3. **Performance**: Monitorar velocidade de carregamento
4. **Acessibilidade**: Garantir inclusividade
5. **Consistência**: Manter padrões entre páginas

---

*Sistema de auditoria criado para garantir a qualidade e funcionalidade da aplicação StayFocus em todas as suas páginas.*