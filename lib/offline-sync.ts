// Sistema de Sincronização Offline para StayFocus
// Gerencia dados offline e sincroniza quando volta online

interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface SyncQueue {
  operations: OfflineOperation[];
  isProcessing: boolean;
}

class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private syncQueue: SyncQueue = { operations: [], isProcessing: false };
  private readonly STORAGE_KEY = 'stayfocus_offline_queue';
  private readonly MAX_RETRIES = 3;

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  constructor() {
    this.loadQueueFromStorage();
    this.setupOnlineListener();
  }

  // 📥 ADICIONAR OPERAÇÃO À FILA
  addOperation(
    type: OfflineOperation['type'],
    table: string,
    data: any
  ): string {
    const operation: OfflineOperation = {
      id: this.generateId(),
      type,
      table,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    };

    this.syncQueue.operations.push(operation);
    this.saveQueueToStorage();

    // Tenta sincronizar imediatamente se online
    if (navigator.onLine) {
      this.processSyncQueue();
    }

    return operation.id;
  }

  // 🔄 PROCESSAR FILA DE SINCRONIZAÇÃO
  async processSyncQueue(): Promise<void> {
    if (this.syncQueue.isProcessing || !navigator.onLine) {
      return;
    }

    this.syncQueue.isProcessing = true;

    const failedOperations: OfflineOperation[] = [];

    for (const operation of this.syncQueue.operations) {
      try {
        await this.executeOperation(operation);

      } catch (error) {
        console.error(`❌ Falha na operação ${operation.id}:`, error);
        
        operation.retryCount++;
        if (operation.retryCount < operation.maxRetries) {
          failedOperations.push(operation);
        } else {
          console.error(`🚫 Operação ${operation.id} descartada após ${operation.maxRetries} tentativas`);
        }
      }
    }

    // Atualiza fila com operações que falharam
    this.syncQueue.operations = failedOperations;
    this.syncQueue.isProcessing = false;
    this.saveQueueToStorage();

    if (failedOperations.length === 0) {

    }
  }

  // 🎯 EXECUTAR OPERAÇÃO ESPECÍFICA
  private async executeOperation(operation: OfflineOperation): Promise<void> {
    const { type, table, data } = operation;

    // Simula chamada para API - substituir pela implementação real
    const apiUrl = this.getApiUrl(table);
    
    let response: Response;
    
    switch (type) {
      case 'CREATE':
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        break;
        
      case 'UPDATE':
        response = await fetch(`${apiUrl}/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        break;
        
      case 'DELETE':
        response = await fetch(`${apiUrl}/${data.id}`, {
          method: 'DELETE'
        });
        break;
        
      default:
        throw new Error(`Tipo de operação não suportado: ${type}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // 🌐 CONFIGURAR LISTENER PARA WHEN ONLINE
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {

      this.processSyncQueue();
    });
  }

  // 💾 PERSISTÊNCIA LOCAL
  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('❌ Erro ao salvar fila offline:', error);
    }
  }

  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        this.syncQueue.isProcessing = false; // Reset processing flag
      }
    } catch (error) {
      console.error('❌ Erro ao carregar fila offline:', error);
      this.syncQueue = { operations: [], isProcessing: false };
    }
  }

  // 🛠️ HELPERS
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getApiUrl(table: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${baseUrl}/rest/v1/${table}`;
  }

  // 📊 STATUS E ESTATÍSTICAS
  getQueueStatus() {
    return {
      pendingOperations: this.syncQueue.operations.length,
      isProcessing: this.syncQueue.isProcessing,
      isOnline: navigator.onLine
    };
  }

  clearQueue(): void {
    this.syncQueue.operations = [];
    this.saveQueueToStorage();

  }
}

// Hook React para usar o sistema offline
export function useOfflineSync() {
  const syncManager = OfflineSyncManager.getInstance();

  const addOfflineOperation = (
    type: OfflineOperation['type'],
    table: string,
    data: any
  ) => {
    return syncManager.addOperation(type, table, data);
  };

  const getStatus = () => syncManager.getQueueStatus();
  const processPendingOperations = () => syncManager.processSyncQueue();
  const clearOfflineQueue = () => syncManager.clearQueue();

  return {
    addOfflineOperation,
    getStatus,
    processPendingOperations,
    clearOfflineQueue
  };
}

// Instância singleton para uso direto
export const offlineSync = OfflineSyncManager.getInstance();

export default OfflineSyncManager;