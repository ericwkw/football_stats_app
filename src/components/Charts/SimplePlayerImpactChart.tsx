'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SimplePlayerImpactChartProps {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
}

interface MatchData {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  home_team: { name: string };
  away_team: { name: string };
}

interface PlayerAssignment {
  match_id: string;
  team_id: string | null;
}

interface ChartDataType {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}

const SimplePlayerImpactChart: React.FC<SimplePlayerImpactChartProps> = ({
  playerId,
  playerName,
  teamId,
  teamName
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataType | null>(null);
  const [rawData, setRawData] = useState<{
    withPlayer: { matches: number, wins: number, draws: number, losses: number, goals_for: number, goals_against: number };
    withoutPlayer: { matches: number, wins: number, draws: number, losses: number, goals_for: number, goals_against: number };
  }>({
    withPlayer: { matches: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 },
    withoutPlayer: { matches: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 }
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!playerId || !teamId) {
        setError('Missing player or team ID');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Step 1: Get all matches for this team
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id, 
            home_team_id, 
            away_team_id, 
            home_score, 
            away_score,
            home_team:home_team_id(name),
            away_team:away_team_id(name)
          `)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .not('home_score', 'is', null)
          .not('away_score', 'is', null);

        if (matchesError) {
          throw new Error(`Error fetching matches: ${matchesError.message}`);
        }

        // Step 2: Get player's match assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('player_match_assignments')
          .select('match_id, team_id')
          .eq('player_id', playerId);

        if (assignmentsError) {
          throw new Error(`Error fetching player assignments: ${assignmentsError.message}`);
        }

        // Step 3: Process the data
        const matches = matchesData as unknown as MatchData[];
        const playerAssignments = assignmentsData as PlayerAssignment[];
        
        // Create a set of match IDs where the player participated with this team
        const playerMatchIds = new Set(
          playerAssignments
            .filter(a => a.team_id === teamId)
            .map(a => a.match_id)
        );

        // Process match results
        const withPlayer = { matches: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 };
        const withoutPlayer = { matches: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 };

        matches.forEach(match => {
          const isHomeTeam = match.home_team_id === teamId;
          const teamScore = isHomeTeam ? match.home_score : match.away_score;
          const opponentScore = isHomeTeam ? match.away_score : match.home_score;
          const isWin = teamScore > opponentScore;
          const isDraw = teamScore === opponentScore;
          const isLoss = teamScore < opponentScore;

          // Determine if player was involved in this match
          const playerInvolved = playerMatchIds.has(match.id);
          
          // Update stats for with/without player
          const targetStats = playerInvolved ? withPlayer : withoutPlayer;
          
          targetStats.matches++;
          if (isWin) targetStats.wins++;
          if (isDraw) targetStats.draws++;
          if (isLoss) targetStats.losses++;
          targetStats.goals_for += teamScore;
          targetStats.goals_against += opponentScore;
        });

        // Calculate averages and percentages
        const calculateStats = (data: typeof withPlayer) => {
          return {
            matches_played: data.matches,
            win_rate: data.matches > 0 ? Math.min(Math.round((data.wins / data.matches) * 100), 100) : 0,
            goals_scored_avg: data.matches > 0 ? parseFloat((data.goals_for / data.matches).toFixed(2)) : 0,
            goals_conceded_avg: data.matches > 0 ? parseFloat((data.goals_against / data.matches).toFixed(2)) : 0
          };
        };

        const withPlayerStats = calculateStats(withPlayer);
        const withoutPlayerStats = calculateStats(withoutPlayer);

        // Calculate impact
        const winRateImpact = withPlayerStats.win_rate - withoutPlayerStats.win_rate;
        const goalsScoredImpact = withPlayerStats.goals_scored_avg - withoutPlayerStats.goals_scored_avg;
        const goalsConcededImpact = withPlayerStats.goals_conceded_avg - withoutPlayerStats.goals_conceded_avg;

        // Prepare chart data
        const chartLabels = ['Win Rate (%)', 'Goals Scored Avg', 'Goals Conceded Avg'];
        const chartDatasets = [
          {
            label: `With ${playerName} (${withPlayer.matches} matches)`,
            data: [withPlayerStats.win_rate, withPlayerStats.goals_scored_avg, withPlayerStats.goals_conceded_avg],
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: `Without ${playerName} (${withoutPlayer.matches} matches)`,
            data: [withoutPlayerStats.win_rate, withoutPlayerStats.goals_scored_avg, withoutPlayerStats.goals_conceded_avg],
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          }
        ];

        // Save the chart data
        setChartData({
          labels: chartLabels,
          datasets: chartDatasets
        });

        // Save raw data for the table
        setRawData({ withPlayer, withoutPlayer });

        // Impact summary
        const impactSummary = {
          winRateImpact,
          goalsScoredImpact,
          goalsConcededImpact
        };

        console.log('Player impact data processed:', {
          withPlayerStats,
          withoutPlayerStats,
          impactSummary
        });

      } catch (err) {
        console.error('Error in SimplePlayerImpactChart:', err);
        setError(typeof err === 'string' ? err : (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [playerId, teamId, playerName, teamName]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${playerName}'s Impact on ${teamName} Performance`,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100 // Set max to 100% for win rate
      }
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded mb-6"></div>
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 p-3 rounded">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Player Impact Analysis</h3>
        <div className="text-center p-4 text-red-500">
          <p>Error loading impact data.</p>
        </div>
      </div>
    );
  }

  // Calculate impact values
  const withPlayerStats = rawData.withPlayer;
  const withoutPlayerStats = rawData.withoutPlayer;
  
  const winRateWith = withPlayerStats.matches > 0 ? Math.round((withPlayerStats.wins / withPlayerStats.matches) * 100) : 0;
  const winRateWithout = withoutPlayerStats.matches > 0 ? Math.round((withoutPlayerStats.wins / withoutPlayerStats.matches) * 100) : 0;
  const winRateImpact = winRateWith - winRateWithout;
  
  const goalsScoredAvgWith = withPlayerStats.matches > 0 ? parseFloat((withPlayerStats.goals_for / withPlayerStats.matches).toFixed(2)) : 0;
  const goalsScoredAvgWithout = withoutPlayerStats.matches > 0 ? parseFloat((withoutPlayerStats.goals_for / withoutPlayerStats.matches).toFixed(2)) : 0;
  const goalsScoredImpact = parseFloat((goalsScoredAvgWith - goalsScoredAvgWithout).toFixed(2));
  
  const goalsConcededAvgWith = withPlayerStats.matches > 0 ? parseFloat((withPlayerStats.goals_against / withPlayerStats.matches).toFixed(2)) : 0;
  const goalsConcededAvgWithout = withoutPlayerStats.matches > 0 ? parseFloat((withoutPlayerStats.goals_against / withoutPlayerStats.matches).toFixed(2)) : 0;
  const goalsConcededImpact = parseFloat((goalsConcededAvgWith - goalsConcededAvgWithout).toFixed(2));

  // Impact summary data
  const summary = [
    {
      label: 'Win Rate Impact', 
      value: `${winRateImpact}%`,
      positive: winRateImpact > 0,
      description: `${Math.abs(winRateImpact).toFixed(1)}% ${winRateImpact >= 0 ? 'higher' : 'lower'} win rate with ${playerName}`
    },
    {
      label: 'Goals Scored Impact', 
      value: goalsScoredImpact.toFixed(2),
      positive: goalsScoredImpact > 0,
      description: `${Math.abs(goalsScoredImpact).toFixed(2)} more goals ${goalsScoredImpact >= 0 ? 'scored' : 'conceded'} per game with ${playerName}`
    },
    {
      label: 'Goals Conceded Impact', 
      value: goalsConcededImpact.toFixed(2),
      // Note: Lower goals conceded is positive, so negative delta is positive
      positive: goalsConcededImpact < 0,
      description: `${Math.abs(goalsConcededImpact).toFixed(2)} ${goalsConcededImpact <= 0 ? 'fewer' : 'more'} goals conceded per game with ${playerName}`
    },
  ];

  // Render chart and data
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">Player Impact Analysis</h3>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center p-4 text-red-500">
          <p>Error loading impact data.</p>
        </div>
      ) : (
        <div>
          {chartData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Bar 
                    options={chartOptions} 
                    data={chartData}
                    aria-label={`Chart showing ${playerName}'s impact on ${teamName} performance`}
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium text-gray-700 mb-2">Impact Summary</h4>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-500">Win Rate with {playerName}</p>
                      <p className="text-xl font-bold">{winRateWith}%</p>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-500">Win Rate without {playerName}</p>
                      <p className="text-xl font-bold">{winRateWithout}%</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Impact Score</p>
                      <p className={`text-xl font-bold ${
                        winRateImpact > 0 
                          ? 'text-green-600' 
                          : winRateImpact < 0 
                            ? 'text-red-600' 
                            : ''
                      }`}>
                        {winRateImpact > 0 ? '+' : ''}{Math.abs(winRateImpact).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-gray-50 p-4 rounded">
                    <h4 className="font-medium text-gray-700 mb-2">Match Data</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Matches with</p>
                        <p className="text-lg font-semibold">{withPlayerStats.matches}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Matches without</p>
                        <p className="text-lg font-semibold">{withoutPlayerStats.matches}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h4 className="font-medium text-gray-700 mb-2">Interpretation</h4>
                <p className="text-sm text-gray-600">
                  {winRateImpact > 10 ? (
                    <>
                      <span className="font-medium text-green-600">Strong Positive Impact:</span> {playerName} significantly improves the team's win rate by {Math.abs(winRateImpact).toFixed(1)}%.
                    </>
                  ) : winRateImpact > 0 ? (
                    <>
                      <span className="font-medium text-green-600">Positive Impact:</span> {playerName} improves the team's win rate by {Math.abs(winRateImpact).toFixed(1)}%.
                    </>
                  ) : winRateImpact < -10 ? (
                    <>
                      <span className="font-medium text-red-600">Strong Negative Impact:</span> The team's win rate decreases by {Math.abs(winRateImpact).toFixed(1)}% when {playerName} plays.
                    </>
                  ) : winRateImpact < 0 ? (
                    <>
                      <span className="font-medium text-red-600">Negative Impact:</span> The team's win rate decreases by {Math.abs(winRateImpact).toFixed(1)}% when {playerName} plays.
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Neutral Impact:</span> {playerName} doesn't significantly affect the team's win rate.
                    </>
                  )}
                  {withPlayerStats.matches < 5 || withoutPlayerStats.matches < 5 ? (
                    <span className="block mt-2 text-yellow-600">
                      Note: Limited match data available. Results may not be statistically significant.
                    </span>
                  ) : null}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SimplePlayerImpactChart; 