-- Direct insert statements for alerts
-- Run this in the Supabase SQL editor to insert sample alerts

-- First, get the current user ID
DO $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user ID
  SELECT auth.uid() INTO current_user_id;
  
  -- Insert sample alerts
  INSERT INTO alert (content, created_at, user_id)
  VALUES 
    ('Residents near Riverbank Ave should not drink tap water until further notice.', NOW(), current_user_id),
    ('Due to heavy rain, avoid Orchard Road until 6 PM.', NOW(), current_user_id);
    
  -- If title column exists, update the alerts
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alert' AND column_name = 'title') THEN
    UPDATE alert 
    SET title = 'Water Contamination Warning'
    WHERE content = 'Residents near Riverbank Ave should not drink tap water until further notice.';
    
    UPDATE alert 
    SET title = 'Flash Flood Risk'
    WHERE content = 'Due to heavy rain, avoid Orchard Road until 6 PM.';
  END IF;
  
  -- If category column exists, update the alerts
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alert' AND column_name = 'category') THEN
    UPDATE alert 
    SET category = 'health'
    WHERE content = 'Residents near Riverbank Ave should not drink tap water until further notice.';
    
    UPDATE alert 
    SET category = 'weather'
    WHERE content = 'Due to heavy rain, avoid Orchard Road until 6 PM.';
  END IF;
  
  -- If location column exists, update the alerts
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alert' AND column_name = 'location') THEN
    UPDATE alert 
    SET location = 'Riverbank Ave'
    WHERE content = 'Residents near Riverbank Ave should not drink tap water until further notice.';
    
    UPDATE alert 
    SET location = 'Orchard Road'
    WHERE content = 'Due to heavy rain, avoid Orchard Road until 6 PM.';
  END IF;
  
  -- If latitude and longitude columns exist, update the alerts
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alert' AND column_name = 'latitude') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alert' AND column_name = 'longitude') THEN
    UPDATE alert 
    SET latitude = 1.3521, longitude = 103.8198
    WHERE content = 'Residents near Riverbank Ave should not drink tap water until further notice.';
    
    UPDATE alert 
    SET latitude = 1.3039, longitude = 103.8318
    WHERE content = 'Due to heavy rain, avoid Orchard Road until 6 PM.';
  END IF;
END $$; 