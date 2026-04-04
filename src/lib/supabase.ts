import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlkbeftkrzhwhmprgqgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2JlZnRrcnpod2htcHJncWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMDQ1OTEsImV4cCI6MjA5MDY4MDU5MX0.WCQ1e7rCtoOgq9yB56V-kCIvrWrH7x_WmSvN4BtwWIg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Trainer {
  id: string;
  name: string;
  pin: string;
  created_at: string;
}

export interface Member {
  id: string;
  trainer_id: string;
  name: string;
  created_at: string;
}

export interface ExerciseLibrary {
  id: string;
  trainer_id: string;
  category: string;
  name: string;
  created_at: string;
}

export interface WorkoutExercise {
  exercise_id: string;
  exercise_name: string;
  category: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface Workout {
  id: string;
  member_id: string;
  trainer_id: string;
  date: string;
  exercises: WorkoutExercise[];
  created_at: string;
}
