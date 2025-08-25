"use client";

import React, { memo, useMemo, useCallback } from 'react';
import { VirtualList, VirtualTable } from '@/lib/virtual-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Edit, 
  Trash2, 
  Pill,
  BookOpen,
  Calculator,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

// Interface para dados de sessões de estudo
interface SessaoEstudo {
  id: string;
  disciplina: string;
  topico?: string;
  duration_minutes: number;
  completed: boolean;
  pomodoro_cycles: number;
  notes?: string;
  started_at: string;
  completed_at?: string;
}

// Interface para dados de medicamentos
interface Medicamento {
  id: string;
  nome: string;
  dosagem: string;
  frequencia: string;
  horarios: string[];
  data_inicio: string;
  intervalo_horas: number;
  observacoes?: string;
}

// Interface para dados financeiros
interface FinanceRecord {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

// Props comuns
interface VirtualStudyListProps {
  sessoes: SessaoEstudo[];
  onToggleComplete: (sessao: SessaoEstudo) => void;
  onEdit: (sessao: SessaoEstudo) => void;
  onDelete: (id: string) => void;
  height?: number;
  className?: string;
}

interface VirtualMedicineListProps {
  medicamentos: Medicamento[];
  onEdit: (medicamento: Medicamento) => void;
  onDelete: (id: string) => void;
  height?: number;
  className?: string;
}

interface VirtualFinanceTableProps {
  records: FinanceRecord[];
  onEdit: (record: FinanceRecord) => void;
  onDelete: (id: string) => void;
  height?: number;
  className?: string;
}

// Lista Virtual de Sessões de Estudo
export const VirtualStudyList = memo(function VirtualStudyList({
  sessoes,
  onToggleComplete,
  onEdit,
  onDelete,
  height = 400,
  className = ""
}: VirtualStudyListProps) {
  
  const renderStudyItem = useCallback((item: unknown, index: number, style: React.CSSProperties) => {
    const sessao = item as SessaoEstudo;
    const handleToggle = () => onToggleComplete(sessao);
    const handleEdit = () => onEdit(sessao);
    const handleDelete = () => onDelete(sessao.id);

    return (
      <div 
        style={style}
        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-650 transition-colors border-b border-slate-600"
      >
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={handleToggle}
            className="text-green-400 hover:text-green-300 flex-shrink-0"
            disabled={sessao.completed}
          >
            {sessao.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${sessao.completed ? "text-slate-400 line-through" : "text-white"}`}>
              <BookOpen className="w-4 h-4 inline mr-2" />
              {sessao.disciplina}
              {sessao.topico && ` - ${sessao.topico}`}
            </div>
            <div className="text-xs text-slate-400 flex items-center mt-1">
              <Clock className="w-3 h-3 mr-1" />
              {sessao.duration_minutes} min
              {sessao.pomodoro_cycles > 0 && ` • ${sessao.pomodoro_cycles} ciclos`}
              <span className="ml-2 text-slate-500">
                {format(new Date(sessao.started_at), 'dd/MM/yyyy')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-400 hover:text-white h-8 w-8 p-0"
            onClick={handleEdit}
            disabled={sessao.completed}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-400 hover:text-red-400 h-8 w-8 p-0"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }, [onToggleComplete, onEdit, onDelete]);

  if (sessoes.length === 0) {
    return (
      <div className={`bg-slate-800 border-slate-700 rounded-lg p-6 text-center ${className}`}>
        <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400">Nenhuma sessão de estudo encontrada</p>
      </div>
    );
  }

  return (
    <Card className={`bg-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          Sessões de Estudo ({sessoes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <VirtualList
          items={sessoes}
          height={height}
          itemHeight={70} // Altura fixa por item
          renderItem={renderStudyItem}
          overscan={5}
          enableMobileOptimizations={true}
          className="px-4 pb-4"
        />
      </CardContent>
    </Card>
  );
});

// Lista Virtual de Medicamentos
export const VirtualMedicineList = memo(function VirtualMedicineList({
  medicamentos,
  onEdit,
  onDelete,
  height = 400,
  className = ""
}: VirtualMedicineListProps) {
  
  const renderMedicineItem = useCallback((item: unknown, index: number, style: React.CSSProperties) => {
    const medicamento = item as Medicamento;
    const handleEdit = () => onEdit(medicamento);
    const handleDelete = () => onDelete(medicamento.id);

    return (
      <div 
        style={style}
        className="flex items-center justify-between p-3 bg-slate-750 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex items-center space-x-3 flex-1">
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/30 flex-shrink-0"
            >
              {medicamento.horarios[0]}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                <Pill className="w-4 h-4 inline mr-2" />
                {medicamento.nome}
              </p>
              <p className="text-sm text-slate-400 truncate">
                {medicamento.dosagem} • {medicamento.frequencia}
                {medicamento.intervalo_horas && ` • ${medicamento.intervalo_horas}h`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white h-8 w-8 p-0"
            onClick={handleEdit}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-red-400 h-8 w-8 p-0"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }, [onEdit, onDelete]);

  if (medicamentos.length === 0) {
    return (
      <div className={`bg-slate-800 border-slate-700 rounded-lg p-6 text-center ${className}`}>
        <Pill className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400">Nenhum medicamento cadastrado</p>
      </div>
    );
  }

  return (
    <Card className={`bg-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Pill className="w-5 h-5 mr-2" />
          Medicamentos ({medicamentos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <VirtualList
          items={medicamentos}
          height={height}
          itemHeight={80} // Altura fixa por item
          renderItem={renderMedicineItem}
          overscan={3}
          enableMobileOptimizations={true}
          className="px-4 pb-4"
        />
      </CardContent>
    </Card>
  );
});

// Tabela Virtual de Finanças
export const VirtualFinanceTable = memo(function VirtualFinanceTable({
  records,
  onEdit,
  onDelete,
  height = 400,
  className = ""
}: VirtualFinanceTableProps) {
  
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }, []);

  const columns = useMemo((): Array<{
    key: string;
    header: string;
    width: string;
    minWidth: number;
    render?: (value: any, item: unknown, index: number) => React.ReactNode;
  }> => [
    {
      key: 'date',
      header: 'Data',
      width: '15%',
      minWidth: 80,
      render: (value: string, item: unknown, index: number) => format(new Date(value), 'dd/MM/yy')
    },
    {
      key: 'description',
      header: 'Descrição',
      width: '35%',
      minWidth: 120
    },
    {
      key: 'category',
      header: 'Categoria',
      width: '20%',
      minWidth: 100
    },
    {
      key: 'amount',
      header: 'Valor',
      width: '20%',
      minWidth: 80,
      render: (value: number, item: unknown, index: number) => {
        const financeItem = item as FinanceRecord;
        return (
          <span className={financeItem.type === 'income' ? 'text-green-400' : 'text-red-400'}>
            {financeItem.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(value))}
          </span>
        );
      }
    },
    {
      key: 'id',
      header: 'Ações',
      width: '10%',
      minWidth: 80,
      render: (value: string, item: unknown, index: number) => {
        const financeItem = item as FinanceRecord;
        return (
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white h-6 w-6 p-0"
              onClick={() => onEdit(financeItem)}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-red-400 h-6 w-6 p-0"
              onClick={() => onDelete(financeItem.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        );
      }
    }
  ], [formatCurrency, onEdit, onDelete]);

  if (records.length === 0) {
    return (
      <div className={`bg-slate-800 border-slate-700 rounded-lg p-6 text-center ${className}`}>
        <Calculator className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400">Nenhum registro financeiro encontrado</p>
      </div>
    );
  }

  return (
    <Card className={`bg-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Registros Financeiros ({records.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <VirtualTable
          data={records}
          columns={columns}
          rowHeight={60}
          height={height}
          stickyHeader={true}
          mobileBreakpoint={768}
          mobileColumns={['description', 'amount', 'id']}
          className="border-0"
        />
      </CardContent>
    </Card>
  );
});

// Hook para filtrar e paginar listas grandes
export function useVirtualizedData<T>(
  data: T[],
  filterFn?: (item: T) => boolean,
  sortFn?: (a: T, b: T) => number,
  pageSize: number = 100
) {
  const filteredData = useMemo(() => {
    let result = data;
    if (filterFn) {
      result = result.filter(filterFn);
    }
    if (sortFn) {
      result = [...result].sort(sortFn);
    }
    return result;
  }, [data, filterFn, sortFn]);

  const paginatedData = useMemo(() => {
    // Para listas muito grandes, implementar paginação
    if (filteredData.length > pageSize * 2) {
      return filteredData.slice(0, pageSize);
    }
    return filteredData;
  }, [filteredData, pageSize]);

  return {
    data: paginatedData,
    totalCount: filteredData.length,
    hasMore: filteredData.length > paginatedData.length
  };
}

// Export default
const indexDefault = {
  VirtualStudyList,
  VirtualMedicineList,
  VirtualFinanceTable,
  useVirtualizedData
};

export default indexDefault;