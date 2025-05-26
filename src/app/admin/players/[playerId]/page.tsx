"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Player, PlayerMatchStats, Team } from '@/types/database';

interface AggregatedStats {
  totalGames: number;
  totalGoals: number;
  totalAssists: number;
  // Removed totalMinutesPlayed
}

interface PlayerProfile extends Player {
  team: Team | null;
  date_of_birth?: string;
  nationality?: string;
  jersey_number?: string;
}

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = params.playerId as string;

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerMatchStats[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch player details along with team name
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*, team:team_id(id, name)')
          .eq('id', playerId)
          .single();

        if (playerError) throw playerError;
        if (!playerData) throw new Error('Player not found.');
        setPlayer(playerData as PlayerProfile);

        // Fetch player match stats
        const { data: statsData, error: statsError } = await supabase
          .from('player_match_stats')
          .select('*')
          .eq('player_id', playerId);

        if (statsError) throw statsError;
        setStats(statsData || []);

        // Aggregate stats
        if (statsData) {
          const totalGames = statsData.length;
          const totalGoals = statsData.reduce((sum, stat) => sum + (stat.goals || 0), 0);
          const totalAssists = statsData.reduce((sum, stat) => sum + (stat.assists || 0), 0);
          
          setAggregatedStats({
            totalGames,
            totalGoals,
            totalAssists,
          });
        }

      } catch (e: unknown) {
        console.error('Error fetching player profile:', e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerId]);

  if (loading) {
    return <p className="text-center text-gray-700 py-8">Loading player profile...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-8">Error: {error}</p>;
  }

  if (!player) {
    return <p className="text-center text-gray-700 py-8">Player not found.</p>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 bg-white shadow-lg rounded-lg">
      <div className="mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{player.name}</h1>
        <p className="text-lg text-gray-600">{player.position || 'N/A'} {player.team ? ` - ${player.team.name}` : ''}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Personal Details</h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>Date of Birth:</strong> {player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Nationality:</strong> {player.nationality || 'N/A'}</p>
            <p><strong>Jersey Number:</strong> {player.jersey_number || 'N/A'}</p>
            {/* Add more player details here if available in your 'players' table */}
          </div>
        </div>
        
        {aggregatedStats && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Career Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-gray-600">
              <div>
                <p className="text-sm text-gray-500">Games Played</p>
                <p className="text-2xl font-semibold text-indigo-600">{aggregatedStats.totalGames}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Goals</p>
                <p className="text-2xl font-semibold text-indigo-600">{aggregatedStats.totalGoals}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assists</p>
                <p className="text-2xl font-semibold text-indigo-600">{aggregatedStats.totalAssists}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Match History & Stats</h2>
        {stats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-md">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Match ID</th> {/* Consider linking to match details page */}
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Goals</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Assists</th>
                  {/* Add more specific stats if needed */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.map((stat) => (
                  <tr key={stat.id}>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {/* Ideally, fetch match details (e.g., opponent, date) to display here or link to match page */}
                      <a href={`/admin/matches/${stat.match_id}/stats`} className="text-indigo-600 hover:text-indigo-800">
                        View Match
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{stat.goals ?? 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{stat.assists ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No match stats recorded for this player yet.</p>
        )}
      </div>
    </div>
  );
}