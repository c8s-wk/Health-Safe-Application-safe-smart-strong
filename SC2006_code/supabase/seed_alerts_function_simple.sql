-- Create a simple function to seed alerts that works with RLS
-- This function doesn't try to bypass RLS but works within it

-- First, create a function that returns the current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Create a function to seed alerts that works with RLS
CREATE OR REPLACE FUNCTION seed_alerts_simple(alerts jsonb)
RETURNS SETOF alert
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user ID
  current_user_id := get_current_user_id();
  
  -- Insert the alerts with the current user ID
  RETURN QUERY
  INSERT INTO alert (content, created_at, user_id)
  SELECT 
    (a->>'content')::text,
    (a->>'created_at')::timestamptz,
    current_user_id
  FROM jsonb_array_elements(alerts) AS a
  RETURNING *;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION seed_alerts_simple TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_id TO authenticated;

-- Note: This function works within RLS by using the current user's ID 