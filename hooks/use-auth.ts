"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { authCache } from "@/lib/auth-cache";
import { validateAuthState, onAuthStateChange } from "@/lib/auth-utils";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const supabase = createClient();

  // Função para inicializar autenticação usando cache
  const initializeAuth = useCallback(async () => {
    if (!initialized) {
      console.log("🔐 [USE-AUTH] Inicializando autenticação...");
      
      // Primeiro, tentar usar cache
      const cached = authCache.getCachedAuth();
      if (cached) {
        console.log("✅ [USE-AUTH] Usando dados do cache");
        setUser(cached.user);
        setSession(cached.session);
        setLoading(false);
        setInitialized(true);
        return;
      }

      // Se não há cache, fazer validação completa
      try {
        const { user: validatedUser, error } = await validateAuthState();
        
        setUser(validatedUser);
        setSession(authCache.getCachedAuth()?.session || null);
        
        if (error) {
          console.log("ℹ️ [USE-AUTH] Usuário não autenticado:", error);
        } else {
          console.log("✅ [USE-AUTH] Usuário autenticado:", {
            userId: validatedUser?.id?.substring(0, 8) + "...",
            email: validatedUser?.email
          });
        }
      } catch (error) {
        console.error("❌ [USE-AUTH] Erro na inicialização:", error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [initialized]);

  useEffect(() => {
    let mounted = true;

    // Inicializar autenticação
    initializeAuth();

    // Escutar mudanças de autenticação usando auth-utils otimizado
    const unsubscribe = onAuthStateChange((user) => {
      if (mounted) {
        console.log("🔄 [USE-AUTH] Auth state changed:", {
          hasUser: !!user,
          userId: user?.id?.substring(0, 8) + "..." || "none"
        });
        
        setUser(user);
        setSession(authCache.getCachedAuth()?.session || null);
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [initializeAuth]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔐 Tentando fazer login para:", email);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Erro no login:", error.message);
        throw error;
      }

      console.log("✅ Login realizado com sucesso:", {
        userId: data.user?.id,
        email: data.user?.email,
      });

      return data;
    } catch (error) {
      console.error("❌ Erro ao fazer login:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log("📝 Tentando criar conta para:", email);
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("❌ Erro na criação de conta:", error.message);
        throw error;
      }

      console.log("✅ Conta criada com sucesso:", {
        userId: data.user?.id,
        email: data.user?.email,
        needsConfirmation: !data.session,
      });

      return data;
    } catch (error) {
      console.error("❌ Erro ao criar conta:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("👋 [USE-AUTH] Fazendo logout...");
      setLoading(true);

      const { error } = await supabase.auth.signOut();
      
      // Limpar cache independentemente do resultado
      authCache.clearCache();
      
      if (error) {
        console.error("❌ [USE-AUTH] Erro no logout:", error.message);
        throw error;
      }

      console.log("✅ [USE-AUTH] Logout realizado com sucesso");
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("❌ [USE-AUTH] Erro ao fazer logout:", error);
      // Limpar estado local mesmo em caso de erro
      setUser(null);
      setSession(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      console.log("🔄 [USE-AUTH] Renovando sessão...");
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("❌ [USE-AUTH] Erro ao renovar sessão:", error.message);
        authCache.clearCache();
        throw error;
      }

      if (data.session?.user) {
        // Atualizar cache com nova sessão
        authCache.setCachedAuth(data.session.user, data.session);
        setUser(data.session.user);
        setSession(data.session);
      }

      console.log("✅ [USE-AUTH] Sessão renovada com sucesso");
      return data;
    } catch (error) {
      console.error("❌ [USE-AUTH] Erro ao renovar sessão:", error);
      throw error;
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
    refreshSession,
    isAuthenticated: !!user && !!session,
  };
}
