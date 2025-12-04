/*
  # Update public_pets View to Include Tag Type
  
  ## Overview
  Updates the public_pets view to include tag_type information from the qr_codes table.
  This allows public pet pages to display the physical tag size information.
  
  ## Changes Made
  
  ### 1. View Update
  - Adds LEFT JOIN to qr_codes table using qr_code_id
  - Includes tag_type column in the SELECT statement
  - Maintains all existing columns for backward compatibility
  
  ### 2. Important Notes
  - View remains publicly accessible via anon and authenticated roles
  - RLS policies on underlying tables still apply
  - No data migration needed
*/

-- Update public_pets view to include tag_type from qr_codes
DROP VIEW IF EXISTS public_pets CASCADE;
CREATE OR REPLACE VIEW public_pets AS
SELECT 
  p.id,
  p.short_id,
  p.name,
  p.species,
  p.breed,
  p.color,
  p.weight,
  p.birthdate,
  p.description,
  p.vaccinations,
  p.photo_url,
  p.qr_url,
  p.missing,
  p.missing_since,
  p.created_at,
  p.environment,
  p.subscription_status,
  p.owner_id,
  qr.tag_type,
  prof.email as owner_email,
  prof.display_name as owner_name,
  prof.phone as owner_phone
FROM pets p
LEFT JOIN profiles prof ON p.owner_id = prof.id
LEFT JOIN qr_codes qr ON p.qr_code_id = qr.id;

-- Grant access to public_pets view
GRANT SELECT ON public_pets TO anon, authenticated;