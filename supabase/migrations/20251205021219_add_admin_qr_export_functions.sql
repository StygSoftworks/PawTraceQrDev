/*
  # Add Admin QR Code Export Functions

  ## Overview
  This migration adds database functions to support admin QR code export functionality.
  Admins can query available QR codes for manufacturing and export them as SVG files.

  ## Functions Created

  ### 1. get_available_qr_codes
  Returns unassigned QR codes with filtering options for admin export
  - Parameters:
    - p_tag_type: Filter by 'dog', 'cat', or NULL for all
    - p_limit: Maximum number of codes to return (default 100)
    - p_offset: Pagination offset (default 0)
  - Returns: Table with id, short_id, tag_type, created_at
  - Security: Only accessible to authenticated users with admin or owner role

  ### 2. get_qr_code_by_shortid
  Returns a specific QR code by its short_id
  - Parameters:
    - p_short_id: The short identifier to look up
  - Returns: Single row with id, short_id, tag_type, created_at
  - Security: Only accessible to authenticated users with admin or owner role

  ### 3. check_user_is_admin
  Helper function to verify if current user has admin privileges
  - Returns: Boolean indicating admin status
  - Checks profiles.role for 'admin' or 'owner' values

  ## Security
  - All functions use SECURITY DEFINER to access qr_codes table
  - Role checks ensure only admins can query available codes
  - Authenticated users only (no anonymous access)
*/

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION check_user_is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_role IN ('admin', 'owner');
END;
$$;

GRANT EXECUTE ON FUNCTION check_user_is_admin() TO authenticated;

-- Function to get available QR codes for admin export
CREATE OR REPLACE FUNCTION get_available_qr_codes(
  p_tag_type text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
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

GRANT EXECUTE ON FUNCTION get_available_qr_codes(text, integer, integer) TO authenticated;

-- Function to get a specific QR code by short_id
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
