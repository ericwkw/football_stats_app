// src/components/Admin/Players/AddPlayerForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Team, PlayerPositionValue, Player } from '@/types/database';

interface AddPlayerFormProps {
  onPlayerAdded?: () => void; 
  playerToEdit?: Player | null;
  onCancel?: () => void;
}

export default function AddPlayerForm({ onPlayerAdded, playerToEdit, onCancel }: AddPlayerFormProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions] = useState<PlayerPositionValue[]>(Object.values(PlayerPositionValue));
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [name, setName] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<PlayerPositionValue | ''>('');
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isEditMode = !!playerToEdit;

  useEffect(() => {
    if (isEditMode && playerToEdit) {
      setName(playerToEdit.name);
      setSelectedPosition(playerToEdit.position as PlayerPositionValue || '');
      setSelectedTeamId(playerToEdit.team_id || '');
    }
    
    // Reset form if playerToEdit becomes null (e.g., after successful edit and closing modal)
    if (!playerToEdit) {
        setName('');
        setSelectedPosition('');
        setSelectedTeamId('');
    }

    const fetchDropdownData = async () => {
      setFormLoading(true);
      setError(null);

      try {
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name');

        if (teamsError) {
          throw new Error(`Failed to fetch teams: ${teamsError.message}`);
        }
        
        setTeams(teamsData || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load form data');
      } finally {
        setFormLoading(false);
      }
    };

    fetchDropdownData();
  }, [playerToEdit, isEditMode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validate required fields
    if (!name.trim()) {
      setError('Player name is required');
      setLoading(false);
      return;
    }

    if (!selectedPosition) {
      setError('Position is required');
      setLoading(false);
      return;
    }

    // Prepare player data
    const playerData: { name: string; position?: PlayerPositionValue | ''; team_id?: string } = {
      name: name.trim(),
      position: selectedPosition || undefined,
    };

    if (selectedTeamId) {
      playerData.team_id = selectedTeamId;
    }

    try {
      if (isEditMode && playerToEdit) {
        // Update existing player
        const { error: updateError } = await supabase
          .from('players')
          .update(playerData)
          .eq('id', playerToEdit.id);

        if (updateError) throw new Error(updateError.message);
        
        setMessage('Player updated successfully!');
        
        // We use a timeout to show the success message briefly before callback
        setTimeout(() => {
          if (onPlayerAdded) {
            onPlayerAdded();
          }
        }, 1500);
      } else {
        // Add new player
        const { error: insertError } = await supabase
          .from('players')
          .insert([playerData]);

        if (insertError) throw new Error(insertError.message);
        
        setMessage('Player added successfully!');
        setName('');
        setSelectedPosition('');
        setSelectedTeamId('');
        
        // Callback after successful add
        if (onPlayerAdded) {
          onPlayerAdded();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  if (formLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
        <p className="ml-2 text-gray-700">Loading form data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      )}
      
      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{message}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
          Player Name
        </label>
        <input
          id="playerName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., Lionel Messi"
        />
      </div>

      <div>
        <label htmlFor="playerPosition" className="block text-sm font-medium text-gray-700">
          Position
        </label>
        <div className="flex flex-wrap gap-2 mt-1">
          {positions.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setSelectedPosition(pos)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPosition === pos
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="playerTeam" className="block text-sm font-medium text-gray-700">
          Team
        </label>
        <select
          id="playerTeam"
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">No team (optional)</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
              {isEditMode ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            isEditMode ? 'Update Player' : 'Add Player'
          )}
        </button>
        {isEditMode && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex justify-center px-4 py-2 ml-4 text-sm font-medium text-gray-700 bg-gray-200 border border-transparent rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}