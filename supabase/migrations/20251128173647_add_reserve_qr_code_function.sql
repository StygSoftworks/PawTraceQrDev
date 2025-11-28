/*
  # Add Reserve QR Code Function for Two-Phase Pet Creation

  1. New Functions
    - `reserve_qr_code()` - Reserves a QR code temporarily for pet creation
      - Claims an unassigned QR code without requiring a pet_id
      - Marks it with a temporary assignment
      - Returns the QR code details for use in pet creation
    
    - `finalize_qr_assignment(qr_id uuid, pet_id uuid)` - Finalizes the QR code assignment
      - Updates the QR code with the actual pet_id after successful pet creation
      - Should be called after the pet is successfully created

  2. Important Notes
    - This enables a two-phase commit for pet creation
    - If pet creation fails, the QR code can be released back to the pool
    - The original claim_qr_code_for_pet function is kept for backward compatibility
*/

-- Function to reserve a QR code (without pet_id yet)
CREATE OR REPLACE FUNCTION reserve_qr_code()
RETURNS TABLE(qr_id uuid, qr_short_id text, qr_qr_url text) AS $$
DECLARE
  claimed_qr qr_codes%ROWTYPE;
BEGIN
  UPDATE qr_codes
  SET 
    assigned_at = now(),
    updated_at = now()
  WHERE id = (
    SELECT id 
    FROM qr_codes 
    WHERE pet_id IS NULL 
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO claimed_qr;

  IF claimed_qr.id IS NOT NULL THEN
    RETURN QUERY SELECT claimed_qr.id, claimed_qr.short_id, claimed_qr.qr_url;
  ELSE
    RAISE EXCEPTION 'No available QR codes in pool';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to finalize QR code assignment with pet_id
CREATE OR REPLACE FUNCTION finalize_qr_assignment(p_qr_id uuid, p_pet_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE qr_codes
  SET 
    pet_id = p_pet_id,
    updated_at = now()
  WHERE id = p_qr_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release a reserved QR code back to pool
CREATE OR REPLACE FUNCTION release_qr_code(p_qr_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE qr_codes
  SET 
    pet_id = NULL,
    assigned_at = NULL,
    updated_at = now()
  WHERE id = p_qr_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION reserve_qr_code() TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_qr_assignment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION release_qr_code(uuid) TO authenticated;