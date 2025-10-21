/*
  # Create location_shares table for privacy-first GPS sharing

  1. New Tables
    - `location_shares`
      - `id` (uuid, primary key) - Unique identifier for the location share
      - `pet_id` (uuid, foreign key) - References the pet that was scanned
      - `owner_id` (uuid, foreign key) - References the pet owner
      - `latitude` (numeric) - GPS latitude coordinate
      - `longitude` (numeric) - GPS longitude coordinate
      - `accuracy` (numeric, nullable) - Location accuracy in meters
      - `finder_note` (text, nullable) - Optional message from the finder
      - `finder_contact` (text, nullable) - Optional contact info from finder
      - `shared_at` (timestamptz) - When the location was shared
      - `viewed_at` (timestamptz, nullable) - When the owner viewed the location
      - `archived_at` (timestamptz, nullable) - When the share was archived
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `location_shares` table
    - Policy for pet owners to view their own pet's location shares
    - Policy for pet owners to update (archive) their own location shares
    - Policy for anonymous users to insert location shares for any pet
    - Policy for pet owners to mark location shares as viewed

  3. Important Notes
    - Anonymous insert allows finders to share location without authentication
    - Owners can only see location shares for their own pets
    - Location shares include accuracy data for transparency
    - Owners can archive location shares to keep their dashboard clean
*/

CREATE TABLE IF NOT EXISTS location_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  accuracy numeric,
  finder_note text,
  finder_contact text,
  shared_at timestamptz DEFAULT now() NOT NULL,
  viewed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE location_shares ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a location share (for finders who scan QR codes)
CREATE POLICY "Anyone can share pet location"
  ON location_shares
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow pet owners to view location shares for their pets
CREATE POLICY "Pet owners can view their pet location shares"
  ON location_shares
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
  );

-- Allow pet owners to update (archive/mark viewed) their location shares
CREATE POLICY "Pet owners can update their pet location shares"
  ON location_shares
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_location_shares_pet_id ON location_shares(pet_id);
CREATE INDEX IF NOT EXISTS idx_location_shares_owner_id ON location_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_location_shares_shared_at ON location_shares(shared_at DESC);