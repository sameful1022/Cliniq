/*
  # Add PIN hint column to trainers table

  1. Changes
    - Add `hint` column to `trainers` table (optional text field)
    - This allows trainers to save a hint for their PIN during registration
  
  2. Security
    - No RLS changes needed as trainers table already has no RLS enabled
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'hint'
  ) THEN
    ALTER TABLE trainers ADD COLUMN hint text DEFAULT '';
  END IF;
END $$;