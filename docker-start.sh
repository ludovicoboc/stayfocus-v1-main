#!/bin/bash
# docker-start.sh - Script para facilitar o uso do Docker com stayfocus-alimentacao

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir ajuda
show_help() {
    echo -e "${BLUE}🚀 StayFocus Alimentação - Docker Manager${NC}"
    echo
    echo "Uso: ./docker-start.sh [COMANDO] [OPÇÕES]"
    echo
    echo "Comandos disponíveis:"
    echo -e "  ${GREEN}dev${NC}              Inicia ambiente de desenvolvimento"
    echo -e "  ${GREEN}prod${NC}             Inicia ambiente de produção"
    echo -e "  ${GREEN}build${NC}            Constrói as imagens Docker"
    echo -e "  ${GREEN}stop${NC}             Para todos os containers"
    echo -e "  ${GREEN}clean${NC}            Remove containers e volumes"
    echo -e "  ${GREEN}logs${NC}             Mostra logs da aplicação"
    echo -e "  ${GREEN}setup${NC}            Configuração inicial"
    echo -e "  ${GREEN}health${NC}           Verifica saúde da aplicação"
    echo -e "  ${GREEN}supabase-local${NC}   Inicia Supabase local completo"
    echo
    echo "Opções:"
    echo "  -h, --help       Mostra esta ajuda"
    echo "  --with-cache     Inclui Redis cache"
    echo "  --with-nginx     Inclui Nginx proxy"
    echo "  --detach         Executa em background"
    echo
    echo "Exemplos:"
    echo "  ./docker-start.sh dev                    # Desenvolvimento padrão"
    echo "  ./docker-start.sh prod --with-nginx      # Produção com Nginx"
    echo "  ./docker-start.sh dev --with-cache       # Dev com Redis cache"
    echo "  ./docker-start.sh supabase-local         # Supabase local completo"
}

# Função para verificar se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker não está rodando!${NC}"
        echo -e "${YELLOW}Por favor, inicie o Docker Desktop primeiro.${NC}"
        exit 1
    fi
}

# Função para verificar arquivos de ambiente
check_env_files() {
    if [ ! -f ".env.local" ] && [ ! -f ".env.production" ]; then
        echo -e "${YELLOW}⚠️  Arquivo de ambiente não encontrado!${NC}"
        echo -e "${BLUE}Criando .env.local a partir do .env.example...${NC}"
        
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            echo -e "${GREEN}✅ .env.local criado!${NC}"
            echo -e "${YELLOW}📝 Por favor, edite .env.local com suas configurações reais do Supabase.${NC}"
        else
            echo -e "${RED}❌ .env.example não encontrado!${NC}"
            exit 1
        fi
    fi
}

# Função para construir imagens
build_images() {
    echo -e "${BLUE}🔨 Construindo imagens Docker...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}✅ Imagens construídas com sucesso!${NC}"
}

# Função para iniciar desenvolvimento
start_dev() {
    local profiles="dev"
    local extra_args=""
    
    # Processar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --with-cache)
                profiles="$profiles,cache"
                shift
                ;;
            --detach)
                extra_args="$extra_args -d"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo -e "${BLUE}🚀 Iniciando ambiente de desenvolvimento...${NC}"
    echo -e "${YELLOW}📋 Profiles: $profiles${NC}"
    
    check_env_files
    docker-compose --profile dev up $extra_args
}

