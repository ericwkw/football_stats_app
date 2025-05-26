/**
 * Master seed script to run all seeding operations in the correct order
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('Starting complete database seeding process...');

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run a script and return a promise
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(__dirname, scriptPath);
    console.log(`Running: ${scriptPath}...`);
    
    // Use --experimental-specifier-resolution=node to allow imports without .js extension
    const child = exec(`node --experimental-modules ${fullPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${scriptPath}:`, error);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`${scriptPath} stderr:`, stderr);
      }
      
      console.log(stdout);
      resolve();
    });
    
    // Forward script output to console in real-time
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });
}

// Run the scripts in sequence
async function runAllScripts() {
  try {
    // 1. First seed the teams
    await runScript('./seed-teams.js');
    console.log('Teams seeding completed successfully.');
    
    // 2. Then seed players, matches, and their relationships
    await runScript('./seed-players-with-teams.js');
    console.log('Players and matches seeding completed successfully.');
    
    console.log('All seeding operations completed successfully!');
    console.log(`
    ✅ Database now contains:
    - 3 teams (FCB United, Red Team, Blue Rovers)
    - 3 players (John Doe, Emma Smith, Michael Johnson)
    - 7 matches with their respective player assignments
    - Player statistics across different teams
    
    You can now view the multi-team impact charts and player combinations.
    `);
    
  } catch (error) {
    console.error('Error during seeding process:', error);
    process.exit(1);
  }
}

// Execute the seeding sequence
runAllScripts(); 