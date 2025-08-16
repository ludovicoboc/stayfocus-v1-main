"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useSono } from "@/hooks/use-sono"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun, Bell, TrendingUp, Info } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SonoPage() {
  const { user, loading: authLoading } = useAuth()
  const { 
    registrosSono, 
    configuracaoLembretes, 
    estatisticas, 
    loading: sonoLoading,
    salvarRegistroSono, 
    atualizarLembretes 
  } = useSono()

  const [registroSono, setRegistroSono] = useState({
    horaDormir: "",
    horaAcordar: "",
    qualidade: 5,
    observacoes: "",
  })
  const [lembretes, setLembretes] = useState({
    lembreteDormir: true,
    horarioLembrete: "22:00",
    lembreteAcordar: false,
    horarioAcordar: "07:00",
  })

  // Atualizar estado dos lembretes quando carregar configuração
  useEffect(() => {
    if (configuracaoLembretes) {
      setLembretes({
        lembreteDormir: configuracaoLembretes.bedtime_reminder_enabled,
        horarioLembrete: configuracaoLembretes.bedtime_reminder_time,
        lembreteAcordar: configuracaoLembretes.wake_reminder_enabled,
        horarioAcordar: configuracaoLembretes.wake_reminder_time,
      })
    }
  }, [configuracaoLembretes])
  
  const [salvandoRegistro, setSalvandoRegistro] = useState(false)
  const [salvandoLembretes, setSalvandoLembretes] = useState(false)

  // Função para salvar registro de sono
  const handleSalvarRegistro = async () => {
    if (!registroSono.horaDormir || !registroSono.horaAcordar) {
      toast.error("Por favor, preencha os horários de dormir e acordar")
      return
    }

    setSalvandoRegistro(true)
    try {
      const hoje = new Date().toISOString().split('T')[0]
      
      const { error } = await salvarRegistroSono({
        bedtime: registroSono.horaDormir,
        wake_time: registroSono.horaAcordar,
        sleep_quality: registroSono.qualidade,
        notes: registroSono.observacoes || undefined,
        date: hoje
      })

      if (error) {
        toast.error("Erro ao salvar registro de sono")
        console.error(error)
      } else {
        toast.success("Registro de sono salvo com sucesso!")
        // Limpar formulário
        setRegistroSono({
          horaDormir: "",
          horaAcordar: "",
          qualidade: 5,
          observacoes: "",
        })
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar")
      console.error(error)
    } finally {
      setSalvandoRegistro(false)
    }
  }

  // Função para salvar configurações de lembretes
  const handleSalvarLembretes = async () => {
    setSalvandoLembretes(true)
    try {
      const { error } = await atualizarLembretes({
        bedtime_reminder_enabled: lembretes.lembreteDormir,
        bedtime_reminder_time: lembretes.horarioLembrete,
        wake_reminder_enabled: lembretes.lembreteAcordar,
        wake_reminder_time: lembretes.horarioAcordar,
        active: true,
        weekdays: ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
      })

      if (error) {
        toast.error("Erro ao salvar configurações")
        console.error(error)
      } else {
        toast.success("Configurações salvas com sucesso!")
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar")
      console.error(error)
    } finally {
      setSalvandoLembretes(false)
    }
  }

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

  const calcularHorasSono = () => {
    if (!registroSono.horaDormir || !registroSono.horaAcordar) return 0

    const [dorH, dorM] = registroSono.horaDormir.split(":").map(Number)
    const [acorH, acorM] = registroSono.horaAcordar.split(":").map(Number)

    const dormir = dorH * 60 + dorM
    let acordar = acorH * 60 + acorM

    // Se acordar é menor que dormir, passou da meia-noite
    if (acordar < dormir) {
      acordar += 24 * 60
    }

    return Math.round(((acordar - dormir) / 60) * 10) / 10
  }

  const horasSono = calcularHorasSono()

  const getQualidadeColor = (qualidade: number) => {
    if (qualidade >= 8) return "bg-green-500"
    if (qualidade >= 6) return "bg-yellow-500"
    return "bg-red-500"
  }

  const dicasSono = [
    "Mantenha um horário regular para dormir e acordar",
    "Evite telas 1 hora antes de dormir",
    "Crie um ambiente escuro e silencioso",
    "Evite cafeína 6 horas antes de dormir",
    "Pratique técnicas de relaxamento",
    "Mantenha o quarto em temperatura agradável (18-22°C)",
  ]

  return (
    <main className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="registrar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="registrar" className="data-[state=active]:bg-indigo-600">
              Registrar Sono
            </TabsTrigger>
            <TabsTrigger value="visualizar" className="data-[state=active]:bg-indigo-600">
              Visualizar Padrões
            </TabsTrigger>
            <TabsTrigger value="lembretes" className="data-[state=active]:bg-indigo-600">
              Lembretes
            </TabsTrigger>
          </TabsList>

          {/* Registrar Sono */}
          <TabsContent value="registrar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Moon className="w-5 h-5" />
                    Registro de Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Hora de Dormir</label>
                      <Input
                        type="time"
                        value={registroSono.horaDormir}
                        onChange={(e) => setRegistroSono((prev) => ({ ...prev, horaDormir: e.target.value }))}
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Hora de Acordar</label>
                      <Input
                        type="time"
                        value={registroSono.horaAcordar}
                        onChange={(e) => setRegistroSono((prev) => ({ ...prev, horaAcordar: e.target.value }))}
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  {horasSono > 0 && (
                    <div className="p-3 bg-indigo-900/20 rounded-lg border border-indigo-700">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Total de sono:</span>
                        <Badge className="bg-indigo-600">{horasSono}h</Badge>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Qualidade do Sono (1-10)</label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="range"
                        min="1"
                        max="10"
                        value={registroSono.qualidade}
                        onChange={(e) =>
                          setRegistroSono((prev) => ({ ...prev, qualidade: Number.parseInt(e.target.value) }))
                        }
                        className="flex-1"
                      />
                      <Badge className={`${getQualidadeColor(registroSono.qualidade)} text-white`}>
                        {registroSono.qualidade}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Observações</label>
                    <Input
                      value={registroSono.observacoes}
                      onChange={(e) => setRegistroSono((prev) => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Como foi sua noite de sono?"
                      className="bg-slate-900 border-slate-600 text-white"
                    />
                  </div>

                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleSalvarRegistro}
                    disabled={salvandoRegistro}
                  >
                    {salvandoRegistro ? "Salvando..." : "Salvar Registro"}
                  </Button>
                </CardContent>
              </Card>

              {/* Dicas de Sono */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Dicas para Melhor Sono
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dicasSono.map((dica, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/50">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-slate-300 text-sm">{dica}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Visualizar Padrões */}
          <TabsContent value="visualizar" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Padrões de Sono - Última Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sonoLoading ? (
                  <div className="text-center py-12">
                    <div className="text-white">Carregando estatísticas...</div>
                  </div>
                ) : !estatisticas || estatisticas.totalRegistros === 0 ? (
                  <div className="text-center py-12">
                    <Moon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-white mb-2">Dados Insuficientes</h3>
                    <p className="text-slate-400 mb-6">Registre seu sono por alguns dias para ver os padrões</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
                      <div className="p-4 bg-slate-900 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-400">0h</div>
                        <div className="text-sm text-slate-400">Média Semanal</div>
                      </div>
                      <div className="p-4 bg-slate-900 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">0</div>
                        <div className="text-sm text-slate-400">Qualidade Média</div>
                      </div>
                      <div className="p-4 bg-slate-900 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">0%</div>
                        <div className="text-sm text-slate-400">Consistência</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Estatísticas Principais */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-900 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-400">{estatisticas.mediaHorasSono}h</div>
                        <div className="text-sm text-slate-400">Média Semanal</div>
                        {estatisticas.tendenciaHoras !== 'estavel' && (
                          <div className={`text-xs mt-1 ${
                            estatisticas.tendenciaHoras === 'aumentando' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {estatisticas.tendenciaHoras === 'aumentando' ? '↗ Aumentando' : '↘ Diminuindo'}
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-slate-900 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">{estatisticas.mediaQualidade}</div>
                        <div className="text-sm text-slate-400">Qualidade Média</div>
                        {estatisticas.tendenciaQualidade !== 'estavel' && (
                          <div className={`text-xs mt-1 ${
                            estatisticas.tendenciaQualidade === 'melhorando' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {estatisticas.tendenciaQualidade === 'melhorando' ? '↗ Melhorando' : '↘ Piorando'}
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-slate-900 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">{estatisticas.consistencia}%</div>
                        <div className="text-sm text-slate-400">Consistência</div>
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900 rounded-lg">
                        <h4 className="font-medium text-white mb-2">Padrões Identificados</h4>
                        <div className="space-y-2 text-sm">
                          {estatisticas.melhorDia && (
                            <div className="text-green-400">
                              Melhor dia: {estatisticas.melhorDia}
                            </div>
                          )}
                          {estatisticas.horaIdealDormir && (
                            <div className="text-slate-300">
                              Horário comum para dormir: {estatisticas.horaIdealDormir}
                            </div>
                          )}
                          {estatisticas.horaIdealAcordar && (
                            <div className="text-slate-300">
                              Horário comum para acordar: {estatisticas.horaIdealAcordar}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900 rounded-lg">
                        <h4 className="font-medium text-white mb-2">Resumo da Semana</h4>
                        <div className="space-y-2 text-sm">
                          <div className="text-slate-300">
                            Registros: {estatisticas.totalRegistros}/7 dias
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${(estatisticas.totalRegistros / 7) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lembretes */}
          <TabsContent value="lembretes" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Configurar Lembretes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <div>
                      <div className="font-medium text-white">Lembrete para Dormir</div>
                      <div className="text-sm text-slate-400">Receba um aviso para se preparar para dormir</div>
                    </div>
                  </div>
                  <Switch
                    checked={lembretes.lembreteDormir}
                    onCheckedChange={(checked) => setLembretes((prev) => ({ ...prev, lembreteDormir: checked }))}
                  />
                </div>

                {lembretes.lembreteDormir && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Horário do Lembrete</label>
                    <Input
                      type="time"
                      value={lembretes.horarioLembrete}
                      onChange={(e) => setLembretes((prev) => ({ ...prev, horarioLembrete: e.target.value }))}
                      className="w-32 bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="font-medium text-white">Lembrete para Acordar</div>
                      <div className="text-sm text-slate-400">Alarme personalizado para acordar</div>
                    </div>
                  </div>
                  <Switch
                    checked={lembretes.lembreteAcordar}
                    onCheckedChange={(checked) => setLembretes((prev) => ({ ...prev, lembreteAcordar: checked }))}
                  />
                </div>

                {lembretes.lembreteAcordar && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Horário para Acordar</label>
                    <Input
                      type="time"
                      value={lembretes.horarioAcordar}
                      onChange={(e) => setLembretes((prev) => ({ ...prev, horarioAcordar: e.target.value }))}
                      className="w-32 bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                )}

                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleSalvarLembretes}
                  disabled={salvandoLembretes}
                >
                  {salvandoLembretes ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardContent>
            </Card>

            {/* Informações sobre Sono */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Por que o Sono é Importante?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-sm">
                  Para pessoas neurodivergentes, um sono adequado é especialmente importante pois:
                </p>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                    Melhora a regulação emocional e reduz a irritabilidade
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                    Aumenta a capacidade de foco e concentração
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                    Facilita o processamento de informações e memória
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                    Reduz a sensibilidade a estímulos sensoriais
                  </li>
                </ul>
                <div className="p-3 bg-indigo-900/20 rounded-lg border border-indigo-700">
                  <p className="text-indigo-300 text-sm">
                    <strong>Meta recomendada:</strong> 7-9 horas de sono por noite para adultos
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </main>
  )
}
