'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface Match {
  id: string;
  match_date: string;
  home_team: {
    id: string;
    name: string;
  };
  away_team: {
    id: string;
    name: string;
  };
  home_score: number | null;
  away_score: number | null;
  venue: string;
  match_type: 'internal_friendly' | 'external_game';
}

export default function MatchesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = supabase
          .from('matches')
          .select(`
            id,
            match_date,
            home_score,
            away_score,
            venue,
            match_type,
            home_team:home_team_id(id, name),
            away_team:away_team_id(id, name)
          `)
          .order('match_date', { ascending: false });
        
        if (filterType) {
          query.eq('match_type', filterType);
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw new Error(`Failed to fetch matches: ${fetchError.message}`);
        
        setMatches((data || []) as unknown as Match[]);
      } catch (err: unknown) {
        console.error('Error fetching match data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [filterType]);

  const getMatchResult = (match: Match) => {
    if (match.home_score === null || match.away_score === null) {
      return 'Upcoming';
    }
    
    if (match.home_score > match.away_score) {
      return 'Home Win';
    } else if (match.home_score < match.away_score) {
      return 'Away Win';
    } else {
      return 'Draw';
    }
  };

  const getMatchTypeLabel = (type: string) => {
    return type === 'internal_friendly' ? 'Internal Friendly' : 'vs External Team';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">Match Results</h1>
          <p className="text-center mt-2">View all matches and results</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to Home
          </Link>
        </div>

        <div className="mb-6">
          <label htmlFor="match-type-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Match Type:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setFilterType('external_game')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'external_game'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              vs External Team
            </button>
            <button
              onClick={() => setFilterType('internal_friendly')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'internal_friendly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Internal Friendly
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl">Loading matches...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.length > 0 ? (
              matches.map((match) => {
                const result = getMatchResult(match);
                const isCompleted = match.home_score !== null && match.away_score !== null;
                
                return (
                  <div key={match.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {new Date(match.match_date).toLocaleDateString()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          match.match_type === 'external_game' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {getMatchTypeLabel(match.match_type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{match.venue}</p>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-center w-2/5">
                          <Link href={`/teams/${match.home_team.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                            {match.home_team.name}
                          </Link>
                        </div>
                        
                        <div className="text-center w-1/5">
                          <div className="text-xl font-bold">
                            {isCompleted 
                              ? `${match.home_score} - ${match.away_score}` 
                              : 'vs'
                            }
                          </div>
                          {isCompleted && (
                            <div className={`text-xs mt-1 ${
                              result === 'Home Win' 
                                ? 'text-green-600' 
                                : result === 'Away Win' 
                                ? 'text-red-600' 
                                : 'text-gray-600'
                            }`}>
                              {result}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-center w-2/5">
                          <Link href={`/teams/${match.away_team.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                            {match.away_team.name}
                          </Link>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <Link href={`/matches/${match.id}`} className="text-blue-600 hover:underline text-sm">
                          {isCompleted ? 'Match Details' : 'Upcoming Match'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-white shadow-md rounded-lg p-6 text-center text-gray-500">
                No matches found
              </div>
            )}
          </div>
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