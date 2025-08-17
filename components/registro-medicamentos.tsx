"use client";

import { useState, useEffect } from "react";
import { useSaude } from "@/hooks/use-saude";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DateNavigation } from "@/components/ui/date-navigation";
import {
  PlusCircle,
  X,
  CheckCircle,
  Clock,
  Pill,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import type { NovoMedicamento, FrequenciaMedicamento } from "@/types/saude";
import { getCurrentDateString } from "@/lib/utils";

export function RegistroMedicamentos({ date }: { date?: string }) {
  const [currentDate, setCurrentDate] = useState<string>(
    date || getCurrentDateString(),
  );
  const {
    medicamentos,
    loadingMedicamentos,
    resumoMedicamentos,
    adicionarMedicamento,
    excluirMedicamento,
  } = useSaude(currentDate);

  const [modalAberto, setModalAberto] = useState(false);
  const [novoMedicamento, setNovoMedicamento] = useState<
    Partial<NovoMedicamento>
  >({
    nome: "",
    dosagem: "",
    frequencia: "Diária",
    horarios: [],
    data_inicio: currentDate,
    observacoes: "",
  });
  const [horarioAtual, setHorarioAtual] = useState("08:00");

  useEffect(() => {
    if (date) {
      setCurrentDate(date);
    }
  }, [date]);

  useEffect(() => {
    setNovoMedicamento((prev) => ({ ...prev, data_inicio: currentDate }));
  }, [currentDate]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
  };

  const adicionarHorario = () => {
    if (!horarioAtual) return;

    const horarios = [...(novoMedicamento.horarios || []), horarioAtual];
    // Ordenar horários
    horarios.sort((a, b) => {
      const [horaA, minutoA] = a.split(":").map(Number);
      const [horaB, minutoB] = b.split(":").map(Number);
      return horaA * 60 + minutoA - (horaB * 60 + minutoB);
    });

    setNovoMedicamento({
      ...novoMedicamento,
      horarios,
    });
  };

  const removerHorario = (index: number) => {
    const horarios = [...(novoMedicamento.horarios || [])];
    horarios.splice(index, 1);
    setNovoMedicamento({
      ...novoMedicamento,
      horarios,
    });
  };

  const handleSubmit = async () => {
    if (
      !novoMedicamento.nome ||
      !novoMedicamento.dosagem ||
      !novoMedicamento.frequencia ||
      !novoMedicamento.horarios?.length
    ) {
      return;
    }

    const intervalo_horas =
      novoMedicamento.frequencia === "Diária"
        ? Number.parseInt(
            (novoMedicamento.intervalo_horas as unknown as string) || "24",
          )
        : 24;

    await adicionarMedicamento({
      nome: novoMedicamento.nome,
      dosagem: novoMedicamento.dosagem,
      frequencia: novoMedicamento.frequencia as FrequenciaMedicamento,
      intervalo_horas,
      horarios: novoMedicamento.horarios,
      data_inicio:
        novoMedicamento.data_inicio || format(new Date(), "yyyy-MM-dd"),
      observacoes: novoMedicamento.observacoes,
    });

    setModalAberto(false);
    resetForm();
  };

  const resetForm = () => {
    setNovoMedicamento({
      nome: "",
      dosagem: "",
      frequencia: "Diária",
      horarios: [],
      data_inicio: format(new Date(), "yyyy-MM-dd"),
      observacoes: "",
    });
    setHorarioAtual("08:00");
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">
          Registro de Medicamentos
        </h2>
        <Button
          onClick={() => setModalAberto(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Novo Medicamento
        </Button>
      </div>

      <div className="mb-6">
        <DateNavigation
          date={currentDate}
          onDateChangeAction={handleDateChange}
          title="Medicamentos"
          className="mb-4"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total de Medicamentos</p>
              <p className="text-2xl font-bold text-white">
                {resumoMedicamentos.total}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Pill className="w-4 h-4 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Tomados Hoje</p>
              <p className="text-2xl font-bold text-white">
                {resumoMedicamentos.tomadosHoje}
              </p>
              <p className="text-xs text-slate-500">0% dos medicamentos</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Próxima Dose</p>
              <p className="text-2xl font-bold text-white">
                {resumoMedicamentos.proximaDose || "N/A"}
              </p>
              <p className="text-xs text-slate-500">Sem medicamentos</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Clock className="w-4 h-4 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            Seus Medicamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMedicamentos ? (
            <div className="text-center py-8">
              <p className="text-slate-400">Carregando medicamentos...</p>
            </div>
          ) : medicamentos.length === 0 ? (
            <div className="border border-dashed border-slate-700 rounded-lg p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                <Pill className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 mb-2">
                Você ainda não tem medicamentos cadastrados.
              </p>
              <p className="text-slate-500 text-sm">
                Adicione seu primeiro medicamento clicando no botão acima.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {medicamentos.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3 bg-slate-750 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center">
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-400 border-blue-500/30"
                    >
                      {med.horarios[0]}
                    </Badge>
                    <div className="ml-3">
                      <p className="text-white font-medium">{med.nome}</p>
                      <p className="text-sm text-slate-400">
                        Frequência: {med.frequencia}, Intervalo:{" "}
                        {med.intervalo_horas} horas
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-400"
                      onClick={() => excluirMedicamento(med.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Novo Medicamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Nome do Medicamento
              </label>
              <Input
                placeholder="Ex: Ritalina, Fluoxetina"
                className="bg-slate-900 border-slate-700 text-white"
                value={novoMedicamento.nome}
                onChange={(e) =>
                  setNovoMedicamento({
                    ...novoMedicamento,
                    nome: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Dosagem
              </label>
              <Input
                placeholder="Ex: 10mg, 1 comprimido"
                className="bg-slate-900 border-slate-700 text-white"
                value={novoMedicamento.dosagem}
                onChange={(e) =>
                  setNovoMedicamento({
                    ...novoMedicamento,
                    dosagem: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Frequência
              </label>
              <Select
                value={novoMedicamento.frequencia}
                onValueChange={(value) =>
                  setNovoMedicamento({
                    ...novoMedicamento,
                    frequencia: value as FrequenciaMedicamento,
                  })
                }
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="Diária">Diária</SelectItem>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Conforme necessário">
                    Conforme necessário
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {novoMedicamento.frequencia === "Diária" && (
              <div>
                <label className="text-sm text-slate-400 mb-1 block">
                  Intervalo entre doses
                  <span className="text-xs text-slate-500 ml-1">
                    (tempo mínimo recomendado entre uma dose e outra)
                  </span>
                </label>
                <Select
                  value={novoMedicamento.intervalo_horas?.toString() || "4"}
                  onValueChange={(value) =>
                    setNovoMedicamento({
                      ...novoMedicamento,
                      intervalo_horas: Number.parseInt(value),
                    })
                  }
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione o intervalo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="4">4 horas</SelectItem>
                    <SelectItem value="6">6 horas</SelectItem>
                    <SelectItem value="8">8 horas</SelectItem>
                    <SelectItem value="12">12 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Horários
              </label>
              <div className="flex space-x-2">
                <Input
                  type="time"
                  className="bg-slate-900 border-slate-700 text-white"
                  value={horarioAtual}
                  onChange={(e) => setHorarioAtual(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700 text-white"
                  onClick={adicionarHorario}
                >
                  <PlusCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {novoMedicamento.horarios?.map((horario, index) => (
                  <Badge
                    key={index}
                    className="bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    {horario}
                    <button
                      className="ml-1 hover:text-red-400"
                      onClick={() => removerHorario(index)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Data de início
              </label>
              <Input
                type="date"
                className="bg-slate-900 border-slate-700 text-white"
                value={novoMedicamento.data_inicio}
                onChange={(e) =>
                  setNovoMedicamento({
                    ...novoMedicamento,
                    data_inicio: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Observações (opcional)
              </label>
              <Textarea
                placeholder="Adicione informações importantes sobre o medicamento..."
                className="bg-slate-900 border-slate-700 text-white resize-none"
                value={novoMedicamento.observacoes || ""}
                onChange={(e) =>
                  setNovoMedicamento({
                    ...novoMedicamento,
                    observacoes: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-700"
              onClick={() => {
                setModalAberto(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSubmit}
            >
              Adicionar Medicamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
