"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useReceitas } from "@/hooks/use-receitas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChefHat,
  ArrowLeft,
  Clock,
  Users,
  Star,
  Pencil,
  Trash2,
  Heart,
  HeartOff,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function ReceitaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { receitas, loading, excluirReceita, toggleFavorita } = useReceitas();

  const receitaId = params.id as string;
  const receita = receitas.find((r) => r.id === receitaId);

  const [deletingReceita, setDeletingReceita] = useState(false);
  const [togglingFavorita, setTogglingFavorita] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    setDeletingReceita(true);
    try {
      const { error } = await excluirReceita(receitaId);
      if (error) {
        alert(`Erro ao excluir receita: ${error.message}`);
      } else {
        router.push("/receitas");
      }
    } catch (error) {
      console.error("Erro ao excluir receita:", error);
      alert("Erro inesperado ao excluir receita");
    } finally {
      setDeletingReceita(false);
    }
  };

  const handleToggleFavorita = async () => {
    if (!receita) return;

    setTogglingFavorita(true);
    try {
      const { error } = await toggleFavorita(receita.id, !receita.favorita);
      if (error) {
        alert(`Erro ao atualizar favorita: ${error.message}`);
      }
    } catch (error) {
      console.error("Erro ao toggle favorita:", error);
      alert("Erro inesperado ao atualizar favorita");
    } finally {
      setTogglingFavorita(false);
    }
  };

  const getDificuldadeColor = (dificuldade?: string) => {
    switch (dificuldade) {
      case "facil":
        return "bg-green-500 hover:bg-green-600";
      case "medio":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "dificil":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (authLoading || loading) {
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
              Você precisa estar logado para ver esta receita.
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
  if (!receita) {
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
              A receita que você está procurando não foi encontrada ou não
              existe.
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
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header com navegação e ações */}
      <div className="flex items-center justify-between">
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFavorita}
            disabled={togglingFavorita}
            className={`border-slate-600 hover:bg-slate-700 ${
              receita.favorita
                ? "text-yellow-500 border-yellow-500 hover:border-yellow-400"
                : "text-slate-300"
            }`}
          >
            {receita.favorita ? (
              <Heart className="w-4 h-4 mr-2 fill-current" />
            ) : (
              <HeartOff className="w-4 h-4 mr-2" />
            )}
            {togglingFavorita
              ? "..."
              : receita.favorita
                ? "Favorita"
                : "Favoritar"}
          </Button>

          <Link href={`/receitas/${receitaId}/editar`}>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deletingReceita}
            className="border-red-600 text-red-400 hover:bg-red-900/20 bg-transparent"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deletingReceita ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </div>

      {/* Cartão principal da receita */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-white text-2xl flex items-center gap-3">
                <ChefHat className="w-7 h-7 text-orange-500" />
                {receita.nome}
                {receita.favorita && (
                  <Star className="w-6 h-6 text-yellow-500 fill-current" />
                )}
              </CardTitle>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-slate-300 border-slate-500"
                >
                  {receita.categoria}
                </Badge>

                {receita.dificuldade && (
                  <Badge
                    className={`${getDificuldadeColor(receita.dificuldade)} text-white`}
                  >
                    {receita.dificuldade.charAt(0).toUpperCase() +
                      receita.dificuldade.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Informações da receita */}
          <div className="flex items-center gap-6 text-sm text-slate-400 pt-4">
            {receita.tempo_preparo && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{receita.tempo_preparo} minutos</span>
              </div>
            )}

            {receita.porcoes && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>
                  {receita.porcoes}{" "}
                  {receita.porcoes === 1 ? "porção" : "porções"}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Criada em {formatDate(receita.created_at)}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Ingredientes */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              📝 Ingredientes
            </h3>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <ul className="space-y-2">
                {receita.ingredientes.map((ingrediente, index) => (
                  <li
                    key={index}
                    className="text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{ingrediente}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Modo de preparo */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              👨‍🍳 Modo de Preparo
            </h3>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {receita.modo_preparo}
              </div>
            </div>
          </div>

          {/* Informações adicionais */}
          {receita.updated_at !== receita.created_at && (
            <div className="text-xs text-slate-500 pt-4 border-t border-slate-700">
              Última atualização: {formatDate(receita.updated_at)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações adicionais */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/receitas/${receitaId}/editar`}>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar Receita
              </Button>
            </Link>

            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              🛒 Adicionar à Lista de Compras
            </Button>

            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              📤 Compartilhar Receita
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
