'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { PlayerStatsComparison, MultiTeamImpactChart } from '@/components/Charts';
import TeamPerformance from '@/components/TeamPerformance';

interface PlayerDetail {
  id: string;
  name: string;
  position: string;
  team_id: string;
  team_name: string;
  matches_played: number;
  goals: number;
  assists: number;
  own_goals: number;
  clean_sheets: number;
  weighted_goals: number;
  weighted_assists: number;
}

interface MatchPerformance {
  id: string;
  match_date: string;
  home_team: string;
  away_team: string;
  player_team: string;
  result: string;
  goals: number;
  assists: number;
  own_goals: number;
  match_type: string;
}

// Define types for team impact data
interface TeamImpact {
  team_id: string;
  team_name: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  win_rate: number;
  goals_per_game: number;
  assists_per_game: number;
  team_win_rate_with_player: number;
  team_win_rate_without_player: number;
  impact_score: number;
  statistical_significance: boolean;
}

// Define the structure expected from the API for matchStatsData
interface MatchStatFromAPI {
  id: string;
  player_id: string;
  match_id: string;
  goals: number;
  assists: number;
  own_goals: number;
  minutes_played: number;
  created_at: string;
  assigned_team_id?: string;
  matches: {
    id: string;
    match_date: string;
    venue: string;
    match_type: string;
    home_score: number | null;
    away_score: number | null;
    home_team: { name: string }[];
    away_team: { name: string }[];
  }[];
}

// Update the interface to include own_goals
interface PlayerStatsData {
  player_id: string;
  player_name: string;
  matches_played: number;
  goals: number;
  assists: number;
  own_goals: number;
  clean_sheets: number;
  weighted_goals: number;
  weighted_assists: number;
  clean_sheet_percentage?: number;
}

