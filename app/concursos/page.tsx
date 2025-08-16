"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useConcursos } from "@/hooks/use-concursos"
import { ConcursoForm } from "@/components/concurso-form"
import { ImportarConcursoJson } from "@/components/importar-concurso-json"
import { ConcursoCard } from "@/components/concurso-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Menu, User, Plus, Upload } from "lucide-react"
import Link from "next/link"
import type { Concurso, ConcursoJsonImport } from "@/types/concursos"

export default function ConcursosPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { concursos, loading, adicionarConcurso } = useConcursos()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const router = useRouter()

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
          <CardContent className="p-6">
            <div className="text-slate-300 text-center mb-4">Você precisa estar logado para acessar esta página.</div>
            <Link href="/auth">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSaveConcurso = async (concurso: Concurso) => {
    const novoConcurso = await adicionarConcurso(concurso)
    if (novoConcurso?.id) {
      setShowAddModal(false)
      router.push(`/concursos/${novoConcurso.id}`)
    }
  }

  const handleImportConcurso = async (jsonData: ConcursoJsonImport) => {
    const concurso: Concurso = {
      title: jsonData.titulo,
      organizer: jsonData.organizadora,
      registration_date: jsonData.dataInscricao || null,
      exam_date: jsonData.dataProva || null,
      edital_link: jsonData.linkEdital || null,
      status: "planejado",
      disciplinas: jsonData.conteudoProgramatico.map((item) => ({
        name: item.disciplina,
        topicos: item.topicos.map((topico) => ({ name: topico })),
      })),
    }

    const novoConcurso = await adicionarConcurso(concurso)
    if (novoConcurso?.id) {
      setShowImportModal(false)
      router.push(`/concursos/${novoConcurso.id}`)
    }
  }

  const handleConcursoClick = (id: string) => {
    router.push(`/concursos/${id}`)
  }

  return (
    <main className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Meus Concursos</h2>
          <div className="flex space-x-2">
            <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Manualmente
            </Button>
            <Button
              onClick={() => setShowImportModal(true)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar JSON do Edital
            </Button>
          </div>
        </div>

        {concursos.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <p className="text-slate-300 mb-2">Você ainda não cadastrou nenhum concurso</p>
              <p className="text-slate-400 text-sm">Você ainda não cadastrou nenhum concurso manualmente.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concursos.map((concurso) => (
              <ConcursoCard key={concurso.id} concurso={concurso} onClick={handleConcursoClick} />
            ))}
          </div>
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
      {/* Modals */}
      <ConcursoForm open={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSaveConcurso} />
      <ImportarConcursoJson
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportConcurso}
      />
    </main>
  )
}
