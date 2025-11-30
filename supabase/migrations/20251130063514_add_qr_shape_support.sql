/*
  # Add QR Shape Support to QR Codes Table

  1. Schema Changes
    - Add `qr_shape` column to `qr_codes` table (values: 'square', 'round')
    - Default to 'square' for backward compatibility
    - Add constraint to ensure only valid shape values

  2. Migration Notes
    - All existing QR codes will default to 'square' shape
    - New QR codes can specify shape preference
    - No data loss - purely additive changes
*/

-- Add qr_shape column to qr_codes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'qr_shape'
  ) THEN
    ALTER TABLE qr_codes 
    ADD COLUMN qr_shape text NOT NULL DEFAULT 'square' 
    CHECK (qr_shape IN ('square', 'round'));
  END IF;
END $$;

-- Create index for efficient filtering by shape
CREATE INDEX IF NOT EXISTS idx_qr_codes_shape ON qr_codes(qr_shape);
