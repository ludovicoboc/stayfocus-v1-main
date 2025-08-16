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
import { Plus, Calendar, Clock, Star } from "lucide-react"
import { useLazer } from "@/hooks/use-lazer"

const CATEGORIAS = ["Leitura", "Música", "Jogos", "Exercício", "Arte", "Culinária", "Jardinagem", "Meditação", "Outro"]

export function AtividadesLazer() {
  const { atividades, estatisticas, adicionarAtividade, loading } = useLazer()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    duracao_minutos: "",
    notas: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await adicionarAtividade({
        nome: formData.nome,
        categoria: formData.categoria || undefined,
        duracao_minutos: formData.duracao_minutos ? Number.parseInt(formData.duracao_minutos) : undefined,
        notas: formData.notas || undefined,
        data_realizacao: new Date().toISOString(),
      })

      setFormData({ nome: "", categoria: "", duracao_minutos: "", notas: "" })
      setIsOpen(false)
    } catch (error) {
      console.error("Erro ao adicionar atividade:", error)
    }
  }

  const formatTempo = (minutos: number) => {
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h ${mins}m`
  }

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
        <CardTitle className="text-white">Atividades de Lazer</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Atividade
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Nova Atividade de Lazer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Atividade</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-white hover:bg-slate-600">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duracao">Duração (minutos)</Label>
                <Input
                  id="duracao"
                  type="number"
                  value={formData.duracao_minutos}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duracao_minutos: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="notas">Notas (opcional)</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
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
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Adicionar Atividade
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{estatisticas.atividadesRealizadas}</div>
                  <div className="text-sm text-slate-400">Atividades Realizadas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{formatTempo(estatisticas.tempoTotalMinutos)}</div>
                  <div className="text-sm text-slate-400">Tempo de Lazer</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{estatisticas.categoriaFavorita || "N/A"}</div>
                  <div className="text-sm text-slate-400">Categoria Favorita</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Atividades */}
        <div>
          <h3 className="text-white font-medium mb-4">Suas Atividades</h3>
          {atividades.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-600 rounded-lg">
              <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Você ainda não tem nenhuma atividade de lazer registrada.</p>
              <p className="text-slate-500 text-sm">Adicione uma atividade para começar a acompanhar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {atividades.slice(0, 5).map((atividade) => (
                <Card key={atividade.id} className="bg-slate-700 border-slate-600">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium">{atividade.nome}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-slate-400">
                          {atividade.categoria && (
                            <span className="bg-slate-600 px-2 py-1 rounded text-xs">{atividade.categoria}</span>
                          )}
                          {atividade.duracao_minutos && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTempo(atividade.duracao_minutos)}
                            </span>
                          )}
                          <span>{new Date(atividade.data_realizacao).toLocaleDateString("pt-BR")}</span>
                        </div>
                        {atividade.notas && <p className="text-slate-300 text-sm mt-2">{atividade.notas}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
