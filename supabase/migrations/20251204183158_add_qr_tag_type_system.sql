/*
  # Add Tag Type System for Physical QR Tags
  
  ## Overview
  This migration adds support for two physical tag sizes (dog/cat) to enable 
  pre-manufacturing of QR codes. Dog tags are larger, cat tags are smaller.
  Non-dog pets (cat, other) will use cat-sized tags.
  
  ## Changes Made
  
  ### 1. New Columns
  - `qr_codes.tag_type` (text, NOT NULL, default 'dog')
    - Values: 'dog' or 'cat'
    - Indicates physical tag size for manufacturing
  
  ### 2. Constraints
  - CHECK constraint ensures only 'dog' or 'cat' values allowed
  
  ### 3. Indexes
  - Index on `tag_type` for efficient filtering during reservation
  - Composite index on `(pet_id, tag_type)` for assignment queries
  - Composite index on `(tag_type, created_at)` for FIFO pool allocation
  
  ### 4. Data Migration
  - Existing assigned QR codes: Set tag_type based on pet species
    - 'dog' species → 'dog' tag_type
    - Other species → 'cat' tag_type
  - Existing unassigned QR codes: Distribute approximately 50/50
    - Uses row numbering with modulo to alternate between types
  
  ### 5. Important Notes
  - Backward compatible: Defaults to 'dog' for safety
  - Existing pets will get appropriate tag types assigned
  - Unassigned pool codes distributed evenly for balanced manufacturing
*/

-- Step 1: Add tag_type column with default value
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS tag_type text NOT NULL DEFAULT 'dog';

-- Step 2: Add CHECK constraint to ensure only valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'qr_codes_tag_type_check'
  ) THEN
    ALTER TABLE qr_codes 
    ADD CONSTRAINT qr_codes_tag_type_check 
    CHECK (tag_type IN ('dog', 'cat'));
  END IF;
END $$;

-- Step 3: Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_qr_codes_tag_type 
  ON qr_codes(tag_type);

CREATE INDEX IF NOT EXISTS idx_qr_codes_pet_id_tag_type 
  ON qr_codes(pet_id, tag_type);

CREATE INDEX IF NOT EXISTS idx_qr_codes_tag_type_created_at 
  ON qr_codes(tag_type, created_at) 
  WHERE pet_id IS NULL;

-- Step 4: Update tag_type for QR codes already assigned to pets
-- Dogs get 'dog' tags, everything else gets 'cat' tags
UPDATE qr_codes 
SET tag_type = CASE 
  WHEN pets.species = 'dog' THEN 'dog' 
  ELSE 'cat' 
END
FROM pets 
WHERE qr_codes.pet_id = pets.id;

-- Step 5: Distribute unassigned QR codes approximately 50/50
-- Uses row number with modulo to alternate between dog and cat
WITH unassigned_codes AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM qr_codes 
  WHERE pet_id IS NULL
)
UPDATE qr_codes 
SET tag_type = CASE 
  WHEN unassigned_codes.rn % 2 = 0 THEN 'dog'
  ELSE 'cat'
END
FROM unassigned_codes
WHERE qr_codes.id = unassigned_codes.id;

-- Step 6: Create function to get QR pool statistics
CREATE OR REPLACE FUNCTION get_qr_pool_stats()
RETURNS TABLE (
  unassigned_dog_count bigint,
  unassigned_cat_count bigint,
  assigned_dog_count bigint,
  assigned_cat_count bigint,
  total_dog_count bigint,
  total_cat_count bigint,
  total_count bigint,
  dog_percentage numeric,
  cat_percentage numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE pet_id IS NULL AND tag_type = 'dog') as unassigned_dog_count,
    COUNT(*) FILTER (WHERE pet_id IS NULL AND tag_type = 'cat') as unassigned_cat_count,
    COUNT(*) FILTER (WHERE pet_id IS NOT NULL AND tag_type = 'dog') as assigned_dog_count,
    COUNT(*) FILTER (WHERE pet_id IS NOT NULL AND tag_type = 'cat') as assigned_cat_count,
    COUNT(*) FILTER (WHERE tag_type = 'dog') as total_dog_count,
    COUNT(*) FILTER (WHERE tag_type = 'cat') as total_cat_count,
    COUNT(*) as total_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE tag_type = 'dog') / NULLIF(COUNT(*), 0), 2) as dog_percentage,
    ROUND(100.0 * COUNT(*) FILTER (WHERE tag_type = 'cat') / NULLIF(COUNT(*), 0), 2) as cat_percentage
  FROM qr_codes;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_qr_pool_stats() TO authenticated;