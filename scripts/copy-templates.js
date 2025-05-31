/**
 * This script copies CSV templates from src/data/templates to the public/templates directory
 * so they can be easily downloaded from the web interface.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Define paths
const srcDir = path.join(rootDir, 'public', 'templates');
const destDir = path.join(rootDir, 'public', 'api', 'templates');

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

// Copy all template files
try {
  const files = fs.readdirSync(srcDir);
  
  console.log(`Found ${files.length} template files to copy`);
  
  for (const file of files) {
    if (file.endsWith('.csv')) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);
      
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${file}`);
    }
  }
  
  console.log('All templates copied successfully');
} catch (error) {
  console.error('Error copying templates:', error);
  process.exit(1);
} 