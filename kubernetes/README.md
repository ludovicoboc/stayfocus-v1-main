# Deploy no Kubernetes - StayFocus Alimentação

Este guia fornece instruções completas para fazer deploy da aplicação Next.js StayFocus Alimentação no Kubernetes.

## 📋 Pré-requisitos

### 1. Ferramentas Necessárias
- [kubectl](https://kubernetes.io/docs/tasks/tools/) - CLI do Kubernetes
- [Docker](https://docs.docker.com/get-docker/) - Para build das imagens
- [kustomize](https://kustomize.io/) (opcional) - Para personalização avançada
- Cluster Kubernetes (local ou cloud)

### 2. Cluster Kubernetes
Você pode usar qualquer um dos seguintes:
- **Minikube** (local)
- **Kind** (local)
- **Docker Desktop** (local)
- **GKE, EKS, AKS** (cloud)
- **DigitalOcean Kubernetes** (cloud)

### 3. Ingress Controller
Para acesso externo, você precisa de um Ingress Controller:
```bash
# NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Aguardar estar pronto
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

## 🐳 Build da Imagem Docker

### 1. Build da Imagem de Produção
```bash
# No diretório raiz do projeto
docker build -t stayfocus-alimentacao:latest -f Dockerfile --target runner .

# Para desenvolvimento
docker build -t stayfocus-alimentacao:dev -f Dockerfile --target builder .
```

### 2. Push para Registry (se usando cluster remoto)
```bash
# Tag para seu registry
docker tag stayfocus-alimentacao:latest your-registry/stayfocus-alimentacao:latest

# Push
docker push your-registry/stayfocus-alimentacao:latest
```

## ⚙️ Configuração

### 1. Configurar Secrets
Edite o arquivo `kubernetes/secret.yaml` e substitua os valores base64:

```bash
# Converter suas credenciais para base64
echo -n "https://your-project.supabase.co" | base64
echo -n "your-supabase-anon-key" | base64
echo -n "your-nextauth-secret" | base64
```

### 2. Configurar Domínios
Edite os arquivos para usar seu domínio:
- `kubernetes/configmap.yaml` - Altere `NEXT_PUBLIC_SITE_URL`
- `kubernetes/ingress.yaml` - Altere `stayfocus.your-domain.com`

### 3. Configurar Registry (se necessário)
Se usando registry privado, edite `kubernetes/deployment-prod.yaml`:
```yaml
spec:
  template:
    spec:
      containers:
      - name: stayfocus-app
        image: your-registry/stayfocus-alimentacao:latest
```

## 🚀 Deploy

### Método 1: Script Automatizado

#### Linux/macOS:
```bash
cd kubernetes
chmod +x deploy.sh

# Deploy em produção
./deploy.sh prod

# Deploy em desenvolvimento
./deploy.sh dev
```

#### Windows (PowerShell):
```powershell
cd kubernetes

# Deploy em produção
.\deploy.ps1 prod

# Deploy em desenvolvimento
.\deploy.ps1 dev
```

### Método 2: Manual

```bash
cd kubernetes

# 1. Criar namespaces
kubectl apply -f namespace.yaml

# 2. Aplicar secrets
kubectl apply -f secret.yaml

# 3. Aplicar configmaps
kubectl apply -f configmap.yaml

# 4. Aplicar services
kubectl apply -f service.yaml

# 5. Deploy produção
kubectl apply -f deployment-prod.yaml
kubectl apply -f hpa.yaml

# OU deploy desenvolvimento
kubectl apply -f deployment-dev.yaml

# 6. Aplicar ingress
kubectl apply -f ingress.yaml
```

### Método 3: Kustomize

```bash
# Deploy com kustomize
kubectl apply -k kubernetes/

# Verificar configuração antes de aplicar
kubectl kustomize kubernetes/
```

## 🔍 Verificação

### 1. Verificar Pods
```bash
# Produção
kubectl get pods -n stayfocus

# Desenvolvimento
kubectl get pods -n stayfocus-dev
```

### 2. Verificar Services
```bash
kubectl get services -n stayfocus
kubectl get ingress -n stayfocus
```

### 3. Logs
```bash
# Produção
kubectl logs -f deployment/stayfocus-app -n stayfocus

# Desenvolvimento
kubectl logs -f deployment/stayfocus-app-dev -n stayfocus-dev
```

### 4. Health Check
```bash
# Port forward para testar
kubectl port-forward service/stayfocus-service 8080:80 -n stayfocus

# Testar health endpoint
curl http://localhost:8080/api/health
```

## 🌐 Acesso

### Produção
- **URL**: `https://stayfocus.your-domain.com`
- **Health Check**: `https://stayfocus.your-domain.com/api/health`

### Desenvolvimento
- **URL**: `http://stayfocus-dev.your-domain.com`
- **NodePort**: `http://node-ip:30000`

## 📊 Monitoramento

### 1. Auto-scaling
```bash
# Verificar HPA
kubectl get hpa -n stayfocus

# Descrição detalhada
kubectl describe hpa stayfocus-hpa -n stayfocus
```

### 2. Métricas
```bash
# CPU e Memória dos pods
kubectl top pods -n stayfocus

# Métricas dos nodes
kubectl top nodes
```

### 3. Events
```bash
# Ver eventos do namespace
kubectl get events -n stayfocus --sort-by='.lastTimestamp'
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Pod não inicia
```bash
# Verificar descrição do pod
kubectl describe pod <pod-name> -n stayfocus

# Verificar logs
kubectl logs <pod-name> -n stayfocus
```

#### 2. Ingress não funciona
```bash
# Verificar se o Ingress Controller está rodando
kubectl get pods -n ingress-nginx

# Verificar configuração do ingress
kubectl describe ingress stayfocus-ingress -n stayfocus
```

#### 3. Variables de ambiente
```bash
# Verificar configmap
kubectl describe configmap stayfocus-config -n stayfocus

# Verificar secrets
kubectl describe secret stayfocus-secrets -n stayfocus
```

#### 4. Health check falhando
```bash
# Port forward e testar localmente
kubectl port-forward pod/<pod-name> 3000:3000 -n stayfocus
curl http://localhost:3000/api/health
```

### Comandos Úteis

```bash
# Restart deployment
kubectl rollout restart deployment/stayfocus-app -n stayfocus

# Histórico de rollouts
kubectl rollout history deployment/stayfocus-app -n stayfocus

# Rollback para versão anterior
kubectl rollout undo deployment/stayfocus-app -n stayfocus

# Escalar manualmente
kubectl scale deployment stayfocus-app --replicas=5 -n stayfocus

# Entrar no pod para debug
kubectl exec -it <pod-name> -n stayfocus -- /bin/sh
```

## 🔒 Segurança

### 1. TLS/SSL
Para HTTPS em produção, instale o cert-manager:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### 2. Network Policies
Considere implementar Network Policies para isolar tráfego.

### 3. Pod Security
Os deployments já incluem:
- `runAsNonRoot: true`
- `readOnlyRootFilesystem: false`
- Resource limits
- Security contexts

## 📈 Otimização

### 1. Resource Tuning
Ajuste requests/limits baseado no uso:
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

### 2. Horizontal Pod Autoscaler
O HPA está configurado para escalar baseado em CPU e memória.

### 3. Vertical Pod Autoscaler
Considere VPA para recomendações automáticas de recursos.

## 🧹 Limpeza

```bash
# Remover tudo de produção
kubectl delete namespace stayfocus

# Remover tudo de desenvolvimento
kubectl delete namespace stayfocus-dev
```

## 📚 Referências

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Cert-Manager](https://cert-manager.io/)
- [Supabase Documentation](https://supabase.com/docs)