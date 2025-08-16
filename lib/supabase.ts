import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export type Database = {
  public: {
    Tables: {
      meal_plans: {
        Row: {
          id: string
          user_id: string
          time: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          time: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          time?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      meal_records: {
        Row: {
          id: string
          user_id: string
          time: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          time: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          time?: string
          description?: string
          created_at?: string
        }
      }
      hydration_records: {
        Row: {
          id: string
          user_id: string
          glasses_count: number
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          glasses_count: number
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          glasses_count?: number
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
