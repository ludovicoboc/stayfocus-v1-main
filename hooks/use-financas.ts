"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import type {
  CategoriaGasto,
  Despesa,
  EnvelopeVirtual,
  PagamentoAgendado,
  GastosPorCategoria,
} from "@/types/financas";
import {
  validateDespesa,
  validateData,
  sanitizeString,
  sanitizeNumber,
  sanitizeDate,
} from "@/utils/validations";
import { criarCategoriasDefault } from "@/utils/default-categories";

export function useFinancas() {
  const { user } = useAuth();
  const supabase = createClient();
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [envelopes, setEnvelopes] = useState<EnvelopeVirtual[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoAgendado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDados();
    }
  }, [user]);

  const fetchDados = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await Promise.all([
        fetchCategorias(),
        fetchDespesas(),
        fetchEnvelopes(),
        fetchPagamentos(),
      ]);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      // Se não há categorias, criar as categorias padrão
      if (!data || data.length === 0) {
        const success = await criarCategoriasDefault(supabase, user.id);

        if (success) {
          // Buscar novamente após criar as categorias padrão
          const { data: newData, error: newError } = await supabase
            .from("expense_categories")
            .select("*")
            .eq("user_id", user.id)
            .order("name");

          if (newError) throw newError;
          setCategorias(newData || []);
        } else {
          setCategorias([]);
        }
      } else {
        setCategorias(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDespesas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("expenses")
        .select(
          `
          *,
          category:expense_categories(*)
        `,
        )
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setDespesas(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const fetchEnvelopes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("virtual_envelopes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");

      if (error) throw error;
      setEnvelopes(data || []);
    } catch (error) {
      console.error("Error fetching envelopes:", error);
    }
  };

  const fetchPagamentos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("scheduled_payments")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date");

      if (error) throw error;
      setPagamentos(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const adicionarCategoria = async (
    categoria: Omit<
      CategoriaGasto,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .insert({
          user_id: user.id,
          ...categoria,
        })
        .select()
        .single();

      if (error) throw error;

      setCategorias([...categorias, data]);
      return data;
    } catch (error) {
      console.error("Error adding category:", error);
      return null;
    }
  };

  const adicionarDespesa = async (
    despesa: Omit<Despesa, "id" | "user_id" | "created_at" | "updated_at">,
  ) => {
    if (!user) return null;

    try {
      // Sanitizar dados de entrada
      const despesaSanitizada = {
        ...despesa,
        description: sanitizeString(despesa.description),
        amount: sanitizeNumber(despesa.amount),
        date: sanitizeDate(despesa.date),
      };

      // Validar dados antes de enviar
      validateData(despesaSanitizada, validateDespesa);

      const { data, error } = await supabase
        .from("expenses")
        .insert({
          user_id: user.id,
          ...despesaSanitizada,
        })
        .select(
          `
          *,
          category:expense_categories(*)
        `,
        )
        .single();

      if (error) throw error;

      setDespesas([data, ...despesas]);
      return data;
    } catch (error) {
      console.error("Error adding expense:", error);
      return null;
    }
  };

  const adicionarEnvelope = async (
    envelope: Omit<
      EnvelopeVirtual,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("virtual_envelopes")
        .insert({
          user_id: user.id,
          ...envelope,
        })
        .select()
        .single();

      if (error) throw error;

      setEnvelopes([...envelopes, data]);
      return data;
    } catch (error) {
      console.error("Error adding envelope:", error);
      return null;
    }
  };

  const atualizarEnvelope = async (
    id: string,
    updates: Partial<EnvelopeVirtual>,
  ) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("virtual_envelopes")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setEnvelopes(envelopes.map((env) => (env.id === id ? data : env)));
      return true;
    } catch (error) {
      console.error("Error updating envelope:", error);
      return false;
    }
  };

  const adicionarPagamento = async (
    pagamento: Omit<
      PagamentoAgendado,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("scheduled_payments")
        .insert({
          user_id: user.id,
          ...pagamento,
        })
        .select()
        .single();

      if (error) throw error;

      setPagamentos([...pagamentos, data]);
      return data;
    } catch (error) {
      console.error("Error adding payment:", error);
      return null;
    }
  };

  const marcarPagamentoPago = async (id: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("scheduled_payments")
        .update({
          is_paid: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setPagamentos(pagamentos.map((pag) => (pag.id === id ? data : pag)));
      return true;
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      return false;
    }
  };

  const getGastosPorCategoria = (): GastosPorCategoria[] => {
    const gastosPorCategoria = new Map<
      string,
      { valor: number; cor: string }
    >();

    despesas.forEach((despesa) => {
      const categoria = despesa.category?.name || "Outros";
      const cor = despesa.category?.color || "#6b7280";
      const valorAtual = gastosPorCategoria.get(categoria)?.valor || 0;

      gastosPorCategoria.set(categoria, {
        valor: valorAtual + despesa.amount,
        cor,
      });
    });

    const totalGastos = Array.from(gastosPorCategoria.values()).reduce(
      (acc, item) => acc + item.valor,
      0,
    );

    return Array.from(gastosPorCategoria.entries()).map(
      ([categoria, { valor, cor }]) => ({
        categoria,
        valor,
        cor,
        porcentagem: totalGastos > 0 ? (valor / totalGastos) * 100 : 0,
      }),
    );
  };

  const getTotalGastos = () => {
    return despesas.reduce((acc, despesa) => acc + despesa.amount, 0);
  };

  return {
    categorias,
    despesas,
    envelopes,
    pagamentos,
    loading,
    adicionarCategoria,
    adicionarDespesa,
    adicionarEnvelope,
    atualizarEnvelope,
    adicionarPagamento,
    marcarPagamentoPago,
    getGastosPorCategoria,
    getTotalGastos,
    refetch: fetchDados,
  };
}
