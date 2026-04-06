/*
  # Add function to claim a specific QR code by short_id

  ## Overview
  Enables the onboarding flow where a user scans a physical tag and creates
  a pet profile linked to that exact tag.

  ## New Functions
  - `claim_specific_qr_code(p_short_id text)` 
    - Looks up a QR code by short_id
    - Validates it exists and is unassigned
    - Marks it as reserved (assigned_at = now())
    - Returns the QR code details for pet creation
  
  - `check_qr_claimable(p_short_id text)`
    - Checks if a given short_id exists in the pool and is unassigned
    - Returns a boolean indicating if the tag is available to claim
    - Used by the public pet page to detect unclaimed tags

  ## Security
  - `check_qr_claimable` is accessible to anonymous users (needed on public scan page)
  - `claim_specific_qr_code` requires authentication (only logged-in users can claim)

  ## Important Notes
  - Uses FOR UPDATE SKIP LOCKED to prevent race conditions
  - Distinct from reserve_qr_code which picks a random code from the pool
  - This function targets a specific physical tag the user has in hand
*/

-- Check if a QR code short_id is claimable (exists and unassigned)
CREATE OR REPLACE FUNCTION check_qr_claimable(p_short_id text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM qr_codes
    WHERE short_id = p_short_id
      AND pet_id IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_qr_claimable(text) TO anon, authenticated;

-- Claim a specific QR code by short_id for pet creation
CREATE OR REPLACE FUNCTION claim_specific_qr_code(p_short_id text)
RETURNS TABLE(qr_id uuid, qr_short_id text, qr_qr_url text, qr_tag_type text) AS $$
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
    WHERE short_id = p_short_id
      AND pet_id IS NULL
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO claimed_qr;

  IF claimed_qr.id IS NOT NULL THEN
    RETURN QUERY SELECT claimed_qr.id, claimed_qr.short_id, claimed_qr.qr_url, claimed_qr.tag_type;
  ELSE
    RAISE EXCEPTION 'QR code % is not available for claiming. It may already be assigned to a pet.', p_short_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION claim_specific_qr_code(text) TO authenticated;
