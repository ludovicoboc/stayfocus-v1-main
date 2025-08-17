"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Heart, SkipForward, Lightbulb, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useLazer } from "@/hooks/use-lazer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const CATEGORIAS_SUGESTAO = [
  "Relaxamento",
  "Mindfulness",
  "Respiração",
  "Alongamento",
  "Criativo",
  "Musical",
  "Gratidão",
  "Contemplação",
  "Outro",
]

const DIFICULDADES = ["Fácil", "Médio", "Difícil"]

export function SugestoesDescanso() {
  const { sugestoes, favoritas, toggleFavorita, adicionarSugestao, loading, error, operationLoading, successMessage, clearMessages } = useLazer()
  const [sugestaoAtual, setSugestaoAtual] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    categoria: "",
    dificuldade: "Fácil",
    duracao_estimada: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    try {
      await adicionarSugestao({
        titulo: formData.titulo,
        descricao: formData.descricao || undefined,
        categoria: formData.categoria || undefined,
        dificuldade: formData.dificuldade,
        duracao_estimada: formData.duracao_estimada ? Number.parseInt(formData.duracao_estimada) : undefined,
      })

      setFormData({ titulo: "", descricao: "", categoria: "", dificuldade: "Fácil", duracao_estimada: "" })
      setIsOpen(false)
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const handleToggleFavorita = async (sugestaoId: string) => {
    clearMessages()
    try {
      await toggleFavorita(sugestaoId)
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const proximaSugestao = () => {
    setSugestaoAtual((prev) => (prev + 1) % sugestoes.length)
  }

  const isFavorita = (sugestaoId: string) => {
    return favoritas.some((f) => f.sugestao_id === sugestaoId)
  }

  const sugestoesFavoritas = favoritas.map((f) => f.sugestoes_descanso).filter(Boolean)

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="text-slate-400 text-center">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Sugestões de Descanso</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Sugestão
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Nova Sugestão de Descanso</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título da Sugestão</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, categoria: value }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {CATEGORIAS_SUGESTAO.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-white hover:bg-slate-600">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dificuldade">Dificuldade</Label>
                  <Select
                    value={formData.dificuldade}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, dificuldade: value }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {DIFICULDADES.map((dif) => (
                        <SelectItem key={dif} value={dif} className="text-white hover:bg-slate-600">
                          {dif}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="duracao">Duração Estimada (minutos)</Label>
                <Input
                  id="duracao"
                  type="number"
                  value={formData.duracao_estimada}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duracao_estimada: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  min="1"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="border-slate-600 text-slate-300"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={operationLoading}>
                  {operationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    "Adicionar Sugestão"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mensagens de Feedback */}
        {error && (
          <Alert className="bg-red-900/20 border-red-700/50">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert className="bg-green-900/20 border-green-700/50">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">{successMessage}</AlertDescription>
          </Alert>
        )}
        {/* Sugestão Atual */}
        {sugestoes.length > 0 && (
          <div>
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  {sugestoes[sugestaoAtual]?.categoria && (
                    <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {sugestoes[sugestaoAtual].categoria}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-white mb-3">{sugestoes[sugestaoAtual]?.titulo}</h3>

                {sugestoes[sugestaoAtual]?.descricao && (
                  <p className="text-slate-300 mb-4">{sugestoes[sugestaoAtual].descricao}</p>
                )}

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => handleToggleFavorita(sugestoes[sugestaoAtual].id)}
                    variant="outline"
                    className={`border-slate-600 ${
                      isFavorita(sugestoes[sugestaoAtual].id)
                        ? "bg-red-600 text-white border-red-600"
                        : "text-slate-300"
                    }`}
                    disabled={operationLoading}
                  >
                    {operationLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Heart
                        className={`w-4 h-4 mr-2 ${isFavorita(sugestoes[sugestaoAtual].id) ? "fill-current" : ""}`}
                      />
                    )}
                    {isFavorita(sugestoes[sugestaoAtual].id) ? "Remover" : "Favoritar"}
                  </Button>

                  <Button onClick={proximaSugestao} className="bg-blue-600 hover:bg-blue-700">
                    <SkipForward className="w-4 h-4 mr-2" />
                    Próxima
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sugestões Favoritas */}
        {sugestoesFavoritas.length > 0 && (
          <div>
            <h3 className="text-white font-medium mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-400" />
              Sugestões Favoritas
            </h3>
            <div className="space-y-3">
              {sugestoesFavoritas.map((sugestao) => (
                <Card key={sugestao?.id} className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{sugestao?.titulo}</h4>
                        {sugestao?.descricao && <p className="text-slate-300 text-sm mt-1">{sugestao.descricao}</p>}
                        <div className="flex items-center space-x-2 mt-2">
                          {sugestao?.categoria && (
                            <span className="bg-slate-600 px-2 py-1 rounded text-xs text-slate-300">
                              {sugestao.categoria}
                            </span>
                          )}
                          {sugestao?.duracao_estimada && (
                            <span className="text-xs text-slate-400">~{sugestao.duracao_estimada} min</span>
                          )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            disabled={operationLoading}
                          >
                            {operationLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Heart className="w-4 h-4 fill-current" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-800 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Remover dos Favoritos</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-300">
                              Tem certeza que deseja remover "{sugestao?.titulo}" dos seus favoritos?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleToggleFavorita(sugestao?.id || "")}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {sugestoes.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-slate-600 rounded-lg">
            <Lightbulb className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Nenhuma sugestão disponível ainda.</p>
            <p className="text-slate-500 text-sm">Adicione uma sugestão para começar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
