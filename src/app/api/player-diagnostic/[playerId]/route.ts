import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const playerId = await params.playerId;
    console.log('Running player diagnostics for:', playerId);
    
    // 1. Get basic player info
    const playerResponse = await supabase
      .from('players')
      .select('id, name, position, team_id')
      .eq('id', playerId)
      .single();
    
    if (playerResponse.error) {
      return NextResponse.json({ error: 'Player not found', details: playerResponse.error.message }, { status: 404 });
    }

    // 2. Get player's match assignments
    const assignmentsResponse = await supabase
      .from('player_match_assignments')
      .select(`
        id, match_id, team_id,
        matches:match_id (
          id, match_date, home_team_id, away_team_id, home_score, away_score,
          home_team:home_team_id (name),
          away_team:away_team_id (name)
        )
      `)
      .eq('player_id', playerId)
      .order('id', { ascending: false });

    // 3. Get player's match stats
    const statsResponse = await supabase
      .from('player_match_stats')
      .select('id, match_id, goals, assists, minutes_played')
      .eq('player_id', playerId);

    // 4. Get specific team performance data
    let teamPerformanceResponse = null;
    
    if (playerResponse.data?.team_id) {
      teamPerformanceResponse = await supabase
        .rpc('get_team_performance_with_player', {
          player_id_param: playerId,
          team_id_param: playerResponse.data.team_id
        });
    }

    // Return all collected data
    return NextResponse.json({
      player: playerResponse.data,
      assignments: assignmentsResponse.data || [],
      assignmentsError: assignmentsResponse.error,
      stats: statsResponse.data || [],
      statsError: statsResponse.error,
      teamPerformance: teamPerformanceResponse?.data || [],
      teamPerformanceError: teamPerformanceResponse?.error
    });
    
  } catch (error: any) {
    console.error('Error in player diagnostic API:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
} 