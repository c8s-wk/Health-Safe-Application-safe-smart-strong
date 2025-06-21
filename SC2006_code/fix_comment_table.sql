-- SQL script to create or fix the comment table

-- First check if the comment table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comment') THEN
    -- Create the comment table if it doesn't exist
    CREATE TABLE public.comment (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id),
      target_id INTEGER NOT NULL,
      target_type TEXT NOT NULL CHECK (target_type IN ('POST', 'COMMENT')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );
    
    -- Add appropriate indexes
    CREATE INDEX comment_target_id_idx ON public.comment(target_id);
    CREATE INDEX comment_user_id_idx ON public.comment(user_id);
    CREATE INDEX comment_target_type_idx ON public.comment(target_type);
    
    -- Add RLS policies
    ALTER TABLE public.comment ENABLE ROW LEVEL SECURITY;
    
    -- Policy for selecting comments - everyone can read
    CREATE POLICY "Anyone can read comments" 
      ON public.comment FOR SELECT 
      USING (true);
    
    -- Policy for inserting comments - authenticated users can create
    CREATE POLICY "Authenticated users can create comments" 
      ON public.comment FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = user_id);
    
    -- Policy for updating comments - users can update their own comments
    CREATE POLICY "Users can update their own comments" 
      ON public.comment FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = user_id);
    
    -- Policy for deleting comments - users can delete their own comments
    CREATE POLICY "Users can delete their own comments" 
      ON public.comment FOR DELETE 
      TO authenticated 
      USING (auth.uid() = user_id);
    
    RAISE NOTICE 'Comment table created successfully';
  ELSE
    -- If table exists, check if it has the right structure and update if needed
    
    -- Check if target_id column exists and add it if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'comment' AND column_name = 'target_id') THEN
      -- Add target_id column
      ALTER TABLE public.comment ADD COLUMN target_id INTEGER;
      RAISE NOTICE 'Added missing target_id column to comment table';
    END IF;
    
    -- Check if target_type column exists and add it if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'comment' AND column_name = 'target_type') THEN
      -- Add target_type column
      ALTER TABLE public.comment ADD COLUMN target_type TEXT CHECK (target_type IN ('POST', 'COMMENT'));
      RAISE NOTICE 'Added missing target_type column to comment table';
    END IF;
    
    -- Check if post_id column exists, and if it does AND target_id doesn't have values, migrate the data
    IF EXISTS (SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = 'comment' AND column_name = 'post_id')
       AND EXISTS (SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = 'comment' AND column_name = 'target_id')
    THEN
      -- Update target_id with post_id values and set target_type to 'POST' if target_id is null
      UPDATE public.comment
      SET target_id = post_id, target_type = 'POST'
      WHERE target_id IS NULL AND post_id IS NOT NULL;
      RAISE NOTICE 'Migrated data from post_id to target_id where applicable';
    END IF;
    
    -- Check if user_id column exists and add it if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'comment' AND column_name = 'user_id') THEN
      -- Add user_id column
      ALTER TABLE public.comment ADD COLUMN user_id UUID REFERENCES auth.users(id);
      RAISE NOTICE 'Added missing user_id column to comment table';
    END IF;
    
    -- Check if content column exists and add it if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'comment' AND column_name = 'content') THEN
      -- Add content column
      ALTER TABLE public.comment ADD COLUMN content TEXT;
      RAISE NOTICE 'Added missing content column to comment table';
    END IF;
    
    -- Check if created_at column exists and add it if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'comment' AND column_name = 'created_at') THEN
      -- Add created_at column
      ALTER TABLE public.comment ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
      RAISE NOTICE 'Added missing created_at column to comment table';
    END IF;
    
    RAISE NOTICE 'Comment table structure verified and fixed if needed';
  END IF;
END
$$; 