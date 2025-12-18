/*
  # Create Pet Shares Table for Collaborative Pet Access

  ## Overview
  This migration creates a system for sharing pet access between users. Pet owners can
  invite family members, roommates, or friends to view and optionally edit their pets.

  ## 1. New Tables

  ### pet_shares
  Tracks sharing relationships between pet owners and collaborators:
  - `id` (uuid, primary key) - Unique identifier for the share
  - `pet_id` (uuid, foreign key) - The pet being shared
  - `owner_id` (uuid) - The pet owner who granted access (grantor)
  - `shared_with_id` (uuid, nullable) - The user receiving access (grantee), null if pending email invite
  - `shared_with_email` (text, nullable) - Email for pending invitations
  - `can_edit` (boolean) - Whether the shared user can edit the pet
  - `status` (text) - Invitation status: 'pending', 'accepted', 'declined', 'revoked'
  - `invite_token` (text, nullable) - Unique token for email-based invitations
  - `created_at` (timestamptz) - When the share was created
  - `accepted_at` (timestamptz, nullable) - When the invitation was accepted
  - `revoked_at` (timestamptz, nullable) - When access was revoked

  ## 2. Security
  - RLS enabled on pet_shares table
  - Pet owners can create, view, and manage shares for their pets
  - Shared users can view and respond to shares where they are the grantee
  - Invite tokens allow email-based invitation acceptance

  ## 3. Indexes
  - Index on pet_id for efficient pet-based lookups
  - Index on shared_with_id for finding pets shared with a user
  - Index on owner_id for listing a user's outgoing shares
  - Index on invite_token for invitation lookups
  - Index on shared_with_email for pending invitation lookups

  ## 4. Functions
  - Helper function to check if a user has access to a pet (owner or shared)
*/

-- Create pet_shares table
CREATE TABLE IF NOT EXISTS pet_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email text,
  can_edit boolean DEFAULT false NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  invite_token text UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  
  CONSTRAINT valid_share_target CHECK (
    (shared_with_id IS NOT NULL) OR (shared_with_email IS NOT NULL)
  ),
  CONSTRAINT unique_active_share UNIQUE (pet_id, shared_with_id) 
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_pet_shares_pet_id ON pet_shares(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_shares_shared_with_id ON pet_shares(shared_with_id) WHERE shared_with_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pet_shares_owner_id ON pet_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_pet_shares_invite_token ON pet_shares(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pet_shares_shared_with_email ON pet_shares(shared_with_email) WHERE shared_with_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pet_shares_status ON pet_shares(status);

-- Enable RLS
ALTER TABLE pet_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Pet owners can view all shares for their pets
CREATE POLICY "Pet owners can view their pet shares"
  ON pet_shares FOR SELECT
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- Policy: Shared users can view shares where they are the grantee
CREATE POLICY "Shared users can view their received shares"
  ON pet_shares FOR SELECT
  TO authenticated
  USING (shared_with_id = (SELECT auth.uid()));

-- Policy: Pet owners can create shares for their own pets
CREATE POLICY "Pet owners can create shares"
  ON pet_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM pets WHERE pets.id = pet_id AND pets.owner_id = (SELECT auth.uid())
    )
  );

-- Policy: Pet owners can update/revoke shares for their pets
CREATE POLICY "Pet owners can update their pet shares"
  ON pet_shares FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- Policy: Shared users can update their own share status (accept/decline)
CREATE POLICY "Shared users can respond to shares"
  ON pet_shares FOR UPDATE
  TO authenticated
  USING (shared_with_id = (SELECT auth.uid()))
  WITH CHECK (shared_with_id = (SELECT auth.uid()));

-- Policy: Pet owners can delete shares for their pets
CREATE POLICY "Pet owners can delete their pet shares"
  ON pet_shares FOR DELETE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- Function to check if user has access to a pet (owner or accepted share)
CREATE OR REPLACE FUNCTION user_has_pet_access(p_pet_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pets WHERE id = p_pet_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM pet_shares 
    WHERE pet_id = p_pet_id 
      AND shared_with_id = p_user_id 
      AND status = 'accepted'
  );
END;
$$;

-- Function to check if user can edit a pet (owner or accepted share with can_edit)
CREATE OR REPLACE FUNCTION user_can_edit_pet(p_pet_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pets WHERE id = p_pet_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM pet_shares 
    WHERE pet_id = p_pet_id 
      AND shared_with_id = p_user_id 
      AND status = 'accepted'
      AND can_edit = true
  );
END;
$$;

-- Function to accept a pending share invitation
CREATE OR REPLACE FUNCTION accept_pet_share(p_share_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_share pet_shares%ROWTYPE;
BEGIN
  SELECT * INTO v_share FROM pet_shares WHERE id = p_share_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Share not found';
  END IF;
  
  IF v_share.shared_with_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to accept this share';
  END IF;
  
  IF v_share.status != 'pending' THEN
    RAISE EXCEPTION 'Share is not pending';
  END IF;
  
  UPDATE pet_shares 
  SET status = 'accepted', accepted_at = now()
  WHERE id = p_share_id;
  
  RETURN true;
END;
$$;

-- Function to decline a pending share invitation
CREATE OR REPLACE FUNCTION decline_pet_share(p_share_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_share pet_shares%ROWTYPE;
BEGIN
  SELECT * INTO v_share FROM pet_shares WHERE id = p_share_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Share not found';
  END IF;
  
  IF v_share.shared_with_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to decline this share';
  END IF;
  
  IF v_share.status != 'pending' THEN
    RAISE EXCEPTION 'Share is not pending';
  END IF;
  
  UPDATE pet_shares 
  SET status = 'declined'
  WHERE id = p_share_id;
  
  RETURN true;
END;
$$;

-- Function to revoke a share (owner only)
CREATE OR REPLACE FUNCTION revoke_pet_share(p_share_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_share pet_shares%ROWTYPE;
BEGIN
  SELECT * INTO v_share FROM pet_shares WHERE id = p_share_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Share not found';
  END IF;
  
  IF v_share.owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to revoke this share';
  END IF;
  
  UPDATE pet_shares 
  SET status = 'revoked', revoked_at = now()
  WHERE id = p_share_id;
  
  RETURN true;
END;
$$;
