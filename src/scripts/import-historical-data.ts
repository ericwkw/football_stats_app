import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Supported data types for import
type DataType = 'matches' | 'players' | 'teams' | 'player_stats';

interface ImportOptions {
  filePath: string;
  dataType: DataType;
  dryRun?: boolean;
  skipDuplicates?: boolean;
}

// Define record types for each data type
interface BaseRecord {
  external_id: string | null;
}

interface TeamRecord extends BaseRecord {
  name: string;
  team_type: string;
  primary_shirt_color: string;
  secondary_shirt_color: string | null;
  logo_url: string | null;
  is_active: boolean;
}

interface PlayerRecord extends BaseRecord {
  name: string;
  position: string | null;
  team_id: string | null;
  date_of_birth: string | null;
  height_cm: number | null;
  preferred_foot: string | null;
  jersey_number: number | null;
  is_active: boolean;
}

interface MatchRecord extends BaseRecord {
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  venue: string;
  match_type: string;
  notes: string | null;
}

interface PlayerStatsRecord extends BaseRecord {
  player_id: string;
  match_id: string;
  team_id: string;
  goals: number;
  assists: number;
  minutes_played: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheet: boolean;
}

type Record = TeamRecord | PlayerRecord | MatchRecord | PlayerStatsRecord;

/**
 * Main function to import historical data
 */
async function importHistoricalData({
  filePath,
  dataType,
  dryRun = false,
  skipDuplicates = true,
}: ImportOptions): Promise<void> {
  try {
    console.log(`Starting import for ${dataType} from ${filePath}`);
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
    
    console.log(`Found ${records.length} records to import`);
    
    if (records.length === 0) {
      console.log('No records found. Exiting.');
      return;
    }
    
    // Process based on data type
    switch (dataType) {
      case 'matches':
        await importMatches(records, { dryRun, skipDuplicates });
        break;
      case 'players':
        await importPlayers(records, { dryRun, skipDuplicates });
        break;
      case 'teams':
        await importTeams(records, { dryRun, skipDuplicates });
        break;
      case 'player_stats':
        await importPlayerStats(records, { dryRun, skipDuplicates });
        break;
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
    
    console.log('Import completed successfully');
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
}

/**
 * Import matches data
 */
async function importMatches(
  records: Record[],
  options: { dryRun: boolean; skipDuplicates: boolean }
): Promise<void> {
  const { dryRun, skipDuplicates } = options;
  const processedRecords = records.map(record => ({
    match_date: record.match_date,
    home_team_id: record.home_team_id,
    away_team_id: record.away_team_id,
    home_score: parseInt(record.home_score as string, 10) || null,
    away_score: parseInt(record.away_score as string, 10) || null,
    venue: record.venue || 'Unknown',
    match_type: record.match_type || 'friendly',
    notes: record.notes || null,
    external_id: record.external_id || null,
  }));
  
  // Log the first record as an example
  console.log('Sample record:', processedRecords[0]);
  
  if (dryRun) {
    console.log(`DRY RUN: Would import ${processedRecords.length} matches`);
    return;
  }
  
  // Import data in batches
  const batchSize = 100;
  for (let i = 0; i < processedRecords.length; i += batchSize) {
    const batch = processedRecords.slice(i, i + batchSize);
    console.log(`Importing batch ${i / batchSize + 1}/${Math.ceil(processedRecords.length / batchSize)}`);
    
    const { error } = await supabase
      .from('matches')
      .upsert(batch, { 
        onConflict: skipDuplicates ? 'external_id' : undefined,
        ignoreDuplicates: skipDuplicates,
      });
    
    if (error) {
      throw new Error(`Failed to import matches batch: ${error.message}`);
    }
    
    console.log(`Successfully imported ${batch.length} matches`);
  }
}

/**
 * Import players data
 */
async function importPlayers(
  records: Record[],
  options: { dryRun: boolean; skipDuplicates: boolean }
): Promise<void> {
  const { dryRun, skipDuplicates } = options;
  const processedRecords = records.map(record => ({
    name: record.name,
    position: record.position || null,
    team_id: record.team_id || null,
    date_of_birth: record.date_of_birth || null,
    height_cm: parseInt(record.height_cm as string, 10) || null,
    preferred_foot: record.preferred_foot || null,
    jersey_number: parseInt(record.jersey_number as string, 10) || null,
    external_id: record.external_id || null,
    is_active: record.is_active === true || record.is_active === 'true' || record.is_active === '1' || record.is_active === 'yes',
  }));
  
  // Log the first record as an example
  console.log('Sample record:', processedRecords[0]);
  
  if (dryRun) {
    console.log(`DRY RUN: Would import ${processedRecords.length} players`);
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
        onConflict: skipDuplicates ? 'external_id' : undefined,
        ignoreDuplicates: skipDuplicates,
      });
    
    if (error) {
      throw new Error(`Failed to import players batch: ${error.message}`);
    }
    
    console.log(`Successfully imported ${batch.length} players`);
  }
}

/**
 * Import teams data
 */
