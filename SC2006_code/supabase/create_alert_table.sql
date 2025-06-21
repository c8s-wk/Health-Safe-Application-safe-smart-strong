-- This script creates or recreates the alert table with proper RLS policies

-- First, check if the table exists and drop it if it does
DROP TABLE IF EXISTS alert;

-- Create the alert table matching the structure we need
CREATE TABLE alert (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  title TEXT,
  category_id INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on the table
ALTER TABLE alert ENABLE ROW LEVEL SECURITY;

-- Create policies that match the post table policies
-- Allow anyone to read alerts
CREATE POLICY "Allow anyone to read alerts" 
ON alert FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own alerts
CREATE POLICY "Allow authenticated users to insert their own alerts" 
ON alert FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own alerts
CREATE POLICY "Allow users to update their own alerts" 
ON alert FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own alerts
CREATE POLICY "Allow users to delete their own alerts" 
ON alert FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Insert some sample data as system
INSERT INTO alert (content, title, category_id, latitude, longitude, user_id, created_at)
SELECT 
  'Water Contamination Warning: Residents near Riverbank Ave should not drink tap water until further notice.',
  'Water Contamination Warning',
  1,
  1.3521,
  103.8198,
  auth.uid(),
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid());

INSERT INTO alert (content, title, category_id, latitude, longitude, user_id, created_at)
SELECT 
  'Flash Flood Risk: Due to heavy rain, avoid Orchard Road until 6 PM.',
  'Flash Flood Risk',
  2,
  1.3039,
  103.8318,
  auth.uid(),
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid());

-- Grant usage privileges to authenticated users
GRANT USAGE ON SEQUENCE alert_id_seq TO authenticated;
GRANT ALL ON alert TO authenticated; 