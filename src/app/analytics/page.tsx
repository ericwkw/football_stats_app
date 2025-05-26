'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PlayerCombinationsChart } from '@/components/Charts';
import Link from 'next/link';

// Define types for analytics data
interface PlayerCombination {
  player1_id: string;
  player1_name: string;
  player2_id: string;
  player2_name: string;
  total_matches: number;
  win_matches: number;
  draw_matches: number;
  loss_matches: number;
  win_rate: number;
  win_rate_as_opponents?: number | null;
}

// Component to display database errors
const DatabaseErrorMessage = ({ error, sqlFunction }: { error: string, sqlFunction?: string }) => (
  <div className="mb-8 bg-red-50 border border-red-200 rounded-md p-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Database Error</h3>
        <div className="mt-2 text-sm text-red-700">
          <p>{error}</p>
          {sqlFunction && <p className="mt-1 font-mono text-xs bg-red-100 p-1 rounded">Function: {sqlFunction}</p>}
        </div>
      </div>
    </div>
  </div>
);

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sqlFunction, setSqlFunction] = useState<string | null>(null);
  const [playerCombinations, setPlayerCombinations] = useState<PlayerCombination[]>([]);
  const [minMatches, setMinMatches] = useState(3);
  const [combinationsLimit, setCombinationsLimit] = useState(10);
  
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      setSqlFunction(null);
      
      try {
        // Fetch player combinations
        const combinationsFunction = 'get_player_combinations';
        const { data: combinationsData, error: combinationsError } = await supabase
          .rpc(combinationsFunction, { min_matches_param: minMatches });
        
        if (combinationsError) {
          console.error('Error fetching player combinations:', combinationsError);
          setError(combinationsError.message);
          setSqlFunction(combinationsFunction);
          setPlayerCombinations([]);
        } else {
          setPlayerCombinations(combinationsData || []);
        }
      } catch (err) {
        console.error('Error in analytics data fetch:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [minMatches]);
  
  const handleRefresh = () => {
    setMinMatches(prev => prev); // Trigger re-fetch by changing dependency
  };
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Team Analytics</h1>
          <p className="mt-2 text-gray-600">Advanced statistical analysis of player and team performance</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to Home
          </Link>
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {error && <DatabaseErrorMessage error={error} sqlFunction={sqlFunction || undefined} />}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Filters & Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="minMatches" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Matches Together
            </label>
            <div className="flex items-center">
              <input
                type="range"
                id="minMatches"
                value={minMatches}
                onChange={e => setMinMatches(parseInt(e.target.value))}
                min="2"
                max="20"
                step="1"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="ml-2 flex items-center">
                <input
                  type="number"
                  value={minMatches}
                  onChange={e => {
                    const value = parseInt(e.target.value);
                    if (value >= 2 && value <= 20) {
                      setMinMatches(value);
                    }
                  }}
                  min="2"
                  max="20"
                  className="w-12 text-center border border-gray-300 rounded py-1 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum games played together for player combinations</p>
          </div>
          
          <div>
            <label htmlFor="combinationsLimit" className="block text-sm font-medium text-gray-700 mb-1">
              Top Combinations to Show
            </label>
            <div className="flex items-center">
              <input
                type="range"
                id="combinationsLimit"
                value={combinationsLimit}
                onChange={e => setCombinationsLimit(parseInt(e.target.value))}
                min="5"
                max="20"
                step="1"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="ml-2 flex items-center">
                <input
                  type="number"
                  value={combinationsLimit}
                  onChange={e => {
                    const value = parseInt(e.target.value);
                    if (value >= 5 && value <= 20) {
                      setCombinationsLimit(value);
                    }
                  }}
                  min="5"
                  max="20"
                  className="w-12 text-center border border-gray-300 rounded py-1 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Number of combinations to display in chart</p>
          </div>
        </div>
      </div>
      
      {/* Player Combinations Section */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Player Combinations Analysis</h2>
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {playerCombinations.length} combinations
          </span>
        </div>
        <p className="text-gray-600 mb-4">
          This chart shows which player combinations work well together, based on win rate when both players
          are on the same team. Minimum {minMatches} matches played together.
        </p>
        
        <PlayerCombinationsChart 
          combinations={playerCombinations}
          limit={combinationsLimit}
          minMatches={minMatches}
          isLoading={isLoading}
        />
      </section>
      
      {/* Link to Individual Player Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-10">
        <h3 className="text-lg font-semibold mb-2">Player-Specific Analysis</h3>
        <p className="text-gray-600 mb-4">
          To see detailed analysis for a specific player, including their impact on particular teams,
          visit the individual player pages.
        </p>
        <div className="flex justify-center">
          <Link 
            href="/players"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Browse Players
          </Link>
        </div>
      </div>
    </main>
  );
} 