/*
  # Create Profiles Table with Optimized RLS

  ## Overview
  Creates the profiles table for storing user profile information with optimized
  Row Level Security policies that use (select auth.uid()) instead of auth.uid()
  for better query performance at scale.

  ## Tables Created
  1. **profiles**
     - `id` (uuid, primary key, references auth.users)
     - `display_name` (text) - User's display name
     - `avatar_url` (text) - URL to user's avatar image
     - `phone` (text) - User's phone number
     - `share_email` (boolean) - Whether to share email publicly
     - `share_phone` (boolean) - Whether to share phone publicly
     - `role` (text) - User role (e.g., 'user', 'admin', 'moderator')
     - `created_at` (timestamptz) - When profile was created
     - `updated_at` (timestamptz) - When profile was last updated

  ## Security
  - RLS enabled on profiles table
  - Users can only view, insert, and update their own profile
  - All policies use (select auth.uid()) for optimal performance
  - This prevents re-evaluation of auth.uid() for each row

  ## Performance Optimization
  Using (select auth.uid()) instead of auth.uid() in RLS policies ensures
  the authentication check is performed once per query rather than once per row,
  significantly improving performance for queries that scan multiple rows.
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  phone text,
  share_email boolean DEFAULT false,
  share_phone boolean DEFAULT false,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on role for role-based queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create optimized RLS policies using (select auth.uid())
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
