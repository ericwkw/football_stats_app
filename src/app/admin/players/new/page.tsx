"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Team, PlayerPositionValue } from '@/types/database';

export default function AddPlayerPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [positions] = useState<PlayerPositionValue[]>(Object.values(PlayerPositionValue));
  const [nationality, setNationality] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase.from('teams').select('id, name').order('name');
      if (error) {
        console.error('Error fetching teams:', error);
        setError('Failed to load teams.');
      } else {
        setTeams(data || []);
      }
    };
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!name || !position) {
      setError('Player name and position are required.');
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('players')
      .insert([
        {
          name,
          position,
          nationality: nationality || null,
          team_id: teamId || null,
        },
      ])
      .select();

    setLoading(false);
    if (insertError) {
      console.error('Error creating player:', insertError);
      setError(`Failed to create player: ${insertError.message}`);
    } else {
      setSuccessMessage('Player added successfully!');
      setName('');
      setPosition('');
      setNationality('');
      setTeamId(null);
      // Keep user on the page to add more players or show success
      setTimeout(() => setSuccessMessage(null), 3000);
      // Optionally, redirect to players list: router.push('/admin/players');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Add New Player</h1>
      
      {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</p>}
      {successMessage && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-lg p-6 md:p-8 space-y-6">
        <div>
          <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
          <input
            type="text"
            id="playerName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Lionel Messi"
          />
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <div className="flex flex-wrap gap-2">
            {positions.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setPosition(pos)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  position === pos
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
          <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">Nationality (Optional)</label>
          <input
            type="text"
            id="nationality"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Argentinian"
          />
        </div>

        <div>
          <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">Team (Optional)</label>
          <select
            id="team"
            value={teamId || ''}
            onChange={(e) => setTeamId(e.target.value || null)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select Team (Optional)</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.push('/admin/players')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition duration-150 ease-in-out"
          >
            {loading ? 'Adding...' : 'Add Player'}
          </button>
        </div>
      </form>
    </div>
  );
}