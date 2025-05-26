/**
 * This script copies CSV templates from src/data/templates to the public/templates directory
 * so they can be easily downloaded from the web interface.
 */

import fs from 'fs';
import path from 'path';

const sourceDir = path.join(process.cwd(), 'src', 'data', 'templates');
const targetDir = path.join(process.cwd(), 'public', 'templates');

// Create the target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Copy each template file
try {
  const files = fs.readdirSync(sourceDir);
  
  if (files.length === 0) {
    console.log('No template files found in source directory.');
    process.exit(0);
  }
  
  let copyCount = 0;
  
  for (const file of files) {
    if (!file.endsWith('.csv')) {
      console.log(`Skipping non-CSV file: ${file}`);
      continue;
    }
    
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied: ${file}`);
    copyCount++;
  }
  
  console.log(`\nSuccessfully copied ${copyCount} template files to ${targetDir}`);
} catch (error) {
  console.error('Error copying template files:', error);
  process.exit(1);
} 