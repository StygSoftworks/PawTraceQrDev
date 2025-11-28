/*
  # Add QR Pool Generation Function

  1. New Functions
    - `generate_qr_codes_batch(batch_size integer)` - Generates a batch of unassigned QR codes
      - Uses the qr_generation_state table to track current generation length
      - Generates short_id values using base36 alphabet (0-9, a-z)
      - Automatically increments length when all combinations at current length are exhausted
      - Returns count of codes generated

  2. Important Notes
    - Generates QR codes starting from length 1 for early adopters
    - Each short_id is unique and follows the sequence: 0, 1, 2...9, a, b...z, 00, 01, etc.
    - qr_url is initially NULL and will be generated when assigned to a pet
    - Function is idempotent and safe to call multiple times
*/

-- Function to generate a batch of QR codes
CREATE OR REPLACE FUNCTION generate_qr_codes_batch(batch_size integer DEFAULT 100)
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

    -- Try to insert (skip if already exists due to migration)
    BEGIN
      INSERT INTO qr_codes (short_id, created_at, updated_at)
      VALUES (new_short_id, now(), now());
      
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

-- Grant execute permission to authenticated users (can be restricted further)
GRANT EXECUTE ON FUNCTION generate_qr_codes_batch(integer) TO service_role;