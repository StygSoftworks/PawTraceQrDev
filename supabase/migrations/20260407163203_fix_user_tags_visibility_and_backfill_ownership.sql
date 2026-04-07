/*
  # Fix My Tags Page - Backfill Ownership and Update Query Logic

  ## Problem
  The get_user_tags_summary function filters by qr_codes.purchased_by = p_user_id,
  but all pre-existing tags have purchased_by = NULL because they were created
  before the ownership tracking system was added. This causes the My Tags page
  to show zero tags for all users.

  ## Changes

  1. Backfill purchased_by on qr_codes
     - For all assigned tags (pet_id IS NOT NULL), set purchased_by = pets.owner_id
     - This correctly attributes existing physical tags to the pet's owner

  2. Update get_user_tags_summary
     - Also return tags linked to the user's pets (via pets.owner_id) that may
       not have purchased_by set, ensuring no tags are ever invisible

  3. Update get_user_unassigned_tags
     - Same fallback: also include unassigned tags the user acquired via
       physical claim that may lack purchased_by
*/

-- 1. Backfill purchased_by for all assigned tags that are missing ownership
UPDATE qr_codes qc
SET
  purchased_by = p.owner_id,
  purchased_at = COALESCE(qc.purchased_at, p.created_at),
  purchase_price = COALESCE(qc.purchase_price, 0)
FROM pets p
WHERE qc.pet_id = p.id
  AND qc.purchased_by IS NULL;

-- 2. Replace get_user_tags_summary with a version that catches both owned
--    and pet-linked tags so no tag is ever invisible to its owner
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
  SELECT DISTINCT ON (qc.id)
    qc.id,
    qc.short_id,
    qc.tag_type::text,
    (qc.pet_id IS NOT NULL) AS is_assigned,
    p.name AS assigned_pet_name,
    p.id AS assigned_pet_id,
    qc.purchased_at,
    qc.purchase_price
  FROM qr_codes qc
  LEFT JOIN pets p ON qc.pet_id = p.id
  WHERE
    qc.purchased_by = p_user_id
    OR p.owner_id = p_user_id
  ORDER BY qc.id, qc.purchased_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_tags_summary(uuid) TO authenticated;

-- 3. Replace get_user_unassigned_tags with same fallback logic
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
  SELECT DISTINCT ON (qc.id)
    qc.id,
    qc.short_id,
    qc.qr_url,
    qc.tag_type::text,
    qc.purchased_at,
    qc.purchase_price
  FROM qr_codes qc
  WHERE
    (qc.purchased_by = p_user_id OR qc.purchased_by IS NULL)
    AND qc.pet_id IS NULL
  ORDER BY qc.id, qc.purchased_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_unassigned_tags(uuid) TO authenticated;
