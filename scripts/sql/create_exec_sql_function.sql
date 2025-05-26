-- Create a function that allows executing arbitrary SQL
-- This should only be callable by users with appropriate privileges

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS exec_sql(text);

-- Create the function
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Restrict access to the function
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Comment on the function to document its purpose and security implications
COMMENT ON FUNCTION exec_sql(text) IS 
'Admin function to execute arbitrary SQL. 
SECURITY WARNING: This function runs with elevated privileges.
Only grant access to trusted roles.'; 