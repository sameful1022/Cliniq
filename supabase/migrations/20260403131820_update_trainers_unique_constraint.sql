/*
  # Update Trainers Unique Constraint

  1. Changes
    - Remove the UNIQUE constraint on trainer name
    - Add a UNIQUE constraint on the combination of name + pin
    - This allows multiple trainers to have the same name as long as they have different PINs
  
  2. Security
    - Ensures unique authentication based on name + pin combination
    - Prevents duplicate trainer accounts with identical credentials
*/

-- Remove existing unique constraint on name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'trainers_name_key'
  ) THEN
    ALTER TABLE trainers DROP CONSTRAINT trainers_name_key;
  END IF;
END $$;

-- Add unique constraint on name + pin combination
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'trainers_name_pin_key'
  ) THEN
    ALTER TABLE trainers ADD CONSTRAINT trainers_name_pin_key UNIQUE (name, pin);
  END IF;
END $$;