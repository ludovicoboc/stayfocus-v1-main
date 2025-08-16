"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSimulados } from "@/hooks/use-simulados"
import { Button } from "@/components/ui/button"

interface HistoricoModalProps {
  open: boolean
  onClose: () => void
}

export function HistoricoModal({ open, onClose }: HistoricoModalProps) {
  const { historico } = useSimulados()

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch (error) {
      return "Data inválida"
    }
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-400"
    if (percentage >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Simulados</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {historico.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">Nenhum simulado realizado ainda.</p>
            </div>
          ) : (
            historico.map((resultado) => (
              <Card key={resultado.id} className="bg-slate-700 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-white font-medium mb-1">Simulado de Lógica de Programação para Backend</div>
                      <div className="text-slate-400 text-sm">
                        {resultado.total_questions} questões | 1 tentativa(s) | Última em:{" "}
                        {formatDate(resultado.completed_at || resultado.created_at || "")}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-slate-500 text-slate-300 hover:bg-slate-600">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Refazer
                    </Button>
                  </div>

                  <div className="flex space-x-4">
                    <div className="bg-purple-600 text-white px-3 py-1 rounded text-sm">
                      Última: {resultado.percentage.toFixed(1)}%
                    </div>
                    <div className="bg-slate-600 text-white px-3 py-1 rounded text-sm">
                      Melhor: {resultado.percentage.toFixed(1)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
