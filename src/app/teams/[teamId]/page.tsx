'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { TeamGoalsChart, PlayerCombinationsChart } from '@/components/Charts';

interface TeamDetail {
  id: string;
  name: string;
  primary_shirt_color: string;
  team_type?: 'club' | 'external' | 'internal';
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
}

interface TeamPlayer {
  id: string;
  name: string;
  position: string;
  goals: number;
  assists: number;
}

interface TeamMatch {
  id: string;
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  venue: string;
  match_type: string;
  is_home: boolean;
}

// Type for top scorers
interface TopScorer {
  player_id: string;
  player_name: string;
  team_id: string;
  team_name?: string;
  total_goals: number;
  weighted_goals: number;
  matches_played: number;
}

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [teamTopScorers, setTeamTopScorers] = useState<TopScorer[]>([]);
  const [recentMatches, setRecentMatches] = useState<TeamMatch[]>([]);
  const [playerCombinations, setPlayerCombinations] = useState<Array<{
    player1_id: string;
    player1_name: string;
    player2_id: string;
    player2_name: string;
    total_matches: number;
    win_matches: number;
    draw_matches: number;
    loss_matches: number;
    win_rate: number;
    win_rate_as_opponents?: number | null;
  }>>([]);

  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get team details first to determine team type
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();
        
        if (teamError) throw new Error(`Failed to fetch team: ${teamError.message}`);
        
        // Get team statistics based on team type
        let teamStats;
        let teamStatsDetail;
        
        if (teamData.team_type === 'internal') {
          const { data: internalTeamStats, error: internalTeamStatsError } = await supabase
            .rpc('get_internal_team_statistics');
          
          if (internalTeamStatsError) throw new Error(`Failed to fetch internal team statistics: ${internalTeamStatsError.message}`);
          
          type TeamStatsRecord = {
            id: string;
            name: string;
            matches_played: number;
            wins: number;
            draws: number;
            losses: number;
            goals_for: number;
            goals_against: number;
          };
          teamStats = internalTeamStats;
          teamStatsDetail = (teamStats as TeamStatsRecord[]).find((t) => t.id === teamId);
        } else if (teamData.team_type === 'club') {
          const { data: clubTeamStats, error: clubTeamStatsError } = await supabase
            .rpc('get_club_team_statistics');
          
          if (clubTeamStatsError) throw new Error(`Failed to fetch club team statistics: ${clubTeamStatsError.message}`);
          
          type TeamStatsRecord = {
            id: string;
            name: string;
            matches_played: number;
            wins: number;
            draws: number;
            losses: number;
            goals_for: number;
            goals_against: number;
          };
          teamStats = clubTeamStats;
          teamStatsDetail = (teamStats as TeamStatsRecord[]).find((t) => t.id === teamId);
        } else {
          // Fallback to the original function for external teams
          const { data: allTeamStats, error: allTeamStatsError } = await supabase
            .rpc('get_team_statistics');
          
          if (allTeamStatsError) throw new Error(`Failed to fetch team statistics: ${allTeamStatsError.message}`);
          
          type TeamStatsRecord = {
            id: string;
            name: string;
            matches_played: number;
            wins: number;
            draws: number;
            losses: number;
            goals_for: number;
            goals_against: number;
          };
          teamStats = allTeamStats;
          teamStatsDetail = (teamStats as TeamStatsRecord[]).find((t) => t.id === teamId);
        }
        
        if (!teamStatsDetail) throw new Error('Team statistics not found');
        
        // Combine team data
        setTeamDetail({
          ...teamData,
          ...teamStatsDetail
        });
        
        // Get appropriate player function based on team type
        let playerStats;
        if (teamData.team_type === 'internal') {
          const { data: internalPlayerStats, error: internalPlayerStatsError } = await supabase
            .rpc('get_internal_all_player_statistics');
          
          if (internalPlayerStatsError) throw new Error(`Failed to fetch internal player statistics: ${internalPlayerStatsError.message}`);
          playerStats = internalPlayerStats;
        } else if (teamData.team_type === 'club') {
          const { data: clubPlayerStats, error: clubPlayerStatsError } = await supabase
            .rpc('get_club_all_player_statistics');
          
          if (clubPlayerStatsError) throw new Error(`Failed to fetch club player statistics: ${clubPlayerStatsError.message}`);
          playerStats = clubPlayerStats;
        } else {
          const { data: allPlayerStats, error: allPlayerStatsError } = await supabase
            .rpc('get_all_player_statistics');
          
          if (allPlayerStatsError) throw new Error(`Failed to fetch player statistics: ${allPlayerStatsError.message}`);
          playerStats = allPlayerStats;
        }
        
        // Get team players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('id, name, position, team_id')
          .eq('team_id', teamId);
        
        if (playersError) throw new Error(`Failed to fetch team players: ${playersError.message}`);
        
        // Get player statistics for those players
        if (playersData && playersData.length > 0) {
          type PlayerStatsRecord = {
            player_id: string;
            goals: number;
            assists: number;
          };
          const teamPlayersWithStats = (playersData as {id: string; name: string; position: string;}[]).map((player) => {
            const stats = (playerStats as PlayerStatsRecord[]).find((s) => s.player_id === player.id) || { goals: 0, assists: 0 };
            return {
              id: player.id,
              name: player.name,
              position: player.position || 'N/A',
              goals: stats.goals || 0,
              assists: stats.assists || 0
            };
          });
          
          setTeamPlayers(teamPlayersWithStats);
        } else {
          setTeamPlayers([]);
        }
        
        // Get top scorers for this team (includes players who played for this team in any match)
        try {
          let topScorersData: TopScorer[] = [];
          if (teamData.team_type === 'internal') {
            // For internal teams, use the internal top scorers function
            const { data, error } = await supabase
              .rpc('get_internal_top_scorers', { 
                limit_count: 10
              });
            
            if (error) {
              console.error('Failed to fetch internal team top scorers:', error);
            } else {
              // Filter to only include players from this team
              topScorersData = data ? data.filter((p: TopScorer) => p.team_id === teamId) : [];
            }
          } else if (teamData.team_type === 'club') {
            // For club teams, use the club top scorers function
            const { data, error } = await supabase
              .rpc('get_club_top_scorers', { 
                limit_count: 10
              });
            
            if (error) {
              console.error('Failed to fetch club team top scorers:', error);
            } else {
              // Filter to only include players from this team
              topScorersData = data ? data.filter((p: TopScorer) => p.team_id === teamId) : [];
            }
          } else {
            // For other teams, use the original function
            const { data, error } = await supabase
              .rpc('get_team_top_scorers', { 
                team_id_param: teamId,
                limit_count: 10
              });
            
            if (error) {
              console.error('Failed to fetch team top scorers:', error);
            } else {
              topScorersData = data || [];
            }
          }
          
          setTeamTopScorers(topScorersData || []);
        } catch (error) {
          console.error('Error fetching top scorers:', error);
        }
        
        // Get recent matches
        const { data: homeMatches, error: homeMatchesError } = await supabase
          .from('matches')
          .select(`
            id,
            match_date,
            home_score,
            away_score,
            venue,
            match_type,
            home_team_id,
            away_team_id,
            home_team:home_team_id(name),
            away_team:away_team_id(name)
          `)
          .eq('home_team_id', teamId)
          .order('match_date', { ascending: false })
          .limit(5);
        
        if (homeMatchesError) throw new Error(`Failed to fetch home matches: ${homeMatchesError.message}`);
        
        const { data: awayMatches, error: awayMatchesError } = await supabase
          .from('matches')
          .select(`
            id,
            match_date,
            home_score,
            away_score,
            venue,
            match_type,
            home_team_id,
            away_team_id,
            home_team:home_team_id(name),
            away_team:away_team_id(name)
          `)
          .eq('away_team_id', teamId)
          .order('match_date', { ascending: false })
          .limit(5);
        
        if (awayMatchesError) throw new Error(`Failed to fetch away matches: ${awayMatchesError.message}`);
        
        // Combine and format match data
        const formattedHomeMatches = ((homeMatches || []) as unknown as unknown[]).map((rawMatch: unknown): TeamMatch => {
          const match = rawMatch as {
            id: string;
            match_date: string;
            home_team_id: string;
            away_team_id: string;
            home_team?: { name: string }[] | { name: string };
            away_team?: { name: string }[] | { name: string };
            home_score: number | null;
            away_score: number | null;
            venue: string;
            match_type: string;
          };
          return {
            id: match.id,
            match_date: match.match_date,
            home_team_id: match.home_team_id,
            away_team_id: match.away_team_id,
            home_team_name: Array.isArray(match.home_team) ? (match.home_team[0]?.name || 'Unknown') : (match.home_team?.name || 'Unknown'),
            away_team_name: Array.isArray(match.away_team) ? (match.away_team[0]?.name || 'Unknown') : (match.away_team?.name || 'Unknown'),
            home_score: match.home_score,
            away_score: match.away_score,
            venue: match.venue,
            match_type: match.match_type,
            is_home: true
          };
        });
        
        const formattedAwayMatches = ((awayMatches || []) as unknown as unknown[]).map((rawMatch: unknown): TeamMatch => {
          const match = rawMatch as {
            id: string;
            match_date: string;
            home_team_id: string;
            away_team_id: string;
            home_team?: { name: string }[] | { name: string };
            away_team?: { name: string }[] | { name: string };
            home_score: number | null;
            away_score: number | null;
            venue: string;
            match_type: string;
          };
          return {
            id: match.id,
            match_date: match.match_date,
            home_team_id: match.home_team_id,
            away_team_id: match.away_team_id,
            home_team_name: Array.isArray(match.home_team) ? (match.home_team[0]?.name || 'Unknown') : (match.home_team?.name || 'Unknown'),
            away_team_name: Array.isArray(match.away_team) ? (match.away_team[0]?.name || 'Unknown') : (match.away_team?.name || 'Unknown'),
            home_score: match.home_score,
            away_score: match.away_score,
            venue: match.venue,
            match_type: match.match_type,
            is_home: false
          };
        });
        
        // Combine, sort by date (recent first), and limit to 10
        const allMatches = [...formattedHomeMatches, ...formattedAwayMatches]
          .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
          .slice(0, 10);
        
        setRecentMatches(allMatches);

        // Fetch player combinations data for this team
        const { data: combinationsData, error: combinationsError } = await supabase
          .rpc('get_player_combinations', { 
            min_matches_param: 2,
            limit_param: 50
          });
        
        if (combinationsError) {
          console.error('Failed to fetch player combinations:', combinationsError);
        } else {
          // Filter combinations to only include players from this team
          // We'll look for combinations where both players are/were on this team
          const playerIds = (teamPlayers || []).map(player => player.id);
          const teamCombinations = (combinationsData || []).filter(
            (combo: {
              player1_id: string;
              player2_id: string;
            }) => 
              playerIds.includes(combo.player1_id) && 
              playerIds.includes(combo.player2_id)
          );
          
          setPlayerCombinations(teamCombinations);
        }
      } catch (err: unknown) {
        console.error('Error fetching team data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading team data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/teams" className="text-blue-600 hover:underline mb-8 inline-block">
            &larr; Back to Teams
          </Link>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!teamDetail) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/teams" className="text-blue-600 hover:underline mb-8 inline-block">
            &larr; Back to Teams
          </Link>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p>Team not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate points and goal difference
  const points = teamDetail.wins * 3 + teamDetail.draws;
  const goalDifference = teamDetail.goals_for - teamDetail.goals_against;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">{teamDetail.name}</h1>
          <div className="flex justify-center items-center mt-2">
            <span 
              className="inline-block w-6 h-6 rounded-full mr-2" 
              style={{ backgroundColor: teamDetail.primary_shirt_color || '#1e40af' }}
            ></span>
            <p className="text-center">Team Color: {getColorName(teamDetail.primary_shirt_color)}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/teams" className="text-blue-600 hover:underline">
            &larr; Back to Teams
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Team Performance</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Matches Played</p>
              <p className="text-2xl font-bold text-blue-600">{teamDetail.matches_played}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Points</p>
              <p className="text-2xl font-bold text-blue-600">{points}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Record (W-D-L)</p>
              <p className="text-2xl font-bold text-blue-600">
                {teamDetail.wins}-{teamDetail.draws}-{teamDetail.losses}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Goal Difference</p>
              <p className={`text-2xl font-bold ${
                goalDifference > 0 ? 'text-green-600' : 
                goalDifference < 0 ? 'text-red-600' : 'text-blue-600'
              }`}>
                {goalDifference > 0 ? `+${goalDifference}` : goalDifference}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Goals For</p>
              <p className="text-2xl font-bold text-blue-600">{teamDetail.goals_for}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Goals Against</p>
              <p className="text-2xl font-bold text-blue-600">{teamDetail.goals_against}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Win Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {teamDetail.matches_played > 0 
                  ? `${Math.round((teamDetail.wins / teamDetail.matches_played) * 100)}%` 
                  : '0%'}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Avg. Goals/Game</p>
              <p className="text-2xl font-bold text-blue-600">
                {teamDetail.matches_played > 0 
                  ? (teamDetail.goals_for / teamDetail.matches_played).toFixed(1) 
                  : '0.0'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Team Players</h2>
            
            {teamPlayers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goals</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assists</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamPlayers.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Link href={`/players/${player.id}`} className="hover:underline">
                            {player.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.position}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.goals}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.assists}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No players currently assigned to this team.</p>
            )}
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Team Scorers</h2>
            
            {teamTopScorers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goals</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weighted Goals</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamTopScorers.map((player) => (
                      <tr key={player.player_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Link href={`/players/${player.player_id}`} className="hover:underline">
                            {player.player_name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.matches_played}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.total_goals}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.weighted_goals.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 text-xs text-gray-500 italic">
                  Note: Includes all players who have played for this team in any match. Weighted goals count external match goals as 3x.
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No scoring data available for this team.</p>
            )}
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Matches</h2>
          
          {recentMatches.length > 0 ? (
            <div className="space-y-4">
              {recentMatches.map((match) => {
                // Determine result (win, loss, draw) from team's perspective
                let result = 'Not Played';
                let resultClass = 'bg-gray-100 text-gray-800';
                
                if (match.home_score !== null && match.away_score !== null) {
                  if (match.is_home) {
                    if (match.home_score > match.away_score) {
                      result = 'Win';
                      resultClass = 'bg-green-100 text-green-800';
                    } else if (match.home_score < match.away_score) {
                      result = 'Loss';
                      resultClass = 'bg-red-100 text-red-800';
                    } else {
                      result = 'Draw';
                      resultClass = 'bg-yellow-100 text-yellow-800';
                    }
                  } else {
                    if (match.away_score > match.home_score) {
                      result = 'Win';
                      resultClass = 'bg-green-100 text-green-800';
                    } else if (match.away_score < match.home_score) {
                      result = 'Loss';
                      resultClass = 'bg-red-100 text-red-800';
                    } else {
                      result = 'Draw';
                      resultClass = 'bg-yellow-100 text-yellow-800';
                    }
                  }
                }
                
                return (
                  <div key={match.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">
                        {new Date(match.match_date).toLocaleDateString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        match.match_type === 'external_game' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {match.match_type === 'external_game' ? 'External' : 'Internal'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className={`text-center ${match.is_home ? 'font-semibold' : ''}`}>
                        {match.home_team_name}
                      </div>
                      
                      <div className="text-center px-4">
                        {match.home_score !== null && match.away_score !== null 
                          ? `${match.home_score} - ${match.away_score}`
                          : 'vs'}
                      </div>
                      
                      <div className={`text-center ${!match.is_home ? 'font-semibold' : ''}`}>
                        {match.away_team_name}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500">{match.venue}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${resultClass}`}>
                        {result}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-center">
                      <Link href={`/matches/${match.id}`} className="text-blue-600 hover:underline text-sm">
                        Match Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No match data available for this team.</p>
          )}
        </div>

        {/* Team Performance Dashboard */}
        <div className="grid grid-cols-1 gap-6 mt-8">
          <div>
            <TeamGoalsChart 
              teams={[{
                id: teamDetail.id,
                name: teamDetail.name,
                goals_for: teamDetail.goals_for || 0,
                goals_against: teamDetail.goals_against || 0
              }]} 
            />
          </div>
        </div>
        
        {/* Player Combinations Analysis */}
        {playerCombinations.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">Player Combinations Analysis</h2>
            <div className="bg-white rounded-lg shadow-md p-4">
              <PlayerCombinationsChart 
                combinations={playerCombinations}
                limit={10}
                minMatches={2}
              />
              <div className="mt-4 text-sm text-gray-600">
                <p>This analysis shows which player combinations work best together on this team. Combinations with higher win rates indicate players who perform well together.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Soccer Stats App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Helper function to get a human-readable color name
function getColorName(hexColor: string): string {
  // Map hex colors to readable names
  const colorMap: Record<string, string> = {
    '#1e40af': 'Light Blue', // FCB United
    '#b91c1c': 'Red',       // Red Team
    '#172554': 'Black',     // Blue Rovers
  };
  
  return colorMap[hexColor] || 'Custom';
} 