"use client"

import { memo, useMemo, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DASHBOARD_MODULES } from "@/lib/constants"

interface DashboardModulesProps {
  progressData?: Record<string, number>
}

// Tipo para módulo com progresso
type ModuloComProgresso = typeof DASHBOARD_MODULES[number] & {
  progresso: number
}

// Componente individual do módulo memoizado para evitar re-renders
const ModuleCard = memo(function ModuleCard({
  modulo,
  progresso
}: {
  modulo: ModuloComProgresso,
  progresso: number
}) {
  const IconeModulo = modulo.icone;
  
  return (
    <Link href={modulo.href}>
      <Card className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-lg">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className={`p-2 rounded-lg ${modulo.cor} flex-shrink-0`}>
              <IconeModulo className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">{modulo.titulo}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{modulo.descricao}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Progresso</span>
              <span className="text-slate-300 font-medium">{progresso}%</span>
            </div>
            <Progress value={progresso} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

// Componente principal memoizado
export const DashboardModules = memo(function DashboardModules({ 
  progressData = {} 
}: DashboardModulesProps) {
  // Memoizar módulos com progresso para evitar recalcular a cada render
  const modulesWithProgress = useMemo(() => {
    return DASHBOARD_MODULES.map(modulo => ({
      ...modulo,
      progresso: progressData[modulo.href] || 0
    }));
  }, [progressData]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {modulesWithProgress.map((modulo) => (
        <ModuleCard
          key={modulo.href} // Usar href como key mais estável
          modulo={modulo}
          progresso={modulo.progresso}
        />
      ))}
    </div>
  )
})

// Export default para lazy loading
export default DashboardModules;