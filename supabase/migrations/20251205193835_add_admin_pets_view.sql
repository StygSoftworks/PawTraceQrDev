/*
  # Add Admin Pets View and Functions

  ## Overview
  This migration creates a function for admins to view all pets across all users
  with owner information for administrative purposes.

  ## New Functions

  ### `get_all_pets_admin()`
  Returns all pets with owner information for admin/owner roles only.
  - Checks user role before returning data
  - Includes owner email and name
  - Returns comprehensive pet information including subscription status

  ## Security
  - Function checks that the requesting user has 'admin' or 'owner' role
  - Returns empty result set if user is not authorized
  - Uses SECURITY DEFINER to access profiles table
*/

-- Create function to get all pets with owner info (admin only)
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
    pets.tag_type::text,
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
  ORDER BY pets.created_at DESC;
END;
$$;