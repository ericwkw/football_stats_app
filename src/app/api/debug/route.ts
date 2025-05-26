import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Debug API called with message:', body.message);
    
    // Test the multi-team impact function directly
    if (body.playerId) {
      const { data, error } = await supabase
        .rpc('get_player_all_teams_impact', { 
          player_id_param: body.playerId 
        });
      
      if (error) {
        console.error('API Debug - Error fetching multi-team impact data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      console.log('API Debug - Team impact data:', data);
      return NextResponse.json({ success: true, data });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Failed to process debug request' }, { status: 500 });
  }
} 