# Função para iniciar produção
start_prod() {
    local profiles="prod"
    local extra_args=""
    
    # Processar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            --with-nginx)
                profiles="$profiles,nginx"
                shift
                ;;
            --with-cache)
                profiles="$profiles,cache"
                shift
                ;;
            --detach)
                extra_args="$extra_args -d"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo -e "${BLUE}🚀 Iniciando ambiente de produção...${NC}"
    echo -e "${YELLOW}📋 Profiles: $profiles${NC}"
    
    # Verificar se .env.production existe
    if [ ! -f ".env.production" ]; then
        echo -e "${YELLOW}⚠️  .env.production não encontrado!${NC}"
        echo -e "${BLUE}Criando a partir do .env.example...${NC}"
        cp .env.example .env.production
        echo -e "${GREEN}✅ .env.production criado!${NC}"
        echo -e "${YELLOW}📝 Por favor, edite .env.production com configurações de produção.${NC}"
    fi
    
    # Construir imagem se necessário
    build_images
    
    # Iniciar com profiles
    docker-compose $(echo $profiles | sed 's/,/ --profile /g' | sed 's/^/--profile /') up $extra_args
}

# Função para Supabase local
start_supabase_local() {
    echo -e "${BLUE}🗄️  Iniciando Supabase local completo...${NC}"
    echo -e "${YELLOW}⚠️  Isso inclui PostgreSQL, Auth e REST API locais${NC}"
    
    check_env_files
    docker-compose --profile supabase-local --profile dev up -d
    
    echo -e "${GREEN}✅ Supabase local iniciado!${NC}"
    echo -e "${BLUE}📍 Endpoints disponíveis:${NC}"
    echo "   - App: http://localhost:3000"
    echo "   - Database: postgresql://postgres:postgres@localhost:54322/postgres"
    echo "   - Auth: http://localhost:9999"
    echo "   - REST API: http://localhost:3001"
}

# Função para parar containers
stop_containers() {
    echo -e "${YELLOW}⏹️  Parando containers...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Containers parados!${NC}"
}

# Função para limpeza
clean_containers() {
    echo -e "${YELLOW}🧹 Removendo containers e volumes...${NC}"
    docker-compose down -v --remove-orphans
    docker system prune -f
    echo -e "${GREEN}✅ Limpeza concluída!${NC}"
}

# Função para mostrar logs
show_logs() {
    local service="app-dev"
    if docker ps | grep -q stayfocus-prod; then
        service="app-prod"
    fi
    
    echo -e "${BLUE}📋 Mostrando logs do serviço: $service${NC}"
    docker-compose logs -f $service
}

# Função para verificar saúde
check_health() {
    echo -e "${BLUE}🔍 Verificando saúde da aplicação...${NC}"
    
    local url="http://localhost:3000/api/health"
    local response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json $url 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Aplicação saudável!${NC}"
        echo -e "${BLUE}📊 Detalhes:${NC}"
        cat /tmp/health_response.json | jq '.' 2>/dev/null || cat /tmp/health_response.json
    else
        echo -e "${RED}❌ Aplicação com problemas (HTTP $response)${NC}"
        if [ -f /tmp/health_response.json ]; then
            cat /tmp/health_response.json
        fi
    fi
    
    rm -f /tmp/health_response.json
}

# Função para configuração inicial
setup() {
    echo -e "${BLUE}⚙️  Configuração inicial do Docker...${NC}"
    
    # Verificar Docker
    check_docker
    
    # Criar arquivo de ambiente
    check_env_files
    
    # Construir imagens
    build_images
    
    echo -e "${GREEN}✅ Configuração inicial concluída!${NC}"
    echo -e "${YELLOW}💡 Próximos passos:${NC}"
    echo "1. Edite .env.local com suas configurações do Supabase"
    echo "2. Execute: ./docker-start.sh dev"
}

# Função principal
main() {
    # Verificar se está no diretório correto
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Este script deve ser executado na raiz do projeto!${NC}"
        exit 1
    fi
    
    # Verificar Docker
    check_docker
    
    # Processar comando
    case "${1:-help}" in
        dev)
            shift
            start_dev "$@"
            ;;
        prod)
            shift
            start_prod "$@"
            ;;
        build)
            build_images
            ;;
        stop)
            stop_containers
            ;;
        clean)
            clean_containers
            ;;
        logs)
            show_logs
            ;;
        health)
            check_health
            ;;
        supabase-local)
            start_supabase_local
            ;;
        setup)
            setup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ Comando inválido: $1${NC}"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"