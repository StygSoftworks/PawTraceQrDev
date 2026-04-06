/*
  # Update scan_events and log_scan for better activity tracking

  ## Changes
  1. Add `scanned_by` column to `scan_events`
    - `scanned_by` (uuid, nullable) - references auth.users, tracks which logged-in user scanned the tag
  2. Update `log_scan` function
    - Accept optional `p_scanned_by` parameter for authenticated scanners
    - Store the scanner's user ID when available

  ## Security
  - No changes to existing RLS policies
  - `log_scan` remains SECURITY DEFINER (needed for anonymous scans)

  ## Important Notes
  - Existing scan_events rows will have NULL scanned_by (backfilled as unknown)
  - The scanned_by field is optional since most scanners will be anonymous
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scan_events' AND column_name = 'scanned_by'
  ) THEN
    ALTER TABLE scan_events ADD COLUMN scanned_by uuid REFERENCES auth.users(id) DEFAULT NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION log_scan(
  p_short_id text,
  p_referrer text DEFAULT NULL,
  p_ua text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_lat double precision DEFAULT NULL,
  p_lng double precision DEFAULT NULL,
  p_scanned_by uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_pet_id uuid;
BEGIN
  SELECT pet_id INTO v_pet_id
  FROM qr_codes
  WHERE short_id = p_short_id;

  IF v_pet_id IS NOT NULL THEN
    INSERT INTO scan_events (
      pet_id, short_id, scanned_at, referrer, ua, city, region, country, lat, lng, scanned_by
    ) VALUES (
      v_pet_id, p_short_id, now(), p_referrer, p_ua, p_city, p_region, p_country, p_lat, p_lng, p_scanned_by
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_scan(text, text, text, text, text, text, double precision, double precision, uuid) TO anon, authenticated;
