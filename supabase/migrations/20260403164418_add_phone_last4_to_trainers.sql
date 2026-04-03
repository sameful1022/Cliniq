/*
  # Add phone_last4 column to trainers table

  1. Changes
    - Add `phone_last4` column to `trainers` table
      - Type: text (4 characters)
      - Not null with default empty string for existing records
      - Will store last 4 digits of phone number for PIN recovery

  2. Notes
    - Existing records will have empty string as default
    - New signups will require this field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'phone_last4'
  ) THEN
    ALTER TABLE trainers ADD COLUMN phone_last4 text DEFAULT '' NOT NULL;
  END IF;
END $$;