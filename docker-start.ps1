# docker-start.ps1 - Script PowerShell para facilitar o uso do Docker com stayfocus-alimentacao

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [switch]$WithCache,
    [switch]$WithNginx,
    [switch]$Detach,
    [switch]$Help
)

# Configuração de cores
$ErrorActionPreference = "Stop"

function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Show-Help {
    Write-ColorText "🚀 StayFocus Alimentação - Docker Manager" "Cyan"
    Write-Host ""
    Write-Host "Uso: .\docker-start.ps1 [COMANDO] [OPÇÕES]"
    Write-Host ""
    Write-Host "Comandos disponíveis:"
    Write-ColorText "  dev              Inicia ambiente de desenvolvimento" "Green"
    Write-ColorText "  prod             Inicia ambiente de produção" "Green"
    Write-ColorText "  build            Constrói as imagens Docker" "Green"
    Write-ColorText "  stop             Para todos os containers" "Green"
    Write-ColorText "  clean            Remove containers e volumes" "Green"
    Write-ColorText "  logs             Mostra logs da aplicação" "Green"
    Write-ColorText "  setup            Configuração inicial" "Green"
    Write-ColorText "  health           Verifica saúde da aplicação" "Green"
    Write-ColorText "  supabase-local   Inicia Supabase local completo" "Green"
    Write-Host ""
    Write-Host "Opções:"
    Write-Host "  -WithCache       Inclui Redis cache"
    Write-Host "  -WithNginx       Inclui Nginx proxy"
    Write-Host "  -Detach          Executa em background"
    Write-Host "  -Help            Mostra esta ajuda"
    Write-Host ""
    Write-Host "Exemplos:"
    Write-Host "  .\docker-start.ps1 dev                     # Desenvolvimento padrão"
    Write-Host "  .\docker-start.ps1 prod -WithNginx         # Produção com Nginx"
    Write-Host "  .\docker-start.ps1 dev -WithCache          # Dev com Redis cache"
    Write-Host "  .\docker-start.ps1 supabase-local          # Supabase local completo"
}

function Test-DockerRunning {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        Write-ColorText "❌ Docker não está rodando!" "Red"
        Write-ColorText "Por favor, inicie o Docker Desktop primeiro." "Yellow"
        exit 1
    }
}

function Test-EnvFiles {
    if (-not (Test-Path ".env.local") -and -not (Test-Path ".env.production")) {
        Write-ColorText "⚠️  Arquivo de ambiente não encontrado!" "Yellow"
        Write-ColorText "Criando .env.local a partir do .env.example..." "Cyan"
        
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env.local"
            Write-ColorText "✅ .env.local criado!" "Green"
            Write-ColorText "📝 Por favor, edite .env.local com suas configurações reais do Supabase." "Yellow"
        }
        else {
            Write-ColorText "❌ .env.example não encontrado!" "Red"
            exit 1
        }
    }
}

function Build-Images {
    Write-ColorText "🔨 Construindo imagens Docker..." "Cyan"
    docker-compose build --no-cache
    Write-ColorText "✅ Imagens construídas com sucesso!" "Green"
}

function Start-Dev {
    $profiles = "dev"
    $extraArgs = @()
    
    if ($WithCache) {
        $profiles += ",cache"
    }
    
    if ($Detach) {
        $extraArgs += "-d"
    }
    
    Write-ColorText "🚀 Iniciando ambiente de desenvolvimento..." "Cyan"
    Write-ColorText "📋 Profiles: $profiles" "Yellow"
    
    Test-EnvFiles
    
    $profileArgs = $profiles.Split(',') | ForEach-Object { "--profile"; $_ }
    docker-compose @profileArgs up @extraArgs
}

function Start-Prod {
    $profiles = "prod"
    $extraArgs = @()
    
    if ($WithNginx) {
        $profiles += ",nginx"
    }
    
    if ($WithCache) {
        $profiles += ",cache"
    }
    
    if ($Detach) {
        $extraArgs += "-d"
    }
    
    Write-ColorText "🚀 Iniciando ambiente de produção..." "Cyan"
    Write-ColorText "📋 Profiles: $profiles" "Yellow"
    
    # Verificar se .env.production existe
    if (-not (Test-Path ".env.production")) {
        Write-ColorText "⚠️  .env.production não encontrado!" "Yellow"
        Write-ColorText "Criando a partir do .env.example..." "Cyan"
        Copy-Item ".env.example" ".env.production"
        Write-ColorText "✅ .env.production criado!" "Green"
        Write-ColorText "📝 Por favor, edite .env.production com configurações de produção." "Yellow"
    }
    
    # Construir imagem se necessário
    Build-Images
    
    # Iniciar com profiles
    $profileArgs = $profiles.Split(',') | ForEach-Object { "--profile"; $_ }
    docker-compose @profileArgs up @extraArgs
}

