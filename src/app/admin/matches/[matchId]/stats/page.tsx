"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import PlayerStatsForm from '@/components/Admin/Matches/PlayerStatsForm';
import PlayerTeamAssignments from '@/components/Admin/Matches/PlayerTeamAssignments';
import { Match } from '@/types/database';

interface MatchWithTeams extends Match {
  home_team: { id: string; name: string };
  away_team: { id: string; name: string };
}

export default function MatchStats() {
  const params = useParams();
  const matchId = params.matchId as string;
  const [match, setMatch] = useState<MatchWithTeams | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*, home_team:home_team_id(id, name), away_team:away_team_id(id, name)')
          .eq('id', matchId)
          .single();

        if (error) throw error;
        setMatch(data as MatchWithTeams);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  const handleStatsSubmitted = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) return <p className="text-center p-8">Loading match details...</p>;
  if (error) return <p className="text-center text-red-500 p-8">Error: {error}</p>;
  if (!match) return <p className="text-center p-8">Match not found</p>;

  return (
    <div className="container p-4 mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Match Stats</h1>
        <Link href="/admin/matches" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Back to Matches
        </Link>
      </div>
      
      <div className="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="font-semibold text-blue-800 mb-2">How This Works</h2>
        <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
          <li>For each match, players can be assigned to either team regardless of their usual team.</li>
          <li><strong>Step 1:</strong> First use the Player Team Assignments section below to select who played and assign them to teams.</li>
          <li><strong>Step 2:</strong> Then record individual player statistics (goals, assists, minutes) in the Player Stats section.</li>
          <li>This flexible assignment system allows tracking internal games where players change teams each match day.</li>
        </ul>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Match Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <p><span className="font-medium">Date:</span> {new Date(match.match_date).toLocaleString()}</p>
          <p><span className="font-medium">Venue:</span> {match.venue}</p>
          <p><span className="font-medium">Home Team:</span> {match.home_team?.name || 'N/A'}</p>
          <p><span className="font-medium">Away Team:</span> {match.away_team?.name || 'N/A'}</p>
          <p><span className="font-medium">Score:</span> {match.home_score === null || match.home_score === undefined ? 'TBD' : match.home_score} - {match.away_score === null || match.away_score === undefined ? 'TBD' : match.away_score}</p>
          <p><span className="font-medium">Match Type:</span> {match.match_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A'}</p>
        </div>
      </div>
      
      <div className="p-6 mb-6 bg-white rounded-lg shadow">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Step 1: Player Team Assignments</h2>
          <p className="text-sm text-gray-600 mt-1">Select the players who participated in this match and assign them to the team they played with</p>
        </div>
        <PlayerTeamAssignments matchId={matchId} onTeamsAssigned={handleStatsSubmitted} />
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Step 2: Add Player Stats</h2>
        <PlayerStatsForm matchId={matchId} onStatsSubmitted={handleStatsSubmitted} refreshTrigger={refreshKey} />
      </div>
    </div>
  );
}