/*
  # Fix Admin Pets Function to Include Tag Type

  ## Overview
  Fixes the get_all_pets_admin() function to properly retrieve tag_type from the qr_codes table.
  The pets table doesn't have a tag_type column - it exists in qr_codes and needs to be joined.

  ## Changes Made

  ### 1. Function Update
  - Adds LEFT JOIN to qr_codes table using qr_code_id
  - Changes pets.tag_type reference to qr.tag_type
  - Maintains all existing functionality and security checks

  ## Important Notes
  - No schema changes - only function update
  - Matches the pattern used in public_pets view
  - Maintains SECURITY DEFINER and role checks
*/

-- Drop and recreate the function with the correct join
DROP FUNCTION IF EXISTS get_all_pets_admin();

CREATE OR REPLACE FUNCTION get_all_pets_admin()
RETURNS TABLE (
  pet_id uuid,
  pet_name text,
  species text,
  breed text,
  color text,
  weight numeric,
  birthdate date,
  microchip_id text,
  description text,
  notes text,
  vaccinations jsonb,
  photo_url text,
  created_at timestamptz,
  updated_at timestamptz,
  missing boolean,
  missing_since timestamptz,
  qr_url text,
  short_id text,
  tag_type text,
  environment text,
  paypal_subscription_id text,
  subscription_status text,
  subscription_activated_at timestamptz,
  subscription_expires_at timestamptz,
  subscription_plan_id text,
  owner_id uuid,
  owner_email text,
  owner_name text,
  owner_role text
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

  -- Only admins and owners can view all pets
  IF user_role NOT IN ('admin', 'owner') THEN
    RETURN;
  END IF;

  -- Return all pets with owner information
  RETURN QUERY
  SELECT
    pets.id as pet_id,
    pets.name as pet_name,
    pets.species::text,
    pets.breed,
    pets.color,
    pets.weight,
    pets.birthdate,
    pets.microchip_id,
    pets.description,
    pets.notes,
    pets.vaccinations,
    pets.photo_url,
    pets.created_at,
    pets.updated_at,
    pets.missing,
    pets.missing_since,
    pets.qr_url,
    pets.short_id,
    qr.tag_type::text,
    pets.environment::text,
    pets.paypal_subscription_id,
    pets.subscription_status::text,
    pets.subscription_activated_at,
    pets.subscription_expires_at,
    pets.subscription_plan_id,
    pets.owner_id,
    profiles.email as owner_email,
    profiles.name as owner_name,
    profiles.role as owner_role
  FROM pets
  LEFT JOIN profiles ON pets.owner_id = profiles.id
  LEFT JOIN qr_codes qr ON pets.qr_code_id = qr.id
  ORDER BY pets.created_at DESC;
END;
$$;