"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, Calendar, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Concurso } from "@/types/concursos"

interface ConcursoCardProps {
  concurso: Concurso
  onClick: (id: string) => void
}

export function ConcursoCard({ concurso, onClick }: ConcursoCardProps) {
  const statusLabels = {
    planejado: "Planejado",
    inscrito: "Inscrito",
    estudando: "Estudando",
    realizado: "Realizado",
    aguardando_resultado: "Aguardando Resultado",
  }

  const statusColors = {
    planejado: "bg-yellow-600 text-yellow-100",
    inscrito: "bg-blue-600 text-blue-100",
    estudando: "bg-green-600 text-green-100",
    realizado: "bg-purple-600 text-purple-100",
    aguardando_resultado: "bg-orange-600 text-orange-100",
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Data não definida"
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return "Data inválida"
    }
  }

  // Placeholder progress for the card view
  const progress = 0

  return (
    <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-white">{concurso.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[concurso.status]}`}>
            {statusLabels[concurso.status]}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-slate-300">
            <Award className="w-4 h-4 mr-2 text-slate-400" />
            <span>{concurso.organizer}</span>
          </div>
          <div className="flex items-center text-slate-300">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            <span>Prova: {formatDate(concurso.exam_date)}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Progresso geral</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 border-t border-slate-700">
        <Button
          onClick={() => concurso.id && onClick(concurso.id)}
          variant="ghost"
          className="text-blue-400 hover:text-blue-300 hover:bg-slate-700 ml-auto"
        >
          Ver detalhes
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  )
}
