/*
  # Fix get_all_pets_admin function

  ## Problems Fixed

  1. Owner email showing as "Unknown"
     - profiles.email was not being populated for most users
     - Fix: Join against auth.users to get the authoritative email

  2. Status showing as "inactive"
     - The function was not returning tag_status column
     - The UI uses tag_status first, falling back to subscription_status
     - Fix: Add tag_status to the SELECT and return columns

  3. tag_type was pulled from pets.tag_type (non-existent) instead of qr_codes
     - Fix: Ensure qr_codes join is present and tag_type comes from qr_codes
*/

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
  tag_status text,
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
  requesting_user_id := auth.uid();

  IF requesting_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT p.role INTO user_role
  FROM profiles p
  WHERE p.id = requesting_user_id;

  IF user_role NOT IN ('admin', 'owner') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    pets.id AS pet_id,
    pets.name AS pet_name,
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
    pets.tag_status::text,
    pets.owner_id,
    COALESCE(profiles.email, au.email) AS owner_email,
    profiles.display_name AS owner_name,
    profiles.role AS owner_role
  FROM pets
  LEFT JOIN profiles ON pets.owner_id = profiles.id
  LEFT JOIN auth.users au ON pets.owner_id = au.id
  LEFT JOIN qr_codes qr ON pets.qr_code_id = qr.id
  ORDER BY pets.created_at DESC;
END;
$$;
