/*
  # Add Automatic Profile Creation on User Signup

  ## Overview
  This migration creates a trigger that automatically creates a profile record
  whenever a new user signs up through Supabase Auth. This ensures every user
  has a profile without requiring application code to manage it.

  ## Changes Made

  ### 1. Function: handle_new_user()
  - Automatically called when a new user is created in auth.users
  - Creates a corresponding profile record with default values
  - Extracts display_name from user metadata if available
  - Extracts email from auth.users for the profile
  - Sets default role to 'free'

  ### 2. Trigger: on_auth_user_created
  - Fires AFTER INSERT on auth.users
  - Calls handle_new_user() function
  - Ensures profile is created atomically with user creation

  ## Important Notes
  - This does NOT backfill existing users without profiles
  - The trigger only applies to new signups going forward
  - If a profile already exists, the INSERT is skipped (no duplicate error)
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert a new profile for the newly created user
  INSERT INTO public.profiles (id, display_name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'display_name'),
    NEW.email,
    'free',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
