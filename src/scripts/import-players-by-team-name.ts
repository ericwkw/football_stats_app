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

interface Record {
  [key: string]: string | number | boolean | null;
}

interface ProcessedPlayerRecord {
  name: string;
  position: string | null;
  team_id: string | null;
  jersey_number: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_foot: string | null;
}

interface TeamRecord {
  id: string;
  name: string;
}

/**
 * Main function to import players with team name resolution
 */
async function importPlayersByTeamName({
  filePath,
  dryRun = false,
  skipDuplicates = true,
}: ImportOptions): Promise<void> {
  try {
    console.log(`Starting player import from ${filePath}`);
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
    
    console.log(`Found ${records.length} players to import`);
    
    if (records.length === 0) {
      console.log('No records found. Exiting.');
      return;
    }
    
    // Fetch all teams from the database to use for name resolution
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name');
    
    if (teamsError) {
      throw new Error(`Failed to fetch teams: ${teamsError.message}`);
    }
    
    if (!teams || teams.length === 0) {
      throw new Error('No teams found in the database. Please create teams first.');
    }
    
    console.log(`Found ${teams.length} teams in the database for name resolution`);
    
    // Process players and resolve team names to IDs
    await importPlayers(records, teams, { dryRun, skipDuplicates });
    
    console.log('Player import completed successfully');
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
}

/**
 * Import players data with team name resolution
 */
async function importPlayers(
  records: Record[],
  teams: TeamRecord[],
  options: { dryRun: boolean; skipDuplicates: boolean }
): Promise<void> {
  const { dryRun, skipDuplicates } = options;
  
  // Create a map of team names to IDs for quick lookup
  const teamNameToIdMap = new Map<string, string>();
  teams.forEach(team => {
    teamNameToIdMap.set(team.name.toLowerCase(), team.id);
  });
  
  // Process records and resolve team names to IDs
  const processedRecords: ProcessedPlayerRecord[] = [];
  const skippedRecords: Record[] = [];
  
  for (const record of records) {
    const teamName = record.team_name as string;
    
    if (!teamName) {
      console.warn(`Skipping player "${record.name}" - missing team name`);
      skippedRecords.push(record);
      continue;
    }
    
    const teamId = teamNameToIdMap.get(teamName.toLowerCase());
    
    if (!teamId) {
      console.warn(`Skipping player "${record.name}" - team "${teamName}" not found in database`);
      skippedRecords.push(record);
      continue;
    }
    
    processedRecords.push({
      name: record.name as string,
      position: record.position as string || null,
      team_id: teamId,
      jersey_number: record.jersey_number ? parseInt(record.jersey_number as string, 10) : null,
      height_cm: record.height_cm ? parseInt(record.height_cm as string, 10) : null,
      weight_kg: record.weight_kg ? parseInt(record.weight_kg as string, 10) : null,
      dominant_foot: record.dominant_foot as string || null,
    });
  }
  
  console.log(`Successfully processed ${processedRecords.length} players`);
  if (skippedRecords.length > 0) {
    console.warn(`Skipped ${skippedRecords.length} players due to missing or invalid team names`);
  }
  
  // Log the first record as an example
  if (processedRecords.length > 0) {
    console.log('Sample processed record:', processedRecords[0]);
  }
  
  if (dryRun) {
    console.log(`DRY RUN: Would import ${processedRecords.length} players`);
    return;
  }
  
  if (processedRecords.length === 0) {
    console.log('No valid records to import. Exiting.');
    return;
  }
  
  // Import data in batches
  const batchSize = 100;
  for (let i = 0; i < processedRecords.length; i += batchSize) {
    const batch = processedRecords.slice(i, i + batchSize);
    console.log(`Importing batch ${i / batchSize + 1}/${Math.ceil(processedRecords.length / batchSize)}`);
    
    const { error } = await supabase
      .from('players')
      .upsert(batch, { 
        onConflict: skipDuplicates ? 'name,team_id' : undefined,
        ignoreDuplicates: skipDuplicates,
      });
    
    if (error) {
      throw new Error(`Failed to import players batch: ${error.message}`);
    }
    
    console.log(`Successfully imported ${batch.length} players`);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage: ts-node import-players-by-team-name.ts [options] <file-path>

Options:
  --dry-run       Run in dry-run mode (no changes will be committed)
  --allow-dupes   Don't skip duplicate players

Example:
  ts-node import-players-by-team-name.ts --dry-run ./players.csv
`);
    process.exit(0);
  }
  
  const options: ImportOptions = {
    filePath: args[args.length - 1],
    dryRun: args.includes('--dry-run'),
    skipDuplicates: !args.includes('--allow-dupes'),
  };
  
  await importPlayersByTeamName(options);
}

// Run the script if called directly
if (require.main === module) {
  main();
}

// Export for programmatic usage
export { importPlayersByTeamName }; 