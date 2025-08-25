'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ServiceWorkerManager {
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  isOnline: boolean;
}

export function ServiceWorkerManager() {
  const [swState, setSwState] = useState<ServiceWorkerManager>({
    registration: null,
    updateAvailable: false,
    isOnline: typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.onLine : true
  });

  useEffect(() => {
    // Registrar service worker apenas no cliente
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Monitorar status de conexão
    const handleOnline = () => setSwState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSwState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      setSwState(prev => ({ ...prev, registration }));

      // Verifica se há atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setSwState(prev => ({ ...prev, updateAvailable: true }));
              showUpdateNotification();
            }
          });
        }
      });

      // Service worker já ativo
      if (registration.active) {

        toast.success('App pronto para uso offline!', {
          description: 'Agora você pode usar o StayFocus sem conexão.'
        });
      }

    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
      toast.error('Falha ao ativar modo offline', {
        description: 'Algumas funcionalidades podem não estar disponíveis.'
      });
    }
  };

  const showUpdateNotification = () => {
    toast.info('Nova versão disponível!', {
      description: 'Clique para atualizar o app.',
      action: {
        label: 'Atualizar',
        onClick: () => handleUpdate()
      },
      duration: 10000 // 10 segundos
    });
  };

  const handleUpdate = () => {
    if (swState.registration?.waiting) {
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // Notificação de status offline
  useEffect(() => {
    if (!swState.isOnline) {
      toast.warning('Você está offline', {
        description: 'Dados em cache ainda estão disponíveis.',
        duration: 5000
      });
    } else if (swState.isOnline && typeof window !== 'undefined') {
      // Apenas mostra se anteriormente estava offline
      const wasOffline = sessionStorage.getItem('wasOffline');
      if (wasOffline) {
        toast.success('Conectado novamente!', {
          description: 'Sincronizando dados...'
        });
        sessionStorage.removeItem('wasOffline');
      }
    }

    // Marca como offline no sessionStorage
    if (!swState.isOnline) {
      sessionStorage.setItem('wasOffline', 'true');
    }
  }, [swState.isOnline]);

  return null; // Componente não renderiza nada visualmente
}

// Hook para usar o service worker em outros componentes
export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Assume online durante SSR
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}