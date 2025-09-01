// =====================================================
// UNIFIED HISTORY SYSTEM TYPES v1.1
// =====================================================

export type ModuleType = 
  | 'estudos' 
  | 'simulados' 
  | 'concursos' 
  | 'financas' 
  | 'saude' 
  | 'sono' 
  | 'alimentacao' 
  | 'lazer' 
  | 'hiperfocos' 
  | 'autoconhecimento';

export type ActivityStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';
export type DifficultyLevel = 'facil' | 'medio' | 'dificil';
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

// =====================================================
// CORE ACTIVITY HISTORY
// =====================================================
export interface ActivityHistory {
  id: string;
  user_id: string;
  
  // Activity identification
  module: ModuleType;
  activity_type: string;
  activity_subtype?: string;
  
  // Activity data
  title: string;
  description?: string;
  metadata: Record<string, any>;
  
  // Performance/Results
  score?: number;
  percentage?: number; // For compatibility with legacy systems (0-100)
  duration_minutes?: number;
  success_rate?: number;
  
  // Categorization
  category?: string;
  tags: string[];
  difficulty?: DifficultyLevel;
  
  // Status and flags
  status: ActivityStatus;
  is_favorite: boolean;
  is_milestone: boolean;
  
  // Timestamps
  activity_date: string; // Date string
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// ANALYTICS
// =====================================================
export interface HistoryAnalytics {
  id: string;
  user_id: string;
  module: ModuleType;
  
  // Time periods
  period_type: PeriodType;
  period_start: string; // Date string
  period_end: string; // Date string
  
  // Metrics
  total_activities: number;
  total_duration_minutes: number;
  avg_score?: number;
  avg_success_rate?: number;
  streak_count: number;
  best_performance?: number;
  
  // Activity breakdown
  activity_breakdown: Record<string, number>;
  category_breakdown: Record<string, number>;
  
  created_at: string;
  updated_at: string;
}

// =====================================================
// GOALS
// =====================================================
export interface HistoryGoal {
  id: string;
  user_id: string;
  
  module: ModuleType;
  goal_type: string;
  title: string;
  description?: string;
  
  // Target values
  target_value: number;
  target_unit: string; // 'minutes', 'count', 'percentage'
  
  // Time frame
  start_date: string; // Date string
  end_date?: string; // Date string
  is_recurring: boolean;
  recurrence_pattern?: string; // 'daily', 'weekly', 'monthly'
  
  // Progress tracking
  current_value: number;
  is_achieved: boolean;
  achieved_at?: string;
  
