'use client';

import React from 'react';
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
import { TooltipItem } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

interface PlayerCombinationsChartProps {
  combinations: PlayerCombination[];
  limit?: number;
  minMatches?: number;
  isLoading?: boolean;
}

const PlayerCombinationsChart: React.FC<PlayerCombinationsChartProps> = ({
  combinations,
  limit = 10,
  minMatches = 3,
  isLoading = false
}) => {
  // Remove the debug table toggle
  // const [showDebugTables, setShowDebugTables] = useState(false);
  
  // Filter combinations by minimum matches
  const filteredCombinations = combinations.filter(c => c.total_matches >= minMatches);
  
  // Sort and limit by win rate together
  const topCombinationsTogether = [...filteredCombinations]
    .sort((a, b) => b.win_rate - a.win_rate)
    .slice(0, limit);
    
  // Sort and limit by win rate as opponents (if data available)
  const topCombinationsOpponents = [...filteredCombinations]
    .filter(c => c.win_rate_as_opponents !== null && c.win_rate_as_opponents !== undefined)
    .sort((a, b) => {
      const aRate = a.win_rate_as_opponents || 0;
      const bRate = b.win_rate_as_opponents || 0;
      return bRate - aRate;
    })
    .slice(0, limit);
  
  // Format label for player combinations
  const formatLabel = (combo: PlayerCombination) => {
    return `${combo.player1_name} & ${combo.player2_name}`;
  };
  
  // Format label for player rivals
  const formatRivalLabel = (combo: PlayerCombination) => {
    return `${combo.player1_name} vs ${combo.player2_name}`;
  };
  
  const togetherChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Win Rate When Playing Together',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          bottom: 10
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            const combo = topCombinationsTogether[context.dataIndex];
            return [
              `Win Rate: ${context.parsed.x}%`,
              `Matches: ${combo.total_matches} (W: ${combo.win_matches}, D: ${combo.draw_matches}, L: ${combo.loss_matches})`,
              `Win percentage: ${(combo.win_matches / combo.total_matches * 100).toFixed(1)}%`
            ];
          }
        }
      },
    },
    scales: {
      x: {
        min: 0,
        max: 110,
        title: {
          display: true,
          text: 'Win Rate (%)',
          font: {
            weight: 'bold' as const,
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Player Pairs',
          font: {
            weight: 'bold' as const,
          }
        }
      }
    },
  };
  
  const opponentsChartOptions = {
    ...togetherChartOptions,
    plugins: {
      ...togetherChartOptions.plugins,
      title: {
        ...togetherChartOptions.plugins.title,
        text: 'Win Rate When Playing As Opponents',
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            const combo = topCombinationsOpponents[context.dataIndex];
            return [
              `Win Rate: ${context.parsed.x}%`,
              `Player 1 (${combo.player1_name}) wins against Player 2 (${combo.player2_name})`,
              `Based on matches where they played on opposite teams`
            ];
          }
        }
      }
    }
  };

  const togetherChartData = {
    labels: topCombinationsTogether.map(formatLabel),
    datasets: [
      {
        label: 'Win Rate Together',
        data: topCombinationsTogether.map(combo => combo.win_rate),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ],
  };
  
  const opponentsChartData = {
    labels: topCombinationsOpponents.map(combo => formatRivalLabel(combo)),
    datasets: [
      {
        label: 'Win Rate as Opponents',
        data: topCombinationsOpponents.map(combo => combo.win_rate_as_opponents || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }
    ],
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
        <div className="mt-3 h-4 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
        <h3 className="text-lg font-semibold">Player Combinations Analysis</h3>
        {/* Debug tables toggle removed */}
      </div>
      
      {/* Together Chart Section */}
      <div className="mb-12">
        <div className="mb-4">
          <h4 className="text-base font-medium text-gray-800">Teammates Performance</h4>
          <p className="text-sm text-gray-600">
            Shows which player combinations work best when playing on the same team. Higher percentages indicate better teamwork.
          </p>
        </div>
        
        <div className="h-96">
          <Bar options={togetherChartOptions} data={togetherChartData} />
        </div>
        
        <div className="mt-3 text-sm text-gray-500 text-center">
          <p>Shows win rates for player combinations when on the same team (min {minMatches} matches together)</p>
        </div>
        
        {/* Debug Table for Together - hidden */}
      </div>
      
      {/* Opponents Chart Section (if data available) */}
      {topCombinationsOpponents.length > 0 && (
        <div>
          <div className="mb-4">
            <h4 className="text-base font-medium text-gray-800">Head-to-Head Performance</h4>
            <p className="text-sm text-gray-600">
              Shows which players perform better when playing against each other on opposing teams.
            </p>
          </div>
          
          <div className="h-96">
            <Bar options={opponentsChartOptions} data={opponentsChartData} />
          </div>
          
          <div className="mt-3 text-sm text-gray-500 text-center">
            <p>Shows win rates when players face each other on opposing teams (min {minMatches} matches)</p>
          </div>
          
          {/* Debug Table for Opponents - hidden */}
        </div>
      )}
    </div>
  );
};

export default PlayerCombinationsChart; 