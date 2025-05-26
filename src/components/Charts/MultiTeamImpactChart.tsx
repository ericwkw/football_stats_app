'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface TeamImpact {
  team_id: string;
  team_name: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  win_rate: number;
  goals_per_game: number;
  assists_per_game: number;
  team_win_rate_with_player: number;
  team_win_rate_without_player: number;
  impact_score: number;
  statistical_significance: boolean;
}

interface MultiTeamImpactChartProps {
  playerName: string;
  teamImpactData: TeamImpact[];
  isLoading?: boolean;
}

const MultiTeamImpactChart: React.FC<MultiTeamImpactChartProps> = ({
  playerName,
  teamImpactData,
  isLoading = false
}) => {
  console.log("MultiTeamImpactChart props:", { playerName, teamImpactData, isLoading });
  
  // Prepare data for visualization
  const chartData = teamImpactData.map(team => ({
    team: team.team_name,
    withPlayer: Math.min(team.team_win_rate_with_player, 100),
    withoutPlayer: Math.min(team.team_win_rate_without_player, 100),
    impact: team.impact_score,
    matches: team.matches_played,
    statSig: team.statistical_significance,
    // Normalize unrealistic values for display
    goals_per_game: Math.min(team.goals_per_game, 3), // Cap at 3 goals per game for display
    assists_per_game: Math.min(team.assists_per_game, 1.5), // Cap at 1.5 assists per game for display
  }));
  
  console.log("MultiTeamImpactChart processed data:", chartData);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-bold">{label}</p>
          <p className="text-sm">
            <span className="font-semibold">Win Rate with {playerName}:</span> {data.withPlayer.toFixed(1)}%
          </p>
          <p className="text-sm">
            <span className="font-semibold">Win Rate without {playerName}:</span> {data.withoutPlayer.toFixed(1)}%
          </p>
          <p className="text-sm mt-1">
            <span className="font-semibold">Win Rate Impact:</span> {data.impact > 0 ? '+' : ''}{data.impact.toFixed(1)}%
          </p>
          <p className="text-sm mt-1">
            <span className="font-semibold">Matches played:</span> {data.matches}
          </p>
          {!data.statSig && (
            <p className="text-xs text-amber-600 mt-1">
              *Limited data for statistical confidence
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (teamImpactData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Team Impact Analysis</h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center p-6">
            <p className="text-gray-500 mb-2">No team impact data available</p>
            <p className="text-sm text-gray-400">
              This player needs to have played matches with different teams for this analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{`${playerName}&apos;s Win Rate Impact Across Teams`}</h3>
        <p className="text-sm text-gray-600">This chart shows how the team&apos;s win rate changes when {playerName} plays vs. when they don&apos;t play</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="team" 
              angle={-45} 
              textAnchor="end" 
              height={60} 
              interval={0}
            />
            <YAxis 
              label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }} 
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              name={`Win Rate With ${playerName}`} 
              dataKey="withPlayer" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              name={`Win Rate Without ${playerName}`} 
              dataKey="withoutPlayer" 
              fill="#EF4444" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {teamImpactData.map((team) => (
          <div 
            key={team.team_id} 
            className={`p-4 rounded-lg border ${
              team.impact_score > 5 ? 'border-green-200 bg-green-50' : 
              team.impact_score < -5 ? 'border-red-200 bg-red-50' : 
              'border-gray-200 bg-gray-50'
            }`}
          >
            <h4 className="font-semibold">{team.team_name}</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Win Rate With</p>
                <p className="font-medium">{team.team_win_rate_with_player.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Win Rate Without</p>
                <p className="font-medium">{team.team_win_rate_without_player.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Win Rate Impact</p>
                <p className={`font-bold ${
                  team.impact_score > 0 ? 'text-green-600' : 
                  team.impact_score < 0 ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {team.impact_score > 0 ? '+' : ''}{team.impact_score.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Matches</p>
                <p className="font-medium">{team.matches_played}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Goals/Game</p>
                <p className="font-medium">
                  {(Math.min(team.goals_per_game, 3)).toFixed(1)}
                  {team.goals_per_game > 3 && <span className="text-xs text-amber-600 ml-1">*</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Assists/Game</p>
                <p className="font-medium">
                  {(Math.min(team.assists_per_game, 1.5)).toFixed(1)}
                  {team.assists_per_game > 1.5 && <span className="text-xs text-amber-600 ml-1">*</span>}
                </p>
              </div>
            </div>
            {!team.statistical_significance && (
              <p className="text-xs text-amber-600 mt-2">
                *Limited data for statistical confidence
              </p>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-700 mb-2">Understanding the Statistics</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
          <li><span className="font-medium">Win Rate Impact</span>: The percentage point difference in team win rate when {playerName} plays versus when they don&apos;t</li>
          <li><span className="font-medium">Goals/Game</span>: Average number of goals scored by the team per game with {playerName}</li>
          <li><span className="font-medium">Assists/Game</span>: Average number of assists by {playerName} per game</li>
          <li><span className="font-medium">Statistical significance</span>: Requires at least 3 matches both with and without the player</li>
        </ul>
        <p className="mt-3 text-sm text-amber-600">
          <strong>Note:</strong> The statistics shown are based on available match data and may be adjusted for display. The actual values might vary as more match data becomes available.
        </p>
      </div>
    </div>
  );
};

export default MultiTeamImpactChart; 