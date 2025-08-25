"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase"
import { useAuthOptimized } from "@/hooks/use-auth-optimized"
import { globalRequestCache } from "@/lib/request-cache-manager"
import type { AtividadePainelDia, Prioridade, Medicamento, SessaoFocoDashboard } from "@/types/dashboard"
import { sanitizeString } from "@/utils/validations"
import { getCurrentDateString } from "@/lib/utils"

interface DashboardData {
  painelDia: AtividadePainelDia[]
  prioridades: Prioridade[]
  medicamentos: Medicamento[]
  sessaoFoco: SessaoFocoDashboard | null
}

interface DashboardError {
  message: string
  type: 'loading' | 'crud' | 'validation'
}

interface UseDashboardOptions {
  enableCache?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

// Utility para detectar mobile
const isMobile = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
};

export function useDashboardOptimized(date?: string, options: UseDashboardOptions = {}) {
  const {
    enableCache = true,
    autoRefresh = true,
    refreshInterval = isMobile() ? 60000 : 30000 // 60s mobile, 30s desktop
  } = options;

  const { user } = useAuthOptimized();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    painelDia: [],
    prioridades: [],
    medicamentos: [],
    sessaoFoco: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DashboardError | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const resolvedDate = useMemo(() => date || getCurrentDateString(), [date]);

  // Cache keys otimizados
  const cacheKeys = useMemo(() => ({
    painelDia: `dashboard-painel-${user?.id}-${resolvedDate}`,
    prioridades: `dashboard-prioridades-${user?.id}-${resolvedDate}`,
    medicamentos: `dashboard-medicamentos-${user?.id}-${resolvedDate}`,
    sessaoFoco: `dashboard-sessao-foco-${user?.id}-${resolvedDate}`,
    combined: `dashboard-combined-${user?.id}-${resolvedDate}`
  }), [user?.id, resolvedDate]);

  // Validação de dados (memoized)
  const validarAtividade = useCallback((atividade: { horario: string; atividade: string; cor: string }) => {
    if (!atividade.horario || !atividade.atividade || !atividade.cor) {
      throw new Error("Todos os campos são obrigatórios")
    }
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(atividade.horario)) {
      throw new Error("Formato de horário inválido (use HH:MM)")
    }
    if (atividade.atividade.length > 200) {
      throw new Error("Descrição da atividade muito longa (máx. 200 caracteres)")
    }
  }, []);

  const validarPrioridade = useCallback((prioridade: { titulo: string; importante: boolean }) => {
    if (!prioridade.titulo || prioridade.titulo.trim().length === 0) {
      throw new Error("Título da prioridade é obrigatório")
    }
    if (prioridade.titulo.length > 100) {
      throw new Error("Título muito longo (máx. 100 caracteres)")
    }
    if (typeof prioridade.importante !== 'boolean') {
      throw new Error("Campo 'importante' deve ser verdadeiro ou falso")
    }
  }, []);

  // Função otimizada para carregar dados individuais
  const carregarPainelDia = useCallback(async () => {
    if (!user) return [];
    
    return globalRequestCache.get(
      cacheKeys.painelDia,
      async () => {
        const { data, error } = await supabase
          .from("painel_dia")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", resolvedDate)
          .order("horario", { ascending: true });

        if (error) throw error;
        return data || [];
      },
      {
        ttl: 5 * 60 * 1000,        // 5 min desktop
        mobileTTL: 10 * 60 * 1000, // 10 min mobile
        staleWhileRevalidate: true,
        timeout: isMobile() ? 8000 : 5000
      }
    );
  }, [user, supabase, resolvedDate, cacheKeys.painelDia]);

  const carregarPrioridades = useCallback(async () => {
    if (!user) return [];
    
    return globalRequestCache.get(
      cacheKeys.prioridades,
      async () => {
        const { data, error } = await supabase
          .from("prioridades")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", resolvedDate)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      },
      {
        ttl: 5 * 60 * 1000,
        mobileTTL: 10 * 60 * 1000,
        staleWhileRevalidate: true,
        timeout: isMobile() ? 8000 : 5000
      }
    );
  }, [user, supabase, resolvedDate, cacheKeys.prioridades]);

  const carregarMedicamentos = useCallback(async () => {
    if (!user) return [];
    
    return globalRequestCache.get(
      cacheKeys.medicamentos,
      async () => {
        const { data, error } = await supabase
          .from("v_medicamentos_dashboard")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      },
      {
        ttl: 3 * 60 * 1000,        // 3 min (medicamentos mudam menos)
        mobileTTL: 15 * 60 * 1000, // 15 min mobile
        staleWhileRevalidate: true,
        timeout: isMobile() ? 8000 : 5000
      }
    );
  }, [user, supabase, cacheKeys.medicamentos]);

  const carregarSessaoFoco = useCallback(async () => {
    if (!user) return null;
    
    return globalRequestCache.get(
      cacheKeys.sessaoFoco,
      async () => {
        const { data, error } = await supabase
          .from("sessoes_foco")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", resolvedDate)
          .eq("ativa", true)
          .maybeSingle();

        if (error) throw error;
        return data || null;
      },
      {
        ttl: 30 * 1000,           // 30 segundos (sessão ativa muda rápido)
        mobileTTL: 60 * 1000,     // 1 min mobile
        staleWhileRevalidate: true,
        timeout: isMobile() ? 6000 : 3000
      }
    );
  }, [user, supabase, resolvedDate, cacheKeys.sessaoFoco]);

  // Função principal para carregar todos os dados (otimizada)
  const carregarDados = useCallback(async (forceRefresh = false) => {
    try {
      if (!user) return;
      
      setLoading(true);
      setError(null);

      // Para mobile: usar cache combinado para reduzir requests
      if (enableCache && !forceRefresh && isMobile()) {
        const cachedCombined = await globalRequestCache.get(
          cacheKeys.combined,
          async () => {
            // Executar requests em paralelo otimizado
            const [painelDia, prioridades, medicamentos, sessaoFoco] = await Promise.allSettled([
              carregarPainelDia(),
              carregarPrioridades(),
              carregarMedicamentos(),
              carregarSessaoFoco()
            ]);

            return {
              painelDia: painelDia.status === 'fulfilled' ? painelDia.value : [],
              prioridades: prioridades.status === 'fulfilled' ? prioridades.value : [],
              medicamentos: medicamentos.status === 'fulfilled' ? medicamentos.value : [],
              sessaoFoco: sessaoFoco.status === 'fulfilled' ? sessaoFoco.value : null,
            };
          },
          {
            ttl: 2 * 60 * 1000,       // 2 min combinado para mobile
            mobileTTL: 5 * 60 * 1000, // 5 min mobile
            staleWhileRevalidate: true,
            forceRefresh
          }
        );

        setDashboardData(cachedCombined);
      } else {
        // Para desktop ou refresh forçado: requests individuais
        const [painelDia, prioridades, medicamentos, sessaoFoco] = await Promise.allSettled([
          carregarPainelDia(),
          carregarPrioridades(), 
          carregarMedicamentos(),
          carregarSessaoFoco()
        ]);

        setDashboardData({
          painelDia: painelDia.status === 'fulfilled' ? painelDia.value : [],
          prioridades: prioridades.status === 'fulfilled' ? prioridades.value : [],
          medicamentos: medicamentos.status === 'fulfilled' ? medicamentos.value : [],
          sessaoFoco: sessaoFoco.status === 'fulfilled' ? sessaoFoco.value : null,
        });

        // Log de erros individuais
        [painelDia, prioridades, medicamentos, sessaoFoco].forEach((result, index) => {
          if (result.status === 'rejected') {
            const names = ['painelDia', 'prioridades', 'medicamentos', 'sessaoFoco'];
            console.error(`Erro ao carregar ${names[index]}:`, result.reason);
          }
        });
      }

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      setError({
        message: error instanceof Error ? error.message : "Erro ao carregar dados",
        type: 'loading'
      });
    } finally {
      setLoading(false);
    }
  }, [
    user, 
    enableCache, 
    cacheKeys.combined, 
    carregarPainelDia, 
    carregarPrioridades, 
    carregarMedicamentos, 
    carregarSessaoFoco
  ]);

  // Auto-refresh inteligente
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      // Apenas refresh se tab estiver ativa e usuário logado
      if (!document.hidden && user) {

        carregarDados(false); // Usar cache se disponível
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, user, refreshInterval, carregarDados]);

  // Carregamento inicial
  useEffect(() => {
    if (user) {
      carregarDados(false);
    }
  }, [user, resolvedDate, carregarDados]);

  // Funções CRUD otimizadas
  const adicionarAtividade = useCallback(async (atividade: { horario: string; atividade: string; cor: string }) => {
    try {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      validarAtividade(atividade);
      setError(null);

      const atividadeSanitizada = {
        horario: atividade.horario.trim(),
        atividade: sanitizeString(atividade.atividade),
        cor: atividade.cor.trim(),
      };

      const { data, error } = await supabase
        .from("painel_dia")
        .insert([
          {
            ...atividadeSanitizada,
            user_id: user.id,
            concluida: false,
            date: resolvedDate,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        // Atualizar estado local
        setDashboardData((prev) => ({
          ...prev,
          painelDia: [...prev.painelDia, ...data].sort((a, b) => a.horario.localeCompare(b.horario)),
        }));

        // Invalidar cache relacionado
        globalRequestCache.invalidate(cacheKeys.painelDia);
        globalRequestCache.invalidate(cacheKeys.combined);
      }
    } catch (error) {
      console.error("Erro ao adicionar atividade:", error);
      setError({
        message: error instanceof Error ? error.message : "Erro ao adicionar atividade",
        type: 'crud'
      });
      throw error;
    }
  }, [user, supabase, validarAtividade, resolvedDate, cacheKeys]);

  const toggleAtividadeConcluida = useCallback(async (id: string, concluida: boolean) => {
    try {
      if (!id || typeof concluida !== 'boolean') {
        throw new Error("Parâmetros inválidos");
      }

      setError(null);
      const { error } = await supabase.from("painel_dia").update({ concluida }).eq("id", id);

      if (error) throw error;

      // Atualizar estado local
      setDashboardData((prev) => ({
        ...prev,
        painelDia: prev.painelDia.map((atividade) => 
          atividade.id === id ? { ...atividade, concluida } : atividade
        ),
      }));

      // Invalidar cache
      globalRequestCache.invalidate(cacheKeys.painelDia);
      globalRequestCache.invalidate(cacheKeys.combined);
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error);
      setError({
        message: error instanceof Error ? error.message : "Erro ao atualizar atividade",
        type: 'crud'
      });
      throw error;
    }
  }, [supabase, cacheKeys]);

  const adicionarPrioridade = useCallback(async (prioridade: { titulo: string; importante: boolean }) => {
    try {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      validarPrioridade(prioridade);
      setError(null);

      const prioridadeSanitizada = {
        titulo: sanitizeString(prioridade.titulo.trim()),
        importante: prioridade.importante,
      };

      const { data, error } = await supabase
        .from("prioridades")
        .insert([
          {
            ...prioridadeSanitizada,
            user_id: user.id,
            concluida: false,
            date: resolvedDate,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        // Atualizar estado local
        setDashboardData((prev) => ({
          ...prev,
          prioridades: [data[0], ...prev.prioridades],
        }));

        // Invalidar cache
        globalRequestCache.invalidate(cacheKeys.prioridades);
        globalRequestCache.invalidate(cacheKeys.combined);
      }
    } catch (error) {
      console.error("Erro ao adicionar prioridade:", error);
      setError({
        message: error instanceof Error ? error.message : "Erro ao adicionar prioridade",
        type: 'crud'
      });
      throw error;
    }
  }, [user, supabase, validarPrioridade, resolvedDate, cacheKeys]);

  const togglePrioridadeConcluida = useCallback(async (id: string, concluida: boolean) => {
    try {
      if (!id || typeof concluida !== 'boolean') {
        throw new Error("Parâmetros inválidos");
      }

      setError(null);
      const { error } = await supabase.from("prioridades").update({ concluida }).eq("id", id);

      if (error) throw error;

      // Atualizar estado local
      setDashboardData((prev) => ({
        ...prev,
        prioridades: prev.prioridades.map((prioridade) =>
          prioridade.id === id ? { ...prioridade, concluida } : prioridade
        ),
      }));

      // Invalidar cache
      globalRequestCache.invalidate(cacheKeys.prioridades);
      globalRequestCache.invalidate(cacheKeys.combined);
    } catch (error) {
      console.error("Erro ao atualizar prioridade:", error);
      setError({
        message: error instanceof Error ? error.message : "Erro ao atualizar prioridade",
        type: 'crud'
      });
      throw error;
    }
  }, [supabase, cacheKeys]);

  // Função para refresh manual
  const refreshDashboard = useCallback(() => {

    carregarDados(true); // Forçar refresh
  }, [carregarDados]);

  // Função para limpar cache
  const clearDashboardCache = useCallback(() => {
    Object.values(cacheKeys).forEach(key => {
      globalRequestCache.invalidate(key);
    });

  }, [cacheKeys]);

  // Métricas de debug
  const getDashboardMetrics = useCallback(() => {
    return globalRequestCache.getMetrics();
  }, []);

  return {
    // Estado
    dashboardData,
    loading,
    error,
    
    // Ações principais
    adicionarAtividade,
    toggleAtividadeConcluida,
    adicionarPrioridade,
    togglePrioridadeConcluida,
    
    // Controle
    refreshDashboard,
    clearDashboardCache,
    getDashboardMetrics,
    
    // Info
    isOptimized: true,
    cacheEnabled: enableCache
  };
}

// Export também um alias para substituir o hook original
export const useDashboard = useDashboardOptimized;