// src/components/Admin/Matches/MatchList.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Match, Team } from '@/types/database'; // Import Match and Team types

interface EnrichedMatch extends Match {
  home_team_name: string;
  away_team_name: string;
}

interface MatchListProps {
  onMatchDeleted?: (matchId: string) => void; // Callback for when a match is deleted
  // key?: any; // Key is a reserved prop and should not be defined here
}

export default function MatchList({ onMatchDeleted }: MatchListProps) {
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchesAndTeams = async () => {
      setLoading(true);
      setError(null);

      // Fetch matches with order by match_date in descending order (newest first)
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select<Match[]>('*')
        .order('match_date', { ascending: false });

      if (matchesError) {
        console.error('MatchList: Error fetching matches:', matchesError);
        setError(matchesError.message);
        setLoading(false);
        return;
      }

      if (!matchesData || matchesData.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Fetch teams to enrich match data
      const teamIds = new Set<string>();
      matchesData.forEach(match => {
        teamIds.add(match.home_team_id);
        teamIds.add(match.away_team_id);
      });

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select<Team[]>('*')
        .in('id', Array.from(teamIds));

      if (teamsError) {
        console.error('MatchList: Error fetching teams:', teamsError);
        // Continue with matches but team names might be missing
        setError(prev => prev ? `${prev}, ${teamsError.message}` : teamsError.message);
      }

      const teamsMap = new Map<string, string>();
      if (teamsData) {
        teamsData.forEach(team => teamsMap.set(team.id, team.name));
      }

      const enrichedMatches = matchesData.map(match => ({
        ...match,
        home_team_name: teamsMap.get(match.home_team_id) || 'Unknown Team',
        away_team_name: teamsMap.get(match.away_team_id) || 'Unknown Team',
      }));

      setMatches(enrichedMatches);
      setLoading(false);
    };

    fetchMatchesAndTeams();
  }, []);

  if (loading) {
    return <p className="text-gray-700">Loading matches...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error loading matches: {error}</p>;
  }

  if (matches.length === 0) {
    return <p className="text-gray-700">No matches found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Date</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Home Team</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Away Team</th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Score</th>
            {/* Add more headers as needed, e.g., Competition */}
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {matches.map((match) => (
            <tr key={match.id}>
              <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{new Date(match.match_date).toLocaleDateString()}</td>
              <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{match.home_team_name}</td>
              <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{match.away_team_name}</td>
              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                {match.home_score !== null && match.away_score !== null ? `${match.home_score} - ${match.away_score}` : 'N/A'}
              </td>
              {/* Render other match data here */}
              <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                <a href={`/admin/matches/${match.id}/stats`} className="text-indigo-600 hover:text-indigo-900">View Stats</a>
                <a href={`/admin/matches/edit/${match.id}`} className="ml-4 text-blue-600 hover:text-blue-900">Edit</a>
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
                      onMatchDeleted?.(match.id);
                    }
                  }}
                  className="ml-4 text-red-600 hover:text-red-900"
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