"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { useDashboard } from "@/hooks/use-dashboard"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Square } from "lucide-react"
import { getCurrentDateString } from "@/lib/utils"

interface TemporizadorProps {
  date?: string
}

// Componente de botões de ação memoizado
const TimerControls = memo(function TimerControls({
  isActive,
  isPaused,
  onPause,
  onContinue,
  onStop,
  duracao
}: {
  isActive: boolean;
  isPaused: boolean;
  onPause: () => void;
  onContinue: () => void;
  onStop: () => void;
  duracao: number;
}) {
  return (
    <div className="flex gap-2">
      {isPaused ? (
        <Button
          onClick={onContinue}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Play className="w-4 h-4 mr-2" />
          Continuar
        </Button>
      ) : (
        <Button onClick={onPause} className="flex-1 bg-yellow-600 hover:bg-yellow-700" size="sm">
          <Pause className="w-4 h-4 mr-2" />
          Pausar
        </Button>
      )}
      <Button
        onClick={onStop}
        variant="outline"
        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
        size="sm"
      >
        <Square className="w-4 h-4" />
      </Button>
    </div>
  );
});

// Componente de seleção de sessão memoizado
const SessionSelector = memo(function SessionSelector({
  onStartSession
}: {
  onStartSession: (duracao: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Button onClick={() => onStartSession(25)} className="w-full bg-green-600 hover:bg-green-700" size="sm">
        <Play className="w-4 h-4 mr-2" />
        Pomodoro (25min)
      </Button>
      <Button onClick={() => onStartSession(15)} className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
        <Play className="w-4 h-4 mr-2" />
        Foco Curto (15min)
      </Button>
      <Button
        onClick={() => onStartSession(45)}
        className="w-full bg-purple-600 hover:bg-purple-700"
        size="sm"
      >
        <Play className="w-4 h-4 mr-2" />
        Foco Longo (45min)
      </Button>
    </div>
  );
});

// Componente principal memoizado
export const TemporizadorFocoDashboard = memo(function TemporizadorFocoDashboard({ 
  date 
}: TemporizadorProps) {
  const resolvedDate = useMemo(() => date || getCurrentDateString(), [date]);
  const { sessaoFoco, iniciarSessaoFoco, pausarSessaoFoco, pararSessaoFoco } = useDashboard(resolvedDate);
  const [tempoLocal, setTempoLocal] = useState(0);

  const sessaoAtiva = sessaoFoco;

  // Memoizar funções de callback para evitar re-renders dos componentes filhos
  const handleIniciarSessao = useCallback(async (duracao: number) => {
    try {
      await iniciarSessaoFoco(duracao);
    } catch (error) {
      console.error("Erro ao iniciar sessão:", error);
    }
  }, [iniciarSessaoFoco]);

  const handlePausar = useCallback(async () => {
    try {
      await pausarSessaoFoco();
    } catch (error) {
      console.error("Erro ao pausar sessão:", error);
    }
  }, [pausarSessaoFoco]);

  const handleParar = useCallback(async () => {
    try {
      await pararSessaoFoco();
      setTempoLocal(0);
    } catch (error) {
      console.error("Erro ao parar sessão:", error);
    }
  }, [pararSessaoFoco]);

  const handleContinuar = useCallback(async () => {
    if (sessaoAtiva) {
      await handleIniciarSessao(sessaoAtiva.duracao_minutos);
    }
  }, [handleIniciarSessao, sessaoAtiva]);

  // Memoizar funções de formatação para evitar recalcular a cada render
  const tempoFormatado = useMemo(() => {
    const minutos = Math.floor(tempoLocal / 60);
    const segs = tempoLocal % 60;
    return `${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  }, [tempoLocal]);

  const progresso = useMemo(() => {
    if (!sessaoAtiva) return 0;
    const tempoTotal = sessaoAtiva.duracao_minutos * 60;
    const tempoDecorrido = tempoTotal - tempoLocal;
    return (tempoDecorrido / tempoTotal) * 100;
  }, [sessaoAtiva, tempoLocal]);

  // Timer effect otimizado
  useEffect(() => {
    if (sessaoAtiva && sessaoAtiva.ativa && !sessaoAtiva.pausada) {
      const interval = setInterval(() => {
        setTempoLocal((prev) => {
          const novoTempo = prev - 1;
          if (novoTempo <= 0) {
            // Sessão finalizada
            pararSessaoFoco();
            return 0;
          }
          return novoTempo;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sessaoAtiva?.ativa, sessaoAtiva?.pausada, pararSessaoFoco]); // Dependencies otimizadas

  // Sync local time with session
  useEffect(() => {
    if (sessaoAtiva?.tempo_restante !== undefined) {
      setTempoLocal(sessaoAtiva.tempo_restante);
    }
  }, [sessaoAtiva?.tempo_restante]);

  // Renderização condicional otimizada
  if (!sessaoAtiva || !sessaoAtiva.ativa) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-mono text-slate-400 mb-2">00:00</div>
          <p className="text-sm text-slate-500">Nenhuma sessão ativa</p>
        </div>
        <SessionSelector onStartSession={handleIniciarSessao} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-mono text-white mb-2">{tempoFormatado}</div>
        <p className="text-sm text-slate-400">{sessaoAtiva.pausada ? "Pausado" : "Em andamento"}</p>
      </div>

      <Progress value={progresso} className="h-2" />

      <TimerControls
        isActive={sessaoAtiva.ativa}
        isPaused={sessaoAtiva.pausada}
        onPause={handlePausar}
        onContinue={handleContinuar}
        onStop={handleParar}
        duracao={sessaoAtiva.duracao_minutos}
      />

      <div className="text-center">
        <p className="text-xs text-slate-500">Sessão de {sessaoAtiva.duracao_minutos} minutos</p>
      </div>
    </div>
  );
});

// Export default para lazy loading
export default TemporizadorFocoDashboard;
