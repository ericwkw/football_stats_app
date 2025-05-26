// src/components/Admin/Players/PlayerList.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Player, Team } from '@/types/database'; // Import Player and Team types

interface PlayerListProps {
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  key?: number; // Allow key prop for re-rendering
}

interface PlayerWithTeam extends Player {
  team?: Team | null;
  team_name?: string;
}

export default function PlayerList({ onEditPlayer, onDeletePlayer }: PlayerListProps) {
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, fetch all players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .order('name');

        if (playersError) throw playersError;
          
        // Then, for players with team_id, fetch their teams
        const playersWithTeams = await Promise.all(
          (playersData || []).map(async (player) => {
            if (player.team_id) {
              const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('*')
                .eq('id', player.team_id)
                .single();
                
              if (teamError) {
                // Just return player with N/A team instead of logging
                return { ...player, team_name: 'N/A' };
              }
              
              return { 
                ...player, 
                team: teamData,
                team_name: teamData?.name || 'N/A'
              };
            }
            
            return { ...player, team_name: 'N/A' };
          })
        );
          
        setPlayers(playersWithTeams);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch players');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-full text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-700">Loading players...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-500 font-medium">Error loading players</p>
        <p className="text-red-400 text-sm mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-md">
        <p className="text-gray-700">No players found.</p>
        <p className="text-gray-500 text-sm mt-1">Add a player using the form above.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Name</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Position</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Team</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {players.map((player) => (
            <tr key={player.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{player.name}</td>
              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{player.position || 'N/A'}</td>
              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{player.team_name}</td>
              <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                <button 
                  onClick={() => onEditPlayer(player)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                  aria-label={`Edit ${player.name}`}
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDeletePlayer(player.id)}
                  className="text-red-600 hover:text-red-900"
                  aria-label={`Delete ${player.name}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}