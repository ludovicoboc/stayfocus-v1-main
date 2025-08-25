"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { PlanejadorRefeicoes } from "@/components/planejador-refeicoes";
import { RegistroRefeicoes } from "@/components/registro-refeicoes";
import { LembreteHidratacao } from "@/components/lembrete-hidratacao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";
import Link from "next/link";
import { getCurrentDateString } from "@/lib/utils";

function AlimentacaoContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<string>(
    getCurrentDateString(),
  );

  useEffect(() => {
    const dateFromQuery = searchParams.get("date");
    if (dateFromQuery) {
      setCurrentDate(dateFromQuery);
    }
  }, [searchParams]);

  if (loading) {
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

  return (
    <main className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlanejadorRefeicoes />
        <RegistroRefeicoes date={currentDate} />
      </div>

      <LembreteHidratacao />

      {/* Minhas Receitas */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <ChefHat className="w-5 h-5 mr-2" />
            Minhas Receitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 mb-4">
            Organize e acesse suas receitas favoritas aqui. Crie listas de
            compras e planeje suas refeições.
          </p>
          <Link href="/receitas">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Acessar Minhas Receitas
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Footer Quote */}
      <div className="text-center py-8">
        <blockquote className="text-slate-400 italic text-sm max-w-2xl mx-auto">
          "Vitalidade é o resultado final, não o ponto de partida. Portanto, não
          deixe Māori Tradição: Simplesmente mantenha uma mente saudável, seja
          grato por tudo que você tem, mantenha-se ativo."
        </blockquote>
        <div className="text-slate-500 text-xs mt-2">StayFocus Oficial</div>
      </div>
    </main>
  );
}

export default function AlimentacaoPageContent() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AlimentacaoContent />
    </Suspense>
  );
}