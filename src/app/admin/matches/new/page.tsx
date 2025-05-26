"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Team } from '@/types/database';

export default function CreateMatchPage() {
  const router = useRouter();
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [matchDate, setMatchDate] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [matchType, setMatchType] = useState<string>('league'); // Default match type
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

    if (!homeTeamId || !awayTeamId || !matchDate) {
      setError('Please fill in all required fields: Home Team, Away Team, and Match Date.');
      setLoading(false);
      return;
    }

    if (homeTeamId === awayTeamId) {
      setError('Home team and Away team cannot be the same.');
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('matches')
      .insert([
        {
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          match_date: matchDate,
          venue: venue || null, // Ensure venue can be optional
          match_type: matchType,
          // home_score and away_score will be null by default
        },
      ])
      .select();

    setLoading(false);
    if (insertError) {
      console.error('Error creating match:', insertError);
      setError(`Failed to create match: ${insertError.message}`);
    } else {
      setSuccessMessage('Match created successfully!');
      // Optionally, redirect or clear form
      // router.push('/admin/matches');
      setHomeTeamId('');
      setAwayTeamId('');
      setMatchDate('');
      setVenue('');
      setMatchType('league');
      // Keep user on the page to add more matches or show success
      setTimeout(() => setSuccessMessage(null), 3000); 
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Create New Match</h1>
      
      {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</p>}
      {successMessage && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-lg p-6 md:p-8 space-y-6">
        <div>
          <label htmlFor="homeTeam" className="block text-sm font-medium text-gray-700 mb-1">Home Team</label>
          <select
            id="homeTeam"
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select Home Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="awayTeam" className="block text-sm font-medium text-gray-700 mb-1">Away Team</label>
          <select
            id="awayTeam"
            value={awayTeamId}
            onChange={(e) => setAwayTeamId(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select Away Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="matchDate" className="block text-sm font-medium text-gray-700 mb-1">Match Date & Time</label>
          <input
            type="datetime-local"
            id="matchDate"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">Venue (Optional)</label>
          <input
            type="text"
            id="venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Stadium Name, City"
          />
        </div>

        <div>
          <label htmlFor="matchType" className="block text-sm font-medium text-gray-700 mb-1">Match Type</label>
          <div className="flex flex-wrap gap-2">
            {['cup', 'friendly', 'league', 'other', 'tournament'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMatchType(type)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  matchType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.push('/admin/matches')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition duration-150 ease-in-out"
          >
            {loading ? 'Creating...' : 'Create Match'}
          </button>
        </div>
      </form>
    </div>
  );
}