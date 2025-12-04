/*
  # Update QR Functions to Support Tag Types
  
  ## Overview
  Updates QR code generation and reservation functions to support dog/cat tag types.
  
  ## Changes Made
  
  ### 1. Updated Functions
  - `generate_qr_codes_batch` - Now accepts p_tag_type parameter
    - Generates codes with specified tag type ('dog' or 'cat')
    - Maintains existing base36 generation logic
  
  - `reserve_qr_code` - Now accepts p_tag_type parameter
    - Filters available codes by tag_type during reservation
    - Provides helpful error messages when specific type is depleted
  
  ### 2. New Functions
  - `generate_balanced_qr_pool` - Generates QR codes with 50/50 dog/cat split
    - Takes batch_size and distributes evenly
    - Handles odd batch sizes by giving extra to dogs
    - Returns total codes generated
  
  ### 3. Important Notes
  - Backward compatibility maintained through default parameters
  - FIFO allocation preserved (ORDER BY created_at ASC)
  - Proper error handling for depleted tag type pools
*/

-- Update generate_qr_codes_batch to accept tag_type parameter
CREATE OR REPLACE FUNCTION generate_qr_codes_batch(
  batch_size integer DEFAULT 100,
  p_tag_type text DEFAULT 'dog'
)
RETURNS integer AS $$
DECLARE
  alphabet text := '0123456789abcdefghijklmnopqrstuvwxyz';
  alphabet_length integer := 36;
  current_len integer;
  codes_at_len integer;
  max_codes_at_len bigint;
  codes_generated integer := 0;
  new_short_id text;
  base_num bigint;
BEGIN
  -- Validate tag_type parameter
  IF p_tag_type NOT IN ('dog', 'cat') THEN
    RAISE EXCEPTION 'Invalid tag_type. Must be ''dog'' or ''cat''';
  END IF;

  -- Get current generation state
  SELECT current_length, codes_generated_at_length 
  INTO current_len, codes_at_len
  FROM qr_generation_state 
  WHERE id = 1;

  -- Calculate max possible codes at current length
  max_codes_at_len := power(alphabet_length, current_len);

  -- Generate batch_size codes
  WHILE codes_generated < batch_size LOOP
    -- Check if we need to move to next length
    IF codes_at_len >= max_codes_at_len THEN
      current_len := current_len + 1;
      codes_at_len := 0;
      max_codes_at_len := power(alphabet_length, current_len);
      
      -- Update state
      UPDATE qr_generation_state 
      SET current_length = current_len, 
          codes_generated_at_length = 0,
          updated_at = now()
      WHERE id = 1;
    END IF;

    -- Generate short_id from base36 number
    new_short_id := '';
    base_num := codes_at_len;
    
    -- Convert number to base36 with proper length
    FOR i IN REVERSE (current_len - 1)..0 LOOP
      new_short_id := substring(alphabet, (base_num / power(alphabet_length, i)::bigint % alphabet_length)::integer + 1, 1) || new_short_id;
    END LOOP;

    -- Try to insert with specified tag_type
    BEGIN
      INSERT INTO qr_codes (short_id, tag_type, created_at, updated_at)
      VALUES (new_short_id, p_tag_type, now(), now());
      
      codes_generated := codes_generated + 1;
      codes_at_len := codes_at_len + 1;
    EXCEPTION WHEN unique_violation THEN
      -- Short ID already exists, skip and try next
      codes_at_len := codes_at_len + 1;
    END;
  END LOOP;

  -- Update generation state with final count
  UPDATE qr_generation_state 
  SET codes_generated_at_length = codes_at_len,
      updated_at = now()
  WHERE id = 1;

  RETURN codes_generated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new function to generate balanced pool (50/50 dog/cat split)
CREATE OR REPLACE FUNCTION generate_balanced_qr_pool(batch_size integer DEFAULT 100)
RETURNS TABLE(
  total_generated integer,
  dog_generated integer,
  cat_generated integer
) AS $$
DECLARE
  dog_count integer;
  cat_count integer;
  total integer := 0;
BEGIN
  -- Calculate split (if odd, dogs get the extra one)
  dog_count := (batch_size + 1) / 2;
  cat_count := batch_size / 2;
  
  -- Generate dog tags
  SELECT generate_qr_codes_batch(dog_count, 'dog') INTO dog_count;
  total := total + dog_count;
  
  -- Generate cat tags
  SELECT generate_qr_codes_batch(cat_count, 'cat') INTO cat_count;
  total := total + cat_count;
  
  RETURN QUERY SELECT total, dog_count, cat_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update reserve_qr_code to accept and filter by tag_type
CREATE OR REPLACE FUNCTION reserve_qr_code(p_tag_type text DEFAULT 'dog')
RETURNS TABLE(qr_id uuid, qr_short_id text, qr_qr_url text, qr_tag_type text) AS $$
DECLARE
  claimed_qr qr_codes%ROWTYPE;
  available_count integer;
BEGIN
  -- Validate tag_type parameter
  IF p_tag_type NOT IN ('dog', 'cat') THEN
    RAISE EXCEPTION 'Invalid tag_type. Must be ''dog'' or ''cat''';
  END IF;

  -- Reserve a QR code of the specified type
  UPDATE qr_codes
  SET 
    assigned_at = now(),
    updated_at = now()
  WHERE id = (
    SELECT id 
    FROM qr_codes 
    WHERE pet_id IS NULL 
      AND tag_type = p_tag_type
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO claimed_qr;

  IF claimed_qr.id IS NOT NULL THEN
    RETURN QUERY SELECT claimed_qr.id, claimed_qr.short_id, claimed_qr.qr_url, claimed_qr.tag_type;
  ELSE
    -- Check if opposite type is available
    SELECT COUNT(*) INTO available_count
    FROM qr_codes
    WHERE pet_id IS NULL 
      AND tag_type != p_tag_type;
    
    IF available_count > 0 THEN
      RAISE EXCEPTION 'No available % QR codes in pool. However, % codes of the opposite type are available. Consider generating more % tags.', 
        p_tag_type, available_count, p_tag_type;
    ELSE
      RAISE EXCEPTION 'No available QR codes in pool for any tag type. Please generate more codes.';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_qr_codes_batch(integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION generate_balanced_qr_pool(integer) TO service_role;
GRANT EXECUTE ON FUNCTION reserve_qr_code(text) TO authenticated;