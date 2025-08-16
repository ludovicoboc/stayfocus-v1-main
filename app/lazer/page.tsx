"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TemporizadorLazer } from "@/components/temporizador-lazer"
import { AtividadesLazer } from "@/components/atividades-lazer"
import { SugestoesDescanso } from "@/components/sugestoes-descanso"
import Link from "next/link"

export default function LazerPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Login Necessário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-300 text-center mb-4">Você precisa estar logado para acessar esta página.</div>
            <Link href="/auth">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Temporizador de Lazer */}
        <TemporizadorLazer />

        {/* Atividades de Lazer */}
        <AtividadesLazer />

        {/* Sugestões de Descanso */}
        <SugestoesDescanso />

        {/* Footer Quote */}
        <div className="text-center py-8">
          <blockquote className="text-slate-400 italic text-sm max-w-2xl mx-auto">
            "Minha lei é trabalhar. Ai de quem não trabalha, que me maçante tédio!" - Provérbio da língua Mãori
          </blockquote>
          <div className="text-slate-500 text-xs mt-2">
            Tradução: "Busque o equilíbrio que você mais valoriza, se você trouxer o silêncio, que seja para uma
            montanha elevada."
          </div>
          <div className="text-slate-500 text-xs mt-1">StayFocus Oficial</div>
        </div>
    </main>
  )
}
