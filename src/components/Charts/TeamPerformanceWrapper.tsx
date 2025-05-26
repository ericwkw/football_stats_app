'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PlayerTeamImpactChart } from '@/components/Charts';

interface TeamPerformance {
  scenario: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  win_rate: number;
  goals_scored_avg: number;
  goals_conceded_avg: number;
}

interface TeamPerformanceWrapperProps {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
}

const TeamPerformanceWrapper: React.FC<TeamPerformanceWrapperProps> = ({
  playerId,
  playerName,
  teamId,
  teamName
}) => {
  const [performance, setPerformance] = useState<TeamPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!playerId || !teamId) {
        setError('Missing player or team ID');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try to fetch the data
        const { data, error: apiError } = await supabase
          .rpc('get_team_performance_with_player', {
            player_id_param: playerId,
            team_id_param: teamId
          });

        if (apiError) {
          console.error('Team performance error:', apiError);
          setError(`Error fetching team performance: ${apiError.message}`);
          // Generate placeholder data if there's an error
          setPerformance([
            { 
              scenario: 'With Player', 
              matches_played: 0, 
              wins: 0, 
              draws: 0, 
              losses: 0, 
              win_rate: 0, 
              goals_scored_avg: 0, 
              goals_conceded_avg: 0 
            },
            { 
              scenario: 'Without Player', 
              matches_played: 0, 
              wins: 0, 
              draws: 0, 
              losses: 0, 
              win_rate: 0, 
              goals_scored_avg: 0, 
              goals_conceded_avg: 0 
            }
          ]);
        } else {
          // Handle case where data is empty
          if (!data || data.length === 0) {
            setPerformance([
              { 
                scenario: 'With Player', 
                matches_played: 0, 
                wins: 0, 
                draws: 0, 
                losses: 0, 
                win_rate: 0, 
                goals_scored_avg: 0, 
                goals_conceded_avg: 0 
              },
              { 
                scenario: 'Without Player', 
                matches_played: 0, 
                wins: 0, 
                draws: 0, 
                losses: 0, 
                win_rate: 0, 
                goals_scored_avg: 0, 
                goals_conceded_avg: 0 
              }
            ]);
          } else {
            setPerformance(data);
          }
        }

        // Also fetch diagnostic data
        setIsDiagnosticLoading(true);
        try {
          const diagnosticResponse = await fetch(`/api/player-diagnostic/${playerId}`);
          const diagnosticJson = await diagnosticResponse.json();
          setDiagnosticData(diagnosticJson);
        } catch (diagErr) {
          console.error('Error fetching diagnostic data:', diagErr);
        } finally {
          setIsDiagnosticLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error in team performance fetch:', err);
        setError('Unexpected error fetching team data');
        // Generate placeholder data on error
        setPerformance([
          { 
            scenario: 'With Player', 
            matches_played: 0, 
            wins: 0, 
            draws: 0, 
            losses: 0, 
            win_rate: 0, 
            goals_scored_avg: 0, 
            goals_conceded_avg: 0 
          },
          { 
            scenario: 'Without Player', 
            matches_played: 0, 
            wins: 0, 
            draws: 0, 
            losses: 0, 
            win_rate: 0, 
            goals_scored_avg: 0, 
            goals_conceded_avg: 0 
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [playerId, teamId]);

  // Display error message if needed
  if (error && !isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Team Impact Analysis</h3>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {error}
              </p>
              <p className="mt-2 text-xs text-yellow-600">
                The chart is showing placeholder data. This is often due to missing match data.
              </p>
            </div>
          </div>
        </div>
        
        {/* Show chart with placeholder data anyway */}
        <div className="mt-4 opacity-70">
          <PlayerTeamImpactChart
            playerName={playerName}
            teamName={teamName}
            performance={performance}
            isLoading={false}
          />
        </div>
      </div>
    );
  }

  // Normal rendering
  return (
    <div>
      <PlayerTeamImpactChart
        playerName={playerName}
        teamName={teamName}
        performance={performance}
        isLoading={isLoading}
      />
      
      {/* Debug data table */}
      <div className="mt-8 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-2">Raw Data (Debug View)</h3>
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Matches Played</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Wins</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Draws</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Losses</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Win Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Goals Scored Avg</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Goals Conceded Avg</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {performance.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border">{item.scenario}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border">{item.matches_played}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border">{item.wins}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border">{item.draws}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border">{item.losses}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border">{item.win_rate}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border">{item.goals_scored_avg}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border">{item.goals_conceded_avg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Diagnostic data */}
      {isDiagnosticLoading ? (
        <div className="mt-8 p-4 bg-blue-50 rounded">
          <p className="text-blue-700">Loading diagnostic data...</p>
        </div>
      ) : diagnosticData && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Advanced Diagnostic Data</h3>
          
          {/* Player Info */}
          <div className="bg-blue-50 p-4 rounded mb-4">
            <h4 className="font-medium mb-2">Player Info</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Player ID: {diagnosticData.player?.id}</div>
              <div>Name: {diagnosticData.player?.name}</div>
              <div>Position: {diagnosticData.player?.position}</div>
              <div>Team ID: {diagnosticData.player?.team_id}</div>
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="bg-green-50 p-4 rounded mb-4">
            <h4 className="font-medium mb-2">Stats Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Assignments Count: {diagnosticData.assignments?.length || 0}</div>
              <div>Stats Count: {diagnosticData.stats?.length || 0}</div>
              <div>Goals: {diagnosticData.stats?.reduce((sum: number, stat: any) => sum + (stat.goals || 0), 0)}</div>
              <div>Assists: {diagnosticData.stats?.reduce((sum: number, stat: any) => sum + (stat.assists || 0), 0)}</div>
            </div>
          </div>
          
          {/* Error Info */}
          {(diagnosticData.assignmentsError || diagnosticData.statsError || diagnosticData.teamPerformanceError) && (
            <div className="bg-red-50 p-4 rounded mb-4">
              <h4 className="font-medium mb-2">Errors</h4>
              {diagnosticData.assignmentsError && <div className="text-red-700 mb-1">Assignments: {diagnosticData.assignmentsError.message}</div>}
              {diagnosticData.statsError && <div className="text-red-700 mb-1">Stats: {diagnosticData.statsError.message}</div>}
              {diagnosticData.teamPerformanceError && <div className="text-red-700 mb-1">Team Performance: {diagnosticData.teamPerformanceError.message}</div>}
            </div>
          )}
          
          {/* Detailed Stats */}
          {diagnosticData.stats?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Match Stats Detail</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Match ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Goals</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Assists</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Minutes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {diagnosticData.stats.map((stat: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500 border">{stat.match_id}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500 border">{stat.goals}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500 border">{stat.assists}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500 border">{stat.minutes_played}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamPerformanceWrapper; 