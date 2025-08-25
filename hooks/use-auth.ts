"use client";

// IMPORTANTE: Este arquivo agora é apenas para compatibilidade
// O hook real está no AuthProvider
// Recomenda-se migrar para: import { useAuth } from "@/lib/auth-provider"

import { useAuth as useAuthContext } from "@/lib/auth-provider";
import type { User, Session } from "@supabase/supabase-js";

/**
 * @deprecated Use useAuth from @/lib/auth-provider instead
 * Este hook está mantido apenas para compatibilidade com código existente
 * 
 * Para migrar:
 * - Altere: import { useAuth } from "@/hooks/use-auth"
 * - Para: import { useAuth } from "@/lib/auth-provider"
 */
export function useAuth() {
  console.warn('⚠️ [USE-AUTH] Hook legado detectado. Migre para @/lib/auth-provider para melhor performance');
  return useAuthContext();
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