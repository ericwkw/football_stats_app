'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface TeamPointsChartProps {
  teams: {
    id: string;
    name: string;
    wins: number;
    draws: number;
    losses: number;
  }[];
}

const TeamPointsChart = ({ teams }: TeamPointsChartProps) => {
  // Calculate points (3 for win, 1 for draw)
  const teamsWithPoints = teams.map(team => ({
    ...team,
    points: team.wins * 3 + team.draws
  }));
  
  // Sort teams by points in descending order
  const sortedTeams = [...teamsWithPoints].sort((a, b) => b.points - a.points);
  
  // Get top 8 teams for better visualization, combine the rest as "Others" if needed
  const topTeams = sortedTeams.slice(0, 8);
  
  // Define team-specific colors
  const getTeamColors = (teamName: string) => {
    const name = teamName.toLowerCase();
    if (name.includes('red')) {
      return {
        background: '#FF6188',
        border: '#FF6188'
      };
    } else if (name.includes('black')) {
      return {
        background: '#000000',
        border: '#000000'
      };
    } else if (name.includes('light blue') || name.includes('blue')) {
      return {
        background: '#79DBFB',
        border: '#79DBFB'
      };
    } else if (name.includes('fcb') || name.includes('united')) {
      return {
        background: 'rgba(80, 80, 240, 0.3)', // #5050f0 with 0.3 transparency
        border: '#5050f0'
      };
    }
    
    // Fallback colors for other teams
    const hue = Math.floor(Math.random() * 360);
    return {
      background: `hsl(${hue}, 70%, 60%)`,
      border: `hsl(${hue}, 70%, 60%)`
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Team Points (3 for win, 1 for draw)',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.floor((value / total) * 100);
            
            // Find the team to show detailed info
            const team = topTeams.find(t => t.name === label);
            if (team) {
              return [
                `${label}: ${value} points (${percentage}%)`,
                `Wins: ${team.wins} (${team.wins * 3} pts)`,
                `Draws: ${team.draws} (${team.draws} pts)`,
                `Losses: ${team.losses} (0 pts)`
              ];
            }
            return `${label}: ${value} points (${percentage}%)`;
          }
        }
      }
    },
  };

  const data = {
    labels: topTeams.map(team => team.name),
    datasets: [
      {
        label: 'Points',
        data: topTeams.map(team => team.points),
        backgroundColor: topTeams.map(team => getTeamColors(team.name).background),
        borderColor: topTeams.map(team => getTeamColors(team.name).border),
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="h-80">
        <Pie options={options} data={data} />
      </div>
      <div className="mt-4 pt-2 border-t text-sm text-gray-600">
        <p><strong>Points System:</strong> Teams receive 3 points for a win, 1 point for a draw, and 0 points for a loss.</p>
      </div>
    </div>
  );
};

export default TeamPointsChart; 