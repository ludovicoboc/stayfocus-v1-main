"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useFinancas } from "@/hooks/use-financas"

export function CalendarioPagamentos() {
  const { pagamentos, adicionarPagamento, marcarPagamentoPago } = useFinancas()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    due_date: "",
    is_recurring: false,
    recurrence_type: "",
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleAddPayment = async () => {
    if (!formData.title.trim() || !formData.amount || !formData.due_date) return

    const pagamentoData = {
      title: formData.title.trim(),
      amount: Number.parseFloat(formData.amount),
      due_date: formData.due_date,
      is_recurring: formData.is_recurring,
      recurrence_type: formData.is_recurring ? (formData.recurrence_type as any) : null,
      is_paid: false,
    }

    await adicionarPagamento(pagamentoData)
    setShowModal(false)
    setFormData({
      title: "",
      amount: "",
      due_date: "",
      is_recurring: false,
      recurrence_type: "",
    })
  }

  const getPagamentosDoMes = () => {
    const inicio = startOfMonth(currentDate)
    const fim = endOfMonth(currentDate)

    return pagamentos.filter((pagamento) => {
      const dataPagamento = new Date(pagamento.due_date)
      return dataPagamento >= inicio && dataPagamento <= fim
    })
  }

  const getPagamentosDoDia = (dia: Date) => {
    return pagamentos.filter((pagamento) => {
      const dataPagamento = new Date(pagamento.due_date)
      return isSameDay(dataPagamento, dia)
    })
  }

  const pagamentosDoMes = getPagamentosDoMes()

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Calendário de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Header do Calendário */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              className="text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-white font-medium">{format(currentDate, "MMMM yyyy", { locale: ptBR })}</h3>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="text-slate-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Lista de Pagamentos do Mês */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {pagamentosDoMes.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm">Nenhum pagamento agendado para este mês</p>
              </div>
            ) : (
              pagamentosDoMes.map((pagamento) => (
                <div
                  key={pagamento.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    pagamento.is_paid
                      ? "bg-green-900/30 border border-green-700"
                      : "bg-red-900/30 border border-red-700"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-white text-sm">{format(new Date(pagamento.due_date), "dd")}</div>
                    <div>
                      <div className="text-white font-medium">{pagamento.title}</div>
                      <div className="text-slate-400 text-xs">
                        {formatCurrency(pagamento.amount)}
                        {pagamento.is_recurring && " (recorrente)"}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!pagamento.is_paid && (
                      <Button
                        size="sm"
                        onClick={() => marcarPagamentoPago(pagamento.id!)}
                        className="bg-green-600 hover:bg-green-700 text-xs"
                      >
                        Pagar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button
            onClick={() => setShowModal(true)}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 border border-dashed border-slate-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Pagamento
          </Button>
        </CardContent>
      </Card>

      {/* Modal para Adicionar Pagamento */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Novo Pagamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title" className="text-slate-300">
                Título
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Aluguel"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="amount" className="text-slate-300">
                Valor
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="due_date" className="text-slate-300">
                Data de Vencimento
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: !!checked })}
              />
              <Label htmlFor="is_recurring" className="text-slate-300">
                Pagamento recorrente
              </Label>
            </div>

            {formData.is_recurring && (
              <div>
                <Label htmlFor="recurrence_type" className="text-slate-300">
                  Frequência
                </Label>
                <Select
                  value={formData.recurrence_type}
                  onValueChange={(value) => setFormData({ ...formData, recurrence_type: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={!formData.title.trim() || !formData.amount || !formData.due_date}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Adicionar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
