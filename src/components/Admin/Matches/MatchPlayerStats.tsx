import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PlayerMatchStats, Player } from '@/types/database'; // Updated import

interface EnrichedPlayerMatchStats extends PlayerMatchStats {
  players: Pick<Player, 'name' | 'position'> | null; // Adjusted to match Supabase join syntax
}

interface MatchPlayerStatsProps {
  matchId: string;
  refreshTrigger?: number; // Add refreshTrigger prop
}

interface TeamOption {
  id: string;
  name: string;
}

interface AssignmentMap {
  [playerId: string]: string; // playerId -> teamId
}

const MatchPlayerStats: React.FC<MatchPlayerStatsProps> = ({ matchId, refreshTrigger }) => {
  const [playerStats, setPlayerStats] = useState<EnrichedPlayerMatchStats[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // playerId being saved

  // Fetch teams for the match
  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`home_team:home_team_id(id, name), away_team:away_team_id(id, name)`)
        .eq('id', matchId)
        .single();
      if (error) {
        setError('Failed to fetch teams for match');
        setTeams([]);
      } else {
        const home = Array.isArray(data.home_team) ? data.home_team[0] : data.home_team;
        const away = Array.isArray(data.away_team) ? data.away_team[0] : data.away_team;
        setTeams([
          home ? { id: home.id, name: home.name } : null,
          away ? { id: away.id, name: away.name } : null,
        ].filter(Boolean) as TeamOption[]);
      }
    };
    fetchTeams();
  }, [matchId]);

  // Fetch player stats and assignments
  useEffect(() => {
    const fetchPlayerStatsAndAssignments = async () => {
      setLoading(true);
      setError(null);
      // Fetch player_match_stats and join with players table
      const { data, error } = await supabase
        .from('player_match_stats')
        .select(`*, players (name, position)`)
        .eq('match_id', matchId);
      if (error) {
        setError('Error fetching player match stats: ' + error.message);
        setPlayerStats([]);
      } else {
        setPlayerStats(data as EnrichedPlayerMatchStats[] || []);
      }
      // Fetch assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('player_match_assignments')
        .select('player_id, team_id')
        .eq('match_id', matchId);
      if (assignmentError) {
        setError('Error fetching player assignments: ' + assignmentError.message);
        setAssignments({});
      } else {
        const map: AssignmentMap = {};
        (assignmentData || []).forEach((row: { player_id: string; team_id: string }) => {
          map[row.player_id] = row.team_id;
        });
        setAssignments(map);
      }
      setLoading(false);
    };
    fetchPlayerStatsAndAssignments();
  }, [matchId, refreshTrigger]);

  // Save assignment for a player
  const handleAssignmentChange = async (playerId: string, teamId: string) => {
    setSaving(playerId);
    setAssignments((prev) => ({ ...prev, [playerId]: teamId }));
    // Upsert assignment
    const { error } = await supabase
      .from('player_match_assignments')
      .upsert({ match_id: matchId, player_id: playerId, team_id: teamId }, { onConflict: 'match_id,player_id' });
    setSaving(null);
    if (error) {
      setError('Failed to save assignment: ' + error.message);
    }
  };

  if (loading) {
    return <p>Loading player stats...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (playerStats.length === 0) {
    return <p className="text-amber-600">No player stats found for this match. Add player stats first using the form above.</p>;
  }

  return (
    <div>
      <div className="p-3 mb-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <span className="font-semibold">Important:</span> For each player in this match, choose which team they played for.
          Players can be assigned to any team regardless of their usual team affiliation.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Player</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Goals</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Assists</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Position</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b bg-blue-50">Team Assignment</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {playerStats.map((stat) => (
              <tr key={stat.id}>
                <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{stat.players?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{stat.goals}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{stat.assists}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{stat.players?.position || 'N/A'}</td>
                <td className="px-6 py-4 text-sm bg-blue-50">
                  <select
                    value={assignments[stat.player_id] || ''}
                    onChange={(e) => handleAssignmentChange(stat.player_id, e.target.value)}
                    className="w-full border border-blue-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving === stat.player_id}
                  >
                    <option value="">Select team/shirt color</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                  {saving === stat.player_id && <span className="ml-2 text-xs text-blue-500">Saving...</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchPlayerStats;