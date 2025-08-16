"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Menu, User, Utensils, BookOpen, Clock, DollarSign, Zap, Heart, Gamepad2, Moon } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()

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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
          <p className="text-slate-400">Escolha uma área para começar sua jornada de desenvolvimento pessoal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Alimentação */}
          <Link href="/alimentacao">
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Utensils className="w-6 h-6 mr-3 text-green-400" />
                  Alimentação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">
                  Gerencie suas refeições, planeje cardápios e acompanhe sua hidratação diária.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Autoconhecimento */}
          <Link href="/autoconhecimento">
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BookOpen className="w-6 h-6 mr-3 text-orange-400" />
                  Autoconhecimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">
                  Registre reflexões pessoais, explore seus valores e identifique padrões comportamentais.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Estudos */}
          <Link href="/estudos">
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-purple-400" />
                  Estudos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">
                  Gerencie suas sessões de estudo com temporizador Pomodoro e acompanhe seu progresso.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Finanças */}
          <Link href="/financas">
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <DollarSign className="w-6 h-6 mr-3 text-green-400" />
                  Finanças
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">
                  Gerencie seus gastos, organize orçamentos e acompanhe pagamentos com envelopes virtuais.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Hiperfocos */}
          <Link href="/hiperfocos">
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-6 h-6 mr-3 text-orange-400" />
                  Hiperfocos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">
                  Transforme interesses intensos em projetos estruturados e gerencie transições de foco.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Saúde */}
          <Link href="/saude">
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Heart className="w-6 h-6 mr-3 text-red-400" />
                  Saúde
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">
                  Cuide de sua saúde física e mental com exercícios regulares e meditação.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Sono */}
          <Link href="/sono">
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Moon className="w-6 h-6 mr-3 text-indigo-400" />
                  Sono
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">
                  Gerencie sua qualidade de sono com registro, visualização e lembretes personalizados.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Lazer */}
          <Link href="/lazer">
            <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Gamepad2 className="w-6 h-6 mr-3 text-purple-400" />
                  Lazer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">
                  Gerencie seu tempo de lazer com temporizador e descubra atividades relaxantes.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
    </main>
  )
}
