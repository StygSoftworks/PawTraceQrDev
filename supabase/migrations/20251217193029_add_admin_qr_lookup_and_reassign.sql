/*
  # Admin QR Code Lookup and Reassignment Functions

  ## Overview
  Adds two admin-only functions for QR code management:
  1. Lookup a QR code by short_id to see which pet it belongs to
  2. Reassign a QR code from one pet to another

  ## New Functions

  ### 1. admin_lookup_qr_code(p_short_id text)
  - Returns QR code details and associated pet/owner information
  - Returns empty row if short_id does not exist
  - Admin/owner role required

  ### 2. admin_reassign_pet_qr(p_pet_id uuid, p_new_short_id text, p_new_tag_type text)
  - Reassigns a pet to a different QR code
  - Original owner of target QR code loses their QR (left without code)
  - Source pet's old QR code is released back to pool
  - Returns confirmation of the reassignment
  - Admin/owner role required

  ## Security
  - Both functions are SECURITY DEFINER with admin role check
  - Only admin and owner roles can execute these functions
*/

-- Function to lookup a QR code by short_id
CREATE OR REPLACE FUNCTION admin_lookup_qr_code(p_short_id text)
RETURNS TABLE (
  qr_id uuid,
  short_id text,
  tag_type text,
  qr_url text,
  assigned_at timestamptz,
  created_at timestamptz,
  pet_id uuid,
  pet_name text,
  species text,
  photo_url text,
  owner_id uuid,
  owner_email text,
  owner_name text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  requesting_user_id uuid;
  user_role text;
BEGIN
  -- Get the requesting user's ID
  requesting_user_id := auth.uid();

  -- If no user is authenticated, return empty
  IF requesting_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get the user's role
  SELECT p.role INTO user_role
  FROM profiles p
  WHERE p.id = requesting_user_id;

  -- Only admins and owners can use this function
  IF user_role NOT IN ('admin', 'owner') THEN
    RETURN;
  END IF;

  -- Return QR code with pet and owner information if assigned
  RETURN QUERY
  SELECT
    qr.id as qr_id,
    qr.short_id,
    qr.tag_type,
    qr.qr_url,
    qr.assigned_at,
    qr.created_at,
    pets.id as pet_id,
    pets.name as pet_name,
    pets.species::text,
    pets.photo_url,
    pets.owner_id,
    profiles.email as owner_email,
    profiles.display_name as owner_name
  FROM qr_codes qr
  LEFT JOIN pets ON qr.pet_id = pets.id
  LEFT JOIN profiles ON pets.owner_id = profiles.id
  WHERE qr.short_id = p_short_id;
END;
$$;

-- Function to reassign a pet to a different QR code
CREATE OR REPLACE FUNCTION admin_reassign_pet_qr(
  p_pet_id uuid,
  p_new_short_id text,
  p_new_tag_type text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  message text,
  pet_id uuid,
  pet_name text,
  new_short_id text,
  new_tag_type text,
  old_short_id text,
  displaced_pet_id uuid,
  displaced_pet_name text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  requesting_user_id uuid;
  user_role text;
  v_target_qr_id uuid;
  v_target_qr_tag_type text;
  v_target_pet_id uuid;
  v_target_pet_name text;
  v_source_pet_name text;
  v_source_old_short_id text;
  v_source_old_qr_id uuid;
  v_final_tag_type text;
BEGIN
  -- Get the requesting user's ID
  requesting_user_id := auth.uid();

  -- If no user is authenticated, fail
  IF requesting_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::text, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  -- Get the user's role
  SELECT p.role INTO user_role
  FROM profiles p
  WHERE p.id = requesting_user_id;

  -- Only admins and owners can use this function
  IF user_role NOT IN ('admin', 'owner') THEN
    RETURN QUERY SELECT false, 'Permission denied. Admin or owner role required.'::text, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  -- Verify the target QR code exists
  SELECT qr.id, qr.pet_id, qr.tag_type
  INTO v_target_qr_id, v_target_pet_id, v_target_qr_tag_type
  FROM qr_codes qr
  WHERE qr.short_id = p_new_short_id;

  IF v_target_qr_id IS NULL THEN
    RETURN QUERY SELECT false, 'QR code with short_id ' || p_new_short_id || ' does not exist.'::text, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  -- Get source pet info
  SELECT pets.name, pets.short_id, pets.qr_code_id
  INTO v_source_pet_name, v_source_old_short_id, v_source_old_qr_id
  FROM pets
  WHERE pets.id = p_pet_id;

  IF v_source_pet_name IS NULL THEN
    RETURN QUERY SELECT false, 'Pet with id ' || p_pet_id || ' does not exist.'::text, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  -- Get displaced pet name if target QR is assigned
  IF v_target_pet_id IS NOT NULL THEN
    SELECT pets.name INTO v_target_pet_name FROM pets WHERE pets.id = v_target_pet_id;
  END IF;

  -- Determine final tag type
  v_final_tag_type := COALESCE(p_new_tag_type, v_target_qr_tag_type);

  -- Validate tag type
  IF v_final_tag_type NOT IN ('dog', 'cat') THEN
    RETURN QUERY SELECT false, 'Invalid tag_type. Must be ''dog'' or ''cat''.'::text, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  -- Start the reassignment process

  -- Step 1: If target QR is assigned to another pet, unlink that pet (leave without QR)
  IF v_target_pet_id IS NOT NULL AND v_target_pet_id != p_pet_id THEN
    -- Clear the pet's QR code reference
    UPDATE pets
    SET qr_code_id = NULL, short_id = NULL, qr_url = NULL, updated_at = now()
    WHERE id = v_target_pet_id;
  END IF;

  -- Step 2: Release source pet's old QR code back to pool (if it had one)
  IF v_source_old_qr_id IS NOT NULL AND v_source_old_qr_id != v_target_qr_id THEN
    UPDATE qr_codes
    SET pet_id = NULL, assigned_at = NULL, updated_at = now()
    WHERE id = v_source_old_qr_id;
  END IF;

  -- Step 3: Assign target QR to source pet
  UPDATE qr_codes
  SET 
    pet_id = p_pet_id,
    assigned_at = now(),
    tag_type = v_final_tag_type,
    updated_at = now()
  WHERE id = v_target_qr_id;

  -- Step 4: Update source pet with new QR reference
  UPDATE pets
  SET 
    qr_code_id = v_target_qr_id,
    short_id = p_new_short_id,
    qr_url = (SELECT qr_url FROM qr_codes WHERE id = v_target_qr_id),
    updated_at = now()
  WHERE id = p_pet_id;

  -- Return success
  RETURN QUERY SELECT 
    true,
    'Successfully reassigned QR code.'::text,
    p_pet_id,
    v_source_pet_name,
    p_new_short_id,
    v_final_tag_type,
    v_source_old_short_id,
    v_target_pet_id,
    v_target_pet_name;
END;
$$;

-- Grant execute permissions to authenticated users (functions check role internally)
GRANT EXECUTE ON FUNCTION admin_lookup_qr_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reassign_pet_qr(uuid, text, text) TO authenticated;
