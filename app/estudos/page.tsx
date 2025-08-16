"use client"

import { useAuth } from "@/hooks/use-auth"
import { TemporizadorPomodoro } from "@/components/temporizador-pomodoro"
import { RegistroEstudos } from "@/components/registro-estudos"
import { ProximoConcurso } from "@/components/proximo-concurso"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Menu, User, FileText, Eye } from "lucide-react"
import Link from "next/link"

export default function EstudosPage() {
  const { user, loading: authLoading, signOut } = useAuth()

  if (authLoading) {
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
    <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Temporizador Pomodoro */}
          <TemporizadorPomodoro />

          {/* Registro de Estudos */}
          <RegistroEstudos />
        </div>

        {/* Próximo Concurso */}
        <ProximoConcurso />

        {/* Footer Quote */}
        <div className="text-center py-8 mt-12">
          <blockquote className="text-slate-400 italic text-sm max-w-2xl mx-auto">
            "Whāia te iti kahurangi, ki te tuohu koe, me he maunga teitei" - Provérbio da língua Māori
            <br />
            Tradução: "Busque o tesouro que você mais valoriza, se você inclinar a cabeça, que seja para uma montanha
            elevada."
          </blockquote>
          <div className="text-slate-500 text-xs mt-2">StayFocus Oficial</div>
        </div>
    </main>
  )
}
