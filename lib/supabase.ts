import { createBrowserClient } from "@supabase/ssr";

// Verificar configuração das variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL não está configurada");
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não está configurada");
}

// Função para criar cliente Supabase (para componentes)
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}

// Cliente Supabase global para uso direto
export const supabase = createClient();

export type Database = {
  public: {
    Tables: {
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          time: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          time: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          time?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      meal_records: {
        Row: {
          id: string;
          user_id: string;
          time: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          time: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          time?: string;
          description?: string;
          created_at?: string;
        };
      };
      hydration_records: {
        Row: {
          id: string;
          user_id: string;
          glasses_count: number;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          glasses_count: number;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          glasses_count?: number;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sleep_records: {
        Row: {
          id: string;
          user_id: string;
          bedtime: string;
          wake_time: string;
          sleep_quality: number;
          notes?: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bedtime: string;
          wake_time: string;
          sleep_quality: number;
          notes?: string;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bedtime?: string;
          wake_time?: string;
          sleep_quality?: number;
          notes?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sleep_reminders: {
        Row: {
          id: string;
          user_id: string;
          reminder_time: string;
          is_active: boolean;
          message?: string;
          days_of_week: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reminder_time: string;
          is_active?: boolean;
          message?: string;
          days_of_week: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          reminder_time?: string;
          is_active?: boolean;
          message?: string;
          days_of_week?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name?: string;
          avatar_url?: string;
          phone?: string;
          birth_date?: string;
          occupation?: string;
          location?: string;
          bio?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string;
          avatar_url?: string;
          phone?: string;
          birth_date?: string;
          occupation?: string;
          location?: string;
          bio?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          avatar_url?: string;
          phone?: string;
          birth_date?: string;
          occupation?: string;
          location?: string;
          bio?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          high_contrast: boolean;
          large_text: boolean;
          reduced_stimuli: boolean;
          dark_mode: boolean;
          notifications_enabled: boolean;
          sound_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          high_contrast?: boolean;
          large_text?: boolean;
          reduced_stimuli?: boolean;
          dark_mode?: boolean;
          notifications_enabled?: boolean;
          sound_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          high_contrast?: boolean;
          large_text?: boolean;
          reduced_stimuli?: boolean;
          dark_mode?: boolean;
          notifications_enabled?: boolean;
          sound_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_goals: {
        Row: {
          id: string;
          user_id: string;
          sleep_hours: number;
          daily_tasks: number;
          water_glasses: number;
          break_frequency: number;
          exercise_minutes?: number;
          study_hours?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sleep_hours?: number;
          daily_tasks?: number;
          water_glasses?: number;
          break_frequency?: number;
          exercise_minutes?: number;
          study_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sleep_hours?: number;
          daily_tasks?: number;
          water_glasses?: number;
          break_frequency?: number;
          exercise_minutes?: number;
          study_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      medicamentos: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          dosagem: string;
          frequencia: string;
          intervalo_horas: number;
          horarios: string[];
          data_inicio: string;
          observacoes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          dosagem: string;
          frequencia: string;
          intervalo_horas: number;
          horarios: string[];
          data_inicio: string;
          observacoes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          dosagem?: string;
          frequencia?: string;
          intervalo_horas?: number;
          horarios?: string[];
          data_inicio?: string;
          observacoes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      registros_humor: {
        Row: {
          id: string;
          user_id: string;
          data: string;
          nivel_humor: number;
          fatores?: string[];
          notas?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          data: string;
          nivel_humor: number;
          fatores?: string[];
          notas?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          data?: string;
          nivel_humor?: number;
          fatores?: string[];
          notas?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          competition_id?: string;
          subject: string;
          topic?: string;
          duration_minutes: number;
          completed: boolean;
          pomodoro_cycles: number;
          notes?: string;
          started_at?: string;
          completed_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          competition_id?: string;
          subject: string;
          topic?: string;
          duration_minutes: number;
          completed?: boolean;
          pomodoro_cycles?: number;
          notes?: string;
          started_at?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          competition_id?: string;
          subject?: string;
          topic?: string;
          duration_minutes?: number;
          completed?: boolean;
          pomodoro_cycles?: number;
          notes?: string;
          started_at?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pomodoro_sessions: {
        Row: {
          id: string;
          user_id: string;
          study_session_id?: string;
          focus_duration: number;
          break_duration: number;
          long_break_duration: number;
          cycles_completed: number;
          current_cycle: number;
          is_active: boolean;
          started_at?: string;
          paused_at?: string;
          completed_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          study_session_id?: string;
          focus_duration: number;
          break_duration: number;
          long_break_duration: number;
          cycles_completed?: number;
          current_cycle?: number;
          is_active?: boolean;
          started_at?: string;
          paused_at?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          study_session_id?: string;
          focus_duration?: number;
          break_duration?: number;
          long_break_duration?: number;
          cycles_completed?: number;
          current_cycle?: number;
          is_active?: boolean;
          started_at?: string;
          paused_at?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      hyperfocus_projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description?: string;
          color: string;
          time_limit?: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          color: string;
          time_limit?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          color?: string;
          time_limit?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      hyperfocus_tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description?: string;
          completed: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          completed?: boolean;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string;
          completed?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      hyperfocus_sessions: {
        Row: {
          id: string;
          user_id: string;
          project_id?: string;
          duration_minutes: number;
          completed: boolean;
          started_at?: string;
          completed_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string;
          duration_minutes: number;
          completed?: boolean;
          started_at?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          duration_minutes?: number;
          completed?: boolean;
          started_at?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      alternation_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          projects: string[];
          current_project_index: number;
          session_duration: number;
          is_active: boolean;
          started_at?: string;
          paused_at?: string;
          completed_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          projects: string[];
          current_project_index?: number;
          session_duration: number;
          is_active?: boolean;
          started_at?: string;
          paused_at?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          projects?: string[];
          current_project_index?: number;
          session_duration?: number;
          is_active?: boolean;
          started_at?: string;
          paused_at?: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      competitions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          organizer: string;
          registration_date?: string;
          exam_date?: string;
          edital_link?: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          organizer: string;
          registration_date?: string;
          exam_date?: string;
          edital_link?: string;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          organizer?: string;
          registration_date?: string;
          exam_date?: string;
          edital_link?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      competition_subjects: {
        Row: {
          id: string;
          competition_id: string;
          name: string;
          progress?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          name: string;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          name?: string;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      competition_topics: {
        Row: {
          id: string;
          subject_id: string;
          name: string;
          completed?: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          name: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          name?: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      competition_questions: {
        Row: {
          id: string;
          competition_id: string;
          subject_id?: string;
          topic_id?: string;
          question_text: string;
          options?: any;
          correct_answer?: string;
          explanation?: string;
          difficulty?: string;
          is_ai_generated?: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          subject_id?: string;
          topic_id?: string;
          question_text: string;
          options?: any;
          correct_answer?: string;
          explanation?: string;
          difficulty?: string;
          is_ai_generated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          subject_id?: string;
          topic_id?: string;
          question_text?: string;
          options?: any;
          correct_answer?: string;
          explanation?: string;
          difficulty?: string;
          is_ai_generated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      competition_simulations: {
        Row: {
          id: string;
          competition_id: string;
          user_id: string;
          title: string;
          questions: string[];
          results?: any;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          user_id: string;
          title: string;
          questions: string[];
          results?: any;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          user_id?: string;
          title?: string;
          questions?: string[];
          results?: any;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      self_knowledge_notes: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          title: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      receitas: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          categoria: string;
          ingredientes: string[];
          modo_preparo: string;
          tempo_preparo?: number;
          porcoes?: number;
          dificuldade?: string;
          favorita: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          categoria: string;
          ingredientes: string[];
          modo_preparo: string;
          tempo_preparo?: number;
          porcoes?: number;
          dificuldade?: string;
          favorita?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          categoria?: string;
          ingredientes?: string[];
          modo_preparo?: string;
          tempo_preparo?: number;
          porcoes?: number;
          dificuldade?: string;
          favorita?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      lista_compras: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          categoria: string;
          quantidade?: string;
          comprado: boolean;
          receita_id?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          categoria: string;
          quantidade?: string;
          comprado?: boolean;
          receita_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          categoria?: string;
          quantidade?: string;
          comprado?: boolean;
          receita_id?: string;
          created_at?: string;
        };
      };
      expense_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color: string;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          category_id?: string;
          description: string;
          amount: number;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string;
          description: string;
          amount: number;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          description?: string;
          amount?: number;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      virtual_envelopes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          total_amount: number;
          used_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color: string;
          total_amount: number;
          used_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          total_amount?: number;
          used_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      scheduled_payments: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          amount: number;
          due_date: string;
          is_recurring: boolean;
          recurrence_type?: string;
          is_paid: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          amount: number;
          due_date: string;
          is_recurring?: boolean;
          recurrence_type?: string;
          is_paid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          amount?: number;
          due_date?: string;
          is_recurring?: boolean;
          recurrence_type?: string;
          is_paid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      atividades_lazer: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          categoria?: string;
          duracao_minutos?: number;
          data_realizacao: string;
          notas?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          categoria?: string;
          duracao_minutos?: number;
          data_realizacao: string;
          notas?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          categoria?: string;
          duracao_minutos?: number;
          data_realizacao?: string;
          notas?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sugestoes_descanso: {
        Row: {
          id: string;
          titulo: string;
          descricao?: string;
          categoria?: string;
          dificuldade: string;
          duracao_estimada?: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          titulo: string;
          descricao?: string;
          categoria?: string;
          dificuldade: string;
          duracao_estimada?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          titulo?: string;
          descricao?: string;
          categoria?: string;
          dificuldade?: string;
          duracao_estimada?: number;
          created_at?: string;
        };
      };
      sugestoes_favoritas: {
        Row: {
          id: string;
          user_id: string;
          sugestao_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sugestao_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sugestao_id?: string;
          created_at?: string;
        };
      };
      sessoes_lazer: {
        Row: {
          id: string;
          user_id: string;
          duracao_minutos: number;
          tempo_usado_minutos: number;
          status: string;
          atividade_id?: string;
          data_inicio: string;
          data_fim?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          duracao_minutos: number;
          tempo_usado_minutos?: number;
          status: string;
          atividade_id?: string;
          data_inicio: string;
          data_fim?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          duracao_minutos?: number;
          tempo_usado_minutos?: number;
          status?: string;
          atividade_id?: string;
          data_inicio?: string;
          data_fim?: string;
          created_at?: string;
        };
      };
    };
  };
};
