"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { useFinancas } from "@/hooks/use-financas"

export function RastreadorGastos() {
  const { getGastosPorCategoria, getTotalGastos } = useFinancas()

  const gastosPorCategoria = getGastosPorCategoria()
  const totalGastos = getTotalGastos()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Rastreador de Gastos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gráfico de Pizza */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gastosPorCategoria}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="valor"
              >
                {gastosPorCategoria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Total de Gastos */}
        <div className="text-center">
          <div className="text-slate-300 text-sm">Total de Gastos</div>
          <div className="text-white text-xl font-bold">{formatCurrency(totalGastos)}</div>
        </div>

        {/* Lista de Categorias */}
        <div className="space-y-2">
          {gastosPorCategoria.map((categoria) => (
            <div key={categoria.categoria} className="flex items-center justify-between p-2 bg-slate-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: categoria.cor }}></div>
                <span className="text-white text-sm">{categoria.categoria}</span>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">{formatCurrency(categoria.valor)}</div>
                <div className="text-slate-400 text-xs">{categoria.porcentagem.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Export default para lazy loading
export default RastreadorGastos
