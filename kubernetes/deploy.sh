#!/bin/bash

# Script de Deploy para Kubernetes - StayFocus Alimentação
# Uso: ./deploy.sh [prod|dev|local]

set -e

ENVIRONMENT=${1:-prod}
NAMESPACE=""
KUSTOMIZE_PATH=""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploy StayFocus Alimentação - Ambiente: $ENVIRONMENT${NC}"

# Configurar ambiente
case $ENVIRONMENT in
  "prod")
    NAMESPACE="stayfocus"
    KUSTOMIZE_PATH="."
    echo -e "${YELLOW}⚠️  Fazendo deploy em PRODUÇÃO${NC}"
    ;;
  "dev")
    NAMESPACE="stayfocus-dev"
    KUSTOMIZE_PATH="overlays/dev"
    echo -e "${GREEN}🔧 Fazendo deploy em DESENVOLVIMENTO${NC}"
    ;;
  "local")
    NAMESPACE="stayfocus-dev"
    KUSTOMIZE_PATH="overlays/local"
    echo -e "${GREEN}💻 Fazendo deploy LOCAL${NC}"
    ;;
  *)
    echo -e "${RED}❌ Ambiente inválido. Use: prod, dev ou local${NC}"
    exit 1
    ;;
esac

# Verificar se o kubectl está instalado
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl não encontrado. Instale o kubectl primeiro.${NC}"
    exit 1
fi

# Verificar se o cluster está acessível
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Não foi possível conectar ao cluster Kubernetes.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Cluster Info:${NC}"
kubectl cluster-info

# Confirmar deploy em produção
if [ "$ENVIRONMENT" = "prod" ]; then
    echo -e "${YELLOW}⚠️  ATENÇÃO: Você está fazendo deploy em PRODUÇÃO!${NC}"
    read -p "Tem certeza? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deploy cancelado${NC}"
        exit 1
    fi
fi

# Aplicar manifestos
echo -e "${BLUE}📦 Aplicando manifestos...${NC}"

# 1. Criar namespaces
echo -e "${GREEN}1. Criando namespaces...${NC}"
kubectl apply -f namespace.yaml

# 2. Aplicar secrets (primeiro para evitar dependências)
echo -e "${GREEN}2. Aplicando secrets...${NC}"
kubectl apply -f secret.yaml

# 3. Aplicar configmaps
echo -e "${GREEN}3. Aplicando configmaps...${NC}"
kubectl apply -f configmap.yaml

# 4. Aplicar services
echo -e "${GREEN}4. Aplicando services...${NC}"
kubectl apply -f service.yaml

# 5. Aplicar deployments
echo -e "${GREEN}5. Aplicando deployments...${NC}"
if [ "$ENVIRONMENT" = "prod" ]; then
    kubectl apply -f deployment-prod.yaml
    kubectl apply -f hpa.yaml
else
    kubectl apply -f deployment-dev.yaml
fi

# 6. Aplicar ingress
echo -e "${GREEN}6. Aplicando ingress...${NC}"
kubectl apply -f ingress.yaml

# Aguardar rollout
echo -e "${BLUE}⏳ Aguardando rollout...${NC}"
if [ "$ENVIRONMENT" = "prod" ]; then
    kubectl rollout status deployment/stayfocus-app -n $NAMESPACE --timeout=300s
else
    kubectl rollout status deployment/stayfocus-app-dev -n $NAMESPACE --timeout=300s
fi

# Verificar pods
echo -e "${GREEN}✅ Deploy concluído! Verificando pods...${NC}"
kubectl get pods -n $NAMESPACE

# Mostrar services
echo -e "${BLUE}🌐 Services disponíveis:${NC}"
kubectl get services -n $NAMESPACE

# Mostrar ingress
echo -e "${BLUE}🌍 Ingress configurado:${NC}"
kubectl get ingress -n $NAMESPACE

# URLs de acesso
echo -e "${GREEN}🎉 Deploy realizado com sucesso!${NC}"
if [ "$ENVIRONMENT" = "prod" ]; then
    echo -e "${BLUE}🌐 URL de Produção: https://stayfocus.your-domain.com${NC}"
    echo -e "${YELLOW}⚠️  Lembre-se de configurar o DNS para apontar para o LoadBalancer${NC}"
else
    echo -e "${BLUE}🌐 URL de Desenvolvimento: http://stayfocus-dev.your-domain.com${NC}"
    echo -e "${BLUE}🌐 NodePort: http://node-ip:30000${NC}"
fi

echo -e "${GREEN}📊 Para monitorar os logs:${NC}"
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "kubectl logs -f deployment/stayfocus-app -n $NAMESPACE"
else
    echo "kubectl logs -f deployment/stayfocus-app-dev -n $NAMESPACE"
fi