  // Status
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

// =====================================================
// SUMMARY AND STATISTICS
// =====================================================
export interface ActivitySummary {
  total_activities: number;
  total_duration_minutes: number;
  avg_score?: number;
  avg_success_rate?: number;
  favorite_count: number;
  milestone_count: number;
  most_active_day?: string;
  current_streak: number;
}

export interface ModuleStats {
  module: ModuleType;
  total_activities: number;
  total_duration: number;
  avg_performance: number;
  last_activity?: string;
  streak: number;
  achievements: number;
}

export interface DailyActivity {
  date: string;
  activities: ActivityHistory[];
  total_duration: number;
  activity_count: number;
  avg_performance?: number;
}

export interface WeeklyProgress {
  week_start: string;
  week_end: string;
  daily_activities: DailyActivity[];
  total_activities: number;
  total_duration: number;
  goals_achieved: number;
  avg_performance?: number;
}

// =====================================================
// FILTER AND QUERY OPTIONS
// =====================================================
export interface HistoryFilters {
  modules?: ModuleType[];
  activity_types?: string[];
  categories?: string[];
  tags?: string[];
  difficulty?: DifficultyLevel[];
  status?: ActivityStatus[];
  date_from?: string;
  date_to?: string;
  is_favorite?: boolean;
  is_milestone?: boolean;
  min_score?: number;
  max_score?: number;
  min_duration?: number;
  max_duration?: number;
}

export interface HistoryQueryOptions {
  filters?: HistoryFilters;
  sort_by?: 'activity_date' | 'completed_at' | 'score' | 'duration_minutes' | 'created_at';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  include_analytics?: boolean;
}

// =====================================================
// ACTIVITY CREATION
// =====================================================
export interface CreateActivityInput {
  module: ModuleType;
  activity_type: string;
  activity_subtype?: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  score?: number;
  percentage?: number;
  duration_minutes?: number;
  success_rate?: number;
  category?: string;
  tags?: string[];
  difficulty?: DifficultyLevel;
  activity_date?: string;
  started_at?: string;
  completed_at?: string;
  is_favorite?: boolean;
  is_milestone?: boolean;
}

export interface UpdateActivityInput extends Partial<CreateActivityInput> {
  id: string;
  status?: ActivityStatus;
}

// =====================================================
// GOAL CREATION
// =====================================================
export interface CreateGoalInput {
  module: ModuleType;
  goal_type: string;
  title: string;
  description?: string;
  target_value: number;
  target_unit: string;
  start_date: string;
  end_date?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
}

export interface UpdateGoalInput extends Partial<CreateGoalInput> {
  id: string;
  current_value?: number;
  is_achieved?: boolean;
  is_active?: boolean;
}

// =====================================================
// HOOK RETURN TYPES
// =====================================================
export interface UseHistoryReturn {
  // Data
  activities: ActivityHistory[];
  analytics: HistoryAnalytics[];
  goals: HistoryGoal[];
  summary: ActivitySummary | null;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  addActivity: (input: CreateActivityInput) => Promise<ActivityHistory>;
  updateActivity: (input: UpdateActivityInput) => Promise<ActivityHistory>;
  deleteActivity: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleMilestone: (id: string) => Promise<void>;
  
  // Goals
  createGoal: (input: CreateGoalInput) => Promise<HistoryGoal>;
  updateGoal: (input: UpdateGoalInput) => Promise<HistoryGoal>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Queries
  getActivities: (options?: HistoryQueryOptions) => Promise<ActivityHistory[]>;
  getModuleStats: (module: ModuleType) => Promise<ModuleStats>;
  getDailyActivities: (date: string) => Promise<DailyActivity>;
  getWeeklyProgress: (weekStart: string) => Promise<WeeklyProgress>;
  
  // Utilities
  refreshData: () => Promise<void>;
  clearError: () => void;
}

// =====================================================
// PREDEFINED ACTIVITY TYPES BY MODULE
// =====================================================
export const ACTIVITY_TYPES = {
  estudos: [
    'study_session',
    'pomodoro_completed',
    'topic_completed',
    'note_created',
    'flashcard_session'
  ],
  simulados: [
    'simulation_completed',
    'practice_test',
    'question_answered',
    'review_session'
  ],
  concursos: [
    'competition_registered',
    'study_plan_created',
    'milestone_reached',
    'exam_completed'
  ],
  financas: [
    'expense_added',
    'income_added',
    'budget_created',
    'goal_achieved',
    'payment_made'
  ],
  saude: [
    'medication_taken',
    'mood_logged',
    'symptom_tracked',
    'appointment_attended',
    'exercise_completed'
  ],
  sono: [
    'sleep_logged',
    'bedtime_routine',
    'wake_up_logged',
    'sleep_goal_met'
  ],
  alimentacao: [
    'meal_logged',
    'recipe_created',
    'nutrition_goal_met',
    'shopping_list_created'
  ],
  lazer: [
    'activity_completed',
    'hobby_session',
    'social_activity',
    'entertainment'
  ],
  hiperfocos: [
    'focus_session',
    'interest_explored',
    'project_completed',
    'research_session'
  ],
  autoconhecimento: [
    'reflection_completed',
    'journal_entry',
    'personality_assessment',
    'goal_set',
    'insight_gained'
  ]
} as const;

export type ActivityTypesByModule = typeof ACTIVITY_TYPES;