"use client"

import { HistoryDashboard } from "@/components/history-dashboard"
import { PageHeader } from "@/components/page-header"

export default function HistoricoPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Histórico Completo"
        description="Visualize todo seu progresso e atividades em um só lugar"
      />
      
      <HistoryDashboard showAllModules={true} />
    </div>
  )
}