import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
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
  const [showDebugTables, setShowDebugTables] = useState(false);
  
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
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              checked={showDebugTables}
              onChange={() => setShowDebugTables(!showDebugTables)}
              aria-label="Show debug tables"
            />
            <span className="ml-2 text-sm text-gray-700">
              Show debug tables
            </span>
          </label>
        </div>
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
        
        {/* Debug Table for Together */}
        {showDebugTables && (
          <div className="mt-4 overflow-x-auto">
            <h4 className="font-semibold text-gray-700 mb-2">Debug: Player Combinations Together</h4>
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-2 py-2 text-left text-gray-500 uppercase tracking-wider">Player 1</th>
                  <th scope="col" className="px-2 py-2 text-left text-gray-500 uppercase tracking-wider">Player 2</th>
                  <th scope="col" className="px-2 py-2 text-left text-gray-500 uppercase tracking-wider">Matches</th>
                  <th scope="col" className="px-2 py-2 text-left text-gray-500 uppercase tracking-wider">Wins</th>
                  <th scope="col" className="px-2 py-2 text-left text-gray-500 uppercase tracking-wider">Draws</th>
                  <th scope="col" className="px-2 py-2 text-left text-gray-500 uppercase tracking-wider">Losses</th>
                  <th scope="col" className="px-2 py-2 text-left text-gray-500 uppercase tracking-wider">Win Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topCombinationsTogether.map((combo, index) => (
                  <tr key={`together-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-2 whitespace-nowrap">{combo.player1_name}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{combo.player2_name}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{combo.total_matches}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{combo.win_matches}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{combo.draw_matches}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{combo.loss_matches}</td>
                    <td className="px-2 py-2 whitespace-nowrap font-bold">{combo.win_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Top Combination Summary */}
        {topCombinationsTogether.length > 0 ? (
          <div className="mt-4 p-2 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-1">Top Combination</h4>
            <p className="text-xs md:text-sm">
              <span className="font-semibold">{topCombinationsTogether[0]?.player1_name}</span> & 
              <span className="font-semibold"> {topCombinationsTogether[0]?.player2_name}</span>: 
              {' '}{topCombinationsTogether[0]?.win_rate}% win rate over {topCombinationsTogether[0]?.total_matches} matches
            </p>
          </div>
        ) : null}
      </div>
      
      {/* Opponents Chart Section */}
      <div className="pt-8 border-t border-gray-200">
        <div className="mb-4">
          <h4 className="text-base font-medium text-gray-800">Rivals Performance</h4>
          <p className="text-sm text-gray-600">
            Shows how players perform when facing each other on opposite teams. The percentage represents how often Player 1 wins against Player 2.
          </p>
        </div>
        
        {topCombinationsOpponents.length > 0 ? (
          <>
            <div className="h-96">
              <Bar options={opponentsChartOptions} data={opponentsChartData} />
            </div>
            
            <div className="mt-3 text-sm text-gray-500 text-center">
              <p>Shows win rates when players face each other as opponents (Player 1 win rate vs Player 2)</p>
            </div>
            
            {/* Debug Table for Opponents */}
            {showDebugTables && (
              <div className="mt-4 overflow-x-auto">
                <h4 className="font-semibold text-gray-700 mb-2">Debug: Player Combinations as Opponents</h4>
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-2 py-2 text-left text-gray-500 uppercase tracking-wider">Player 1</th>
                      <th scope="col" className="px-2 py-2 text-left text-gray-500 uppercase tracking-wider">Player 2</th>
                      <th scope="col" className="px-2 py-2 text-left text-gray-500 uppercase tracking-wider">Win Rate as Opponents</th>
                      <th scope="col" className="px-2 py-2 text-left text-gray-500 uppercase tracking-wider">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topCombinationsOpponents.map((combo, index) => (
                      <tr key={`opponents-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 py-2 whitespace-nowrap">{combo.player1_name}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{combo.player2_name}</td>
                        <td className="px-2 py-2 whitespace-nowrap font-bold">{combo.win_rate_as_opponents}%</td>
                        <td className="px-2 py-2">
                          {combo.win_rate_as_opponents && combo.win_rate_as_opponents > 50 
                            ? `${combo.player1_name} usually beats ${combo.player2_name}` 
                            : `${combo.player2_name} usually beats ${combo.player1_name}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Top Rivals Summary */}
            <div className="mt-4 p-2 bg-red-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-1">Top Rivals</h4>
              <p className="text-xs md:text-sm">
                <span className="font-semibold">{topCombinationsOpponents[0]?.player1_name}</span> vs 
                <span className="font-semibold"> {topCombinationsOpponents[0]?.player2_name}</span>: 
                {' '}{topCombinationsOpponents[0]?.win_rate_as_opponents}% win rate when opposing each other
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {topCombinationsOpponents[0]?.win_rate_as_opponents && topCombinationsOpponents[0]?.win_rate_as_opponents > 50 
                  ? `${topCombinationsOpponents[0]?.player1_name} usually beats ${topCombinationsOpponents[0]?.player2_name} when they play on opposite teams`
                  : `${topCombinationsOpponents[0]?.player2_name} usually beats ${topCombinationsOpponents[0]?.player1_name} when they play on opposite teams`}
              </p>
            </div>
          </>
        ) : (
          <div className="p-6 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-500">No data available for players as opponents</p>
            <p className="text-sm text-gray-400 mt-1">Players need to have faced each other on opposite teams to appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCombinationsChart; 