"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ConcursoJsonImport } from "@/types/concursos"

interface ImportarConcursoJsonProps {
  open: boolean
  onClose: () => void
  onImport: (jsonData: ConcursoJsonImport) => Promise<void>
}

export function ImportarConcursoJson({ open, onClose, onImport }: ImportarConcursoJsonProps) {
  const [jsonText, setJsonText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    setError(null)
    if (!jsonText.trim()) {
      setError("Por favor, insira o JSON do edital.")
      return
    }

    try {
      setImporting(true)
      const jsonData = JSON.parse(jsonText) as ConcursoJsonImport

      // Validate required fields
      if (!jsonData.titulo || !jsonData.organizadora || !jsonData.conteudoProgramatico) {
        setError("JSON inválido. Certifique-se de incluir título, organizadora e conteúdo programático.")
        setImporting(false)
        return
      }

      await onImport(jsonData)
      setJsonText("")
    } catch (err) {
      setError("Erro ao processar o JSON. Verifique o formato e tente novamente.")
      console.error("JSON parse error:", err)
    } finally {
      setImporting(false)
    }
  }

  const exampleJson = `{
  "titulo": "Analista Administrativo",
  "organizadora": "CESPE",
  "dataInscricao": "2023-10-01",
  "dataProva": "2023-11-15",
  "linkEdital": "https://www.exemplo.com/edital",
  "conteudoProgramatico": [
    {
      "disciplina": "Língua Portuguesa",
      "topicos": ["Interpretação de textos", "Gramática aplicada ao texto", "Redação oficial"]
    },
    {
      "disciplina": "Raciocínio Lógico",
      "topicos": ["Estruturas lógicas", "Lógica de argumentação", "Probabilidade e estatística"]
    }
  ]
}`

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle>Importar JSON do Edital</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-300">Cole abaixo o JSON extraído de LLM externa (Claude, ChatGPT, etc.)</p>

          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`{\n  "titulo": "",\n  "organizadora": "",\n  ...\n}`}
            className="bg-slate-700 border-slate-600 text-white h-60 font-mono text-sm"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="text-xs text-slate-400">
            <button onClick={() => setJsonText(exampleJson)} className="text-blue-400 hover:underline" type="button">
              Ver template de exemplo
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!jsonText.trim() || importing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {importing ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
