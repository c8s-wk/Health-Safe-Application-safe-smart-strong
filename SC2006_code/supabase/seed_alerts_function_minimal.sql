-- Create a minimal function to seed alerts with elevated privileges
-- This version only includes the essential columns we know exist

CREATE OR REPLACE FUNCTION seed_alerts_minimal(alerts jsonb, user_id uuid)
RETURNS SETOF alert
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
BEGIN
  -- Insert the alerts with only the essential columns
  RETURN QUERY
  INSERT INTO alert (content, created_at, user_id)
  SELECT 
    (a->>'content')::text,
    (a->>'created_at')::timestamptz,
    (a->>'user_id')::uuid
  FROM jsonb_array_elements(alerts) AS a
  RETURNING *;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION seed_alerts_minimal TO authenticated;

-- Note: You may need to adjust the column names and types based on your actual schema 

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'alert'; 