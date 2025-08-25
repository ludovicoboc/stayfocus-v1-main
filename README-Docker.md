# 🐳 Docker Configuration - StayFocus Alimentação

Este diretório contém a configuração completa do Docker para executar a aplicação StayFocus Alimentação em containers.

## 📋 Pré-requisitos

- Docker Desktop 4.0+ instalado e funcionando
- Docker Compose v2.0+
- 4GB+ de RAM disponível
- 2GB+ de espaço em disco

### Verificar instalação:
```bash
docker --version
docker-compose --version
```

## 🚀 Início Rápido

### 1. Configuração Inicial (primeira vez)
```bash
# Windows PowerShell
.\docker-start.ps1 setup

# Linux/macOS
./docker-start.sh setup
```

### 2. Editar variáveis de ambiente
Edite o arquivo `.env.local` criado com suas configurações do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Iniciar desenvolvimento
```bash
# Windows PowerShell
.\docker-start.ps1 dev

# Linux/macOS
./docker-start.sh dev
```

A aplicação estará disponível em: http://localhost:3000

## 📚 Comandos Disponíveis

### Scripts Facilitadores

| Comando | Descrição |
|---------|-----------|
| `setup` | Configuração inicial completa |
| `dev` | Ambiente de desenvolvimento |
| `prod` | Ambiente de produção |
| `build` | Construir imagens Docker |
| `stop` | Parar todos os containers |
| `clean` | Remover containers e volumes |
| `logs` | Mostrar logs da aplicação |
| `health` | Verificar saúde da aplicação |
| `supabase-local` | Supabase local completo |

### Opções Adicionais

| Opção | Descrição |
|-------|-----------|
| `-WithCache` / `--with-cache` | Incluir Redis cache |
| `-WithNginx` / `--with-nginx` | Incluir Nginx proxy |
| `-Detach` / `--detach` | Executar em background |

### Exemplos de Uso

```bash
# Desenvolvimento básico
.\docker-start.ps1 dev

# Desenvolvimento com cache Redis
.\docker-start.ps1 dev -WithCache

# Produção com Nginx e cache
.\docker-start.ps1 prod -WithNginx -WithCache -Detach

# Supabase local completo (desenvolvimento offline)
.\docker-start.ps1 supabase-local
```

## 🏗️ Arquitetura dos Containers

### Desenvolvimento (`dev` profile)
- **app-dev**: Aplicação Next.js com hot reload
- **redis** (opcional): Cache Redis
- **supabase-local** (opcional): Stack Supabase completo

### Produção (`prod` profile)
- **app-prod**: Build otimizado do Next.js
- **nginx** (opcional): Reverse proxy e balanceamento
- **redis** (opcional): Cache Redis para sessões

### Supabase Local (`supabase-local` profile)
- **supabase-db**: PostgreSQL 15
- **supabase-auth**: GoTrue (autenticação)
- **supabase-rest**: PostgREST (API REST)

## 🔧 Configuração Avançada

### Variáveis de Ambiente

#### Obrigatórias
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Opcionais
```env
# Cache Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=senha-segura

# Supabase Local
POSTGRES_PASSWORD=postgres
JWT_SECRET=chave-jwt-muito-secreta-32-caracteres-minimo

# Performance
NEXT_TELEMETRY_DISABLED=1
WATCHPACK_POLLING=true
```

### Personalizar Configurações

#### Nginx (Produção)
Edite `docker/nginx.conf` para ajustar:
- Rate limiting
- Cache policies
- SSL/TLS configuration
- Headers de segurança

#### Docker Compose
Edite `docker-compose.yml` para:
- Ajustar recursos (CPU/RAM)
- Adicionar volumes persistentes
- Configurar networks customizadas

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Docker não está rodando
```bash
# Verificar status
docker info

# Solução: Iniciar Docker Desktop
```

#### 2. Porta 3000 já está em uso
```bash
# Verificar o que está usando a porta
netstat -ano | findstr :3000

# Parar processo ou mudar porta no docker-compose.yml
```

#### 3. Erro de permissões (Linux/macOS)
```bash
# Dar permissão de execução ao script
chmod +x docker-start.sh
```

#### 4. Build falha por falta de memória
```bash
# Aumentar memória do Docker Desktop (Settings > Resources)
# Ou limpar cache:
docker system prune -a
```

### Logs e Debugging

```bash
# Ver logs da aplicação
.\docker-start.ps1 logs

# Ver logs específicos
docker-compose logs app-dev
docker-compose logs nginx

# Verificar saúde
.\docker-start.ps1 health

# Entrar no container
docker exec -it stayfocus-dev sh
```

### Limpeza de Recursos

```bash
# Limpeza básica
.\docker-start.ps1 clean

# Limpeza completa (CUIDADO: remove tudo)
docker system prune -a --volumes
```

## 🚀 Deploy em Produção

### 1. Preparar ambiente
```bash
# Copiar configuração de produção
cp .env.example .env.production

# Editar com configurações reais
# - URLs de produção
# - Chaves secretas seguras
# - Configurações de cache
```

### 2. Build e deploy
```bash
# Build de produção
.\docker-start.ps1 build

# Iniciar produção
.\docker-start.ps1 prod -WithNginx -WithCache -Detach
```

### 3. Verificações pós-deploy
```bash
# Health check
.\docker-start.ps1 health

# Logs em tempo real
.\docker-start.ps1 logs
```

## 📊 Monitoramento

### Health Checks
- **Aplicação**: http://localhost:3000/api/health
- **Nginx**: http://localhost/health
- **Containers**: `docker ps` e `docker stats`

### Métricas Disponíveis
- Uptime da aplicação
- Uso de memória
- Status dos serviços
- Conectividade com Supabase

## 🛡️ Segurança

### Práticas Implementadas
- Container non-root
- Headers de segurança
- Rate limiting
- Validação de health checks
- Isolamento de networks

### Recomendações para Produção
- Use HTTPS (configure SSL no nginx)
- Atualize regularmente as imagens base
- Configure secrets management
- Implemente backup dos volumes
- Monitor logs de segurança

## 📝 Desenvolvimento

### Estrutura de Arquivos
```
├── Dockerfile                 # Multi-stage build otimizado
├── docker-compose.yml         # Orquestração de serviços
├── .dockerignore              # Exclusões do build
├── .env.example               # Template de variáveis
├── docker-start.ps1           # Script Windows
├── docker-start.sh            # Script Linux/macOS
└── docker/
    └── nginx.conf             # Configuração Nginx
```

### Contribuindo
1. Teste mudanças localmente com `docker-start.ps1 dev`
2. Valide build de produção com `docker-start.ps1 prod`
3. Execute health checks
4. Documente mudanças

## 📞 Suporte

### Comandos de Diagnóstico
```bash
# Informações do sistema
docker system info
docker system df

# Status dos containers
docker ps -a
docker stats

# Logs detalhados
docker-compose logs --tail=100
```

### Links Úteis
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)

---

🎯 **Dica**: Use `.\docker-start.ps1 help` para ver todos os comandos disponíveis!