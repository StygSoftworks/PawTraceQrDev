/*
  # Allow Shared Users to Toggle Missing Status and Add Location Reports

  ## Overview
  This migration enables view-only shared users to mark pets as missing/found
  and add location sighting reports when a pet is marked missing. This supports
  collaborative pet recovery efforts.

  ## 1. New Functions

  ### toggle_pet_missing(p_pet_id, p_is_missing)
  - Allows any user with an accepted share (owner or shared) to toggle missing status
  - Only updates `missing` and `missing_since` columns for security
  - Uses SECURITY DEFINER to safely bypass RLS restrictions
  - Returns success/failure boolean

  ## 2. New Policies

  ### Location Shares INSERT for Shared Users
  - Allows shared users to add location reports for shared pets
  - Only when the pet is marked as missing
  - Complements existing anonymous finder reporting

  ## 3. Security
  - Function validates user has accepted share before allowing update
  - Only missing status fields can be modified (no other pet data)
  - Location reports require pet to be missing to prevent misuse
*/

-- Function to toggle pet missing status for any user with accepted share access
CREATE OR REPLACE FUNCTION toggle_pet_missing(p_pet_id uuid, p_is_missing boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_access boolean;
BEGIN
  -- Check if user is owner or has any accepted share (regardless of can_edit)
  SELECT EXISTS (
    SELECT 1 FROM pets WHERE id = p_pet_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM pet_shares 
    WHERE pet_id = p_pet_id 
      AND shared_with_id = auth.uid() 
      AND status = 'accepted'
  ) INTO v_has_access;
  
  IF NOT v_has_access THEN
    RAISE EXCEPTION 'Not authorized to update this pet';
  END IF;
  
  -- Only update missing status fields
  UPDATE pets 
  SET 
    missing = p_is_missing,
    missing_since = CASE WHEN p_is_missing THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = p_pet_id;
  
  RETURN true;
END;
$$;

-- Allow shared users to add location reports for shared pets when missing
CREATE POLICY "Shared users can add location reports for missing shared pets"
  ON location_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pet_shares
      JOIN pets ON pets.id = pet_shares.pet_id
      WHERE pet_shares.pet_id = location_shares.pet_id
        AND pet_shares.shared_with_id = auth.uid()
        AND pet_shares.status = 'accepted'
        AND pets.missing = true
    )
  );