async function importTeams(
  records: Record[],
  options: { dryRun: boolean; skipDuplicates: boolean }
): Promise<void> {
  const { dryRun, skipDuplicates } = options;
  const processedRecords = records.map(record => ({
    name: record.name,
    team_type: record.team_type || 'internal',
    primary_shirt_color: record.primary_shirt_color || '#000000',
    secondary_shirt_color: record.secondary_shirt_color || null,
    logo_url: record.logo_url || null,
    external_id: record.external_id || null,
    is_active: record.is_active === true || record.is_active === 'true' || record.is_active === '1' || record.is_active === 'yes',
  }));
  
  // Log the first record as an example
  console.log('Sample record:', processedRecords[0]);
  
  if (dryRun) {
    console.log(`DRY RUN: Would import ${processedRecords.length} teams`);
    return;
  }
  
  // Import data in batches
  const batchSize = 100;
  for (let i = 0; i < processedRecords.length; i += batchSize) {
    const batch = processedRecords.slice(i, i + batchSize);
    console.log(`Importing batch ${i / batchSize + 1}/${Math.ceil(processedRecords.length / batchSize)}`);
    
    const { error } = await supabase
      .from('teams')
      .upsert(batch, { 
        onConflict: skipDuplicates ? 'external_id' : undefined,
        ignoreDuplicates: skipDuplicates,
      });
    
    if (error) {
      throw new Error(`Failed to import teams batch: ${error.message}`);
    }
    
    console.log(`Successfully imported ${batch.length} teams`);
  }
}

/**
 * Import player stats data
 */
async function importPlayerStats(
  records: Record[],
  options: { dryRun: boolean; skipDuplicates: boolean }
): Promise<void> {
  const { dryRun, skipDuplicates } = options;
  const processedRecords = records.map(record => ({
    player_id: record.player_id,
    match_id: record.match_id,
    team_id: record.team_id,
    goals: parseInt(record.goals as string, 10) || 0,
    assists: parseInt(record.assists as string, 10) || 0,
    minutes_played: parseInt(record.minutes_played as string, 10) || 0,
    yellow_cards: parseInt(record.yellow_cards as string, 10) || 0,
    red_cards: parseInt(record.red_cards as string, 10) || 0,
    clean_sheet: record.clean_sheet === true || record.clean_sheet === 'true' || record.clean_sheet === '1' || record.clean_sheet === 'yes',
    external_id: record.external_id || null,
  }));
  
  // Log the first record as an example
  console.log('Sample record:', processedRecords[0]);
  
  if (dryRun) {
    console.log(`DRY RUN: Would import ${processedRecords.length} player stats`);
    return;
  }
  
  // First, ensure all players are assigned to the correct teams for these matches
  console.log('Ensuring player-team-match assignments...');
  const assignments = processedRecords.map(record => ({
    player_id: record.player_id,
    match_id: record.match_id,
    team_id: record.team_id,
  }));
  
  // Create unique assignments (no duplicates)
  const uniqueAssignments = Array.from(
    new Map(assignments.map(item => [
      `${item.player_id}-${item.match_id}-${item.team_id}`, 
      item
    ])).values()
  );
  
  // Import assignments
  const { error: assignmentError } = await supabase
    .from('player_match_assignments')
    .upsert(uniqueAssignments, {
      onConflict: 'player_id,match_id',
      ignoreDuplicates: true,
    });
  
  if (assignmentError) {
    throw new Error(`Failed to create player-match assignments: ${assignmentError.message}`);
  }
  
  console.log(`Successfully created ${uniqueAssignments.length} player-match assignments`);
  
  // Now import the actual stats
  const batchSize = 100;
  for (let i = 0; i < processedRecords.length; i += batchSize) {
    const batch = processedRecords.slice(i, i + batchSize);
    console.log(`Importing stats batch ${i / batchSize + 1}/${Math.ceil(processedRecords.length / batchSize)}`);
    
    const { error } = await supabase
      .from('player_match_stats')
      .upsert(batch, { 
        onConflict: skipDuplicates ? 'player_id,match_id' : undefined,
        ignoreDuplicates: skipDuplicates,
      });
    
    if (error) {
      throw new Error(`Failed to import player stats batch: ${error.message}`);
    }
    
    console.log(`Successfully imported ${batch.length} player stats`);
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
    } else if (arg === '--type' || arg === '-t') {
      options.dataType = args[++i] as DataType;
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
  
  if (!options.dataType) {
    console.error('Error: Missing required --type option');
    printHelp();
    process.exit(1);
  }
  
  return options as ImportOptions;
}

function printHelp(): void {
  console.log(`
Usage: npx ts-node src/scripts/import-historical-data.ts --file <path> --type <dataType> [options]

Required:
  --file, -f <path>       Path to the CSV file to import
  --type, -t <dataType>   Type of data to import: matches, players, teams, player_stats

Options:
  --dry-run              Run in dry-run mode (no changes will be made)
  --no-skip-duplicates   Don't skip duplicate records
  --help, -h             Show this help message
  
Examples:
  # Import players in dry-run mode
  npx ts-node src/scripts/import-historical-data.ts --file ./data/players.csv --type players --dry-run
  
  # Import matches
  npx ts-node src/scripts/import-historical-data.ts --file ./data/matches.csv --type matches
  `);
}

// Execute if called directly
if (require.main === module) {
  const options = parseArgs();
  importHistoricalData(options).catch(err => {
    console.error('Error during import:', err);
    process.exit(1);
  });
}

export { importHistoricalData }; 