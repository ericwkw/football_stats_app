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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data: csvData, dryRun = false, skipDuplicates = true } = body;

    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      comment: '#', // Skip lines starting with #
    });

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid records found in the uploaded file',
      }, { status: 400 });
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

    // Validation
    const errors = [];
    for (let i = 0; i < processedRecords.length; i++) {
      const record = processedRecords[i];
      if (!record.name) {
        errors.push(`Row ${i + 2}: Missing required field 'name'`);
      }
      if (!record.team_type) {
        errors.push(`Row ${i + 2}: Missing required field 'team_type'`);
      } else if (!['internal', 'external', 'club'].includes(record.team_type)) {
        errors.push(`Row ${i + 2}: Invalid team_type '${record.team_type}'. Must be one of: internal, external, club`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Validation errors found',
        errors,
      }, { status: 400 });
    }

    // For dry run, just return success without making changes
    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: `Validated ${processedRecords.length} teams successfully (dry run)`,
        records: processedRecords.length,
      });
    }

    // Insert data
    const { error } = await supabase
      .from('teams')
      .upsert(processedRecords, { 
        onConflict: skipDuplicates ? 'name' : undefined,
        ignoreDuplicates: skipDuplicates,
      });

    if (error) {
      console.error('Error importing teams:', error);
      return NextResponse.json({
        success: false,
        message: `Error importing teams: ${error.message}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${processedRecords.length} teams`,
      records: processedRecords.length,
    });
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json({
      success: false,
      message: `Error processing request: ${error.message}`,
    }, { status: 500 });
  }
} 