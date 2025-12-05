/*
  # Fix Admin QR Export Function Parameter Order

  ## Overview
  PostgREST requires function parameters to be in alphabetical order for proper matching.
  This migration recreates the functions with parameters in alphabetical order.

  ## Changes
  - Drop and recreate get_available_qr_codes with parameters in alphabetical order:
    - p_limit (was 2nd, now 1st alphabetically)
    - p_offset (was 3rd, now 2nd alphabetically)  
    - p_tag_type (was 1st, now 3rd alphabetically)
  
  - Drop and recreate get_qr_code_by_shortid (no parameter order change needed)

  ## Security
  - Maintains same SECURITY DEFINER and access controls
  - Admin role checks remain in place
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS get_available_qr_codes(text, integer, integer);
DROP FUNCTION IF EXISTS get_qr_code_by_shortid(text);

-- Recreate get_available_qr_codes with alphabetically ordered parameters
CREATE OR REPLACE FUNCTION get_available_qr_codes(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_tag_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  short_id text,
  tag_type text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT check_user_is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  IF p_limit > 1000 THEN
    p_limit := 1000;
  END IF;

  RETURN QUERY
  SELECT 
    qr.id,
    qr.short_id,
    qr.tag_type,
    qr.created_at
  FROM qr_codes qr
  WHERE qr.pet_id IS NULL
    AND (p_tag_type IS NULL OR qr.tag_type = p_tag_type)
  ORDER BY qr.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_available_qr_codes(integer, integer, text) TO authenticated;

-- Recreate get_qr_code_by_shortid
CREATE OR REPLACE FUNCTION get_qr_code_by_shortid(
  p_short_id text
)
RETURNS TABLE (
  id uuid,
  short_id text,
  tag_type text,
  created_at timestamptz,
  is_assigned boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT check_user_is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    qr.id,
    qr.short_id,
    qr.tag_type,
    qr.created_at,
    (qr.pet_id IS NOT NULL) as is_assigned
  FROM qr_codes qr
  WHERE qr.short_id = p_short_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_qr_code_by_shortid(text) TO authenticated;
