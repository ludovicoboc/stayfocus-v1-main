"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { RegistroMedicamentos } from "@/components/registro-medicamentos"
import { MonitoramentoHumor } from "@/components/monitoramento-humor"

export default function SaudePage() {
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
          <CardContent className="pt-6">
            <div className="text-white text-center text-xl font-bold mb-4">Login Necessário</div>
            <div className="text-slate-300 text-center mb-6">Você precisa estar logado para acessar esta página.</div>
            <Link href="/auth">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-8">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4 mb-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Saúde</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        <RegistroMedicamentos />
        <MonitoramentoHumor />
      </main>

      {/* Footer Quote */}
      <footer className="max-w-5xl mx-auto px-4 mt-12 text-center">
        <blockquote className="text-slate-400 italic text-sm">
          "Whaka te iti kahurangi, ki te tuohu koe, me he maunga teitei" - Provérbio da língua Māori
        </blockquote>
        <div className="text-slate-500 text-xs mt-1">
          Tradução: "Busque o tesouro que você mais valoriza, se você inclinar a cabeça, que seja para uma montanha
          elevada."
        </div>
        <div className="text-slate-600 text-xs mt-2">StayFocus Oficial</div>
      </footer>
    </div>
  )
}
