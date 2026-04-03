/*
  # Create Trainer App Tables

  1. Changes
    - Drop existing tables and create fresh schema
    - Create tables: trainers, members, exercise_library, workouts
    - Disable RLS on all tables for simplicity
  
  2. Tables
    - `trainers`
      - `id` (uuid, primary key, auto-generated)
      - `name` (text, unique, required)
      - `pin` (text, required)
      - `created_at` (timestamptz, auto-generated)
    
    - `members`
      - `id` (uuid, primary key, auto-generated)
      - `trainer_id` (uuid, foreign key to trainers)
      - `name` (text, required)
      - `created_at` (timestamptz, auto-generated)
    
    - `exercise_library`
      - `id` (uuid, primary key, auto-generated)
      - `trainer_id` (uuid, foreign key to trainers)
      - `category` (text, required)
      - `name` (text, required)
    
    - `workouts`
      - `id` (uuid, primary key, auto-generated)
      - `member_id` (uuid, foreign key to members)
      - `trainer_id` (uuid, foreign key to trainers)
      - `date` (date, required)
      - `exercises` (jsonb, stores array of exercise data)
      - `created_at` (timestamptz, auto-generated)
  
  3. Security
    - RLS is disabled on all tables
*/

-- Drop existing tables
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS exercise_library CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS trainers CASCADE;

-- Create trainers table
CREATE TABLE trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  pin text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create members table
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create exercise_library table
CREATE TABLE exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  category text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create workouts table
CREATE TABLE workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS on all tables
ALTER TABLE trainers DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library DISABLE ROW LEVEL SECURITY;
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX idx_members_trainer_id ON members(trainer_id);
CREATE INDEX idx_exercise_library_trainer_id ON exercise_library(trainer_id);
CREATE INDEX idx_workouts_member_id ON workouts(member_id);
CREATE INDEX idx_workouts_trainer_id ON workouts(trainer_id);
CREATE INDEX idx_workouts_date ON workouts(date);
