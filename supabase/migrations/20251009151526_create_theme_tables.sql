/*
  # Create Theme System Tables

  ## Overview
  This migration creates tables for storing user and pet theme preferences,
  enabling customizable theming across the application and public pet pages.

  ## New Tables

  ### 1. `user_themes`
  Stores theme preferences at the user level for the main application interface.
  - `user_id` (uuid, primary key) - References auth.users
  - `theme_preset` (varchar) - One of: 'nature', 'playful', 'elegant', 'ocean', 'minimalist', 'custom'
  - `custom_colors` (jsonb) - Stores custom color overrides when theme_preset is 'custom'
  - `dark_mode_enabled` (boolean) - Whether dark mode is active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `pet_themes`
  Stores optional theme overrides at the pet level for public pet pages.
  - `pet_id` (uuid, primary key) - References pets table
  - `theme_preset` (varchar) - Theme preset identifier
  - `custom_colors` (jsonb) - Custom color overrides
  - `background_image_url` (text) - Optional custom background image
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on both tables
  - Users can only read/update their own theme preferences
  - Pet themes can only be modified by pet owners
  - Public pet pages can read pet themes without authentication

  ## Notes
  - Custom colors JSON structure: { primary, secondary, accent, background, text, cardBg, cardBorder, buttonPrimary, buttonSecondary }
  - Theme presets reference THEME_PRESETS constant in application code
  - Background images stored in Supabase Storage (pet-photos bucket)
*/

-- Create user_themes table
CREATE TABLE IF NOT EXISTS user_themes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_preset VARCHAR(50) NOT NULL DEFAULT 'minimalist',
  custom_colors JSONB,
  dark_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create pet_themes table
CREATE TABLE IF NOT EXISTS pet_themes (
  pet_id UUID PRIMARY KEY REFERENCES pets(id) ON DELETE CASCADE,
  theme_preset VARCHAR(50) NOT NULL DEFAULT 'minimalist',
  custom_colors JSONB,
  background_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_themes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_themes

-- Users can view their own theme preferences
CREATE POLICY "Users can view own theme preferences"
  ON user_themes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own theme preferences
CREATE POLICY "Users can insert own theme preferences"
  ON user_themes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own theme preferences
CREATE POLICY "Users can update own theme preferences"
  ON user_themes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own theme preferences
CREATE POLICY "Users can delete own theme preferences"
  ON user_themes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for pet_themes

-- Pet owners can view their pet themes
CREATE POLICY "Pet owners can view pet themes"
  ON pet_themes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_themes.pet_id
      AND pets.owner_id = auth.uid()
    )
  );

-- Public users can view pet themes (for public pet pages)
CREATE POLICY "Public can view pet themes"
  ON pet_themes
  FOR SELECT
  TO anon
  USING (true);

-- Pet owners can insert themes for their pets
CREATE POLICY "Pet owners can insert pet themes"
  ON pet_themes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_themes.pet_id
      AND pets.owner_id = auth.uid()
    )
  );

-- Pet owners can update themes for their pets
CREATE POLICY "Pet owners can update pet themes"
  ON pet_themes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_themes.pet_id
      AND pets.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_themes.pet_id
      AND pets.owner_id = auth.uid()
    )
  );

-- Pet owners can delete themes for their pets
CREATE POLICY "Pet owners can delete pet themes"
  ON pet_themes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_themes.pet_id
      AND pets.owner_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON user_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_themes_pet_id ON pet_themes(pet_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating updated_at
DROP TRIGGER IF EXISTS update_user_themes_updated_at ON user_themes;
CREATE TRIGGER update_user_themes_updated_at
  BEFORE UPDATE ON user_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pet_themes_updated_at ON pet_themes;
CREATE TRIGGER update_pet_themes_updated_at
  BEFORE UPDATE ON pet_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
