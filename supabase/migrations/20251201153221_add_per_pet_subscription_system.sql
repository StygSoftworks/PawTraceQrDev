/*
  # Add Per-Pet Subscription System

  ## Overview
  This migration transforms the subscription model from user-level base+addon subscriptions
  to a per-pet subscription system where each pet has its own subscription tracking.

  ## Changes

  ### 1. Pets Table Updates
  Add columns to track subscription status per pet:
  - `paypal_subscription_id` (text) - PayPal subscription ID for this pet
  - `subscription_status` (text) - Current status: 'active', 'inactive', 'expired', 'cancelled', 'pending'
  - `subscription_activated_at` (timestamptz) - When subscription was first activated
  - `subscription_expires_at` (timestamptz) - When subscription expires/renews
  - `subscription_plan_id` (text) - PayPal plan ID (monthly/yearly)

  ### 2. Pet Subscriptions History Table
  New table to track subscription lifecycle per pet:
  - Tracks all subscription events (activated, renewed, cancelled, expired)
  - Links to pets table for historical reference
  - Stores PayPal subscription and plan details

  ### 3. Indexes
  Add indexes for efficient queries on subscription status and expiration dates

  ### 4. RLS Policies
  - Owners can view their pets' subscription history
  - Service role can manage all subscription records

  ## Data Safety
  - Uses IF NOT EXISTS for all changes
  - Preserves existing data
  - Maintains backward compatibility with existing subscriptions table
*/

-- Add subscription tracking columns to pets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'paypal_subscription_id'
  ) THEN
    ALTER TABLE pets ADD COLUMN paypal_subscription_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE pets ADD COLUMN subscription_status TEXT DEFAULT 'inactive'
      CHECK (subscription_status IN ('active', 'inactive', 'expired', 'cancelled', 'pending'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'subscription_activated_at'
  ) THEN
    ALTER TABLE pets ADD COLUMN subscription_activated_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE pets ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pets' AND column_name = 'subscription_plan_id'
  ) THEN
    ALTER TABLE pets ADD COLUMN subscription_plan_id TEXT;
  END IF;
END $$;

-- Create indexes for subscription queries
CREATE INDEX IF NOT EXISTS idx_pets_subscription_status ON pets(subscription_status);
CREATE INDEX IF NOT EXISTS idx_pets_subscription_expires_at ON pets(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pets_paypal_subscription_id ON pets(paypal_subscription_id) WHERE paypal_subscription_id IS NOT NULL;

-- Create pet_subscriptions history table
CREATE TABLE IF NOT EXISTS pet_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  paypal_subscription_id TEXT NOT NULL,
  paypal_plan_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'expired', 'cancelled', 'pending', 'suspended')),
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'activated', 'renewed', 'cancelled', 'expired', 'suspended', 'payment_failed')),
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for pet_subscriptions
CREATE INDEX IF NOT EXISTS idx_pet_subscriptions_pet_id ON pet_subscriptions(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_subscriptions_owner_id ON pet_subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_pet_subscriptions_paypal_sub_id ON pet_subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_pet_subscriptions_status ON pet_subscriptions(status);

-- Enable RLS on pet_subscriptions
ALTER TABLE pet_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pet_subscriptions
CREATE POLICY "Users can view their own pet subscription history"
  ON pet_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Service role can insert pet subscriptions"
  ON pet_subscriptions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update pet subscriptions"
  ON pet_subscriptions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete pet subscriptions"
  ON pet_subscriptions FOR DELETE
  TO service_role
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pet_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_pet_subscriptions_timestamp ON pet_subscriptions;
CREATE TRIGGER update_pet_subscriptions_timestamp
  BEFORE UPDATE ON pet_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_pet_subscriptions_updated_at();

-- Update public_pets view to include subscription status
DROP VIEW IF EXISTS public_pets CASCADE;
CREATE OR REPLACE VIEW public_pets AS
SELECT 
  p.id,
  p.short_id,
  p.name,
  p.species,
  p.breed,
  p.color,
  p.weight,
  p.birthdate,
  p.description,
  p.vaccinations,
  p.photo_url,
  p.qr_url,
  p.missing,
  p.missing_since,
  p.created_at,
  p.environment,
  p.subscription_status,
  p.owner_id,
  prof.email as owner_email,
  prof.display_name as owner_name,
  prof.phone as owner_phone
FROM pets p
LEFT JOIN profiles prof ON p.owner_id = prof.id;

-- Grant access to public_pets view
GRANT SELECT ON public_pets TO anon, authenticated;
