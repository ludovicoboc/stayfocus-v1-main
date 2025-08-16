"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Zap, AlertCircle } from "lucide-react"
import { useConcursos } from "@/hooks/use-concursos"
import { useSimulados } from "@/hooks/use-simulados"

export function SimuladoLoader() {
  const { concursos } = useConcursos()
  const { gerarSimulado, carregarDeArquivo, carregarDeTexto, loading, error, clearError } = useSimulados()

  const [concursoSelecionado, setConcursoSelecionado] = useState("")
  const [numeroQuestoes, setNumeroQuestoes] = useState("10")
  const [jsonText, setJsonText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGerarSimulado = async () => {
    if (!concursoSelecionado) return

    clearError()
    const success = await gerarSimulado(concursoSelecionado, Number.parseInt(numeroQuestoes))
    if (!success) {
      // Error is handled by the hook
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    clearError()
    const success = await carregarDeArquivo(file)
    if (!success) {
      // Error is handled by the hook
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleTextUpload = async () => {
    if (!jsonText.trim()) return

    clearError()
    const success = await carregarDeTexto(jsonText.trim())
    if (success) {
      setJsonText("")
    }
  }

  const exampleJson = `{
  "metadata": {
    "titulo": "Simulado de Exemplo",
    "concurso": "Concurso Público",
    "ano": 2025,
    "totalQuestoes": 2
  },
  "questoes": [
    {
      "id": 1,
      "enunciado": "Qual é a capital do Brasil?",
      "alternativas": {
        "a": "São Paulo",
        "b": "Rio de Janeiro", 
        "c": "Brasília",
        "d": "Belo Horizonte"
      },
      "gabarito": "c"
    },
    {
      "id": 2,
      "enunciado": "Quanto é 2 + 2?",
      "alternativas": {
        "a": "3",
        "b": "4",
        "c": "5", 
        "d": "6"
      },
      "gabarito": "b"
    }
  ]
}`

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-center">Iniciar Simulado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Messages */}
          {error && (
            <Alert className="bg-red-900/50 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {/* Gerar Simulado */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Gerar Simulado</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Selecione o Concurso</label>
                <Select value={concursoSelecionado} onValueChange={setConcursoSelecionado}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Simulado Concurso TSE Unificado - Técnico Judiciário - Área Administrativa" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    {concursos.map((concurso) => (
                      <SelectItem key={concurso.id} value={concurso.id!}>
                        {concurso.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">Número de Questões</label>
                <Input
                  type="number"
                  value={numeroQuestoes}
                  onChange={(e) => setNumeroQuestoes(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  min="1"
                  max="100"
                />
              </div>

              <Button
                onClick={handleGerarSimulado}
                disabled={!concursoSelecionado || loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                {loading ? "Gerando..." : "Gerar e Iniciar Simulado"}
              </Button>
            </div>
          </div>

          {/* Separator */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-slate-600"></div>
            <span className="px-3 text-slate-400 text-sm">OU</span>
            <div className="flex-1 border-t border-slate-600"></div>
          </div>

          {/* Carregar de Arquivo */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Carregar de Arquivo .json</h3>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>
          </div>

          {/* Separator */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-slate-600"></div>
            <span className="px-3 text-slate-400 text-sm">OU</span>
            <div className="flex-1 border-t border-slate-600"></div>
          </div>

          {/* Colar Texto JSON */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Colar Texto JSON</h3>
            <div className="space-y-3">
              <Textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="Cole o conteúdo JSON gerado pela IA aqui..."
                className="bg-slate-700 border-slate-600 text-white min-h-32 font-mono text-sm"
                disabled={loading}
              />
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setJsonText(exampleJson)}
                  className="text-xs text-blue-400 hover:underline"
                  type="button"
                >
                  Ver exemplo de formato
                </button>
                <Button
                  onClick={handleTextUpload}
                  disabled={!jsonText.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {loading ? "Carregando..." : "Carregar Texto Colado"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
