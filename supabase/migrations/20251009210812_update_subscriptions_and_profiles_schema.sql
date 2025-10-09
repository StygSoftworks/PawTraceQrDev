/*
  # Update Subscriptions and Profiles Schema for PayPal Billing

  1. Subscriptions Table Changes
    - Replace paypal_sub_id_addon and paypal_plan_id_addon columns
    - Add paypal_addon_subs JSONB array to support multiple addon subscriptions
    - Change default status from 'active' to 'inactive'

  2. Profiles Table Changes
    - Add stripe_customer_id for future Stripe integration
    - Add plan_interval to track monthly vs yearly billing
    - Add base_status to track base subscription status
    - Add extras_quantity to track number of extra pet slots
    - Add allowed_pets as computed default based on extras
    - Add current_period_end to track subscription period
    - Add email column for easier access to user email
    - Update role check constraint to include 'free' and 'owner' roles

  3. Data Safety
    - Uses IF NOT EXISTS for all column additions
    - Preserves existing data
    - Safe to run multiple times
*/

-- Update subscriptions table
DO $$
BEGIN
  -- Add paypal_addon_subs column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'paypal_addon_subs'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN paypal_addon_subs JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Update default status to 'inactive'
  ALTER TABLE subscriptions ALTER COLUMN status SET DEFAULT 'inactive'::text;

  -- Drop old addon columns if they exist and paypal_addon_subs exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'paypal_addon_subs'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name = 'paypal_sub_id_addon'
    ) THEN
      ALTER TABLE subscriptions DROP COLUMN IF EXISTS paypal_sub_id_addon;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name = 'paypal_plan_id_addon'
    ) THEN
      ALTER TABLE subscriptions DROP COLUMN IF EXISTS paypal_plan_id_addon;
    END IF;
  END IF;
END $$;

-- Update profiles table
DO $$
BEGIN
  -- Add stripe_customer_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;

  -- Add plan_interval
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'plan_interval'
  ) THEN
    ALTER TABLE profiles ADD COLUMN plan_interval TEXT CHECK (plan_interval = ANY (ARRAY['month'::text, 'year'::text]));
  END IF;

  -- Add base_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'base_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN base_status TEXT;
  END IF;

  -- Add extras_quantity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'extras_quantity'
  ) THEN
    ALTER TABLE profiles ADD COLUMN extras_quantity INTEGER DEFAULT 0;
  END IF;

  -- Add allowed_pets
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'allowed_pets'
  ) THEN
    ALTER TABLE profiles ADD COLUMN allowed_pets INTEGER DEFAULT 3;
  END IF;

  -- Add current_period_end
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_period_end TIMESTAMPTZ;
  END IF;

  -- Add email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;

  -- Update role constraint to include 'free' and 'owner'
  -- First drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'profiles' AND constraint_name LIKE '%role%check%'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  END IF;

  -- Add the updated constraint
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role = ANY (ARRAY['free'::text, 'user'::text, 'admin'::text, 'owner'::text]));

  -- Update default value for role
  ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'free'::text;
END $$;

-- Update allowed_pets to be computed based on extras_quantity
-- This creates a function to auto-calculate allowed pets
CREATE OR REPLACE FUNCTION calculate_allowed_pets()
RETURNS TRIGGER AS $$
BEGIN
  NEW.allowed_pets := 3 + COALESCE(NEW.extras_quantity, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate allowed_pets
DROP TRIGGER IF EXISTS update_allowed_pets ON profiles;
CREATE TRIGGER update_allowed_pets
  BEFORE INSERT OR UPDATE OF extras_quantity
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_allowed_pets();
