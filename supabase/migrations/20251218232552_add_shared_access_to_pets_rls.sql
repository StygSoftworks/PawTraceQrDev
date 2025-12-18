/*
  # Add Shared Access to Pets RLS Policies

  ## Overview
  This migration updates the pets table RLS policies to allow users with accepted
  pet shares to view and optionally edit pets that have been shared with them.

  ## Changes

  ### 1. New SELECT Policy
  - Allows users with accepted shares to view pets shared with them
  - Complements existing owner-only SELECT policy

  ### 2. New UPDATE Policy  
  - Allows users with accepted shares AND can_edit permission to update pets
  - Maintains owner's full update access

  ## Security
  - Only accepted shares grant access (pending/declined/revoked do not)
  - Edit access requires explicit can_edit permission
  - Delete remains owner-only (no changes needed)
*/

-- Add SELECT policy for shared users to view pets shared with them
CREATE POLICY "Shared users can view pets shared with them"
  ON pets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pet_shares
      WHERE pet_shares.pet_id = pets.id
        AND pet_shares.shared_with_id = (SELECT auth.uid())
        AND pet_shares.status = 'accepted'
    )
  );

-- Add UPDATE policy for shared users with can_edit permission
CREATE POLICY "Shared users can edit pets if permitted"
  ON pets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pet_shares
      WHERE pet_shares.pet_id = pets.id
        AND pet_shares.shared_with_id = (SELECT auth.uid())
        AND pet_shares.status = 'accepted'
        AND pet_shares.can_edit = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pet_shares
      WHERE pet_shares.pet_id = pets.id
        AND pet_shares.shared_with_id = (SELECT auth.uid())
        AND pet_shares.status = 'accepted'
        AND pet_shares.can_edit = true
    )
  );

-- Update location_shares SELECT policy to include shared users
CREATE POLICY "Shared users can view location shares for shared pets"
  ON location_shares FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pet_shares
      WHERE pet_shares.pet_id = location_shares.pet_id
        AND pet_shares.shared_with_id = (SELECT auth.uid())
        AND pet_shares.status = 'accepted'
    )
  );
