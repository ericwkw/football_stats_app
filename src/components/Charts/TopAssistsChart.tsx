'use client';

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

interface TopAssistsChartProps {
  players: {
    player_id: string;
    player_name: string;
    total_assists: number;
    weighted_assists?: number;
  }[];
  limit?: number;
  useWeighted?: boolean;
}

const TopAssistsChart = ({ players, limit = 10, useWeighted = true }: TopAssistsChartProps) => {
  // Sort players by assists in descending order and limit to top N
  const topPlayers = [...players]
    .sort((a, b) => {
      // Sort by weighted assists if available and useWeighted is true
      if (useWeighted && a.weighted_assists !== undefined && b.weighted_assists !== undefined) {
        return b.weighted_assists - a.weighted_assists;
      }
      // Fall back to total assists
      return b.total_assists - a.total_assists;
    })
    .slice(0, limit);
  
  // Determine which assists value to display
  const getAssistsValue = (player: typeof players[0]) => {
    if (useWeighted && player.weighted_assists !== undefined) {
      return player.weighted_assists;
    }
    return player.total_assists;
  };
  
  // Find the maximum number of assists to set the x-axis max value
  const maxAssists = topPlayers.length > 0 
    ? Math.max(...topPlayers.map(player => getAssistsValue(player))) 
    : 0;
  
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
        text: 'Top Assists',
      },
      tooltip: {
        callbacks: {
          label: (context: { dataIndex: number }) => {
            const player = topPlayers[context.dataIndex];
            const assistsValue = getAssistsValue(player);
            
            if (useWeighted && player.weighted_assists !== undefined && player.weighted_assists !== player.total_assists) {
              return `${assistsValue} weighted assists (${player.total_assists} actual assists)`;
            }
            
            return `${assistsValue} assists`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: maxAssists + 5, // Set max to be 5 more than the highest value
        title: {
          display: true,
          text: useWeighted ? 'Weighted Assists' : 'Assists'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Player'
        }
      }
    },
  };

  const data = {
    labels: topPlayers.map(player => player.player_name),
    datasets: [
      {
        label: useWeighted ? 'Weighted Assists' : 'Assists',
        data: topPlayers.map(player => getAssistsValue(player)),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="h-80">
        <Bar options={options} data={data} />
      </div>
    </div>
  );
};

export default TopAssistsChart; 