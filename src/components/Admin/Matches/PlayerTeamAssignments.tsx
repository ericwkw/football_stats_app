import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Player, Team } from '@/types/database';

interface PlayerTeamAssignmentsProps {
  matchId: string;
  onTeamsAssigned?: () => void;
}

interface PlayerWithTeam extends Player {
  teamId: string | null;
  isParticipating: boolean;
}

export default function PlayerTeamAssignments({ matchId, onTeamsAssigned }: PlayerTeamAssignmentsProps) {
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Fetch match details to get the teams
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*, home_team:home_team_id(id, name), away_team:away_team_id(id, name)')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;
      
      // Set teams for this match
      const homeTeam = matchData.home_team as Team;
      const awayTeam = matchData.away_team as Team;
      setTeams([homeTeam, awayTeam]);
      
      // 2. Fetch all players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('name');

      if (playersError) throw playersError;
      
      // 3. Fetch existing assignments for this match
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('player_match_assignments')
        .select('*')
        .eq('match_id', matchId);

      if (assignmentsError) throw assignmentsError;
      
      // Map players with their team assignments for this match
      const playersWithTeams: PlayerWithTeam[] = (playersData || []).map(player => {
        const assignment = (assignmentsData || []).find(a => a.player_id === player.id);
        return {
          ...player,
          teamId: assignment ? assignment.team_id : null,
          isParticipating: !!assignment
        };
      });
      
      setPlayers(playersWithTeams);
      
    } catch (e: unknown) {
      console.error('Error fetching data:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleParticipationToggle = (playerId: string) => {
    setPlayers(prevPlayers => 
      prevPlayers.map(player => 
        player.id === playerId 
          ? { ...player, isParticipating: !player.isParticipating }
          : player
      )
    );
  };

  const handleTeamChange = (playerId: string, teamId: string) => {
    setPlayers(prevPlayers => 
      prevPlayers.map(player => 
        player.id === playerId 
          ? { ...player, teamId, isParticipating: true }
          : player
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    
    try {
      // Get all participating players with their team assignments
      const participatingPlayers = players.filter(p => p.isParticipating && p.teamId);
      
      // First, remove all existing assignments for this match
      const { error: deleteError } = await supabase
        .from('player_match_assignments')
        .delete()
        .eq('match_id', matchId);
        
      if (deleteError) throw deleteError;
      
      // Then insert new assignments
      if (participatingPlayers.length > 0) {
        const assignments = participatingPlayers.map(player => ({
          match_id: matchId,
          player_id: player.id,
          team_id: player.teamId
        }));
        
        const { error: insertError } = await supabase
          .from('player_match_assignments')
          .insert(assignments);
          
        if (insertError) throw insertError;
      }
      
      setMessage('Player team assignments saved successfully!');
      if (onTeamsAssigned) {
        onTeamsAssigned();
      }
    } catch (e: unknown) {
      console.error('Error saving team assignments:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Failed to save assignments: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-700">Loading players...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (teams.length < 2) return <p className="text-amber-600">Match team information is incomplete.</p>;

  return (
    <div>
      <div className="p-3 mb-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Instructions:</span> First check the box for each player who participated in this match, 
          then select which team they played for.
        </p>
      </div>
      
      {message && <p className="text-sm text-green-600 mb-4">{message}</p>}
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Played</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Player</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Position</th>
              {/* Regular Team column is hidden but the data is still used behind the scenes */}
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b bg-blue-50">Played For Team</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.map((player) => (
              <tr key={player.id} className={player.isParticipating ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    checked={player.isParticipating}
                    onChange={() => handleParticipationToggle(player.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{player.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{player.position}</td>
                {/* The Regular Team column is removed from UI but data is still used */}
                <td className={`px-6 py-4 text-sm ${player.isParticipating ? 'bg-blue-50' : 'bg-gray-100'}`}>
                  <select
                    value={player.teamId || ''}
                    onChange={(e) => handleTeamChange(player.id, e.target.value)}
                    disabled={!player.isParticipating}
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      player.isParticipating ? 'border-blue-300 bg-white' : 'border-gray-200 bg-gray-100 text-gray-400'
                    }`}
                  >
                    <option value="">Select team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {saving ? 'Saving...' : 'Save Team Assignments'}
        </button>
      </div>
    </div>
  );
} 