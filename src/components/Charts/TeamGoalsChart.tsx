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

interface TeamGoalsChartProps {
  teams: {
    id: string;
    name: string;
    goals_for: number;
    goals_against: number;
  }[];
}

const TeamGoalsChart = ({ teams }: TeamGoalsChartProps) => {
  // Sort teams by total goals (for + against) for better visualization
  const sortedTeams = [...teams].sort((a, b) => 
    (b.goals_for + b.goals_against) - (a.goals_for + a.goals_against)
  );
  
  // Find the maximum goal value (either goals_for or goals_against)
  const maxGoals = sortedTeams.length > 0 
    ? Math.max(
        ...sortedTeams.map(team => team.goals_for),
        ...sortedTeams.map(team => team.goals_against)
      ) 
    : 0;
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Team Goals Scored vs Conceded',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            const team = sortedTeams.find(t => t.name === context.label);
            
            if (team) {
              // Estimate average per match (assume average of 10 matches)
              const estimatedMatches = 10;
              const perMatch = (value / estimatedMatches).toFixed(1);
              return `${label}: ${value} (${perMatch} per match)`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false,
        title: {
          display: true,
          text: 'Teams',
          font: {
            weight: 'bold' as const
          }
        }
      },
      y: {
        stacked: false,
        beginAtZero: true,
        max: maxGoals + 10, // Set max to be 10 more than the highest value
        title: {
          display: true,
          text: 'Total Goals',
          font: {
            weight: 'bold' as const
          }
        }
      },
    },
  };

  const data = {
    labels: sortedTeams.map(team => team.name),
    datasets: [
      {
        label: 'Goals Scored',
        data: sortedTeams.map(team => team.goals_for),
        backgroundColor: 'rgba(54, 162, 235, 0.8)', // Blue
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Goals Conceded',
        data: sortedTeams.map(team => team.goals_against),
        backgroundColor: 'rgba(255, 99, 132, 0.8)', // Red
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="h-80">
        <Bar options={options} data={data} />
      </div>
      <div className="mt-4 pt-2 border-t text-sm text-gray-600">
        <p><strong>Note:</strong> This chart shows the total goals scored and conceded by each team across all matches.</p>
      </div>
    </div>
  );
};

export default TeamGoalsChart; 