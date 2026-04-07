/*
  # Add Tag Ownership, One-Time Purchase Model, and Tag Assignment

  ## Overview
  Transforms the billing model from recurring subscriptions to one-time $15 tag purchases.
  Adds tag ownership tracking and the ability for existing users to assign scanned tags
  to their existing pets.

  ## New Columns on qr_codes
  - `purchased_by` (uuid) - User who owns this tag (via purchase or physical claim)
  - `purchased_at` (timestamptz) - When the tag was acquired
  - `purchase_price` (numeric) - Price paid (0 for physical claims, 15 for digital)
  - `paypal_order_id` (text) - PayPal order ID for digital purchases

  ## New Columns on pets
  - `tag_status` (text) - Replaces subscription_status: 'active', 'inactive', 'pending_payment'

  ## New Functions
  - `assign_tag_to_existing_pet(p_short_id, p_pet_id)` - Assigns a scanned tag to an existing pet
  - `get_user_unassigned_tags(p_user_id)` - Lists tags a user owns but hasn't assigned
  - `get_user_tags_summary(p_user_id)` - Full tag inventory for a user

  ## Updated View
  - `public_pets` view updated to include tag_status

  ## Security
  - All functions use SECURITY DEFINER with auth.uid() checks
  - Granted to authenticated role only (except where noted)
*/

-- 1. Add ownership columns to qr_codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'purchased_by'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN purchased_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'purchased_at'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN purchased_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'purchase_price'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN purchase_price numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'paypal_order_id'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN paypal_order_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_qr_codes_purchased_by ON qr_codes(purchased_by) WHERE purchased_by IS NOT NULL;

-- 2. Add tag_status column to pets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'tag_status'
  ) THEN
    ALTER TABLE pets ADD COLUMN tag_status text DEFAULT 'active'
      CHECK (tag_status IN ('active', 'inactive', 'pending_payment'));
  END IF;
END $$;

-- Set tag_status based on existing subscription_status for backward compat
UPDATE pets
SET tag_status = CASE
  WHEN subscription_status = 'active' THEN 'active'
  WHEN subscription_status = 'pending' THEN 'pending_payment'
  ELSE 'inactive'
END
WHERE tag_status IS NULL;

-- 3. Update claim_specific_qr_code to also set purchased_by
CREATE OR REPLACE FUNCTION claim_specific_qr_code(p_short_id text)
RETURNS TABLE(qr_id uuid, qr_short_id text, qr_qr_url text, qr_tag_type text) AS $$
DECLARE
  claimed_qr qr_codes%ROWTYPE;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  UPDATE qr_codes
  SET
    assigned_at = now(),
    updated_at = now(),
    purchased_by = COALESCE(purchased_by, v_user_id),
    purchased_at = COALESCE(purchased_at, now()),
    purchase_price = COALESCE(purchase_price, 0)
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

-- 4. Create assign_tag_to_existing_pet function
CREATE OR REPLACE FUNCTION assign_tag_to_existing_pet(p_short_id text, p_pet_id uuid)
RETURNS TABLE(
  success boolean,
  new_short_id text,
  old_short_id text,
  pet_name text
) AS $$
DECLARE
  v_user_id uuid;
  v_pet_owner_id uuid;
  v_pet_name text;
  v_new_qr_id uuid;
  v_new_qr_url text;
  v_new_tag_type text;
  v_old_qr_id uuid;
  v_old_short_id text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.owner_id, p.name, p.qr_code_id, p.short_id
  INTO v_pet_owner_id, v_pet_name, v_old_qr_id, v_old_short_id
  FROM pets p
  WHERE p.id = p_pet_id;

  IF v_pet_owner_id IS NULL THEN
    RAISE EXCEPTION 'Pet not found';
  END IF;

  IF v_pet_owner_id != v_user_id THEN
    RAISE EXCEPTION 'You do not own this pet';
  END IF;

  SELECT qc.id, qc.qr_url, qc.tag_type
  INTO v_new_qr_id, v_new_qr_url, v_new_tag_type
  FROM qr_codes qc
  WHERE qc.short_id = p_short_id
    AND qc.pet_id IS NULL
  FOR UPDATE SKIP LOCKED;

  IF v_new_qr_id IS NULL THEN
    RAISE EXCEPTION 'Tag % is not available. It may already be assigned.', p_short_id;
  END IF;

  IF v_old_qr_id IS NOT NULL THEN
    UPDATE qr_codes
    SET pet_id = NULL, assigned_at = NULL, updated_at = now()
    WHERE id = v_old_qr_id;
  END IF;

  UPDATE qr_codes
  SET
    pet_id = p_pet_id,
    assigned_at = now(),
    updated_at = now(),
    purchased_by = COALESCE(purchased_by, v_user_id),
    purchased_at = COALESCE(purchased_at, now()),
    purchase_price = COALESCE(purchase_price, 0)
  WHERE id = v_new_qr_id;

  UPDATE pets
  SET
    qr_code_id = v_new_qr_id,
    short_id = p_short_id,
    qr_url = v_new_qr_url,
    tag_status = 'active',
    subscription_status = 'active',
    updated_at = now()
  WHERE id = p_pet_id;

  RETURN QUERY SELECT
    true,
    p_short_id,
    v_old_short_id,
    v_pet_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assign_tag_to_existing_pet(text, uuid) TO authenticated;

