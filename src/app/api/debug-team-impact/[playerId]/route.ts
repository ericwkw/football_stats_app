import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: { playerId: string } }
) {
  const playerId = context.params.playerId;
  
  try {
    // Initialize Supabase client from environment
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    // Get raw SQL data directly
    const { data: directSqlData, error: directSqlError } = await supabase.from('player_match_assignments')
      .select(`
        player_id,
        team_id,
        match_id,
        teams:team_id (name, team_type),
        matches:match_id (
          match_date,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          match_type
        )
      `)
      .eq('player_id', playerId)
      .order('match_id', { ascending: false })
      .limit(50);
    
    // Try to get player team assignments
    const { data: playerTeams, error: teamsError } = await supabase
      .from('player_match_assignments')
      .select('team_id')
      .eq('player_id', playerId)
      .order('team_id')
      .limit(100);
    
    // Get distinct teams this player has played for
    const distinctTeams = playerTeams 
      ? [...new Set(playerTeams.map((pt: { team_id: string }) => pt.team_id))]
      : [];
    
    // Call the team impact RPC function
    const { data: teamImpactData, error: rpcError } = await supabase
      .rpc('get_player_all_teams_impact', { player_id_param: playerId });
    
    // Fetch the raw SQL structure for diagnostic purposes
    const { data: functionDef, error: functionDefError } = await supabase
      .from('pg_proc')
      .select('prosrc')
      .ilike('proname', 'get_player_all_teams_impact')
      .limit(1);
    
    // Create diagnostic data to return
    const diagnosticData = {
      player_id: playerId,
      distinct_teams_count: distinctTeams.length,
      distinct_teams: distinctTeams,
      team_assignments_sample: directSqlData?.slice(0, 10) || [],
      team_impact_result: teamImpactData || [],
      errors: {
        direct_sql_error: directSqlError?.message || null,
        teams_error: teamsError?.message || null,
        rpc_error: rpcError?.message || null,
        function_def_error: functionDefError?.message || null
      },
      function_definition: functionDef?.[0]?.prosrc || null,
      debug_info: {
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url
      }
    };
    
    return NextResponse.json(diagnosticData);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
} 