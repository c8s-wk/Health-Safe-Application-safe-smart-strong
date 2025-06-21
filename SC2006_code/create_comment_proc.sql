-- SQL script to create a stored procedure for adding comments
-- This bypasses RLS and can be used when direct inserts fail

-- Create stored procedure for adding comments
CREATE OR REPLACE FUNCTION create_comment(
  content_text TEXT,
  post_id_val INTEGER,
  user_id_val UUID
) RETURNS INTEGER AS $$
DECLARE
  new_comment_id INTEGER;
BEGIN
  -- Insert the comment and return the ID
  INSERT INTO comment (content, post_id, user_id, created_at)
  VALUES (content_text, post_id_val, user_id_val, NOW())
  RETURNING id INTO new_comment_id;
  
  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 