"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Award, ChevronRight, Plus } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useConcursos } from "@/hooks/use-concursos"
import Link from "next/link"
import type { Concurso } from "@/types/concursos"

export function ProximoConcurso() {
  const { concursos, loading } = useConcursos()
  const [proximoConcurso, setProximoConcurso] = useState<Concurso | null>(null)

  useEffect(() => {
    if (concursos.length > 0) {
      // Find the next upcoming competition
      const hoje = new Date()
      const concursosFuturos = concursos
        .filter((c) => c.exam_date && new Date(c.exam_date) > hoje)
        .sort((a, b) => {
          if (!a.exam_date || !b.exam_date) return 0
          return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
        })

      if (concursosFuturos.length > 0) {
        setProximoConcurso(concursosFuturos[0])
      } else if (concursos.length > 0) {
        // If no future competitions, show the most recent one
        setProximoConcurso(concursos[0])
      }
    }
  }, [concursos])

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Data não definida"
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return "Data inválida"
    }
  }

  // Calculate progress (placeholder - in real app this would be calculated from study sessions)
  const progresso = 0

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Próximo Concurso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  if (!proximoConcurso) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Próximo Concurso</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-slate-300 mb-4">Nenhum concurso cadastrado ainda.</p>
          <Link href="/concursos">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Concurso
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Próximo Concurso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{proximoConcurso.title}</h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-slate-300">
              <Award className="w-4 h-4 mr-2 text-slate-400" />
              <span>{proximoConcurso.organizer}</span>
            </div>
            <div className="flex items-center text-slate-300">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              <span>Data da Prova: {formatDate(proximoConcurso.exam_date)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Progresso de estudos</span>
              <span className="text-slate-300">{progresso}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progresso}%` }}
                role="progressbar"
                aria-valuenow={progresso}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href={`/concursos/${proximoConcurso.id}`}>
            <Button variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-slate-700">
              Ver detalhes
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
