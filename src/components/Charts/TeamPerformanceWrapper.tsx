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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // These state variables are not used anymore since debug views are removed
  // const [diagnosticData, setDiagnosticData] = useState<any>(null);
  // const [isDiagnosticLoading, setIsDiagnosticLoading] = useState<boolean>(false);

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

        // Also fetch diagnostic data - commented out as not needed anymore
        /*
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
        */
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
      
      {/* Debug data tables - hidden */}

      {/* Diagnostic data - hidden */}
    </div>
  );
};

export default TeamPerformanceWrapper; 