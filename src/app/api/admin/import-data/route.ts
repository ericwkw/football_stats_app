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

type DataType = 'matches' | 'players' | 'teams' | 'player_stats';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - this should be extended with proper auth check
    // For now, we'll assume this is an admin-only endpoint
    
    // Parse request
    const { dataType, data, dryRun = true, skipDuplicates = true } = await request.json();
    
    if (!dataType || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: dataType and data' },
        { status: 400 }
      );
    }
    
    if (!['matches', 'players', 'teams', 'player_stats'].includes(dataType)) {
      return NextResponse.json(
        { error: `Invalid dataType: ${dataType}` },
        { status: 400 }
      );
    }
    
    // Parse CSV data
    const records = parse(data, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    if (records.length === 0) {
      return NextResponse.json(
        { message: 'No records found in the CSV file' },
        { status: 200 }
      );
    }
    
    // Process records based on type
    const { processedRecords, errors } = processRecords(dataType, records);
    
    if (errors.length > 0 && errors.length === records.length) {
      return NextResponse.json(
        { 
          error: 'All records have validation errors', 
          errors,
        },
        { status: 400 }
      );
    }
    
    // In dry run mode, we just return the validation results
    if (dryRun) {
      return NextResponse.json({
        message: 'Validation completed successfully',
        records: processedRecords.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    }
    
    // Import the data
    const result = await importRecords(dataType, processedRecords, skipDuplicates);
    
    return NextResponse.json({
      message: `Import completed with ${result.imported} records imported`,
      records: result.imported,
      errors: result.errors,
    });
    
  } catch (error) {
    console.error('Import API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

function processRecords(dataType: DataType, records: any[]) {
  const processedRecords: any[] = [];
  const errors: string[] = [];
  
  records.forEach((record, index) => {
    try {
      let processedRecord;
      
      switch (dataType) {
        case 'teams':
          processedRecord = {
            name: validateRequired(record.name, 'name', index),
            team_type: record.team_type || 'internal',
            primary_shirt_color: record.primary_shirt_color || '#000000',
            secondary_shirt_color: record.secondary_shirt_color || null,
            logo_url: record.logo_url || null,
            external_id: record.external_id || null,
            is_active: parseBoolean(record.is_active, true),
          };
          break;
          
        case 'players':
          processedRecord = {
            name: validateRequired(record.name, 'name', index),
            position: record.position || null,
            team_id: record.team_id || null,
            date_of_birth: record.date_of_birth || null,
            height_cm: parseInt(record.height_cm, 10) || null,
            preferred_foot: record.preferred_foot || null,
            jersey_number: parseInt(record.jersey_number, 10) || null,
            external_id: record.external_id || null,
            is_active: parseBoolean(record.is_active, true),
          };
          break;
          
        case 'matches':
          processedRecord = {
            match_date: validateRequired(record.match_date, 'match_date', index),
            home_team_id: validateRequired(record.home_team_id, 'home_team_id', index),
            away_team_id: validateRequired(record.away_team_id, 'away_team_id', index),
            home_score: parseInt(record.home_score, 10) || null,
            away_score: parseInt(record.away_score, 10) || null,
            venue: record.venue || 'Unknown',
            match_type: record.match_type || 'friendly',
            notes: record.notes || null,
            external_id: record.external_id || null,
          };
          break;
          
        case 'player_stats':
          processedRecord = {
            player_id: validateRequired(record.player_id, 'player_id', index),
            match_id: validateRequired(record.match_id, 'match_id', index),
            team_id: validateRequired(record.team_id, 'team_id', index),
            goals: parseInt(record.goals, 10) || 0,
            assists: parseInt(record.assists, 10) || 0,
            minutes_played: parseInt(record.minutes_played, 10) || 0,
            yellow_cards: parseInt(record.yellow_cards, 10) || 0,
            red_cards: parseInt(record.red_cards, 10) || 0,
            clean_sheet: parseBoolean(record.clean_sheet, false),
            external_id: record.external_id || null,
          };
          break;
      }
      
      processedRecords.push(processedRecord);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Error on record ${index + 1}`);
    }
  });
  
  return { processedRecords, errors };
}

async function importRecords(dataType: DataType, records: any[], skipDuplicates: boolean) {
  const importErrors: string[] = [];
  let importedCount = 0;
  
  try {
    // Handle player stats special case
    if (dataType === 'player_stats') {
      // First, ensure all players are assigned to the correct teams for these matches
      const assignments = records.map(record => ({
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
        importErrors.push(`Failed to create player-match assignments: ${assignmentError.message}`);
      }
    }
    
    // Import in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from(getTableName(dataType))
        .upsert(batch, { 
          onConflict: skipDuplicates ? getConflictColumn(dataType) : undefined,
          ignoreDuplicates: skipDuplicates,
        });
      
      if (error) {
        importErrors.push(`Batch import error (${i / batchSize + 1}): ${error.message}`);
      } else {
        importedCount += batch.length;
      }
    }
    
    return {
      imported: importedCount,
      errors: importErrors.length > 0 ? importErrors : undefined,
    };
  } catch (error) {
    return {
      imported: importedCount,
      errors: [error instanceof Error ? error.message : 'Unknown import error'],
    };
  }
}

// Helper functions
function validateRequired(value: any, fieldName: string, recordIndex: number): any {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Record ${recordIndex + 1}: Missing required field '${fieldName}'`);
  }
  return value;
}

function parseBoolean(value: any, defaultValue: boolean): boolean {
  if (value === undefined || value === null) return defaultValue;
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function getTableName(dataType: DataType): string {
  switch (dataType) {
    case 'teams': return 'teams';
    case 'players': return 'players';
    case 'matches': return 'matches';
    case 'player_stats': return 'player_match_stats';
    default: return '';
  }
}

function getConflictColumn(dataType: DataType): string {
  switch (dataType) {
    case 'teams': return 'external_id';
    case 'players': return 'external_id';
    case 'matches': return 'external_id';
    case 'player_stats': return 'player_id,match_id';
    default: return '';
  }
} 