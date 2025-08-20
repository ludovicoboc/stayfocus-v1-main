"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Função para verificar usuário atual
    const getUser = async () => {
      try {
        console.log("🔐 Verificando estado de autenticação...");

        // Primeiro, tentar obter a sessão atual
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ Erro ao obter sessão:", sessionError);
          if (mounted) {
            setUser(null);
            setSession(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user) {
          console.log("✅ Sessão válida encontrada:", {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: new Date(session.expires_at! * 1000).toISOString(),
          });

          if (mounted) {
            setUser(session.user);
            setSession(session);
          }
        } else {
          console.log("ℹ️ Nenhuma sessão ativa encontrada");
          if (mounted) {
            setUser(null);
            setSession(null);
          }
        }

        // Verificar se o token ainda é válido fazendo uma chamada de teste
        if (session?.user) {
          try {
            const { data, error } = await supabase.auth.getUser();
            if (error) {
              console.warn("⚠️ Token inválido ou expirado:", error.message);
              if (mounted) {
                setUser(null);
                setSession(null);
              }
            } else if (data.user) {
              console.log("✅ Token validado com sucesso");
              if (mounted) {
                setUser(data.user);
              }
            }
          } catch (tokenError) {
            console.error("❌ Erro ao validar token:", tokenError);
            if (mounted) {
              setUser(null);
              setSession(null);
            }
          }
        }
      } catch (error) {
        console.error("❌ Erro geral ao verificar usuário:", error);
        if (mounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getUser();

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Mudança de estado de autenticação:", event, {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
      });

      if (mounted) {
        setUser(session?.user ?? null);
        setSession(session);
        setLoading(false);
        setInitialized(true);
      }

      // Log específico para diferentes eventos
      switch (event) {
        case "SIGNED_IN":
          console.log("✅ Usuário logado com sucesso");
          break;
        case "SIGNED_OUT":
          console.log("👋 Usuário deslogado");
          break;
        case "TOKEN_REFRESHED":
          console.log("🔄 Token renovado automaticamente");
          break;
        case "PASSWORD_RECOVERY":
          console.log("🔑 Processo de recuperação de senha iniciado");
          break;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

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
      console.log("👋 Fazendo logout...");
      setLoading(true);

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Erro no logout:", error.message);
        throw error;
      }

      console.log("✅ Logout realizado com sucesso");
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("❌ Erro ao fazer logout:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      console.log("🔄 Renovando sessão...");
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("❌ Erro ao renovar sessão:", error.message);
        throw error;
      }

      console.log("✅ Sessão renovada com sucesso");
      return data;
    } catch (error) {
      console.error("❌ Erro ao renovar sessão:", error);
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