export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerDetail, setPlayerDetail] = useState<PlayerDetail | null>(null);
  const [matchPerformances, setMatchPerformances] = useState<MatchPerformance[]>([]);

  // New states for multi-team impact analysis
  const [teamImpactData, setTeamImpactData] = useState<TeamImpact[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [multiTeamImpactLoading, setMultiTeamImpactLoading] = useState(true);
  
  // New states for navigation
  const [nextPlayerId, setNextPlayerId] = useState<string | null>(null);
  const [prevPlayerId, setPrevPlayerId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get all player IDs for navigation
        const { data: allPlayers, error: allPlayersError } = await supabase
          .from('players')
          .select('id')
          .order('name');
        
        if (allPlayersError) throw new Error(`Failed to fetch all players: ${allPlayersError.message}`);
        
        if (allPlayers && allPlayers.length > 0) {
          const playerIds = allPlayers.map(p => p.id);
          const currentIndex = playerIds.findIndex(id => id === playerId);
          
          if (currentIndex !== -1) {
            // Set next player ID (loop to beginning if at the end)
            setNextPlayerId(playerIds[(currentIndex + 1) % playerIds.length]);
            
            // Set previous player ID (loop to end if at the beginning)
            setPrevPlayerId(playerIds[(currentIndex - 1 + playerIds.length) % playerIds.length]);
          }
        }
        
        // Get player details first to determine team type
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select(`
            id,
            name,
            position,
            team_id
          `)
          .eq('id', playerId)
          .single();
        
        if (playerError) throw new Error(`Failed to fetch player: ${playerError.message}`);
        
        // Get team details to determine if internal or club
        let teamName = 'N/A';
        let teamId = null;
        let teamType = '';
        
        if (playerData.team_id) {
          teamId = playerData.team_id;
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('name, team_type')
            .eq('id', playerData.team_id)
            .single();
          
          if (!teamError && teamData) {
            teamName = teamData.name;
            teamType = teamData.team_type;
          }
        }

        // Get player statistics based on team type
        let playerStats;
        if (teamType === 'internal') {
          const { data: internalStats, error: internalStatsError } = await supabase
            .rpc('get_internal_player_statistics', { player_id_param: playerId });
          
          if (internalStatsError) throw new Error(`Failed to fetch internal player statistics: ${internalStatsError.message}`);
          playerStats = internalStats;
        } else if (teamType === 'club') {
          const { data: clubStats, error: clubStatsError } = await supabase
            .rpc('get_club_player_statistics', { player_id_param: playerId });
          
          if (clubStatsError) throw new Error(`Failed to fetch club player statistics: ${clubStatsError.message}`);
          playerStats = clubStats;
        } else {
          // Fallback to original function if team type not recognized
          const { data: stats, error: statsError } = await supabase
            .rpc('get_player_statistics', { player_id_param: playerId });
          
          if (statsError) throw new Error(`Failed to fetch player statistics: ${statsError.message}`);
          playerStats = stats;
        }
        
        if (!playerStats || playerStats.length === 0) throw new Error('Player statistics not found');
        
        // Format the player detail
        setPlayerDetail({
          id: playerData.id,
          name: playerData.name,
          position: playerData.position || 'N/A',
          team_id: playerData.team_id,
          team_name: teamName,
          matches_played: playerStats[0].matches_played,
          goals: playerStats[0].goals,
          assists: playerStats[0].assists,
          own_goals: playerStats[0].own_goals,
          clean_sheets: playerStats[0].clean_sheets,
          weighted_goals: playerStats[0].weighted_goals,
          weighted_assists: playerStats[0].weighted_assists,
        });
        
        // Get match performances with per-match team assignment
        const { data: matchStatsData, error: matchStatsError } = await supabase
          .from('player_stats_with_assignments')
          .select(`
            id,
            player_id,
            match_id,
            goals,
            assists,
            own_goals,
            minutes_played,
            assigned_team_id,
            matches (
              id,
              match_date,
              venue,
              match_type,
              home_score,
              away_score,
              home_team:home_team_id (name),
              away_team:away_team_id (name)
            )
          `)
          .eq('player_id', playerId)
          .order('id', { ascending: false });
        
        if (matchStatsError) throw new Error(`Failed to fetch match statistics: ${matchStatsError.message}`);
        
        // Get team names for assigned teams
        const teamIds = new Set<string>();
        const teamNameMap = new Map<string, string>();
        
        if (matchStatsData && matchStatsData.length > 0) {
          (matchStatsData as any[]).forEach((stat: any) => {
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
              (teamsData as any[]).forEach((team: any) => {
                teamNameMap.set(team.id, team.name);
              });
            }
          }
        }
        
        // Format match performances
        const performances: MatchPerformance[] = [];
        
        if (matchStatsData && matchStatsData.length > 0) {
          (matchStatsData as any[]).forEach((stat: any) => {
            const matchesArray = stat.matches;
            if (matchesArray && matchesArray.length > 0) {
              const match = matchesArray[0]; // Access the first item in the array
              performances.push({
                id: stat.id,
                match_date: match.match_date,
                home_team: match.home_team && match.home_team.length > 0 ? match.home_team[0].name : '',
                away_team: match.away_team && match.away_team.length > 0 ? match.away_team[0].name : '',
                player_team: stat.assigned_team_id && teamNameMap.get(stat.assigned_team_id) ? 
                  teamNameMap.get(stat.assigned_team_id)! : 'Unknown Team',
                result: match.home_score !== null && match.away_score !== null 
                  ? `${match.home_score} - ${match.away_score}`
                  : 'Not played',
                goals: stat.goals,
                assists: stat.assists,
                own_goals: stat.own_goals || 0,
                match_type: match.match_type,
              });
            }
          });
        }
        
        setMatchPerformances(performances);
        
        // Fetch team impact data if player has a team
        if (teamId) {
          // fetchTeamImpactData(playerId, teamId);
        } else {
          // setTeamImpactLoading(false);
        }
        
      } catch (err) {
        console.error('Error fetching player data:', err);
        setError(typeof err === 'string' ? err : (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    // New function to fetch multi-team impact data
    const fetchMultiTeamImpactData = async (playerIdParam: string) => {
      setMultiTeamImpactLoading(true);
      
      try {
        // Fetch multi-team impact data directly with the player diagnostic API
        const diagnosticResponse = await fetch(`/api/player-diagnostic/${playerIdParam}`);
        
        if (!diagnosticResponse.ok) {
          throw new Error('Failed to fetch player diagnostic data');
        }
        
        const diagnosticData = await diagnosticResponse.json();
        
        if (diagnosticData?.teamImpact) {
          setTeamImpactData(diagnosticData.teamImpact);
          
          // Select the first team by default if it exists
          if (diagnosticData.teamImpact.length > 0) {
            setSelectedTeamId(diagnosticData.teamImpact[0].team_id);
          }
        } else {
          setTeamImpactData([]);
          setError('No team impact data available');
        }
      } catch (err) {
        console.error('Error fetching multi-team impact data:', err);
        setError('Failed to load team impact data. Please try again later.');
        setTeamImpactData([]);
      } finally {
        setMultiTeamImpactLoading(false);
      }
    };
    
    fetchPlayerData();
    fetchMultiTeamImpactData(playerId);
  }, [playerId]);

  // Add this helper function to filter team impact data
  const getFilteredTeamImpact = () => {
    if (!selectedTeamId) {
      return teamImpactData;
    }
    return teamImpactData.filter(team => team.team_id === selectedTeamId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading player data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/players" className="text-blue-600 hover:underline mb-8 inline-block">
            &larr; Back to Players
          </Link>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!playerDetail) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/players" className="text-blue-600 hover:underline mb-8 inline-block">
            &larr; Back to Players
          </Link>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p>Player not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">Player Details</h1>
          {playerDetail && (
            <p className="text-center mt-2">{playerDetail.name}{playerDetail.position ? ` - ${playerDetail.position}` : ''}</p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/players" className="text-blue-600 hover:underline">
            &larr; Back to Players
          </Link>
          
          <div className="flex space-x-4">
            {prevPlayerId && (
              <Link 
                href={`/players/${prevPlayerId}`} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                &larr; Previous Player
              </Link>
            )}
            
            {nextPlayerId && (
              <Link 
                href={`/players/${nextPlayerId}`} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Next Player &rarr;
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : playerDetail === null ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p>Player not found</p>
          </div>
        ) : (
          <>
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Player Statistics</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Matches</p>
                  <p className="text-2xl font-bold text-gray-800">{playerDetail.matches_played || 0}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Goals</p>
                  <p className="text-2xl font-bold text-gray-800">{playerDetail.goals || 0}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Assists</p>
                  <p className="text-2xl font-bold text-gray-800">{playerDetail.assists || 0}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Own Goals</p>
                  <p className="text-2xl font-bold text-gray-800">{playerDetail.own_goals || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Match Performances</h2>
              
              {matchPerformances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goals</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assists</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Own Goals</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {matchPerformances.map((performance) => (
                        <tr key={performance.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(performance.match_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <Link href={`/matches/${performance.id}`} className="hover:underline">
                              {performance.home_team} vs {performance.away_team}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {performance.player_team}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {performance.result}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{performance.goals || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{performance.assists || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{performance.own_goals || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              performance.match_type === 'external_game' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {performance.match_type === 'external_game' ? 'External' : 'Internal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No match data available for this player.</p>
              )}
            </div>

            {/* Player Stats Visualizations - Modified to remove the impact analysis */}
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Performance Statistics</h2>
              <PlayerStatsComparison 
                players={[
                  {
                    player_id: playerDetail.id,
                    player_name: playerDetail.name,
                    goals: playerDetail.goals,
                    assists: playerDetail.assists,
                    matches_played: playerDetail.matches_played
                  }
                ]}
                title="Player Performance"
              />
            </div>
            
            {/* Replace the existing Team Impact Section with this enhanced version */}
            <div className="mt-8 bg-white shadow-md rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Team Impact Analysis</h2>
              </div>
              
              {multiTeamImpactLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading team impact data...</p>
                  </div>
                </div>
              ) : teamImpactData.length > 0 ? (
                <>
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 text-sm font-medium mb-2">Team Selector</p>
                    <p className="text-blue-700 text-sm mb-3">Select a team to view {playerDetail.name}&apos;s impact:</p>
                    
                    {/* Display available teams as buttons for easier selection */}
                    <div className="flex flex-wrap gap-2">
                      {teamImpactData.map(team => (
                        <button
                          key={team.team_id}
                          onClick={() => setSelectedTeamId(team.team_id)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedTeamId === team.team_id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {team.team_name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <MultiTeamImpactChart
                    playerName={playerDetail.name}
                    teamImpactData={getFilteredTeamImpact()}
                    isLoading={false}
                  />
                </>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <p className="text-center text-gray-600 mb-2">No team impact data available</p>
                  <p className="text-center text-sm text-gray-500 mb-6">
                    This player needs to have played for multiple teams with sufficient match data for this analysis.
                  </p>
                </div>
              )}
            </div>
            
            {/* We can still keep the current team performance section if desired */}
            {playerDetail.team_name && playerDetail.team_id && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Detailed Impact on {playerDetail.team_name}</h2>
                <TeamPerformance
                  playerId={playerDetail.id}
                  playerName={playerDetail.name}
                  teamId={playerDetail.team_id}
                  teamName={playerDetail.team_name}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 