-- 5. Create get_user_unassigned_tags function
CREATE OR REPLACE FUNCTION get_user_unassigned_tags(p_user_id uuid)
RETURNS TABLE(
  qr_id uuid,
  short_id text,
  qr_url text,
  tag_type text,
  purchased_at timestamptz,
  purchase_price numeric
) AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    qc.id,
    qc.short_id,
    qc.qr_url,
    qc.tag_type::text,
    qc.purchased_at,
    qc.purchase_price
  FROM qr_codes qc
  WHERE qc.purchased_by = p_user_id
    AND qc.pet_id IS NULL
  ORDER BY qc.purchased_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_unassigned_tags(uuid) TO authenticated;

-- 6. Create get_user_tags_summary function
CREATE OR REPLACE FUNCTION get_user_tags_summary(p_user_id uuid)
RETURNS TABLE(
  qr_id uuid,
  short_id text,
  tag_type text,
  is_assigned boolean,
  assigned_pet_name text,
  assigned_pet_id uuid,
  purchased_at timestamptz,
  purchase_price numeric
) AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    qc.id,
    qc.short_id,
    qc.tag_type::text,
    (qc.pet_id IS NOT NULL) as is_assigned,
    p.name as assigned_pet_name,
    p.id as assigned_pet_id,
    qc.purchased_at,
    qc.purchase_price
  FROM qr_codes qc
  LEFT JOIN pets p ON qc.pet_id = p.id
  WHERE qc.purchased_by = p_user_id
  ORDER BY qc.purchased_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_tags_summary(uuid) TO authenticated;

-- 7. Update public_pets view to include tag_status
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
  p.notes,
  p.vaccinations,
  p.photo_url,
  p.qr_url,
  p.missing,
  p.missing_since,
  p.created_at,
  p.environment,
  p.tag_status,
  p.subscription_status,
  p.owner_id,
  qr.tag_type,
  prof.email as owner_email,
  prof.display_name as owner_name,
  prof.phone as owner_phone,
  CASE WHEN COALESCE(prof.share_social_links, false) THEN prof.instagram ELSE NULL END as owner_instagram,
  CASE WHEN COALESCE(prof.share_social_links, false) THEN prof.facebook ELSE NULL END as owner_facebook,
  CASE WHEN COALESCE(prof.share_social_links, false) THEN prof.twitter ELSE NULL END as owner_twitter,
  CASE WHEN COALESCE(prof.share_social_links, false) THEN prof.telegram ELSE NULL END as owner_telegram,
  CASE WHEN COALESCE(prof.share_social_links, false) THEN prof.whatsapp ELSE NULL END as owner_whatsapp,
  prof.website as owner_website
FROM pets p
LEFT JOIN profiles prof ON p.owner_id = prof.id
LEFT JOIN qr_codes qr ON p.qr_code_id = qr.id;

GRANT SELECT ON public_pets TO anon, authenticated;

-- 8. Safety-net trigger for new pets
CREATE OR REPLACE FUNCTION set_pet_tag_status_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tag_status IS NULL THEN
    NEW.tag_status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_pet_tag_status ON pets;
CREATE TRIGGER trigger_set_pet_tag_status
  BEFORE INSERT ON pets
  FOR EACH ROW
  EXECUTE FUNCTION set_pet_tag_status_on_insert();
