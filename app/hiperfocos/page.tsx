"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useHiperfocos } from "@/hooks/use-hiperfocos"
import { ConversorInteresses } from "@/components/conversor-interesses"
import { SistemaAlternancia } from "@/components/sistema-alternancia"
import { VisualizadorProjetos } from "@/components/visualizador-projetos"
import { TemporizadorFoco } from "@/components/temporizador-foco"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Menu, User, Zap } from "lucide-react"
import Link from "next/link"
import type { HiperfocoTab } from "@/types/hiperfocos"

export default function HiperfocosPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { getProjectsWithTasks, loading } = useHiperfocos()
  const [activeTab, setActiveTab] = useState<HiperfocoTab>("conversor")

  const projectsWithTasks = getProjectsWithTasks()

  if (authLoading || loading) {
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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as HiperfocoTab)}>
          <TabsList className="bg-slate-800 border-slate-700 mb-6">
            <TabsTrigger value="conversor" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Conversor de Interesses
            </TabsTrigger>
            <TabsTrigger value="alternancia" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Sistema de Alternância
            </TabsTrigger>
            <TabsTrigger value="estrutura" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Estrutura de Projetos
            </TabsTrigger>
            <TabsTrigger
              value="temporizador"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Temporizador
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversor" className="mt-0">
            <ConversorInteresses />
          </TabsContent>

          <TabsContent value="alternancia" className="mt-0">
            <SistemaAlternancia />
          </TabsContent>

          <TabsContent value="estrutura" className="mt-0">
            <VisualizadorProjetos />
          </TabsContent>

          <TabsContent value="temporizador" className="mt-0">
            <TemporizadorFoco />
          </TabsContent>
        </Tabs>

        {/* Resumo dos Hiperfocos */}
        {projectsWithTasks.length > 0 && (
          <Card className="bg-slate-800 border-slate-700 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Resumo dos Hiperfocos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectsWithTasks.map((project) => {
                  const completedTasks = project.tasks?.filter((task) => task.completed).length || 0
                  const totalTasks = project.tasks?.length || 0

                  return (
                    <div
                      key={project.id}
                      className="p-4 rounded-lg border border-slate-600"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        <h3 className="text-white font-medium">{project.title}</h3>
                      </div>
                      <div className="text-slate-300 text-sm">
                        {completedTasks}/{totalTasks} tarefas concluídas
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

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
