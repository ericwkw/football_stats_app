'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface MatchDetail {
  id: string;
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  venue: string;
  match_type: 'internal_friendly' | 'external_game';
}

interface PlayerPerformance {
  player_id: string;
  player_name: string;
  team_name: string;
  assigned_team_name: string;
  position: string | null;
  goals: number;
  assists: number;
  minutes_played: number;
}

interface TeamSummary {
  team_id: string;
  team_name: string;
  players: PlayerPerformance[];
  total_goals: number;
  total_assists: number;
}

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchDetail, setMatchDetail] = useState<MatchDetail | null>(null);
  const [homeTeam, setHomeTeam] = useState<TeamSummary | null>(null);
  const [awayTeam, setAwayTeam] = useState<TeamSummary | null>(null);
  
  // Add state for navigation
  const [nextMatchId, setNextMatchId] = useState<string | null>(null);
  const [prevMatchId, setPrevMatchId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get all match IDs for navigation, sorted by date (newest first)
        const { data: allMatches, error: allMatchesError } = await supabase
          .from('matches')
          .select('id, match_date')
          .order('match_date', { ascending: false });
        
        if (allMatchesError) throw new Error(`Failed to fetch all matches: ${allMatchesError.message}`);
        
        if (allMatches && allMatches.length > 0) {
          const matchIds = allMatches.map(m => m.id);
          const currentIndex = matchIds.findIndex(id => id === matchId);
          
          if (currentIndex !== -1) {
            // Set next match ID (loop to beginning if at the end)
            setNextMatchId(matchIds[(currentIndex + 1) % matchIds.length]);
            
            // Set previous match ID (loop to end if at the beginning)
            setPrevMatchId(matchIds[(currentIndex - 1 + matchIds.length) % matchIds.length]);
          }
        }
        
        // Get match details
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select(`
            id,
            match_date,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            venue,
            match_type,
            home_team:home_team_id(id, name),
            away_team:away_team_id(id, name)
          `)
          .eq('id', matchId)
          .single();
        
        if (matchError) throw new Error(`Failed to fetch match: ${matchError.message}`);
        if (!matchData) throw new Error('Match not found');
        
        // Format the match detail
        interface NamedObject { name: string }
        function isNamedObject(obj: unknown): obj is NamedObject {
          return typeof obj === 'object' && obj !== null && 'name' in obj && typeof (obj as { name: unknown }).name === 'string';
        }
        function extractTeamName(team: unknown): string {
          if (Array.isArray(team)) {
            return (team[0] && isNamedObject(team[0])) ? team[0].name : 'Unknown';
          } else if (isNamedObject(team)) {
            return team.name;
          }
          return 'Unknown';
        }
        const formattedMatch: MatchDetail = {
          id: matchData.id,
          match_date: matchData.match_date,
          home_team_id: matchData.home_team_id,
          away_team_id: matchData.away_team_id,
          home_team_name: extractTeamName(matchData.home_team),
          away_team_name: extractTeamName(matchData.away_team),
          home_score: matchData.home_score,
          away_score: matchData.away_score,
          venue: matchData.venue,
          match_type: matchData.match_type
        };
        
        setMatchDetail(formattedMatch);
        
        // Get player performances in this match along with their assigned teams
        const { data: playerStatsData, error: playerStatsError } = await supabase
          .from('player_stats_with_assignments')
          .select(`
            id,
            player_id,
            goals,
            assists,
            minutes_played,
            assigned_team_id,
            players (
              id,
              name,
              position,
              team_id
            )
          `)
          .eq('match_id', matchId);
        
        if (playerStatsError) throw new Error(`Failed to fetch player stats: ${playerStatsError.message}`);
        
        // Get team names for all players' default teams and assigned teams
        const teamIds = new Set<string>();
        const playerTeamMap = new Map<string, string>();
        const assignedTeamMap = new Map<string, string>();
        
        if (playerStatsData && playerStatsData.length > 0) {
          (playerStatsData as unknown[]).forEach((rawStat: unknown) => {
            const stat = rawStat as { 
              players?: { team_id?: string },
              assigned_team_id?: string 
            };
            
            if (stat.players?.team_id) {
              teamIds.add(stat.players.team_id);
            }
            
            if (stat.assigned_team_id) {
              teamIds.add(stat.assigned_team_id);
            }
          });
          
          if (teamIds.size > 0) {
            const { data: teamsData, error: teamsError } = await supabase
              .from('teams')
              .select('id, name')
              .in('id', Array.from(teamIds));
            
            if (!teamsError && teamsData) {
              const teamMap = new Map<string, string>();
              (teamsData as unknown[]).forEach((rawTeam: unknown) => {
                const team = rawTeam as { id: string; name: string };
                teamMap.set(team.id, team.name);
              });
              
              (playerStatsData as unknown[]).forEach((rawStat: unknown) => {
                const stat = rawStat as { 
                  player_id: string; 
                  players?: { team_id?: string },
                  assigned_team_id?: string 
                };
                
                if (stat.players?.team_id) {
                  const teamName = teamMap.get(stat.players.team_id) || 'Unknown Team';
                  playerTeamMap.set(stat.player_id, teamName);
                }
                
                if (stat.assigned_team_id) {
                  const assignedName = teamMap.get(stat.assigned_team_id) || 'Unknown Team';
                  assignedTeamMap.set(stat.player_id, assignedName);
                }
              });
            }
          }
        }
        
        // Organize players by their teams (home vs away in this match)
        const homePlayerPerformances: PlayerPerformance[] = [];
        const awayPlayerPerformances: PlayerPerformance[] = [];
        let homeTotalGoals = 0;
        let homeTotalAssists = 0;
        let awayTotalGoals = 0;
        let awayTotalAssists = 0;
        
        if (playerStatsData) {
          (playerStatsData as unknown[]).forEach((rawStat: unknown) => {
            const stat = rawStat as {
              player_id: string;
              goals?: number;
              assists?: number;
              minutes_played?: number;
              assigned_team_id?: string;
              players?: {
                id: string;
                name: string;
                position: string | null;
                team_id: string;
              };
            };
            if (!stat.players) return;
            
            const playerTeamName = playerTeamMap.get(stat.player_id) || 'Unknown Team';
            const assignedTeamName = assignedTeamMap.get(stat.player_id) || 'Unknown Team';
            
            const playerPerformance: PlayerPerformance = {
              player_id: stat.player_id,
              player_name: stat.players.name || 'Unknown Player',
              team_name: playerTeamName,
              assigned_team_name: assignedTeamName,
              position: stat.players.position,
              goals: stat.goals || 0,
              assists: stat.assists || 0,
              minutes_played: stat.minutes_played || 0
            };
            
            // Determine if player was on home or away team for this match
            // Use the match assignment team_id, not the player's default team
            if (stat.assigned_team_id === matchData.home_team_id) {
              homePlayerPerformances.push(playerPerformance);
              homeTotalGoals += playerPerformance.goals;
              homeTotalAssists += playerPerformance.assists;
            } else if (stat.assigned_team_id === matchData.away_team_id) {
              awayPlayerPerformances.push(playerPerformance);
              awayTotalGoals += playerPerformance.goals;
              awayTotalAssists += playerPerformance.assists;
            }
          });
        }
        
        setHomeTeam({
          team_id: matchData.home_team_id,
          team_name: extractTeamName(matchData.home_team),
          players: homePlayerPerformances,
          total_goals: homeTotalGoals,
          total_assists: homeTotalAssists
        });
        
        setAwayTeam({
          team_id: matchData.away_team_id,
          team_name: extractTeamName(matchData.away_team),
          players: awayPlayerPerformances,
          total_goals: awayTotalGoals,
          total_assists: awayTotalAssists
        });
      } catch (err: unknown) {
        console.error('Error fetching match data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchData();
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading match data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/matches" className="text-blue-600 hover:underline mb-8 inline-block">
            &larr; Back to Matches
          </Link>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!matchDetail) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/matches" className="text-blue-600 hover:underline mb-8 inline-block">
            &larr; Back to Matches
          </Link>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p>Match not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine match result
  let matchResult = 'Upcoming';
  
  if (matchDetail.home_score !== null && matchDetail.away_score !== null) {
    if (matchDetail.home_score > matchDetail.away_score) {
      matchResult = 'Home Win';
    } else if (matchDetail.home_score < matchDetail.away_score) {
      matchResult = 'Away Win';
    } else {
      matchResult = 'Draw';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">Match Details</h1>
          <p className="text-center mt-2">
            {matchDetail.home_team_name} vs {matchDetail.away_team_name}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/matches" className="text-blue-600 hover:underline">
            &larr; Back to Matches
          </Link>
          
          <div className="flex space-x-4">
            {prevMatchId && (
              <Link 
                href={`/matches/${prevMatchId}`} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                &larr; Previous Match
              </Link>
            )}
            
            {nextMatchId && (
              <Link 
                href={`/matches/${nextMatchId}`} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Next Match &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Match Information */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center md:text-right">
              <Link href={`/teams/${matchDetail.home_team_id}`} className="text-xl font-semibold text-gray-900 hover:underline">
                {matchDetail.home_team_name}
              </Link>
              <p className="text-sm text-gray-500">(Home)</p>
            </div>
            
            <div className="text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-gray-800 mb-2">
                  {matchDetail.home_score !== null && matchDetail.away_score !== null 
                    ? `${matchDetail.home_score} - ${matchDetail.away_score}` 
                    : 'vs'}
                </div>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  matchResult === 'Home Win' 
                    ? 'bg-green-100 text-green-800' 
                    : matchResult === 'Away Win' 
                    ? 'bg-red-100 text-red-800'
                    : matchResult === 'Draw'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {matchResult}
                </span>
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <Link href={`/teams/${matchDetail.away_team_id}`} className="text-xl font-semibold text-gray-900 hover:underline">
                {matchDetail.away_team_name}
              </Link>
              <p className="text-sm text-gray-500">(Away)</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-gray-800">{new Date(matchDetail.match_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Venue</p>
              <p className="text-gray-800">{matchDetail.venue}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-gray-800">{matchDetail.match_type === 'external_game' ? 'External Game' : 'Internal Friendly'}</p>
            </div>
          </div>
        </div>

        {/* Team Performances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Home Team Players */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{matchDetail.home_team_name} Players</h2>
            
            {homeTeam?.players && homeTeam.players.length > 0 ? (
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
                    {homeTeam.players.map((player) => (
                      <tr key={player.player_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Link href={`/players/${player.player_id}`} className="hover:underline">
                            {player.player_name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.position || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.goals}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.assists}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-right text-sm font-medium text-gray-500">Total:</td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{homeTeam.total_goals}</td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{homeTeam.total_assists}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No player data available for this team.</p>
            )}
          </div>

          {/* Away Team Players */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{matchDetail.away_team_name} Players</h2>
            
            {awayTeam?.players && awayTeam.players.length > 0 ? (
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
                    {awayTeam.players.map((player) => (
                      <tr key={player.player_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Link href={`/players/${player.player_id}`} className="hover:underline">
                            {player.player_name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.position || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.goals}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.assists}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-right text-sm font-medium text-gray-500">Total:</td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{awayTeam.total_goals}</td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{awayTeam.total_assists}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No player data available for this team.</p>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Soccer Stats App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 