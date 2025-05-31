import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions
interface ImportOptions {
  filePath: string;
  dryRun?: boolean;
  skipDuplicates?: boolean;
}

interface SimplifiedTeamRecord {
  name: string;
  team_type: string;
}

// Color mapping for team names
const teamColorMap: Record<string, string> = {
  'Light Blue': '#79DBFB',
  'Red': '#FF6188',
  'Black': '#000000',
  'FCB United': '#5050f0',
};

/**
 * Main function to import teams with simplified format
 */
async function importSimplifiedTeams({
  filePath,
  dryRun = false,
  skipDuplicates = true,
}: ImportOptions): Promise<void> {
  try {
    console.log(`Starting simplified team import from ${filePath}`);
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'} (changes ${dryRun ? 'will not' : 'will'} be committed)`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    console.log(`Found ${records.length} teams to import`);
    
    if (records.length === 0) {
      console.log('No teams found. Exiting.');
      return;
    }
    
    // Process records
    const processedRecords = records.map((record: SimplifiedTeamRecord) => {
      // Generate a unique external ID based on the name
      const externalId = `${record.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
      
      return {
        name: record.name,
        team_type: record.team_type || 'internal',
        primary_shirt_color: teamColorMap[record.name] || '#808080', // Default to gray if no mapping
        logo_url: null,
        external_id: externalId,
        is_active: true,
      };
    });
    
    // Log the first record as an example
    console.log('Sample processed record:', processedRecords[0]);
    
    if (dryRun) {
      console.log(`DRY RUN: Would import ${processedRecords.length} teams`);
      return;
    }
    
    // Import data
    const { error } = await supabase
      .from('teams')
      .upsert(processedRecords, { 
        onConflict: skipDuplicates ? 'name' : undefined,
        ignoreDuplicates: skipDuplicates,
      });
    
    if (error) {
      throw new Error(`Failed to import teams: ${error.message}`);
    }
    
    console.log(`Successfully imported ${processedRecords.length} teams`);
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
}

// Command line interface
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: Partial<ImportOptions> = {
    dryRun: false,
    skipDuplicates: true,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--file' || arg === '-f') {
      options.filePath = args[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--no-skip-duplicates') {
      options.skipDuplicates = false;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  
  // Validate required options
  if (!options.filePath) {
    console.error('Error: Missing required --file option');
    printHelp();
    process.exit(1);
  }
  
  return options as ImportOptions;
}

function printHelp(): void {
  console.log(`
Usage: npx ts-node src/scripts/import-teams-simplified.ts --file <path> [options]

Required:
  --file, -f <path>       Path to the CSV file to import

Options:
  --dry-run              Run in dry-run mode (no changes will be made)
  --no-skip-duplicates   Don't skip duplicate records
  --help, -h             Show this help message
  
Examples:
  # Import teams in dry-run mode
  npx ts-node src/scripts/import-teams-simplified.ts --file ./data/teams-simple.csv --dry-run
  
  # Import teams
  npx ts-node src/scripts/import-teams-simplified.ts --file ./data/teams-simple.csv
  `);
}

// Execute if called directly
if (require.main === module) {
  const options = parseArgs();
  importSimplifiedTeams(options).catch(err => {
    console.error('Error during import:', err);
    process.exit(1);
  });
} 