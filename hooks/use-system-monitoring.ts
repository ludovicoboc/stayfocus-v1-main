"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

export interface DataConsistencyCheck {
  table_name: string;
  issue_type: string;
  issue_count: number;
  description: string;
}

export interface SystemHealthMetric {
  metric_name: string;
  metric_value: string;
  status: 'healthy' | 'warning' | 'error' | 'info';
  last_updated: string;
}

export interface CleanupResult {
  table_name: string;
  records_deleted: number;
  operation_date: string;
}

export function useSystemMonitoring() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const checkDataConsistency = async (): Promise<DataConsistencyCheck[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('check_data_consistency');
      if (error) throw error;
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao verificar consistência: ${errorMessage}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getSystemHealth = async (): Promise<SystemHealthMetric[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_system_health_metrics');
      if (error) throw error;
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao obter métricas do sistema: ${errorMessage}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async (daysToKeep = 365): Promise<CleanupResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('cleanup_old_data_enhanced', {
        days_to_keep: daysToKeep
      });
      if (error) throw error;
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao executar limpeza: ${errorMessage}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getStudyStatistics = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_study_statistics', {
        p_user_id: userId
      });
      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao obter estatísticas de estudo: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCompetitionStudyStatistics = async (userId: string, competitionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_competition_study_statistics', {
        p_user_id: userId,
        p_competition_id: competitionId
      });
      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao obter estatísticas de estudo do concurso: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    checkDataConsistency,
    getSystemHealth,
    runCleanup,
    getStudyStatistics,
    getCompetitionStudyStatistics,
    clearError: () => setError(null)
  };
}