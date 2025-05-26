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

interface TopScorersChartProps {
  players: {
    player_id: string;
    player_name: string;
    total_goals: number;
    weighted_goals?: number;
  }[];
  limit?: number;
  useWeighted?: boolean;
}

const TopScorersChart = ({ players, limit = 10, useWeighted = true }: TopScorersChartProps) => {
  // Sort players by goals in descending order and limit to top N
  const topPlayers = [...players]
    .sort((a, b) => {
      // Sort by weighted goals if available and useWeighted is true
      if (useWeighted && a.weighted_goals !== undefined && b.weighted_goals !== undefined) {
        return b.weighted_goals - a.weighted_goals;
      }
      // Fall back to total goals
      return b.total_goals - a.total_goals;
    })
    .slice(0, limit);
  
  // Determine which goals value to display
  const getGoalsValue = (player: typeof players[0]) => {
    if (useWeighted && player.weighted_goals !== undefined) {
      return player.weighted_goals;
    }
    return player.total_goals;
  };
  
  // Find the maximum number of goals to set the x-axis max value
  const maxGoals = topPlayers.length > 0 
    ? Math.max(...topPlayers.map(player => getGoalsValue(player))) 
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
        text: 'Top Goal Scorers',
      },
      tooltip: {
        callbacks: {
          label: (context: { dataIndex: number }) => {
            const player = topPlayers[context.dataIndex];
            const goalsValue = getGoalsValue(player);
            
            if (useWeighted && player.weighted_goals !== undefined && player.weighted_goals !== player.total_goals) {
              return `${goalsValue} weighted goals (${player.total_goals} actual goals)`;
            }
            
            return `${goalsValue} goals`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: maxGoals + 10, // Set max to be 10 more than the highest value
        title: {
          display: true,
          text: useWeighted ? 'Weighted Goals' : 'Goals'
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
        label: useWeighted ? 'Weighted Goals' : 'Goals',
        data: topPlayers.map(player => getGoalsValue(player)),
        backgroundColor: 'rgba(0, 100, 0, 0.8)',
        borderColor: 'rgba(0, 100, 0, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <div className="h-80 min-w-[400px]">
          <Bar options={options} data={data} />
        </div>
      </div>
    </div>
  );
};

export default TopScorersChart; 