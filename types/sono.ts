export interface RegistroSono {
  id: string
  user_id: string
  bedtime: string // horário de dormir (formato HH:mm)
  wake_time: string // horário de acordar (formato HH:mm)
  sleep_quality: number // qualidade do sono (1-10)
  notes?: string // observações sobre o sono
  date: string // data do registro (YYYY-MM-DD)
  created_at: string
  updated_at: string
}

export interface ConfiguracaoLembretes {
  id: string
  user_id: string
  bedtime_reminder_enabled: boolean // lembrete para dormir ativo
  bedtime_reminder_time: string // horário do lembrete para dormir
  wake_reminder_enabled: boolean // lembrete para acordar ativo
  wake_reminder_time: string // horário do lembrete para acordar
  weekdays?: string[] // dias da semana (segunda, terca, etc.)
  message?: string // mensagem personalizada do lembrete
  active: boolean // se o lembrete está ativo
  created_at: string
  updated_at: string
}

export interface EstatisticasSono {
  // Estatísticas da última semana
  mediaHorasSono: number // média de horas de sono
  mediaQualidade: number // média da qualidade do sono
  consistencia: number // percentual de consistência nos horários
  totalRegistros: number // total de registros na semana
  
  // Tendências
  tendenciaHoras: 'aumentando' | 'diminuindo' | 'estavel' // tendência das horas de sono
  tendenciaQualidade: 'melhorando' | 'piorando' | 'estavel' // tendência da qualidade
  
  // Dados por dia da semana
  registrosPorDia: {
    [dia: string]: {
      horas: number
      qualidade: number
      horaDormir: string
      horaAcordar: string
    }
  }
  
  // Padrões identificados
  melhorDia: string | null // dia com melhor qualidade de sono
  piorDia: string | null // dia com pior qualidade de sono
  horaIdealDormir: string | null // horário mais comum para dormir
  horaIdealAcordar: string | null // horário mais comum para acordar
}

// Tipos auxiliares para inserção e atualização
export type RegistroSonoInsert = Omit<RegistroSono, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type RegistroSonoUpdate = Partial<RegistroSonoInsert>

export type ConfiguracaoLembretesInsert = Omit<ConfiguracaoLembretes, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type ConfiguracaoLembretesUpdate = Partial<ConfiguracaoLembretesInsert>
