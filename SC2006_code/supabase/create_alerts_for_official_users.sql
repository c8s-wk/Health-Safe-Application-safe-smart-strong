-- Create a function to seed alerts for official users with elevated privileges
CREATE OR REPLACE FUNCTION create_alerts_for_official_users()
RETURNS SETOF alert
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
BEGIN
  -- Insert the alerts with explicit official user IDs
  RETURN QUERY
  INSERT INTO alert (content, user_id)
  VALUES 
    ('Water Contamination Warning: Residents near Riverbank Ave should not drink tap water until further notice.',
     'official_user_1'),
    ('Flash Flood Risk: Due to heavy rain, avoid Orchard Road until 6 PM.',
     'official_user_2')
  RETURNING *;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_alerts_for_official_users TO authenticated;

-- You may need to run this SQL script in the Supabase SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New Query
-- Then paste this code and run it 