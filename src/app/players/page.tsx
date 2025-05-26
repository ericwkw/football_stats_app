'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { PlayerPositionValue } from '@/types/database';

interface PlayerStats {
  player_id: string;
  player_name: string;
  position: PlayerPositionValue | string;
  team_name: string;
  team_id: string;
  matches_played: number;
  goals: number;
  assists: number;
  clean_sheets: number;
  weighted_goals: number;
  weighted_assists: number;
  clean_sheet_percentage?: number | null;
}

interface PlayerFromDB {
  id: string;
  name: string;
  player_position?: string;
  team_id?: string;
  team_name?: string;
}

interface PlayerStatFromDB {
  player_id: string;
  matches_played: number;
  goals: number;
  assists: number;
  clean_sheets: number;
  weighted_goals: number;
  weighted_assists: number;
  clean_sheet_percentage?: number;
}

export default function PlayersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [filterPosition, setFilterPosition] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('weighted_goals');

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get all players with their positions and teams using our SQL function
        const { data: playersData, error: playersError } = await supabase
          .rpc('get_all_internal_players');
        
        if (playersError) throw new Error(`Failed to fetch players: ${playersError.message}`);
        
        // Get player statistics
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_internal_all_player_statistics');
        
        if (statsError) throw new Error(`Failed to fetch player statistics: ${statsError.message}`);
        
        // Merge the data
        const playerStats: PlayerStats[] = (playersData as PlayerFromDB[]).map((player) => {
          const stats = (statsData as PlayerStatFromDB[]).find(s => s.player_id === player.id) || {
            matches_played: 0,
            goals: 0,
            assists: 0,
            clean_sheets: 0,
            weighted_goals: 0,
            weighted_assists: 0
          };
          
          // Calculate clean sheet percentage for goalkeepers
          let clean_sheet_percentage = null;
          if (player.player_position === 'Goalkeeper' && stats.matches_played > 0) {
            clean_sheet_percentage = Math.round((stats.clean_sheets / stats.matches_played) * 100);
          }
          
          return {
            player_id: player.id,
            player_name: player.name,
            position: player.player_position || 'N/A',
            team_name: player.team_name || 'N/A',
            team_id: player.team_id || 'N/A',
            ...stats,
            clean_sheet_percentage
          };
        });
        
        setPlayers(playerStats);
      } catch (err: unknown) {
        console.error('Error fetching player data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayers();
  }, []);

  // Sort and filter players
  const filteredPlayers = players
    .filter(player => !filterPosition || player.position === filterPosition)
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.player_name.localeCompare(b.player_name);
      } else if (sortBy === 'matches_played') {
        return b.matches_played - a.matches_played;
      } else if (sortBy === 'goals') {
        return b.goals - a.goals;
      } else if (sortBy === 'assists') {
        return b.assists - a.assists;
      } else if (sortBy === 'weighted_goals') {
        return b.weighted_goals - a.weighted_goals;
      } else if (sortBy === 'weighted_assists') {
        return b.weighted_assists - a.weighted_assists;
      } else if (sortBy === 'clean_sheets') {
        return b.clean_sheets - a.clean_sheets;
      } else if (sortBy === 'clean_sheet_percentage') {
        return (b.clean_sheet_percentage || 0) - (a.clean_sheet_percentage || 0);
      }
      return 0;
    });

  // Get unique positions for filtering
  const positions = Array.from(new Set(players.map(p => p.position))).sort();

  // Helper function to determine if a column is the sorted column
  const isSortedColumn = (column: string) => sortBy === column;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">Player Statistics</h1>
          <p className="text-center mt-2">View performance data for all players</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to Home
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl">Loading player statistics...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-lg shadow">
              {/* Position Filter */}
              <div>
                <label htmlFor="position-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Position:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterPosition('')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      filterPosition === ''
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Positions
                  </button>
                  {positions.map(position => (
                    <button
                      key={position}
                      onClick={() => setFilterPosition(position)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        filterPosition === position
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {position}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By:
                </label>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSortBy('name')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        sortBy === 'name'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Name
                    </button>
                    <button
                      onClick={() => setSortBy('weighted_goals')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        sortBy === 'weighted_goals'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Weighted Goals
                    </button>
                    <button
                      onClick={() => setSortBy('weighted_assists')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        sortBy === 'weighted_assists'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Weighted Assists
                    </button>
                    <button
                      onClick={() => setSortBy('clean_sheet_percentage')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        sortBy === 'clean_sheet_percentage'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Clean Sheet %
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSortedColumn('name') ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSortedColumn('matches_played') ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
                        MP
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSortedColumn('goals') ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
                        Goals
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSortedColumn('weighted_goals') ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
                        Weighted Goals
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSortedColumn('assists') ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
                        Assists
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSortedColumn('weighted_assists') ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
                        Weighted Assists
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSortedColumn('clean_sheets') ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
                        Clean Sheets
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isSortedColumn('clean_sheet_percentage') ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
                        Clean Sheet %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPlayers.length > 0 ? (
                      filteredPlayers.map((player) => (
                        <tr key={player.player_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link href={`/players/${player.player_id}`} className="hover:underline">
                              {player.player_name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.position}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isSortedColumn('matches_played') ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                            {player.matches_played}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isSortedColumn('goals') ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                            {player.goals}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isSortedColumn('weighted_goals') ? 'text-blue-600' : 'text-gray-500'}`}>
                            {player.weighted_goals}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isSortedColumn('assists') ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                            {player.assists}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isSortedColumn('weighted_assists') ? 'text-blue-600' : 'text-gray-500'}`}>
                            {player.weighted_assists}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isSortedColumn('clean_sheets') ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                            {player.clean_sheets}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isSortedColumn('clean_sheet_percentage') ? 'text-blue-600' : 'text-gray-500'}`}>
                            {player.clean_sheet_percentage ? `${player.clean_sheet_percentage}%` : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                          No player statistics available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Football Stats App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 