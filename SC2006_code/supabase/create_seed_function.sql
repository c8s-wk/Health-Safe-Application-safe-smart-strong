-- This function allows seeding alerts with elevated privileges

-- Create a function to seed alerts with elevated privileges
CREATE OR REPLACE FUNCTION seed_alerts_bypass_rls()
RETURNS SETOF alert
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user ID
  SELECT auth.uid() INTO current_user_id;
  
  -- Insert the alerts as the current user but with elevated privileges
  RETURN QUERY
  INSERT INTO alert (content, title, category_id, latitude, longitude, user_id, created_at)
  VALUES 
    ('Water Contamination Warning: Residents near Riverbank Ave should not drink tap water until further notice.',
     'Water Contamination Warning',
     1,
     1.3521,
     103.8198,
     current_user_id,
     NOW()),
    ('Flash Flood Risk: Due to heavy rain, avoid Orchard Road until 6 PM.',
     'Flash Flood Risk',
     2,
     1.3039,
     103.8318,
     current_user_id,
     NOW())
  RETURNING *;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION seed_alerts_bypass_rls TO authenticated; 