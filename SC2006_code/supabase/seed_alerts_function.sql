-- Create a function to seed alerts with elevated privileges
-- This function will be called with the user's authentication token
-- but will have elevated privileges to insert data

-- First, create the function
CREATE OR REPLACE FUNCTION seed_alerts(alerts jsonb, user_id uuid)
RETURNS SETOF alert
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
BEGIN
  -- Insert the alerts
  RETURN QUERY
  INSERT INTO alert (content, created_at, user_id, title, category, location, latitude, longitude)
  SELECT 
    (a->>'content')::text,
    (a->>'created_at')::timestamptz,
    (a->>'user_id')::uuid,
    (a->>'title')::text,
    (a->>'category')::text,
    (a->>'location')::text,
    (a->>'latitude')::float8,
    (a->>'longitude')::float8
  FROM jsonb_array_elements(alerts) AS a
  RETURNING *;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION seed_alerts TO authenticated;

-- Create a policy to allow users to execute this function
CREATE POLICY "Allow authenticated users to execute seed_alerts" 
ON alert FOR INSERT 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: You may need to adjust the column names and types based on your actual schema 