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
  ReferenceLine,
  TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface PlayerCombination {
  teammate_id: string;
  teammate_name: string;
  team_id: string;
  team_name: string;
  matches_together: number;
  win_rate_together: number;
  win_rate_without: number;
  win_impact: number;
  goals_per_match_together: number;
  goals_per_match_without: number; 
  goal_impact: number;
  statistical_significance: boolean;
}

interface PlayerTeamCombinationsChartProps {
  playerName: string;
  teamName: string;
  combinations: PlayerCombination[];
  isLoading?: boolean;
  limit?: number;
}

const PlayerTeamCombinationsChart: React.FC<PlayerTeamCombinationsChartProps> = ({
  playerName,
  teamName,
  combinations,
  isLoading = false,
  limit = 10
}) => {
  // Sort combinations by matches together (desc) and then impact (absolute value, desc)
  const sortedCombinations = [...combinations].sort((a, b) => {
    // First sort by statistical significance
    if (a.statistical_significance && !b.statistical_significance) return -1;
    if (!a.statistical_significance && b.statistical_significance) return 1;
    
    // Then by matches played together
    if (a.matches_together !== b.matches_together) {
      return b.matches_together - a.matches_together;
    }
    
    // Finally by absolute impact
    return Math.abs(b.win_impact) - Math.abs(a.win_impact);
  });
  
  // Take only the top N combinations
  const topCombinations = sortedCombinations.slice(0, limit);
  
  // Prepare chart data - focusing on win impact
  const chartData = topCombinations.map(combo => ({
    name: combo.teammate_name,
    winImpact: combo.win_impact,
    matches: combo.matches_together,
    winRateTogether: combo.win_rate_together,
    winRateWithout: combo.win_rate_without,
    statSig: combo.statistical_significance
  }));
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-bold">{label}</p>
          <p className="text-sm">
            <span className="font-semibold">Win rate together:</span> {data.winRateTogether.toFixed(1)}%
          </p>
          <p className="text-sm">
            <span className="font-semibold">Win rate without:</span> {data.winRateWithout.toFixed(1)}%
          </p>
          <p className="text-sm mt-1">
            <span className="font-semibold">Impact:</span> {data.winImpact > 0 ? '+' : ''}{data.winImpact.toFixed(1)}%
          </p>
          <p className="text-sm mt-1">
            <span className="font-semibold">Matches together:</span> {data.matches}
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

  if (combinations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Player Combinations Analysis</h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center p-6">
            <p className="text-gray-500 mb-2">No combinations data available</p>
            <p className="text-sm text-gray-400">
              This player needs to have played matches with teammates for this analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">
        {playerName}&apos;s Combinations with {teamName} Players
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number"
              domain={[-50, 50]} 
              label={{ value: 'Win Rate Impact (%)', position: 'insideBottom', offset: -5 }} 
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine x={0} stroke="#000" />
            <Bar 
              name="Win Rate Impact" 
              dataKey="winImpact" 
              fill={(data) => data.winImpact > 0 ? "#3B82F6" : "#EF4444"}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teammate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Matches
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Win Rate Together
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Win Rate Without
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Win Impact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Goal Impact
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topCombinations.map((combo) => (
              <tr key={combo.teammate_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {combo.teammate_name}
                    {!combo.statistical_significance && (
                      <span className="text-amber-500 ml-1">*</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {combo.matches_together}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {combo.win_rate_together.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {combo.win_rate_without.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      combo.win_impact > 5
                        ? 'bg-green-100 text-green-800'
                        : combo.win_impact < -5
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {combo.win_impact > 0 ? '+' : ''}{combo.win_impact.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      combo.goal_impact > 0.5
                        ? 'bg-green-100 text-green-800'
                        : combo.goal_impact < -0.5
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {combo.goal_impact > 0 ? '+' : ''}{combo.goal_impact.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <p>* Limited data for statistical confidence (requires at least 3 matches both together and without)</p>
        <p className="mt-1">Win Impact: difference in win rate when playing together vs. when teammate plays without this player</p>
        <p className="mt-1">Goal Impact: difference in goals per match when playing together vs. without</p>
      </div>
    </div>
  );
};

export default PlayerTeamCombinationsChart; 