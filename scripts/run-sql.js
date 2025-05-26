/**
 * Helper script to run SQL files against Supabase
 * Usage: node run-sql.js <sql-file-path>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for SQL file argument
const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
  console.error('Error: No SQL file specified.');
  console.error('Usage: node run-sql.js <sql-file-path>');
  process.exit(1);
}

// Resolve the path
const resolvedPath = path.resolve(process.cwd(), sqlFilePath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: SQL file not found: ${resolvedPath}`);
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Read and run the SQL file
async function runSqlFile() {
  try {
    console.log(`Reading SQL file: ${resolvedPath}`);
    const sqlContent = fs.readFileSync(resolvedPath, 'utf8');
    
    console.log('Executing SQL against Supabase...');
    
    // Execute the SQL query
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }
    
    console.log('SQL executed successfully!');
  } catch (error) {
    console.error('Error running SQL file:', error);
    process.exit(1);
  }
}

// Run the SQL file
runSqlFile(); 