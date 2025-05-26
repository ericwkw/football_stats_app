/**
 * Helper script to run a specific SQL function file against Supabase
 * Usage: node apply_function.js <sql-file-path>
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config({ path: '.env.local' });

// Default to the temp_fix.sql file if no file is specified
const sqlFilePath = process.argv[2] || 'sql/temp_fix.sql';

// Resolve the path
const resolvedPath = path.resolve(process.cwd(), sqlFilePath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: SQL file not found: ${resolvedPath}`);
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read and run the SQL file
async function runSqlFile() {
  try {
    console.log(`Reading SQL file: ${resolvedPath}`);
    const sqlContent = fs.readFileSync(resolvedPath, 'utf8');
    
    console.log('Executing SQL against Supabase...');
    
    // Execute the SQL query directly
    const { error } = await supabase.rpc('exec_sql', { 
      sql: sqlContent 
    });
    
    if (error) {
      if (error.message.includes('Could not find the function')) {
        console.error('Error: The exec_sql function does not exist in the database.');
        console.error('You may need to run: node scripts/create_exec_sql.js');
      } else {
        console.error('Error executing SQL:', error);
      }
      process.exit(1);
    }
    
    console.log('SQL executed successfully!');
    console.log('Please restart your app for changes to take effect.');
  } catch (error) {
    console.error('Error running SQL file:', error);
    process.exit(1);
  }
}

// Run the SQL file
runSqlFile(); 