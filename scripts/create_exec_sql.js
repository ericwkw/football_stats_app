/**
 * Helper script to create the exec_sql function directly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL to create the exec_sql function
const createExecSqlFunction = `
-- Drop the function if it already exists
DROP FUNCTION IF EXISTS exec_sql(text);

-- Create the function
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
`;

// Apply the function creation SQL
async function createFunction() {
  try {
    console.log('Creating exec_sql function...');
    
    // Execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', { 
      sql: createExecSqlFunction 
    });
    
    if (error) {
      console.error('Error creating exec_sql function:');
      console.error('You may need to create this function manually in the Supabase SQL editor:');
      console.error(createExecSqlFunction);
      process.exit(1);
    }
    
    console.log('exec_sql function created successfully!');
    console.log('You can now use it to apply other SQL functions.');
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    console.error('You may need to create this function manually in the Supabase SQL editor:');
    console.error(createExecSqlFunction);
    process.exit(1);
  }
}

// Create the function
createFunction(); 