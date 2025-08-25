"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ChefHat, Plus, X, ArrowLeft } from "lucide-react";
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

export default function AdicionarReceitaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { adicionarReceita } = useReceitas();

  const [loading, setLoading] = useState(false);
  const [receita, setReceita] = useState({
    nome: "",
    categoria: "",
    ingredientes: [""],
    modo_preparo: "",
    tempo_preparo: "",
    porcoes: "",
    dificuldade: "medio" as "facil" | "medio" | "dificil",
    favorita: false,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Login Necessário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-300 text-center mb-4">
              Você precisa estar logado para acessar esta página.
            </div>
            <Link href="/auth">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Fazer Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      .filter((ing) => ing !== "" && ing.length > 0);

    if (ingredientesFiltrados.length === 0) {
      alert("Adicione pelo menos um ingrediente válido");
      return;
    }

    // Validar se nenhum ingrediente está vazio após trim
    const hasEmptyIngredients = ingredientesFiltrados.some((ing) => ing === "");
    if (hasEmptyIngredients) {
      alert("Remova ingredientes vazios antes de salvar");
      return;
    }

    setLoading(true);
    try {
      const { error } = await adicionarReceita({
        nome: receita.nome,
        categoria: receita.categoria,
        ingredientes: ingredientesFiltrados,
        modo_preparo: receita.modo_preparo,
        tempo_preparo: receita.tempo_preparo
          ? Number.parseInt(receita.tempo_preparo)
          : undefined,
        porcoes: receita.porcoes ? Number.parseInt(receita.porcoes) : undefined,
        dificuldade: receita.dificuldade,
        favorita: receita.favorita,
      });

      if (error) {
        console.error("Erro ao salvar receita:", error);
        const errorMessage = error.message || "Erro desconhecido";
        alert(`Erro ao salvar receita: ${errorMessage}`);
      } else {
        alert("Receita salva com sucesso!");
        router.push("/receitas");
      }
    } catch (error) {
      console.error("Erro inesperado ao salvar receita:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro inesperado";
      alert(`Erro inesperado: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getDificuldadeColor = (dificuldade: string) => {
    switch (dificuldade) {
      case "facil":
        return "bg-green-600";
      case "medio":
        return "bg-yellow-600";
      case "dificil":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-4">
      {/* Header com navegação */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/receitas">
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
            Adicionar Nova Receita
          </h1>
          <p className="text-slate-400 mt-1">
            Preencha os campos abaixo para criar sua receita
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Básicas */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
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
                    required
                  />
                </div>

                <div>
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
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {CATEGORIAS_RECEITAS.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
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

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Porções
                    </label>
                    <Input
                      type="number"
                      value={receita.porcoes}
                      onChange={(e) =>
                        setReceita((prev) => ({
                          ...prev,
                          porcoes: e.target.value,
                        }))
                      }
                      placeholder="4"
                      className="bg-slate-900 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Dificuldade
                    </label>
                    <Select
                      value={receita.dificuldade}
                      onValueChange={(value: "facil" | "medio" | "dificil") =>
                        setReceita((prev) => ({ ...prev, dificuldade: value }))
                      }
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="facil">Fácil</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="dificil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {receita.ingredientes.map((ingrediente, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={ingrediente}
                        onChange={(e) =>
                          atualizarIngrediente(index, e.target.value)
                        }
                        placeholder="Ex: 2 xícaras de farinha de trigo"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                      {receita.ingredientes.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removerIngrediente(index)}
                          size="icon"
                          variant="outline"
                          className="border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-400 bg-transparent"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
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
                  placeholder="Descreva o passo a passo para preparar a receita..."
                  className="bg-slate-900 border-slate-600 text-white min-h-32"
                  required
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {receita.nome || "Nome da Receita"}
                  </h3>
                  {receita.categoria && (
                    <Badge variant="outline" className="mt-2">
                      {receita.categoria}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {receita.tempo_preparo && (
                    <div className="text-slate-300">
                      ⏱️ {receita.tempo_preparo} minutos
                    </div>
                  )}
                  {receita.porcoes && (
                    <div className="text-slate-300">
                      👥 {receita.porcoes} porções
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">📊</span>
                    <Badge
                      className={`${getDificuldadeColor(receita.dificuldade)} text-white`}
                    >
                      {receita.dificuldade}
                    </Badge>
                  </div>
                </div>

                {receita.ingredientes.filter((ing) => ing.trim()).length >
                  0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">
                      Ingredientes:
                    </h4>
                    <ul className="text-xs text-slate-400 space-y-1">
                      {receita.ingredientes
                        .filter((ing) => ing.trim())
                        .slice(0, 3)
                        .map((ingrediente, index) => (
                          <li key={index}>• {ingrediente}</li>
                        ))}
                      {receita.ingredientes.filter((ing) => ing.trim()).length >
                        3 && (
                        <li className="text-slate-500">
                          ... e mais{" "}
                          {receita.ingredientes.filter((ing) => ing.trim())
                            .length - 3}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? "Salvando..." : "Salvar Receita"}
              </Button>
              <Link href="/receitas">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  Cancelar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
