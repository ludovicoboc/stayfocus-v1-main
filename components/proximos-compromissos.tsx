"use client"

import { CheckCircle } from "lucide-react"
import { useCompromissos } from "@/hooks/use-compromissos"

export function ProximosCompromissos() {
  const { compromissos, loading } = useCompromissos()

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-700">
              <div className="w-2 h-2 bg-slate-600 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-slate-600 rounded mb-1" />
                <div className="h-3 bg-slate-600 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const compromissosHoje = compromissos.filter(c => !c.concluido)

  if (compromissosHoje.length === 0) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
        <p className="text-sm text-slate-400">Nenhum compromisso hoje!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {compromissosHoje.slice(0, 3).map((compromisso) => (
        <div key={compromisso.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-700">
          <div className="w-2 h-2 bg-blue-400 rounded-full" />
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{compromisso.titulo}</div>
            <div className="text-xs text-slate-400">{compromisso.horario}</div>
          </div>
        </div>
      ))}
    </div>
  )
}