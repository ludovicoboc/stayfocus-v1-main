"use client";

import { useAuthOptimized } from "@/hooks/use-auth-optimized";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Hook de autenticação compatível com a versão anterior
 * Agora usa internamente o sistema otimizado com cache e debouncing
 */
export function useAuth() {
  // Usar versão otimizada internamente
  const optimizedAuth = useAuthOptimized({
    enableCache: true,
    debounceTime: 300,
    enableBackgroundRefresh: true
  });

  // Manter compatibilidade com interface anterior
  return {
    user: optimizedAuth.user,
    session: optimizedAuth.session,
    loading: optimizedAuth.loading,
    initialized: optimizedAuth.initialized,
    signIn: optimizedAuth.signIn,
    signUp: optimizedAuth.signUp,
    signOut: optimizedAuth.signOut,
    // Adicionar função de compatibilidade
    getCurrentSession: optimizedAuth.getCurrentSession
  };
}

// === IMPLEMENTAÇÃO ANTERIOR (MANTIDA PARA REFERÊNCIA) ===
// Esta implementação foi substituída pela versão otimizada
// mas mantida comentada para referência e rollback se necessário

/*
function useAuthLegacy() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  const supabase = createClient();

  // Função simples para obter sessão atual
  const getCurrentSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { user: null, session: null };
      }

      return { 
        user: session?.user || null, 
        session: session || null 
      };
    } catch (error) {
      console.error("❌ [USE-AUTH-LEGACY] Erro na obtenção de sessão:", error);
      return { user: null, session: null };
    }
  }, [supabase.auth]);

  // Inicialização simples
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { user: currentUser, session: currentSession } = await getCurrentSession();
        
        if (mounted) {
          setUser(currentUser);
          setSession(currentSession);
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error("❌ [USE-AUTH-LEGACY] Erro na inicialização:", error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [getCurrentSession]);

  // Listener para mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setSession(session || null);
        
        if (!loading) {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, loading]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ [USE-AUTH-LEGACY] Erro no login:", error.message);
        throw error;
      }
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error("❌ [USE-AUTH-LEGACY] Erro no signIn:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("❌ [USE-AUTH-LEGACY] Erro no registro:", error.message);
        throw error;
      }
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error("❌ [USE-AUTH-LEGACY] Erro no signUp:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ [USE-AUTH-LEGACY] Erro no logout:", error.message);
        throw error;
      }
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("❌ [USE-AUTH-LEGACY] Erro no signOut:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    getCurrentSession,
  };
}
*/