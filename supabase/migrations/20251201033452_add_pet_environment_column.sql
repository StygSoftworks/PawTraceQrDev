/*
  # Add environment column to pets table

  1. Changes
    - Add `environment` column to `pets` table with three possible values:
      - 'indoor' - Pet stays indoors only
      - 'outdoor' - Pet stays outdoors only  
      - 'indoor_outdoor' - Pet goes both indoors and outdoors (default)
    - Set default value to 'indoor_outdoor' for all existing and new pets
    - Add check constraint to ensure only valid values are stored
  
  2. Security
    - No RLS changes needed (inherits existing pets table policies)
*/

-- Add environment column to pets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'environment'
  ) THEN
    ALTER TABLE pets ADD COLUMN environment text DEFAULT 'indoor_outdoor';
    
    -- Add check constraint to ensure only valid values
    ALTER TABLE pets ADD CONSTRAINT pets_environment_check 
      CHECK (environment IN ('indoor', 'outdoor', 'indoor_outdoor'));
  END IF;
END $$;