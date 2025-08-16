"use client"

import { useAuth } from "@/hooks/use-auth"
import { useDashboard } from "@/hooks/use-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PainelDia } from "@/components/painel-dia"
import { PrioridadesDia } from "@/components/prioridades-dia"
import { TemporizadorFocoDashboard } from "@/components/temporizador-foco-dashboard"
import { DashboardModules } from "@/components/dashboard-modules"
import { 
  Calendar, 
  Target, 
  Timer, 
  Pill, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Activity 
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { dashboardData, loading: dashboardLoading } = useDashboard()

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

  const formatTime = () => {
    const now = new Date()
    return now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  // Estatísticas do dashboard
  const atividadesCompletadas = dashboardData.painelDia.filter(a => a.concluida).length
  const totalAtividades = dashboardData.painelDia.length
  const prioridadesCompletadas = dashboardData.prioridades.filter(p => p.concluida).length
  const totalPrioridades = dashboardData.prioridades.length
  const proximoMedicamento = dashboardData.medicamentos
    .filter(m => !m.tomado && m.horario)
    .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''))[0]

  // Dados de progresso baseados em dados reais
  const progressData = {
    '/alimentacao': totalAtividades > 0 ? Math.round((atividadesCompletadas / totalAtividades) * 100) : 0,
    '/estudos': dashboardData.sessaoFoco?.ativa ? 75 : 25,
    '/saude': dashboardData.medicamentos.length > 0 ? Math.round((dashboardData.medicamentos.filter(m => m.tomado).length / dashboardData.medicamentos.length) * 100) : 0,
    '/sono': 60, // Placeholder - seria calculado com dados de sono
    '/hiperfocos': dashboardData.sessaoFoco ? 80 : 20,
    '/financas': 45, // Placeholder - seria calculado com dados financeiros
    '/autoconhecimento': 30, // Placeholder
    '/lazer': 50, // Placeholder
  }

  return (
    <main className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {getGreeting()}, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-slate-400 mt-1">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} • {formatTime()}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {dashboardData.sessaoFoco?.ativa && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">
                Sessão ativa
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Atividades Hoje</p>
                {dashboardLoading ? (
                  <Skeleton className="h-6 w-12 mt-1 bg-slate-700" />
                ) : (
                  <p className="text-2xl font-bold text-white">
                    {atividadesCompletadas}/{totalAtividades}
                  </p>
                )}
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
              </CardContent>
            </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Prioridades</p>
                {dashboardLoading ? (
                  <Skeleton className="h-6 w-12 mt-1 bg-slate-700" />
                ) : (
                  <p className="text-2xl font-bold text-white">
                    {prioridadesCompletadas}/{totalPrioridades}
                  </p>
                )}
              </div>
              <Target className="w-8 h-8 text-orange-400" />
            </div>
              </CardContent>
            </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Próximo Medicamento</p>
                {dashboardLoading ? (
                  <Skeleton className="h-6 w-20 mt-1 bg-slate-700" />
                ) : proximoMedicamento ? (
                  <p className="text-lg font-semibold text-white">
                    {proximoMedicamento.horario}
                  </p>
                ) : (
                  <p className="text-lg text-slate-500">--:--</p>
                )}
              </div>
              <Pill className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Sessão de Foco</p>
                {dashboardLoading ? (
                  <Skeleton className="h-6 w-16 mt-1 bg-slate-700" />
                ) : dashboardData.sessaoFoco?.ativa ? (
                  <p className="text-lg font-semibold text-green-400">Ativa</p>
                ) : (
                  <p className="text-lg text-slate-500">Parada</p>
                )}
              </div>
              <Timer className="w-8 h-8 text-purple-400" />
            </div>
              </CardContent>
            </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Atividades do Dia */}
        <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Painel do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
            {dashboardLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full bg-slate-700" />
                ))}
              </div>
            ) : (
              <PainelDia />
            )}
              </CardContent>
            </Card>

        {/* Middle Column - Prioridades */}
        <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              Prioridades
                </CardTitle>
              </CardHeader>
              <CardContent>
            {dashboardLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full bg-slate-700" />
                ))}
              </div>
            ) : (
              <PrioridadesDia />
            )}
              </CardContent>
            </Card>

        {/* Right Column - Foco & Medicamentos */}
        <div className="space-y-6">
          {/* Temporizador de Foco */}
          <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Timer className="w-5 h-5 text-purple-400" />
                Foco
                </CardTitle>
              </CardHeader>
              <CardContent>
              {dashboardLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full bg-slate-700" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full bg-slate-700" />
                    <Skeleton className="h-8 w-full bg-slate-700" />
                  </div>
                </div>
              ) : (
                <TemporizadorFocoDashboard />
              )}
              </CardContent>
            </Card>

          {/* Widget de Medicamentos */}
          <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Pill className="w-5 h-5 text-red-400" />
                Medicamentos Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
              {dashboardLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-8 w-full bg-slate-700" />
                  ))}
                </div>
              ) : dashboardData.medicamentos.length === 0 ? (
                <div className="text-center py-4">
                  <Pill className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Nenhum medicamento cadastrado</p>
                  <Link href="/saude" className="text-blue-400 text-xs hover:underline">
                    Gerenciar medicamentos
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dashboardData.medicamentos.map((medicamento) => (
                    <div
                      key={medicamento.id}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        medicamento.tomado
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-slate-700 border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {medicamento.tomado ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                        <span className={`text-sm ${medicamento.tomado ? 'text-green-400' : 'text-white'}`}>
                          {medicamento.nome}
                        </span>
                      </div>
                      {medicamento.horario && (
                        <span className="text-xs text-slate-400">
                          {medicamento.horario}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Modules Grid */}
      <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
          <CardTitle className="text-white">Módulos do Sistema</CardTitle>
          <p className="text-slate-400 text-sm">
            Acesse rapidamente todas as funcionalidades do StayFocus
          </p>
              </CardHeader>
                      <CardContent>
          <DashboardModules progressData={progressData} />
        </CardContent>
            </Card>
    </main>
  )
}
