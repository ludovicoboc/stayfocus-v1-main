"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useReceitas } from "@/hooks/use-receitas"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Plus, Trash2, ArrowLeft, Check } from "lucide-react"
import Link from "next/link"

export default function ListaComprasPage() {
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const {
    listaCompras,
    loading,
    adicionarItemListaCompras,
    toggleItemComprado,
    limparListaCompras,
    gerarListaComprasDeReceitas,
    loadListaCompras,
  } = useReceitas()

  const [novoItem, setNovoItem] = useState({ nome: "", categoria: "Geral", quantidade: "" })
  const [adicionando, setAdicionando] = useState(false)

  useEffect(() => {
    const receitasParam = searchParams.get("receitas")
    if (receitasParam && user) {
      const receitaIds = receitasParam.split(",")
      gerarListaComprasDeReceitas(receitaIds)
    }
  }, [searchParams, user])

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
          <CardHeader>
            <CardTitle className="text-white text-center">Login Necessário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-300 text-center mb-4">Você precisa estar logado para acessar esta página.</div>
            <Link href="/auth">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleAdicionarItem = async () => {
    if (!novoItem.nome.trim()) return

    setAdicionando(true)
    try {
      await adicionarItemListaCompras(novoItem.nome, novoItem.categoria, novoItem.quantidade || undefined)
      setNovoItem({ nome: "", categoria: "Geral", quantidade: "" })
    } catch (error) {
      console.error("Erro ao adicionar item:", error)
    } finally {
      setAdicionando(false)
    }
  }

  const handleToggleItem = async (id: string, comprado: boolean) => {
    await toggleItemComprado(id, comprado)
  }

  const handleLimparLista = async () => {
    if (confirm("Deseja remover todos os itens marcados como comprados?")) {
      await limparListaCompras()
    }
  }

  const itensNaoComprados = listaCompras.filter((item) => !item.comprado)
  const itensComprados = listaCompras.filter((item) => item.comprado)
  const progresso = listaCompras.length > 0 ? Math.round((itensComprados.length / listaCompras.length) * 100) : 0

  const categorias = Array.from(new Set(listaCompras.map((item) => item.categoria))).sort()

  const agruparPorCategoria = (itens: typeof listaCompras) => {
    return itens.reduce(
      (acc, item) => {
        if (!acc[item.categoria]) {
          acc[item.categoria] = []
        }
        acc[item.categoria].push(item)
        return acc
      },
      {} as Record<string, typeof listaCompras>,
    )
  }

  const itensAgrupadosNaoComprados = agruparPorCategoria(itensNaoComprados)
  const itensAgrupadosComprados = agruparPorCategoria(itensComprados)

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link href="/receitas">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <ShoppingCart className="w-6 h-6 text-green-400" />
            <h1 className="text-xl font-semibold text-white">Lista de Compras</h1>
          </div>
          {itensComprados.length > 0 && (
            <Button
              onClick={handleLimparLista}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Comprados
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Adicionar Item */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Adicionar Item
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={novoItem.nome}
                    onChange={(e) => setNovoItem((prev) => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome do item..."
                    className="flex-1 bg-slate-900 border-slate-600 text-white"
                    onKeyPress={(e) => e.key === "Enter" && handleAdicionarItem()}
                  />
                  <Input
                    value={novoItem.quantidade}
                    onChange={(e) => setNovoItem((prev) => ({ ...prev, quantidade: e.target.value }))}
                    placeholder="Qtd"
                    className="w-20 bg-slate-900 border-slate-600 text-white"
                  />
                  <Button
                    onClick={handleAdicionarItem}
                    disabled={adicionando || !novoItem.nome.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Itens Não Comprados */}
            {Object.keys(itensAgrupadosNaoComprados).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(itensAgrupadosNaoComprados).map(([categoria, itens]) => (
                  <Card key={categoria} className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg flex items-center justify-between">
                        {categoria}
                        <Badge variant="outline" className="text-slate-300">
                          {itens.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {itens.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                          >
                            <Checkbox
                              checked={item.comprado}
                              onCheckedChange={(checked) => handleToggleItem(item.id, !!checked)}
                            />
                            <div className="flex-1">
                              <span className="text-slate-300">{item.nome}</span>
                              {item.quantidade && (
                                <span className="text-slate-500 text-sm ml-2">({item.quantidade})</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">Lista vazia</h3>
                  <p className="text-slate-400">Adicione itens à sua lista de compras</p>
                </CardContent>
              </Card>
            )}

            {/* Itens Comprados */}
            {Object.keys(itensAgrupadosComprados).length > 0 && (
              <>
                <Separator className="bg-slate-700" />
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    Itens Comprados
                  </h2>
                  {Object.entries(itensAgrupadosComprados).map(([categoria, itens]) => (
                    <Card key={categoria} className="bg-slate-800 border-slate-700 opacity-75">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-slate-400 text-lg flex items-center justify-between">
                          {categoria}
                          <Badge variant="outline" className="text-slate-500">
                            {itens.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {itens.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-2 rounded-lg bg-green-900/20 border border-green-700/50"
                            >
                              <Checkbox
                                checked={item.comprado}
                                onCheckedChange={(checked) => handleToggleItem(item.id, !!checked)}
                              />
                              <div className="flex-1">
                                <span className="text-green-300 line-through">{item.nome}</span>
                                {item.quantidade && (
                                  <span className="text-green-500 text-sm ml-2 line-through">({item.quantidade})</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progresso */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Progresso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{progresso}%</div>
                  <div className="text-sm text-slate-400">
                    {itensComprados.length} de {listaCompras.length} itens
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumo por Categoria */}
            {categorias.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Resumo por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categorias.map((categoria) => {
                      const itensCategoria = listaCompras.filter((item) => item.categoria === categoria)
                      const compradosCategoria = itensCategoria.filter((item) => item.comprado)
                      return (
                        <div key={categoria} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{categoria}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">
                              {compradosCategoria.length}/{itensCategoria.length}
                            </span>
                            <div className="w-12 bg-slate-700 rounded-full h-1">
                              <div
                                className="bg-green-600 h-1 rounded-full"
                                style={{
                                  width: `${(compradosCategoria.length / itensCategoria.length) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dicas */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Dicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Organize por seções do mercado</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Adicione quantidades para não esquecer</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span>Marque itens conforme compra</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
