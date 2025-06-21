-- Check RLS policies on the alert table
-- Run this in the Supabase SQL editor to understand the RLS policies

-- Check if RLS is enabled on the alert table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'alert';

-- List all policies on the alert table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'alert';

-- Check the structure of the alert table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'alert'
ORDER BY 
    ordinal_position;

-- Check if there are any triggers on the alert table
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'alert'; 