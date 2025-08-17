"use client"

import { useAuth } from "@/hooks/use-auth"
import { useDashboard } from "@/hooks/use-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Clock,
  Target,
  Pill,
  Brain,
  Plus,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { PainelDia } from "@/components/painel-dia"
import { PrioridadesDia } from "@/components/prioridades-dia"
import { TemporizadorFocoDashboard } from "@/components/temporizador-foco-dashboard"
import { DashboardModules } from "@/components/dashboard-modules"
import { ProximosCompromissos } from "@/components/proximos-compromissos"

import { LoadingScreen } from "@/components/loading-screen"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { 
    dashboardData, 
    loading, 
    error, 
    adicionarAtividadePainelDia,
    toggleAtividadeConcluida,
    adicionarPrioridade,
    togglePrioridadeConcluida,
    iniciarSessaoFoco,
    pausarSessaoFoco,
    pararSessaoFoco,
    recarregarDados,
    limparErro
  } = useDashboard()

  if (authLoading || loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Bem-vindo ao StayFocus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-slate-300 text-center">
              Uma plataforma especializada para pessoas neurodivergentes organizarem sua vida com mais facilidade.
            </div>
            <Link href="/auth">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Tratamento de Erros */}
        {error && (
          <Alert className="mb-4 bg-red-900/20 border-red-700 text-red-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error.message}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={recarregarDados}
                  className="h-6 px-2 text-red-100 hover:bg-red-800"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={limparErro}
                  className="h-6 px-2 text-red-100 hover:bg-red-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-none">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-4 sm:space-y-6">
            {/* Painel do Dia */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Painel do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PainelDia />
              </CardContent>
            </Card>

            {/* Módulos Principais */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Seus Módulos</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardModules />
              </CardContent>
            </Card>

            {/* Prioridades do Dia */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Prioridades do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PrioridadesDia />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Direita */}
          <div className="lg:col-span-1 xl:col-span-1 space-y-4 sm:space-y-6">
            {/* Temporizador de Foco */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Foco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TemporizadorFocoDashboard />
              </CardContent>
            </Card>

            {/* Próximos Compromissos */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Próximos Compromissos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProximosCompromissos />
              </CardContent>
            </Card>

            {/* Medicamentos */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Medicamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.medicamentos && dashboardData.medicamentos.length > 0 ? (
                  <div className="space-y-2">
                    {dashboardData.medicamentos.slice(0, 3).map((medicamento) => (
                      <div
                        key={medicamento.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-700"
                      >
                        <div>
                          <div className="text-sm font-medium text-white">{medicamento.nome}</div>
                          {medicamento.horario && <div className="text-xs text-slate-400">{medicamento.horario}</div>}
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${medicamento.tomado ? "bg-green-400" : "bg-yellow-400"}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Pill className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">Nenhum medicamento cadastrado</p>
                    <Link href="/saude">
                      <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700">
                        Adicionar
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dica do Dia */}
            <Card className="bg-gradient-to-br from-blue-900 to-purple-900 border-blue-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Dica do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-100">
                  Lembre-se de fazer pausas regulares durante o trabalho. Seu cérebro neurodivergente precisa de
                  momentos de descanso para processar informações.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
