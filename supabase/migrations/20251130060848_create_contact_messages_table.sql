/*
  # Create Contact Messages Table

  1. New Tables
    - `contact_messages`
      - `id` (uuid, primary key) - Unique identifier for each message
      - `user_id` (uuid, nullable) - Links to auth.users if user is authenticated
      - `name` (text) - Sender's name
      - `email` (text) - Sender's email address
      - `phone` (text, nullable) - Optional phone number for urgent matters
      - `subject` (text) - Category/subject of the inquiry
      - `message` (text) - The actual message content
      - `status` (text) - Message status (pending, resolved, archived)
      - `admin_notes` (text, nullable) - Internal notes for admin use
      - `responded_at` (timestamptz, nullable) - When admin responded
      - `created_at` (timestamptz) - When message was created
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `contact_messages` table
    - Allow anyone to insert (authenticated or anonymous users)
    - Only admins/owners can read all messages
    - Users can read their own messages if authenticated

  3. Notes
    - Supports both authenticated and anonymous contact form submissions
    - Status tracking for admin workflow management
    - Indexed for efficient querying by admins
*/

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'archived')),
  admin_notes text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert contact messages (authenticated or anonymous)
CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Admins and owners can view all contact messages
CREATE POLICY "Admins can view all contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Policy: Authenticated users can view their own contact messages
CREATE POLICY "Users can view own contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins and owners can update contact messages (for status changes and notes)
CREATE POLICY "Admins can update contact messages"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row updates
DROP TRIGGER IF EXISTS update_contact_messages_timestamp ON contact_messages;
CREATE TRIGGER update_contact_messages_timestamp
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_messages_updated_at();
