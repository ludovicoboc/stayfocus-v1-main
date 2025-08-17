"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useReceitas } from "@/hooks/use-receitas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChefHat,
  Plus,
  Search,
  ShoppingCart,
  Clock,
  Users,
  Star,
} from "lucide-react";
import Link from "next/link";

export default function ReceitasPage() {
  const { user, loading: authLoading } = useAuth();
  const { receitas, loading, loadReceitas, excluirReceita } = useReceitas();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  const getReceitasFiltradas = () => {
    return receitas.filter((receita) => {
      const matchesSearch = receita.nome
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoriaFiltro === "todas" || receita.categoria === categoriaFiltro;
      return matchesSearch && matchesCategory;
    });
  };

  const getCategorias = () => {
    const categorias = Array.from(new Set(receitas.map((r) => r.categoria)));
    return ["todas", ...categorias];
  };

  const removerReceita = async (id: string) => {
    await excluirReceita(id);
    await loadReceitas();
  };

  const [receitasSelecionadas, setReceitasSelecionadas] = useState<string[]>(
    [],
  );

  if (authLoading || loading) {
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

  const receitasFiltradas = getReceitasFiltradas();
  const categorias = getCategorias();

  const toggleReceitaSelecionada = (id: string) => {
    setReceitasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const getDificuldadeColor = (dificuldade?: string) => {
    switch (dificuldade) {
      case "facil":
        return "bg-green-500";
      case "medio":
        return "bg-yellow-500";
      case "dificil":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Buscar receitas ou ingredientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categorias.map((categoria) => (
              <SelectItem key={categoria} value={categoria}>
                {categoria}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Receitas */}
      {receitasFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {receitasFiltradas.map((receita) => (
            <Card
              key={receita.id}
              className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-white text-lg">
                    {receita.nome}
                  </CardTitle>
                  {receita.favorita && (
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-slate-300">
                    {receita.categoria}
                  </Badge>
                  {receita.dificuldade && (
                    <Badge
                      className={`${getDificuldadeColor(receita.dificuldade)} text-white`}
                    >
                      {receita.dificuldade}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  {receita.tempo_preparo && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {receita.tempo_preparo}min
                    </div>
                  )}
                  {receita.porcoes && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {receita.porcoes} porções
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">
                    Ingredientes:
                  </h4>
                  <div className="text-sm text-slate-400 max-h-20 overflow-y-auto">
                    {receita.ingredientes
                      .slice(0, 3)
                      .map((ingrediente, index) => (
                        <div key={index}>• {ingrediente}</div>
                      ))}
                    {receita.ingredientes.length > 3 && (
                      <div className="text-slate-500">
                        ... e mais {receita.ingredientes.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/receitas/${receita.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    >
                      Ver Receita
                    </Button>
                  </Link>
                  <Button
                    variant={
                      receitasSelecionadas.includes(receita.id)
                        ? "default"
                        : "outline"
                    }
                    onClick={() => toggleReceitaSelecionada(receita.id)}
                    className={
                      receitasSelecionadas.includes(receita.id)
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "border-slate-600 text-slate-300 hover:bg-slate-700"
                    }
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm || categoriaFiltro
              ? "Nenhuma receita encontrada"
              : "Nenhuma receita cadastrada"}
          </h3>
          <p className="text-slate-400 mb-6">
            {searchTerm || categoriaFiltro
              ? "Tente ajustar os filtros de busca"
              : "Comece adicionando sua primeira receita"}
          </p>
          <Link href="/receitas/adicionar">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Receita
            </Button>
          </Link>
        </div>
      )}

      {/* Botão para gerar lista de compras */}
      {receitasSelecionadas.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <Link
            href={`/receitas/lista-compras?receitas=${receitasSelecionadas.join(",")}`}
          >
            <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Gerar Lista ({receitasSelecionadas.length})
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
