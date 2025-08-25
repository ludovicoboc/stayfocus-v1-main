"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { optimizedAuthCache } from "@/lib/auth-cache";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface UseAuthOptions {
  enableCache?: boolean;
  debounceTime?: number;
  enableBackgroundRefresh?: boolean;
}

// Utility para detectar mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
};

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

export function useAuthOptimized(options: UseAuthOptions = {}) {
  const {
    enableCache = true,
    debounceTime = isMobile() ? 500 : 300, // Mais debounce para mobile
    enableBackgroundRefresh = true
  } = options;

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false
  });

  const supabase = useMemo(() => createClient(), []);
  const authCheckRef = useRef<boolean>(false);
  const backgroundRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Função otimizada para obter sessão com cache
  const getSessionOptimized = useCallback(async (forceRefresh = false) => {
    try {
      // 1. Tentar cache primeiro (se habilitado e não é refresh forçado)
      if (enableCache && !forceRefresh) {
        const cached = optimizedAuthCache.getCachedAuth();
        if (cached && cached.isValid) {

          return {
            user: cached.user,
            session: cached.session
          };
        }
      }

      // 2. Buscar do Supabase com otimizações

      const result = await optimizedAuthCache.validateWithOptimizations(
        'auth-session-check',
        async () => {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {

            return { user: null, session: null };
          }

          // Cachear resultado se cache habilitado
          if (enableCache && session) {
            optimizedAuthCache.setCachedAuth(session.user, session, 'fresh');
          }

          return {
            user: session?.user || null,
            session: session || null
          };
        },
        { forceRefresh }
      );

      return result;
    } catch (error) {
      console.error("❌ [USE-AUTH-OPTIMIZED] Erro na obtenção de sessão:", error);
      
      // Fallback para cache se disponível
      if (enableCache) {
        const cached = optimizedAuthCache.getCachedAuth();
        if (cached) {

          return {
            user: cached.user,
            session: cached.session
          };
        }
      }
      
      return { user: null, session: null };
    }
  }, [supabase.auth, enableCache]);

  // Debounced auth check - reduz verificações excessivas
  const debouncedAuthCheck = useMemo(
    () => debounce(async (forceRefresh = false) => {
      if (authCheckRef.current && !forceRefresh) {
        console.log('⏳ [USE-AUTH-OPTIMIZED] Verificação em andamento, ignorando chamada duplicada');
        return;
      }

      authCheckRef.current = true;
      console.log('🔐 [USE-AUTH-OPTIMIZED] Iniciando verificação de autenticação', { forceRefresh });
      
      try {
        const { user, session } = await getSessionOptimized(forceRefresh);
        
        setAuthState(prev => ({
          ...prev,
          user,
          session,
          loading: false,
          initialized: true
        }));

        console.log('✅ [USE-AUTH-OPTIMIZED] Verificação concluída com sucesso', { hasUser: !!user });
      } catch (error) {
        console.error("❌ [USE-AUTH-OPTIMIZED] Erro no auth check:", error);
        setAuthState(prev => ({
          ...prev,
          user: null,
          session: null,
          loading: false,
          initialized: true
        }));
      } finally {
        authCheckRef.current = false;
      }
    }, debounceTime),
    [getSessionOptimized, debounceTime, enableCache]
  );

  // Background refresh inteligente (apenas para mobile)
  const setupBackgroundRefresh = useCallback(() => {
    if (!enableBackgroundRefresh || !isMobile()) return;

    // Limpar timer anterior
    if (backgroundRefreshRef.current) {
      clearInterval(backgroundRefreshRef.current);
    }

    // Configurar refresh background a cada 5 minutos apenas se tab ativa
    backgroundRefreshRef.current = setInterval(() => {
      if (!document.hidden && authState.user) {

        debouncedAuthCheck(false); // Não forçar refresh, usar cache se válido
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      if (backgroundRefreshRef.current) {
        clearInterval(backgroundRefreshRef.current);
      }
    };
  }, [enableBackgroundRefresh, authState.user, debouncedAuthCheck]);

  // Inicialização otimizada
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {

      // Primeiro, tentar cache para início mais rápido
      if (enableCache) {
        const cached = optimizedAuthCache.getCachedAuth();
        if (cached && cached.isValid && mounted) {
          setAuthState({
            user: cached.user,
            session: cached.session,
            loading: false,
            initialized: true
          });

          return;
        }
      }

      // Se não há cache válido, fazer verificação
      await debouncedAuthCheck(false);
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [enableCache, debouncedAuthCheck]);

  // Listener otimizado para mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        // Atualizar cache imediatamente
        if (enableCache) {
          if (session) {
            optimizedAuthCache.setCachedAuth(session.user, session, 'fresh');
          } else {
            optimizedAuthCache.clearCache();
          }
        }

        // Atualizar estado local
        setAuthState(prev => ({
          ...prev,
          user: session?.user || null,
          session: session || null,
          loading: false,
          initialized: true
        }));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, enableCache]);

  // Setup background refresh
  useEffect(() => {
    return setupBackgroundRefresh();
  }, [setupBackgroundRefresh]);

  // Cleanup em unmount
  useEffect(() => {
    return () => {
      if (backgroundRefreshRef.current) {
        clearInterval(backgroundRefreshRef.current);
      }
    };
  }, []);

  // Funções de autenticação otimizadas
  const signIn = useCallback(async (email: string, password: string) => {
    try {

      setAuthState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ [USE-AUTH-OPTIMIZED] Erro no login:", error.message);
        throw error;
      }

      // Atualizar cache imediatamente
      if (enableCache && data.session) {
        optimizedAuthCache.setCachedAuth(data.user, data.session, 'fresh');
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error("❌ [USE-AUTH-OPTIMIZED] Erro no signIn:", error);
      throw error;
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase.auth, enableCache]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {

      setAuthState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("❌ [USE-AUTH-OPTIMIZED] Erro no registro:", error.message);
        throw error;
      }

      // Atualizar cache se session criada
      if (enableCache && data.session) {
        optimizedAuthCache.setCachedAuth(data.user, data.session, 'fresh');
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error("❌ [USE-AUTH-OPTIMIZED] Erro no signUp:", error);
      throw error;
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase.auth, enableCache]);

  const signOut = useCallback(async () => {
    try {

      setAuthState(prev => ({ ...prev, loading: true }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ [USE-AUTH-OPTIMIZED] Erro no logout:", error.message);
        throw error;
      }

      // Limpar cache
      if (enableCache) {
        optimizedAuthCache.clearCache();
      }

      setAuthState({
        user: null,
        session: null,
        loading: false,
        initialized: true
      });
    } catch (error) {
      console.error("❌ [USE-AUTH-OPTIMIZED] Erro no signOut:", error);
      throw error;
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase.auth, enableCache]);

  // Função para refresh manual
  const refreshAuth = useCallback(() => {

    debouncedAuthCheck(true); // Forçar refresh
  }, [debouncedAuthCheck]);

  // Função para limpar cache manualmente
  const clearAuthCache = useCallback(() => {
    if (enableCache) {

      optimizedAuthCache.clearCache();
      debouncedAuthCheck(true);
    }
  }, [enableCache, debouncedAuthCheck]);

  // Métricas de debug
  const getAuthMetrics = useCallback(() => {
    if (!enableCache) return null;
    return optimizedAuthCache.getDebugInfo();
  }, [enableCache]);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshAuth,
    clearAuthCache,
    getAuthMetrics,
    // Compatibilidade com hook antigo
    getCurrentSession: getSessionOptimized
  };
}

// Export também um alias para compatibilidade
export const useAuth = useAuthOptimized;