/**
 * Helper script to directly update a SQL function in Supabase
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config({ path: '.env.local' });

// Read the SQL file with the function definition
const sqlFilePath = 'sql/apply_weighted_fix.sql';
const resolvedPath = path.resolve(process.cwd(), sqlFilePath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: SQL file not found: ${resolvedPath}`);
  process.exit(1);
}

// Read the SQL content
const sqlContent = fs.readFileSync(resolvedPath, 'utf8');

// Write a modified version of the SQL to a temporary file
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const tempFilePath = path.join(tempDir, 'function_update.sql');
fs.writeFileSync(tempFilePath, sqlContent);

console.log(`SQL function definition saved to: ${tempFilePath}`);
console.log('To apply this update:');
console.log('1. Go to the Supabase dashboard for your project');
console.log('2. Click on "SQL Editor" in the left menu');
console.log('3. Create a new query');
console.log('4. Copy and paste the contents of the following SQL:');
console.log('\n' + sqlContent + '\n');
console.log('5. Run the query');
console.log('6. Restart your application');

// Also update the consolidated_functions.sql file if needed
console.log('\nThe consolidated_functions.sql file has already been updated.');
console.log('After applying the SQL directly, restart your application for the changes to take effect.'); 