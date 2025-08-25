"use client"

import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth-provider"
import { EnvelopesVirtuais } from "@/components/envelopes-virtuais"
import { CalendarioPagamentos } from "@/components/calendario-pagamentos"
import { AdicionarDespesa } from "@/components/adicionar-despesa"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Menu, User, DollarSign } from "lucide-react"
import Link from "next/link"

// Carregamento dinâmico do componente de gráficos para evitar problemas de SSR
const RastreadorGastos = dynamic(
  () => import("@/components/rastreador-gastos").then((mod) => ({ default: mod.RastreadorGastos })),
  {
    ssr: false,
    loading: () => (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Rastreador de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando gráfico...</p>
          </div>
        </CardContent>
      </Card>
    ),
  },
)

export default function FinancasPage() {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rastreador de Gastos */}
          <RastreadorGastos />

          {/* Envelopes Virtuais */}
          <EnvelopesVirtuais />

          {/* Calendário de Pagamentos */}
          <CalendarioPagamentos />

          {/* Adicionar Despesa */}
          <AdicionarDespesa />
        </div>

        {/* Footer Quote */}
        <div className="text-center py-8 mt-12">
          <blockquote className="text-slate-400 italic text-sm max-w-2xl mx-auto">
            "Não é o quanto você ganha, mas o quanto você economiza que determina sua riqueza." - Benjamin Franklin
          </blockquote>
          <div className="text-slate-500 text-xs mt-2">StayFocus Oficial</div>
        </div>
    </main>
  )
}
