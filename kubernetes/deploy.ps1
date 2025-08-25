# Script de Deploy para Kubernetes - StayFocus Alimentação (Windows)
# Uso: .\deploy.ps1 [prod|dev|local]

param(
    [Parameter(Position=0)]
    [ValidateSet("prod", "dev", "local")]
    [string]$Environment = "prod"
)

$ErrorActionPreference = "Stop"

# Cores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Blue "🚀 Deploy StayFocus Alimentação - Ambiente: $Environment"

# Configurar ambiente
switch ($Environment) {
    "prod" {
        $Namespace = "stayfocus"
        Write-ColorOutput Yellow "⚠️  Fazendo deploy em PRODUÇÃO"
    }
    "dev" {
        $Namespace = "stayfocus-dev"
        Write-ColorOutput Green "🔧 Fazendo deploy em DESENVOLVIMENTO"
    }
    "local" {
        $Namespace = "stayfocus-dev"
        Write-ColorOutput Green "💻 Fazendo deploy LOCAL"
    }
}

# Verificar se o kubectl está instalado
try {
    kubectl version --client | Out-Null
} catch {
    Write-ColorOutput Red "❌ kubectl não encontrado. Instale o kubectl primeiro."
    exit 1
}

# Verificar se o cluster está acessível
try {
    kubectl cluster-info | Out-Null
} catch {
    Write-ColorOutput Red "❌ Não foi possível conectar ao cluster Kubernetes."
    exit 1
}

Write-ColorOutput Blue "📋 Cluster Info:"
kubectl cluster-info

# Confirmar deploy em produção
if ($Environment -eq "prod") {
    Write-ColorOutput Yellow "⚠️  ATENÇÃO: Você está fazendo deploy em PRODUÇÃO!"
    $confirmation = Read-Host "Tem certeza? (y/N)"
    if ($confirmation -ne "y" -and $confirmation -ne "Y") {
        Write-ColorOutput Red "❌ Deploy cancelado"
        exit 1
    }
}

# Aplicar manifestos
Write-ColorOutput Blue "📦 Aplicando manifestos..."

# 1. Criar namespaces
Write-ColorOutput Green "1. Criando namespaces..."
kubectl apply -f namespace.yaml

# 2. Aplicar secrets
Write-ColorOutput Green "2. Aplicando secrets..."
kubectl apply -f secret.yaml

# 3. Aplicar configmaps
Write-ColorOutput Green "3. Aplicando configmaps..."
kubectl apply -f configmap.yaml

# 4. Aplicar services
Write-ColorOutput Green "4. Aplicando services..."
kubectl apply -f service.yaml

# 5. Aplicar deployments
Write-ColorOutput Green "5. Aplicando deployments..."
if ($Environment -eq "prod") {
    kubectl apply -f deployment-prod.yaml
    kubectl apply -f hpa.yaml
} else {
    kubectl apply -f deployment-dev.yaml
}

# 6. Aplicar ingress
Write-ColorOutput Green "6. Aplicando ingress..."
kubectl apply -f ingress.yaml

# Aguardar rollout
Write-ColorOutput Blue "⏳ Aguardando rollout..."
if ($Environment -eq "prod") {
    kubectl rollout status deployment/stayfocus-app -n $Namespace --timeout=300s
} else {
    kubectl rollout status deployment/stayfocus-app-dev -n $Namespace --timeout=300s
}

# Verificar pods
Write-ColorOutput Green "✅ Deploy concluído! Verificando pods..."
kubectl get pods -n $Namespace

# Mostrar services
Write-ColorOutput Blue "🌐 Services disponíveis:"
kubectl get services -n $Namespace

# Mostrar ingress
Write-ColorOutput Blue "🌍 Ingress configurado:"
kubectl get ingress -n $Namespace

# URLs de acesso
Write-ColorOutput Green "🎉 Deploy realizado com sucesso!"
if ($Environment -eq "prod") {
    Write-ColorOutput Blue "🌐 URL de Produção: https://stayfocus.your-domain.com"
    Write-ColorOutput Yellow "⚠️  Lembre-se de configurar o DNS para apontar para o LoadBalancer"
} else {
    Write-ColorOutput Blue "🌐 URL de Desenvolvimento: http://stayfocus-dev.your-domain.com"
    Write-ColorOutput Blue "🌐 NodePort: http://node-ip:30000"
}

Write-ColorOutput Green "📊 Para monitorar os logs:"
if ($Environment -eq "prod") {
    Write-Output "kubectl logs -f deployment/stayfocus-app -n $Namespace"
} else {
    Write-Output "kubectl logs -f deployment/stayfocus-app-dev -n $Namespace"
}