"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, X, AlertCircle } from "lucide-react"
import type { Concurso, ConcursoStatus, Disciplina } from "@/types/concursos"

interface ConcursoFormProps {
  open: boolean
  onClose: () => void
  onSave: (concurso: Concurso) => Promise<void>
}

export function ConcursoForm({ open, onClose, onSave }: ConcursoFormProps) {
  const [titulo, setTitulo] = useState("")
  const [organizadora, setOrganizadora] = useState("")
  const [dataInscricao, setDataInscricao] = useState("")
  const [dataProva, setDataProva] = useState("")
  const [linkEdital, setLinkEdital] = useState("")
  const [status, setStatus] = useState<ConcursoStatus>("planejado")
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [novaDisciplina, setNovaDisciplina] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddDisciplina = () => {
    if (!novaDisciplina.trim()) return

    setDisciplinas([...disciplinas, { name: novaDisciplina.trim(), topicos: [] }])
    setNovaDisciplina("")
  }

  const handleRemoveDisciplina = (index: number) => {
    const novasDisciplinas = [...disciplinas]
    novasDisciplinas.splice(index, 1)
    setDisciplinas(novasDisciplinas)
  }

  const handleSave = async () => {
    if (!titulo.trim() || !organizadora.trim()) return

    setSaving(true)
    setError(null)
    
    try {
      const concurso: Concurso = {
        title: titulo.trim(),
        organizer: organizadora.trim(),
        registration_date: dataInscricao || null,
        exam_date: dataProva || null,
        edital_link: linkEdital.trim() || null,
        status,
        disciplinas,
      }

      await onSave(concurso)
      resetForm()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao salvar concurso'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setTitulo("")
    setOrganizadora("")
    setDataInscricao("")
    setDataProva("")
    setLinkEdital("")
    setStatus("planejado")
    setDisciplinas([])
    setNovaDisciplina("")
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Concurso</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert className="bg-red-900/20 border-red-800 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div>
            <label htmlFor="titulo" className="text-sm text-slate-300 mb-1 block">
              Título
            </label>
            <Input
              id="titulo"
              placeholder="Ex: Analista Administrativo - TRT"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label htmlFor="organizadora" className="text-sm text-slate-300 mb-1 block">
              Organizadora
            </label>
            <Input
              id="organizadora"
              placeholder="Ex: CESPE"
              value={organizadora}
              onChange={(e) => setOrganizadora(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dataInscricao" className="text-sm text-slate-300 mb-1 block">
                Data de Inscrição
              </label>
              <Input
                id="dataInscricao"
                type="date"
                value={dataInscricao}
                onChange={(e) => setDataInscricao(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label htmlFor="dataProva" className="text-sm text-slate-300 mb-1 block">
                Data da Prova
              </label>
              <Input
                id="dataProva"
                type="date"
                value={dataProva}
                onChange={(e) => setDataProva(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="linkEdital" className="text-sm text-slate-300 mb-1 block">
              Link do Edital (opcional)
            </label>
            <Input
              id="linkEdital"
              placeholder="https://..."
              value={linkEdital}
              onChange={(e) => setLinkEdital(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label htmlFor="status" className="text-sm text-slate-300 mb-1 block">
              Status
            </label>
            <Select value={status} onValueChange={(value) => setStatus(value as ConcursoStatus)}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 text-white">
                <SelectItem value="planejado">Planejado</SelectItem>
                <SelectItem value="inscrito">Inscrito</SelectItem>
                <SelectItem value="estudando">Estudando</SelectItem>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="aguardando_resultado">Aguardando Resultado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">Conteúdo Programático</label>
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="Nova disciplina..."
                value={novaDisciplina}
                onChange={(e) => setNovaDisciplina(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white flex-1"
              />
              <Button
                onClick={handleAddDisciplina}
                disabled={!novaDisciplina.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {disciplinas.map((disciplina, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-700 p-2 rounded-md">
                  <span className="text-sm text-slate-200">{disciplina.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveDisciplina(index)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!titulo.trim() || !organizadora.trim() || saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? "Salvando..." : "Adicionar Concurso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