function Start-SupabaseLocal {
    Write-ColorText "🗄️  Iniciando Supabase local completo..." "Cyan"
    Write-ColorText "⚠️  Isso inclui PostgreSQL, Auth e REST API locais" "Yellow"
    
    Test-EnvFiles
    docker-compose --profile supabase-local --profile dev up -d
    
    Write-ColorText "✅ Supabase local iniciado!" "Green"
    Write-ColorText "📍 Endpoints disponíveis:" "Cyan"
    Write-Host "   - App: http://localhost:3000"
    Write-Host "   - Database: postgresql://postgres:postgres@localhost:54322/postgres"
    Write-Host "   - Auth: http://localhost:9999"
    Write-Host "   - REST API: http://localhost:3001"
}

function Stop-Containers {
    Write-ColorText "⏹️  Parando containers..." "Yellow"
    docker-compose down
    Write-ColorText "✅ Containers parados!" "Green"
}

function Remove-Containers {
    Write-ColorText "🧹 Removendo containers e volumes..." "Yellow"
    docker-compose down -v --remove-orphans
    docker system prune -f
    Write-ColorText "✅ Limpeza concluída!" "Green"
}

function Show-Logs {
    $service = "app-dev"
    
    # Verificar se prod está rodando
    $containers = docker ps --format "table {{.Names}}" | Select-String "stayfocus-prod"
    if ($containers) {
        $service = "app-prod"
    }
    
    Write-ColorText "📋 Mostrando logs do serviço: $service" "Cyan"
    docker-compose logs -f $service
}

function Test-Health {
    Write-ColorText "🔍 Verificando saúde da aplicação..." "Cyan"
    
    $url = "http://localhost:3000/api/health"
    
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-ColorText "✅ Aplicação saudável!" "Green"
            Write-ColorText "📊 Detalhes:" "Cyan"
            $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
        }
        else {
            Write-ColorText "❌ Aplicação com problemas (HTTP $($response.StatusCode))" "Red"
            Write-Host $response.Content
        }
    }
    catch {
        Write-ColorText "❌ Não foi possível conectar à aplicação" "Red"
        Write-Host $_.Exception.Message
    }
}

function Initialize-Setup {
    Write-ColorText "⚙️  Configuração inicial do Docker..." "Cyan"
    
    # Verificar Docker
    Test-DockerRunning
    
    # Criar arquivo de ambiente
    Test-EnvFiles
    
    # Construir imagens
    Build-Images
    
    Write-ColorText "✅ Configuração inicial concluída!" "Green"
    Write-ColorText "💡 Próximos passos:" "Yellow"
    Write-Host "1. Edite .env.local com suas configurações do Supabase"
    Write-Host "2. Execute: .\docker-start.ps1 dev"
}

# Função principal
function Main {
    # Verificar se está no diretório correto
    if (-not (Test-Path "package.json")) {
        Write-ColorText "❌ Este script deve ser executado na raiz do projeto!" "Red"
        exit 1
    }
    
    # Verificar Docker
    Test-DockerRunning
    
    # Processar comando
    switch ($Command.ToLower()) {
        "dev" {
            Start-Dev
        }
        "prod" {
            Start-Prod
        }
        "build" {
            Build-Images
        }
        "stop" {
            Stop-Containers
        }
        "clean" {
            Remove-Containers
        }
        "logs" {
            Show-Logs
        }
        "health" {
            Test-Health
        }
        "supabase-local" {
            Start-SupabaseLocal
        }
        "setup" {
            Initialize-Setup
        }
        "help" {
            Show-Help
        }
        default {
            Write-ColorText "❌ Comando inválido: $Command" "Red"
            Write-Host ""
            Show-Help
            exit 1
        }
    }
}

# Mostrar ajuda se solicitado
if ($Help) {
    Show-Help
    exit 0
}

# Executar função principal
Main