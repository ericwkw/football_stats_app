import React from 'react';
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

interface PlayerWinImpact {
  player_id: string;
  player_name: string;
  total_matches: number;
  win_matches: number;
  draw_matches: number;
  loss_matches: number;
  win_rate: number;
  win_rate_delta: number;
  player_position: string;
}

interface PlayerWinImpactChartProps {
  players: PlayerWinImpact[];
  limit?: number;
  isLoading?: boolean;
}

const PlayerWinImpactChart: React.FC<PlayerWinImpactChartProps> = ({ 
  players, 
  limit = 10,
  isLoading = false
}) => {
  // Sort players by win rate delta and take top N
  const topPlayers = [...players]
    .sort((a, b) => b.win_rate_delta - a.win_rate_delta)
    .slice(0, limit);
  
  // Generate colors based on win rate delta
  const generateColor = (delta: number) => {
    if (delta > 10) return 'rgba(46, 184, 92, 0.8)'; // Significant positive impact - Green
    if (delta > 0) return 'rgba(54, 162, 235, 0.8)'; // Positive impact - Blue
    if (delta > -10) return 'rgba(255, 159, 64, 0.8)'; // Slight negative impact - Orange
    return 'rgba(255, 99, 132, 0.8)'; // Significant negative impact - Red
  };

  // Find the maximum absolute value of win rate delta
  const maxDelta = Math.max(...players.map(player => Math.abs(player.win_rate_delta)));
  
  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Player Win Impact (vs League Average)',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            const player = topPlayers[context.dataIndex];
            return [
              `Win rate: ${Math.min(player.win_rate, 100)}%`,
              `Matches: ${player.total_matches} (W: ${player.win_matches}, D: ${player.draw_matches}, L: ${player.loss_matches})`,
              `Win impact: ${player.win_rate_delta > 0 ? '+' : ''}${player.win_rate_delta.toFixed(1)}%`,
              `Position: ${player.player_position}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Win Rate Delta (%)',
          font: {
            weight: 'bold' as const,
          }
        },
        // Set max to be 10 more than the highest absolute value
        max: maxDelta + 10,
        min: -(maxDelta + 10),
        grid: {
          color: (context: {tick: {value: number}}) => {
            if (context.tick.value === 0) {
              return 'rgba(0, 0, 0, 0.2)';
            }
            return 'rgba(0, 0, 0, 0.1)';
          },
          lineWidth: (context: {tick: {value: number}}) => {
            if (context.tick.value === 0) {
              return 2;
            }
            return 1;
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Player',
          font: {
            weight: 'bold' as const,
          }
        }
      }
    },
  };

  const data = {
    labels: topPlayers.map(player => player.player_name),
    datasets: [
      {
        label: 'Win Rate Delta',
        data: topPlayers.map(player => player.win_rate_delta),
        backgroundColor: topPlayers.map(player => generateColor(player.win_rate_delta)),
        borderColor: topPlayers.map(player => generateColor(player.win_rate_delta).replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
        <div className="mt-3 h-4 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="h-96">
        <Bar options={options} data={data} />
      </div>
      <div className="mt-3 text-sm text-gray-500 text-center">
        <p>Shows how much each player impacts win rate compared to league average</p>
        <div className="mt-2 flex justify-center items-center space-x-4 text-xs">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{backgroundColor: 'rgba(46, 184, 92, 0.8)'}}></span>
            <span>Strong positive (10%+)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{backgroundColor: 'rgba(54, 162, 235, 0.8)'}}></span>
            <span>Positive (0-10%)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{backgroundColor: 'rgba(255, 159, 64, 0.8)'}}></span>
            <span>Slight negative (0 to -10%)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 mr-1 rounded-full" style={{backgroundColor: 'rgba(255, 99, 132, 0.8)'}}></span>
            <span>Strong negative (below -10%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerWinImpactChart; 