'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { MultiTeamImpactChart, PlayerTeamCombinationsChart } from '@/components/Charts';
import TeamSelector from '@/components/TeamSelector';

interface PlayerDetail {
  id: string;
  name: string;
  position: string;
  current_team_id: string | null;
  current_team_name: string | null;
}

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

interface PlayerCombination {
  teammate_id: string;
  teammate_name: string;
  team_id: string;
  team_name: string;
  matches_together: number;
  win_rate_together: number;
  win_rate_without: number;
  win_impact: number;
  goals_per_match_together: number;
  goals_per_match_without: number;
  goal_impact: number;
  statistical_significance: boolean;
}

export default function PlayerTeamAnalysisPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  
  const [playerDetail, setPlayerDetail] = useState<PlayerDetail | null>(null);
  const [teamImpactData, setTeamImpactData] = useState<TeamImpact[]>([]);
  const [teamCombinations, setTeamCombinations] = useState<PlayerCombination[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [impactLoading, setImpactLoading] = useState(true);
  const [combinationsLoading, setCombinationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch basic player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      try {
        // Get player details
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select(`
            id,
            name,
            position,
            team_id,
            teams:team_id (name)
          `)
          .eq('id', playerId)
          .single();
        
        if (playerError) throw new Error(`Failed to fetch player: ${playerError.message}`);
        
        // Format the player detail
        setPlayerDetail({
          id: playerData.id,
          name: playerData.name,
          position: playerData.position || 'N/A',
          current_team_id: playerData.team_id,
          current_team_name: playerData.teams?.name || null,
        });
        
        // Set the player's current team as the default selected team if available
        if (playerData.team_id) {
          setSelectedTeamId(playerData.team_id);
        }
      } catch (err) {
        console.error('Error fetching player data:', err);
        setError(typeof err === 'string' ? err : (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId]);
  
  // Fetch team impact data
  useEffect(() => {
    const fetchTeamImpactData = async () => {
      if (!playerId) return;
      
      setImpactLoading(true);
      try {
        // For debugging
        console.log('Fetching team impact data for player:', playerId);
        
        const { data, error } = await supabase
          .rpc('get_player_all_teams_impact', { player_id_param: playerId });
        
        if (error) {
          console.error('Failed to fetch team impact data:', error);
          // Remove the fallback test data
          setTeamImpactData([]);
          return;
        }
        
        console.log('Team impact data received:', data);
        setTeamImpactData(data || []);
      } catch (err) {
        console.error('Error fetching team impact data:', err);
        setTeamImpactData([]);
      } finally {
        setImpactLoading(false);
      }
    };
    
    fetchTeamImpactData();
  }, [playerId, playerDetail]);
  
  // Find the selected team name
  const selectedTeamName = selectedTeamId 
    ? teamImpactData.find(team => team.team_id === selectedTeamId)?.team_name || 'Selected Team'
    : 'All Teams';
  
  // Fetch team combinations data when a team is selected
  useEffect(() => {
    const fetchTeamCombinations = async () => {
      if (!playerId) return;
      
      setCombinationsLoading(true);
      try {
        console.log('Fetching team combinations for player:', playerId, 'team:', selectedTeamId);
        
        const { data, error } = await supabase
          .rpc('get_player_team_combinations', { 
            player_id_param: playerId,
            team_id_param: selectedTeamId 
          });
        
        if (error) {
          console.error('Failed to fetch team combinations data:', error);
          // Remove the fallback test data
          setTeamCombinations([]);
          return;
        }
        
        console.log('Team combinations data received:', data);
        setTeamCombinations(data || []);
      } catch (err) {
        console.error('Error fetching team combinations data:', err);
        setTeamCombinations([]);
      } finally {
        setCombinationsLoading(false);
      }
    };
    
    fetchTeamCombinations();
  }, [playerId, selectedTeamId, teamImpactData]);
  
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
        <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto">
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
  
  // Filter team impact data if a team is selected
  const filteredTeamImpact = selectedTeamId 
    ? teamImpactData.filter(team => team.team_id === selectedTeamId)
    : teamImpactData;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">{playerDetail.name}</h1>
          <p className="text-center mt-2">
            {playerDetail.position} - Team Impact Analysis
          </p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div>
            <Link href={`/players/${playerId}`} className="text-blue-600 hover:underline">
              &larr; Back to Player Profile
            </Link>
          </div>
          
          {playerDetail.current_team_name && (
            <div className="text-sm text-gray-500">
              Current Team: {playerDetail.current_team_name}
            </div>
          )}
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Team Impact Analysis</h2>
          <p className="text-gray-600 mb-6">
            This analysis shows how {playerDetail.name} impacts different teams they play with.
            Performance is compared between matches where the player participated versus matches where they didn&apos;t.
          </p>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Select Team</h3>
            <TeamSelector 
              playerId={playerId}
              selectedTeamId={selectedTeamId}
              onTeamSelect={setSelectedTeamId}
              showAllOption={true}
              className="mb-4"
            />
          </div>
          
          {impactLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-600">Loading team impact data...</p>
            </div>
          ) : filteredTeamImpact.length > 0 ? (
            <MultiTeamImpactChart
              playerName={playerDetail.name}
              teamImpactData={filteredTeamImpact}
              isLoading={impactLoading}
            />
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-600 mb-2">No team impact data available</p>
              <p className="text-sm text-gray-500">
                This player needs to have played matches with different teams for this analysis.
                Also, there must be team matches both with and without this player to calculate impact.
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {selectedTeamId ? `Player Combinations in ${selectedTeamName}` : 'Select a Team to View Player Combinations'}
          </h2>
          
          {selectedTeamId ? (
            combinationsLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-gray-600">Loading player combinations data...</p>
              </div>
            ) : teamCombinations.length > 0 ? (
              <PlayerTeamCombinationsChart
                playerName={playerDetail.name}
                teamName={selectedTeamName}
                combinations={teamCombinations}
                isLoading={false}
                limit={10}
              />
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-600 mb-2">No player combinations data available</p>
                <p className="text-sm text-gray-500">
                  This player needs to have played multiple matches with teammates on the same team.
                  At least 3 matches with and without specific teammates are needed for meaningful analysis.
                </p>
              </div>
            )
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-600 mb-2">Please select a specific team above to view player combinations analysis</p>
              <p className="text-sm text-gray-500">This analysis identifies which players work best with {playerDetail.name}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 