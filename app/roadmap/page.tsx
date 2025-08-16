"use client"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, Smartphone, Database, Zap, Target, Calendar, Users } from "lucide-react"

export default function RoadmapPage() {
  const sprints = [
    {
      number: 1,
      title: "Fundação e Dashboard",
      status: "completed",
      progress: 100,
      features: ["Estrutura base da aplicação", "Dashboard principal", "Sistema de autenticação", "Layout responsivo"],
    },
    {
      number: 2,
      title: "Alimentação e Autoconhecimento",
      status: "completed",
      progress: 100,
      features: [
        "Planejador de refeições",
        "Registro de hidratação",
        "Sistema de notas pessoais",
        "Modo refúgio para crises",
      ],
    },
    {
      number: 3,
      title: "Estudos e Concursos",
      status: "completed",
      progress: 100,
      features: [
        "Temporizador Pomodoro",
        "Gerenciamento de concursos",
        "Sistema de simulados",
        "Registro de sessões de estudo",
      ],
    },
    {
      number: 4,
      title: "Saúde e Bem-estar",
      status: "completed",
      progress: 100,
      features: ["Registro de medicamentos", "Monitoramento de humor", "Controle de sono", "Atividades de lazer"],
    },
    {
      number: 5,
      title: "Finanças e Hiperfocos",
      status: "completed",
      progress: 100,
      features: ["Rastreador de gastos", "Envelopes virtuais", "Conversor de interesses", "Gestão de projetos"],
    },
    {
      number: 6,
      title: "Receitas e Perfil",
      status: "completed",
      progress: 100,
      features: [
        "Sistema de receitas",
        "Lista de compras",
        "Configurações de perfil",
        "Preferências de acessibilidade",
      ],
    },
    {
      number: 7,
      title: "Apps Mobile e Sincronização",
      status: "planned",
      progress: 0,
      features: ["App iOS nativo", "App Android nativo", "Sincronização em nuvem", "Notificações push", "Modo offline"],
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Roadmap de Desenvolvimento"
        breadcrumbs={[{ title: "Dashboard", href: "/" }, { title: "Roadmap" }]}
      />

      <div className="space-y-6">
        {/* Conceito e Filosofia */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Target className="h-5 w-5" />
              Conceito e Filosofia do StayFocus
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-600 dark:text-blue-400">
            <p className="mb-4">
              O StayFocus é uma aplicação desenvolvida especificamente para pessoas neurodivergentes, com foco em
              organização, produtividade e bem-estar. Nossa missão é criar ferramentas que respeitem as necessidades
              únicas de cada indivíduo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Princípios de Design:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Interface adaptável e personalizável</li>
                  <li>Redução de sobrecarga sensorial</li>
                  <li>Feedback constante e reassegurador</li>
                  <li>Estrutura clara e previsível</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Funcionalidades Especiais:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Modo refúgio para momentos de crise</li>
                  <li>Preferências visuais adaptáveis</li>
                  <li>Sistema de hiperfocos</li>
                  <li>Organização temporal flexível</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline de Sprints */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Timeline de Desenvolvimento</h2>

          {sprints.map((sprint) => (
            <Card
              key={sprint.number}
              className={
                sprint.status === "completed"
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                  : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {sprint.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    )}
                    Sprint {sprint.number}: {sprint.title}
                  </CardTitle>
                  <Badge variant={sprint.status === "completed" ? "default" : "secondary"}>
                    {sprint.status === "completed" ? "Concluído" : "Planejado"}
                  </Badge>
                </div>
                <Progress value={sprint.progress} className="w-full" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Funcionalidades:</h4>
                    <ul className="space-y-1">
                      {sprint.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          {sprint.status === "completed" ? (
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <Clock className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                          )}
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {sprint.number === 7 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Recursos Mobile Planejados:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          iOS
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          Android
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          Supabase
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Push
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Atual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Status Atual do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">6/7</div>
                <p className="text-sm text-muted-foreground">Sprints Concluídos</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">85%</div>
                <p className="text-sm text-muted-foreground">Progresso Total</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">1</div>
                <p className="text-sm text-muted-foreground">Sprint Restante</p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <Users className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Aviso sobre o desenvolvimento:</strong> O projeto pode ter pausas devido a hiperfocos do
                  desenvolvedor. Agradecemos a compreensão e paciência da comunidade neurodivergente que utiliza esta
                  ferramenta.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximos Passos */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos - Sprint 7</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                O Sprint 7 focará na criação de aplicativos móveis nativos e sistema de sincronização em nuvem,
                permitindo acesso aos dados em qualquer dispositivo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Tecnologias Planejadas:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• React Native para apps móveis</li>
                    <li>• Supabase para backend e sincronização</li>
                    <li>• Expo para desenvolvimento rápido</li>
                    <li>• Push notifications nativas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Recursos Mobile:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Modo offline completo</li>
                    <li>• Sincronização automática</li>
                    <li>• Widgets para tela inicial</li>
                    <li>• Lembretes inteligentes</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
