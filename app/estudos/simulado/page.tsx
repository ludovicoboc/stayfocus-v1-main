"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useSimulados } from "@/hooks/use-simulados"
import { SimuladoLoader } from "@/components/simulado-loader"
import { SimuladoReview } from "@/components/simulado-review"
import { SimuladoResults } from "@/components/simulado-results"
import { HistoricoModal } from "@/components/historico-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, RotateCcw } from "lucide-react"
import Link from "next/link"

export default function SimuladoPage() {
  const { user, loading: authLoading } = useAuth()
  const { status, resetSimulado } = useSimulados()
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false)

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

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando simulado...</p>
          </div>
        )
      case "reviewing":
        return <SimuladoReview />
      case "results":
        return <SimuladoResults />
      default:
        return <SimuladoLoader />
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold text-white">Conferência de Simulado</h1>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsHistoricoOpen(true)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <History className="w-4 h-4 mr-1" />
              Histórico
            </Button>
            {status !== "idle" && (
              <Button
                onClick={resetSimulado}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Carregar Novo
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">{renderContent()}</main>

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

      {/* Histórico Modal */}
      <HistoricoModal open={isHistoricoOpen} onClose={() => setIsHistoricoOpen(false)} />
    </div>
  )
}
