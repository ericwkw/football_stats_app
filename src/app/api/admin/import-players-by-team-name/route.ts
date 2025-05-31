import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

interface TeamRecord {
  id: string;
  name: string;
}

interface PlayerRecord {
  name: string;
  position: string | null;
  team_name: string;
  jersey_number: string | null;
  height_cm: string | null;
  weight_kg: string | null;
  dominant_foot: string | null;
}

interface ProcessedPlayerRecord {
  name: string;
  position: string | null;
  team_id: string;
  jersey_number: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_foot: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { data: csvData, dryRun = false, skipDuplicates = true } = requestData;
    
    if (!csvData) {
      return NextResponse.json(
        { message: 'No data provided' },
        { status: 400 }
      );
    }
    
    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as PlayerRecord[];
    
    if (records.length === 0) {
      return NextResponse.json(
        { message: 'No records found in the provided data', records: 0 },
        { status: 200 }
      );
    }
    
    // Fetch all teams from the database to use for name resolution
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name');
    
    if (teamsError) {
      return NextResponse.json(
        { message: `Failed to fetch teams: ${teamsError.message}` },
        { status: 500 }
      );
    }
    
    if (!teams || teams.length === 0) {
      return NextResponse.json(
        { message: 'No teams found in the database. Please create teams first.' },
        { status: 400 }
      );
    }
    
    // Create a map of team names to IDs for quick lookup
    const teamNameToIdMap = new Map<string, string>();
    teams.forEach((team: TeamRecord) => {
      teamNameToIdMap.set(team.name.toLowerCase(), team.id);
    });
    
    // Process records and resolve team names to IDs
    const processedRecords: ProcessedPlayerRecord[] = [];
    const errors: string[] = [];
    
    for (const record of records) {
      const teamName = record.team_name;
      
      if (!teamName) {
        errors.push(`Player "${record.name}" skipped - missing team name`);
        continue;
      }
      
      const teamId = teamNameToIdMap.get(teamName.toLowerCase());
      
      if (!teamId) {
        errors.push(`Player "${record.name}" skipped - team "${teamName}" not found in database`);
        continue;
      }
      
      processedRecords.push({
        name: record.name,
        position: record.position,
        team_id: teamId,
        jersey_number: record.jersey_number ? parseInt(record.jersey_number, 10) : null,
        height_cm: record.height_cm ? parseInt(record.height_cm, 10) : null,
        weight_kg: record.weight_kg ? parseInt(record.weight_kg, 10) : null,
        dominant_foot: record.dominant_foot || null,
      });
    }
    
    if (processedRecords.length === 0) {
      return NextResponse.json(
        { 
          message: 'No valid records found after team name resolution', 
          records: 0,
          errors: errors.length > 0 ? errors : undefined,
        },
        { status: 200 }
      );
    }
    
    if (dryRun) {
      return NextResponse.json(
        { 
          message: `Dry run completed. ${processedRecords.length} players would be imported.`, 
          records: processedRecords.length,
          errors: errors.length > 0 ? errors : undefined,
        },
        { status: 200 }
      );
    }
    
    // Import data in batches
    const importErrors: string[] = [];
    let importedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < processedRecords.length; i += batchSize) {
      const batch = processedRecords.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('players')
        .upsert(batch, { 
          onConflict: skipDuplicates ? 'name,team_id' : undefined,
          ignoreDuplicates: skipDuplicates,
        });
      
      if (error) {
        importErrors.push(`Batch import error: ${error.message}`);
      } else {
        importedCount += batch.length;
      }
    }
    
    return NextResponse.json(
      { 
        message: `Successfully imported ${importedCount} players.`, 
        records: importedCount,
        errors: [...errors, ...importErrors].length > 0 ? [...errors, ...importErrors] : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in import-players-by-team-name:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unknown error occurred during import' },
      { status: 500 }
    );
  }
} 