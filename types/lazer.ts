export interface AtividadeLazer {
  id: string
  user_id: string
  nome: string
  categoria?: string
  duracao_minutos?: number
  data_realizacao: string
  notas?: string
  created_at: string
  updated_at: string
}

export interface SugestaoDescanso {
  id: string
  titulo: string
  descricao?: string
  categoria?: string
  dificuldade: string
  duracao_estimada?: number
  created_at: string
}

export interface SugestaoFavorita {
  id: string
  user_id: string
  sugestao_id: string
  created_at: string
  sugestoes_descanso?: SugestaoDescanso
}

export interface SessaoLazer {
  id: string
  user_id: string
  duracao_minutos: number
  tempo_usado_minutos: number
  status: "ativo" | "pausado" | "concluido"
  atividade_id?: string
  data_inicio: string
  data_fim?: string
  created_at: string
}

export interface EstatisticasLazer {
  atividadesRealizadas: number
  tempoTotalMinutos: number
  categoriaFavorita: string | null
}
