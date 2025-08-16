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
    <main className="max-w-7xl mx-auto p-4">{renderContent()}</main>

  )
}
