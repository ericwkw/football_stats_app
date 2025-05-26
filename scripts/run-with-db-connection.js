/**
 * Database Connection Helper Script
 * 
 * This script handles secure connections to the database for running SQL files.
 * It loads environment variables from .env.local and passes the connection
 * to psql in a more secure way than exposing connection strings in package.json.
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Ensure the SQL file path is provided
if (process.argv.length < 3) {
  console.error('Error: Please provide the path to the SQL file as an argument');
  console.error('Usage: node run-with-db-connection.js path/to/sql/file.sql');
  process.exit(1);
}

// Get the SQL file path from command line arguments
const sqlFilePath = resolve(process.argv[2]);

// Get database connection from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not set in .env.local');
  console.error('Please set it in your .env.local file or create one if it doesn\'t exist');
  process.exit(1);
}

try {
  // Check if the SQL file exists
  try {
    readFileSync(sqlFilePath, 'utf8');
  } catch (err) {
    console.error(`Error: Could not read SQL file at ${sqlFilePath}`);
    console.error(err.message);
    process.exit(1);
  }

  console.log(`Running SQL file: ${sqlFilePath}`);
  
  // Run psql command with the SQL file
  const psql = spawn('psql', ['-f', sqlFilePath, databaseUrl]);

  // Handle output
  psql.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  psql.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  psql.on('close', (code) => {
    if (code === 0) {
      console.log('SQL file executed successfully');
    } else {
      console.error(`SQL execution failed with code ${code}`);
    }
  });
} catch (error) {
  console.error('An error occurred:', error.message);
  process.exit(1);
} 