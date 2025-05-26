// src/components/Admin/Matches/PlayerStatsForm.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Player, Match, PlayerMatchStats, Team } from '@/types/database';

interface PlayerStatsFormProps {
  matchId: string;
  onStatsSubmitted?: () => void;
  refreshTrigger?: number;
}

interface PlayerWithStats extends Player {
  goals: number | string; // Use string for input field, convert to number on save
  assists: number | string;
  own_goals: number | string; // Add own_goals field
  statId?: string; // To track existing player_match_stats.id for updates
  assignedTeamId?: string; // The team the player is assigned to for this match
}

interface MatchWithTeams extends Match {
  home_team: Team;
  away_team: Team;
}

export default function PlayerStatsForm({ matchId, onStatsSubmitted, refreshTrigger = 0 }: PlayerStatsFormProps) {
  const [matchDetails, setMatchDetails] = useState<Match | null>(null);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<PlayerWithStats[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<PlayerWithStats[]>([]);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<PlayerWithStats[]>([]);

  const fetchMatchAndPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // 1. Fetch match details
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*, home_team:home_team_id(id, name), away_team:away_team_id(id, name)')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;
      if (!matchData) throw new Error('Match not found.');
      const typedMatchData = matchData as MatchWithTeams;
      setMatchDetails(typedMatchData);
      setHomeTeam(typedMatchData.home_team);
      setAwayTeam(typedMatchData.away_team);

      // 2. Fetch ALL players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*');

      if (playersError) throw playersError;

      // 3. Fetch player match assignments for this match
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('player_match_assignments')
        .select('*')
        .eq('match_id', matchId);

      if (assignmentsError) throw assignmentsError;

      // 4. Fetch existing stats for this match
      const { data: existingStatsData, error: statsError } = await supabase
        .from('player_match_stats')
        .select('*')
        .eq('match_id', matchId);

      if (statsError) throw statsError;

      // Function to map players to state with their existing stats (if any)
      const mapPlayersToState = (players: Player[]): PlayerWithStats[] => {
        return players.map(player => {
          const existingStat = existingStatsData?.find(s => s.player_id === player.id);
          const assignment = assignmentsData?.find(a => a.player_id === player.id);
          
          return {
            ...player,
            goals: existingStat?.goals ?? '',
            assists: existingStat?.assists ?? '',
            own_goals: existingStat?.own_goals ?? '', // Initialize own_goals
            statId: existingStat?.id,
            assignedTeamId: assignment?.team_id
          };
        });
      };

      // Get all players who have been assigned to teams for this match
      const allPlayers = mapPlayersToState(playersData || []);
      
      // Filter players into their match-assigned teams (not their regular teams)
      const homeTeamPlayers = allPlayers.filter(p => 
        p.assignedTeamId === typedMatchData.home_team_id
      );
      
      const awayTeamPlayers = allPlayers.filter(p => 
        p.assignedTeamId === typedMatchData.away_team_id
      );
      
      // Players who have no team assignment for this match
      const otherPlayers = allPlayers.filter(p => 
        !p.assignedTeamId
      );

      setHomeTeamPlayers(homeTeamPlayers);
      setAwayTeamPlayers(awayTeamPlayers);
      
      // Add state for other players
      setOtherPlayers(otherPlayers);

    } catch (e: unknown) {
      console.error('Error fetching data for stats form:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId) {
      fetchMatchAndPlayers();
    }
  }, [matchId, fetchMatchAndPlayers, refreshTrigger]);

  const handleStatChange = (
    team: 'home' | 'away' | 'other',
    playerId: string,
    field: keyof Omit<PlayerWithStats, keyof Player | 'statId' | 'assignedTeamId'>,
    value: string
  ) => {
    const setter = team === 'home' ? setHomeTeamPlayers : 
                  team === 'away' ? setAwayTeamPlayers : 
                  setOtherPlayers;
                  
    setter(prevPlayers =>
      prevPlayers.map(p =>
        p.id === playerId ? { ...p, [field]: value } : p
      )
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const allPlayersWithStats = [...homeTeamPlayers, ...awayTeamPlayers, ...otherPlayers];
    const statsToUpsert: Omit<PlayerMatchStats, 'id' | 'created_at'>[] = [];

    console.log('Saving stats for match:', matchId);
    console.log('Players with stats:', allPlayersWithStats.length);

    for (const player of allPlayersWithStats) {
      // Convert the input values to numbers or set them to 0 if empty
      const goals = player.goals === '' ? 0 : parseInt(String(player.goals), 10);
      const assists = player.assists === '' ? 0 : parseInt(String(player.assists), 10);
      const own_goals = player.own_goals === '' ? 0 : parseInt(String(player.own_goals), 10);

      // Only include if the player has been assigned to a team for this match
      if (player.assignedTeamId) {
        const statEntry = {
          player_id: player.id,
          match_id: matchId,
          goals: goals,
          assists: assists,
          own_goals: own_goals,
          minutes_played: 0, // Default to 0 since we're not collecting this data
        };
        
        // We'll use upsert for all stats, whether they already exist or not
        statsToUpsert.push(statEntry);
        
        console.log(`Adding stats for ${player.name}:`, statEntry);
      }
    }

    try {
      if (statsToUpsert.length > 0) {
        console.log('Upserting stats:', statsToUpsert);
        
        const { error: upsertError } = await supabase
          .from('player_match_stats')
          .upsert(statsToUpsert, { 
            onConflict: 'player_id,match_id'
          });

        if (upsertError) {
          console.error('Upsert error:', upsertError);
          throw upsertError;
        }
        
        console.log('Stats saved successfully');
      } else {
        console.log('No stats to save');
      }

      setMessage('Player stats saved successfully!');
      if (onStatsSubmitted) {
        onStatsSubmitted();
      }
      
      // Re-fetch to update the displayed stats
      fetchMatchAndPlayers();
    } catch (e: unknown) {
      console.error('Error saving player stats:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Failed to save stats: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-700">Loading player stats form...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!matchDetails) return <p className="text-gray-700">Match details not found.</p>;

  const renderPlayerRows = (players: PlayerWithStats[], teamType: 'home' | 'away' | 'other') => {
    if (players.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="px-6 py-4 text-sm text-center text-gray-500">
            No players found for this team or team not yet specified in match details.
          </td>
        </tr>
      );
    }
    return players.map((player) => (
      <tr key={player.id}>
        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{player.name}</td>
        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
          <input
            type="number"
            min="0"
            value={player.goals}
            onChange={(e) => handleStatChange(teamType, player.id, 'goals', e.target.value)}
            className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
          <input
            type="number"
            min="0"
            value={player.assists}
            onChange={(e) => handleStatChange(teamType, player.id, 'assists', e.target.value)}
            className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
          <input
            type="number"
            min="0"
            value={player.own_goals}
            onChange={(e) => handleStatChange(teamType, player.id, 'own_goals', e.target.value)}
            className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </td>
      </tr>
    ));
  };

  return (
    <div>
      <div className="p-3 mb-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Note:</span> Players are grouped based on their team assignments from Step 1.
        </p>
        <p className="text-sm text-blue-800 mt-1">
          <span className="font-semibold">Important:</span> If you don&apos;t see players in the correct teams, make sure you&apos;ve first assigned them in the Player Team Assignments section above and clicked Save.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Enter Player Stats</h2>
        {message && <p className="text-sm text-green-600">{message}</p>}
        
        <div>
          <h3 className="text-lg font-medium text-gray-700">Home Team: {homeTeam?.name || 'Loading...'}</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Player</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Goals</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Assists</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Own Goals</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {renderPlayerRows(homeTeamPlayers, 'home')}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700">Away Team: {awayTeam?.name || 'Loading...'}</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Player</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Goals</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Assists</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Own Goals</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {renderPlayerRows(awayTeamPlayers, 'away')}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Other Players Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-700">Other Players</h3>
          <p className="text-sm text-gray-500 mb-2">Players from other teams or without team assignment who participated in this match</p>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Player</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Goals</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Assists</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Own Goals</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {otherPlayers.length > 0 ? 
                  renderPlayerRows(otherPlayers, 'other') : 
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm text-center text-gray-500">
                      All players are already assigned to either home or away team.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {saving ? 'Saving...' : 'Save Player Stats'}
          </button>
        </div>
      </form>
    </div>
  );
}