"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-provider";
import { useReceitas } from "@/hooks/use-receitas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChefHat, Plus, X, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const CATEGORIAS_RECEITAS = [
  "Café da Manhã",
  "Almoço",
  "Jantar",
  "Lanche",
  "Sobremesa",
  "Bebida",
  "Aperitivo",
  "Salada",
  "Sopa",
  "Massa",
  "Carne",
  "Peixe",
  "Vegetariano",
  "Vegano",
  "Sem Glúten",
  "Low Carb",
  "Fitness",
  "Comfort Food",
  "Internacional",
  "Brasileira",
];

export default function EditarReceitaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    receitas,
    atualizarReceita,
    loading: receitasLoading,
  } = useReceitas();

  const receitaId = params.id as string;
  const receitaOriginal = receitas.find((r) => r.id === receitaId);

  const [loading, setLoading] = useState(false);
  const [receita, setReceita] = useState({
    nome: "",
    categoria: "",
    ingredientes: [""],
    modo_preparo: "",
    tempo_preparo: "",
    porcoes: "",
    dificuldade: "",
    favorita: false,
  });

  // Carregar dados da receita quando disponível
  useEffect(() => {
    if (receitaOriginal) {
      setReceita({
        nome: receitaOriginal.nome,
        categoria: receitaOriginal.categoria,
        ingredientes: [...receitaOriginal.ingredientes],
        modo_preparo: receitaOriginal.modo_preparo,
        tempo_preparo: receitaOriginal.tempo_preparo?.toString() || "",
        porcoes: receitaOriginal.porcoes?.toString() || "",
        dificuldade: receitaOriginal.dificuldade || "",
        favorita: receitaOriginal.favorita,
      });
    }
  }, [receitaOriginal]);

  const adicionarIngrediente = () => {
    setReceita((prev) => ({
      ...prev,
      ingredientes: [...prev.ingredientes, ""],
    }));
  };

  const removerIngrediente = (index: number) => {
    setReceita((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((_, i) => i !== index),
    }));
  };

  const atualizarIngrediente = (index: number, valor: string) => {
    setReceita((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes.map((ing, i) =>
        i === index ? valor : ing,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receita.nome || !receita.categoria || !receita.modo_preparo) {
      alert("Por favor, preencha os campos obrigatórios");
      return;
    }

    // Filtrar e limpar ingredientes
    const ingredientesFiltrados = receita.ingredientes
      .map((ing) => ing.trim())
      .filter((ing) => ing.length > 0);

    if (ingredientesFiltrados.length === 0) {
      alert("Por favor, adicione pelo menos um ingrediente");
      return;
    }

    setLoading(true);

    try {
      const dadosAtualizacao = {
        nome: receita.nome,
        categoria: receita.categoria,
        ingredientes: ingredientesFiltrados,
        modo_preparo: receita.modo_preparo,
        tempo_preparo: receita.tempo_preparo
          ? Number.parseInt(receita.tempo_preparo)
          : undefined,
        porcoes: receita.porcoes ? Number.parseInt(receita.porcoes) : undefined,
        dificuldade:
          receita.dificuldade &&
          ["facil", "medio", "dificil"].includes(receita.dificuldade)
            ? (receita.dificuldade as "facil" | "medio" | "dificil")
            : undefined,
        favorita: receita.favorita,
      };

      const { error } = await atualizarReceita(receitaId, dadosAtualizacao);

      if (error) {
        console.error("Erro ao atualizar receita:", error);
        const errorMessage = error.message || "Erro desconhecido";
        alert(`Erro ao atualizar receita: ${errorMessage}`);
      } else {
        alert("Receita atualizada com sucesso!");
        router.push(`/receitas/${receitaId}`);
      }
    } catch (error) {
      console.error("Erro inesperado ao atualizar receita:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro inesperado";
      alert(`Erro inesperado: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (authLoading || receitasLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando receita...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Login Necessário
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-slate-300 mb-4">
              Você precisa estar logado para editar receitas.
            </div>
            <Link href="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Fazer Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Recipe not found
  if (!receitaOriginal) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center flex items-center justify-center gap-2">
              <ChefHat className="w-6 h-6" />
              Receita Não Encontrada
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-slate-300">
              A receita que você está tentando editar não foi encontrada.
            </div>
            <Link href="/receitas">
              <Button className="bg-orange-600 hover:bg-orange-700 w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar às Receitas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/receitas/${receitaId}`}>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            Editar Receita
          </h1>
          <p className="text-slate-400 mt-1">
            Modifique os campos abaixo para atualizar sua receita
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Receita *
                </label>
                <Input
                  value={receita.nome}
                  onChange={(e) =>
                    setReceita((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Ex: Bolo de Chocolate"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Categoria *
                </label>
                <Select
                  value={receita.categoria}
                  onValueChange={(value) =>
                    setReceita((prev) => ({ ...prev, categoria: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {CATEGORIAS_RECEITAS.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tempo de Preparo (min)
                </label>
                <Input
                  type="number"
                  value={receita.tempo_preparo}
                  onChange={(e) =>
                    setReceita((prev) => ({
                      ...prev,
                      tempo_preparo: e.target.value,
                    }))
                  }
                  placeholder="30"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Porções
                </label>
                <Input
                  type="number"
                  value={receita.porcoes}
                  onChange={(e) =>
                    setReceita((prev) => ({ ...prev, porcoes: e.target.value }))
                  }
                  placeholder="4"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dificuldade
                </label>
                <Select
                  value={receita.dificuldade}
                  onValueChange={(value) =>
                    setReceita((prev) => ({ ...prev, dificuldade: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="facil">Fácil</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="dificil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="favorita"
                checked={receita.favorita}
                onCheckedChange={(checked) =>
                  setReceita((prev) => ({ ...prev, favorita: !!checked }))
                }
              />
              <label
                htmlFor="favorita"
                className="text-sm font-medium text-slate-300"
              >
                Marcar como receita favorita
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Ingredientes */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Ingredientes *</CardTitle>
              <Button
                type="button"
                onClick={adicionarIngrediente}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {receita.ingredientes.map((ingrediente, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={ingrediente}
                  onChange={(e) => atualizarIngrediente(index, e.target.value)}
                  placeholder={`Ingrediente ${index + 1}`}
                  className="flex-1 bg-slate-900 border-slate-600 text-white"
                />
                {receita.ingredientes.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removerIngrediente(index)}
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Modo de Preparo */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Modo de Preparo *</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={receita.modo_preparo}
              onChange={(e) =>
                setReceita((prev) => ({
                  ...prev,
                  modo_preparo: e.target.value,
                }))
              }
              placeholder="Descreva o passo a passo para preparar sua receita..."
              className="bg-slate-900 border-slate-600 text-white min-h-32"
            />
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <Link href={`/receitas/${receitaId}`} className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
