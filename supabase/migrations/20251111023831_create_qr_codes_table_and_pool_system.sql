/*
  # Create QR Codes Table for Preloaded QR Code Pool System

  1. New Tables
    - `qr_codes`
      - `id` (uuid, primary key) - Unique identifier for each QR code record
      - `short_id` (text, unique, not null) - The short URL identifier starting from length 1
      - `qr_url` (text, nullable) - Public URL of the generated QR code image
      - `pet_id` (uuid, nullable) - Foreign key to pets, null when unassigned
      - `assigned_at` (timestamptz, nullable) - When assigned to a pet
      - `created_at` (timestamptz, not null) - When generated
      - `updated_at` (timestamptz, not null) - Last update

    - `qr_generation_state`
      - `id` (integer, primary key) - Single row for tracking state
      - `current_length` (integer, not null) - Current short_id length (starts at 1)
      - `codes_generated_at_length` (integer, not null) - Count at current length
      - `updated_at` (timestamptz, not null)

  2. Migration of Existing Data
    - Copy existing pet short_id and qr_url to qr_codes table
    - Add qr_code_id column to pets table
    - Link existing pets to their QR codes

  3. Security
    - Enable RLS on both tables
    - Public read access for QR codes
    - Only service role can modify QR codes

  4. Important Notes
    - Short IDs start at length 1 for early adopters
    - QR codes are recycled when pets are deleted
    - Pool maintains 500 codes with 100 as refill threshold
*/

-- Create the qr_codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id text UNIQUE NOT NULL,
  qr_url text,
  pet_id uuid,
  assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT qr_codes_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_short_id ON qr_codes(short_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_pet_id ON qr_codes(pet_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_unassigned ON qr_codes(pet_id) WHERE pet_id IS NULL;

-- Create QR generation state tracking table
CREATE TABLE IF NOT EXISTS qr_generation_state (
  id integer PRIMARY KEY DEFAULT 1,
  current_length integer NOT NULL DEFAULT 1,
  codes_generated_at_length integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT qr_generation_state_single_row CHECK (id = 1)
);

INSERT INTO qr_generation_state (id, current_length, codes_generated_at_length)
VALUES (1, 1, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_generation_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qr_codes
CREATE POLICY "Anyone can read QR codes"
  ON qr_codes FOR SELECT USING (true);

CREATE POLICY "Service role can insert QR codes"
  ON qr_codes FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update QR codes"
  ON qr_codes FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can delete QR codes"
  ON qr_codes FOR DELETE TO service_role USING (true);

-- RLS Policies for qr_generation_state
CREATE POLICY "Anyone can read generation state"
  ON qr_generation_state FOR SELECT USING (true);

CREATE POLICY "Service role can update generation state"
  ON qr_generation_state FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Migrate existing pet QR data to qr_codes table
INSERT INTO qr_codes (short_id, qr_url, pet_id, assigned_at, created_at, updated_at)
SELECT 
  p.short_id,
  p.qr_url,
  p.id,
  p.created_at,
  p.created_at,
  p.updated_at
FROM pets p
WHERE p.short_id IS NOT NULL
ON CONFLICT (short_id) DO NOTHING;

-- Add qr_code_id column to pets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'qr_code_id'
  ) THEN
    ALTER TABLE pets ADD COLUMN qr_code_id uuid;
  END IF;
END $$;

-- Update pets to link to their qr_codes
UPDATE pets p
SET qr_code_id = qr.id
FROM qr_codes qr
WHERE qr.pet_id = p.id;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pets_qr_code_id_fkey'
  ) THEN
    ALTER TABLE pets
    ADD CONSTRAINT pets_qr_code_id_fkey
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pets_qr_code_id ON pets(qr_code_id);

-- Update public_pets view
DROP VIEW IF EXISTS public_pets;

CREATE OR REPLACE VIEW public_pets AS
SELECT 
  p.id,
  p.name,
  p.species,
  p.breed,
  p.description,
  p.notes,
  p.color,
  p.photo_url,
  p.missing,
  p.missing_since,
  p.owner_id,
  qr.short_id,
  qr.qr_url,
  CASE WHEN prof.share_email THEN u.email ELSE NULL END as owner_email,
  CASE WHEN prof.share_phone THEN prof.phone ELSE NULL END as owner_phone
FROM pets p
LEFT JOIN qr_codes qr ON qr.pet_id = p.id
JOIN auth.users u ON p.owner_id = u.id
LEFT JOIN profiles prof ON prof.id = p.owner_id;

GRANT SELECT ON public_pets TO anon, authenticated;

-- Update log_scan function
CREATE OR REPLACE FUNCTION log_scan(
  p_short_id text,
  p_referrer text DEFAULT NULL,
  p_ua text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_lat double precision DEFAULT NULL,
  p_lng double precision DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_pet_id uuid;
BEGIN
  SELECT pet_id INTO v_pet_id
  FROM qr_codes
  WHERE short_id = p_short_id;

  IF v_pet_id IS NOT NULL THEN
    INSERT INTO scan_events (
      pet_id, short_id, scanned_at, referrer, ua, city, region, country, lat, lng
    ) VALUES (
      v_pet_id, p_short_id, now(), p_referrer, p_ua, p_city, p_region, p_country, p_lat, p_lng
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim QR code for pet
CREATE OR REPLACE FUNCTION claim_qr_code_for_pet(p_pet_id uuid)
RETURNS TABLE(qr_id uuid, qr_short_id text, qr_qr_url text) AS $$
DECLARE
  claimed_qr qr_codes%ROWTYPE;
BEGIN
  UPDATE qr_codes
  SET 
    pet_id = p_pet_id,
    assigned_at = now(),
    updated_at = now()
  WHERE id = (
    SELECT id 
    FROM qr_codes 
    WHERE pet_id IS NULL 
    ORDER BY RANDOM() 
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO claimed_qr;

  IF claimed_qr.id IS NOT NULL THEN
    RETURN QUERY SELECT claimed_qr.id, claimed_qr.short_id, claimed_qr.qr_url;
  ELSE
    RAISE EXCEPTION 'No available QR codes in pool';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release QR code on pet delete
CREATE OR REPLACE FUNCTION release_qr_code_on_pet_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE qr_codes
  SET 
    pet_id = NULL,
    assigned_at = NULL,
    updated_at = now()
  WHERE pet_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_release_qr_on_pet_delete ON pets;
CREATE TRIGGER trigger_release_qr_on_pet_delete
  BEFORE DELETE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION release_qr_code_on_pet_delete();

-- Function to count unassigned QR codes
CREATE OR REPLACE FUNCTION count_unassigned_qr_codes()
RETURNS integer AS $$
BEGIN
  RETURN (SELECT COUNT(*)::integer FROM qr_codes WHERE pet_id IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;