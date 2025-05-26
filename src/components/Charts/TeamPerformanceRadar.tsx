'use client';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface TeamPerformanceRadarProps {
  teams: {
    id: string;
    name: string;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    matches_played: number;
  }[];
  selectedTeamIds?: string[];
  maxTeams?: number;
}

const TeamPerformanceRadar = ({ 
  teams, 
  selectedTeamIds = [], 
  maxTeams = 5 
}: TeamPerformanceRadarProps) => {
  // Calculate additional metrics for teams
  const teamsWithMetrics = teams.map(team => {
    const winRate = team.matches_played > 0 ? (team.wins / team.matches_played) * 100 : 0;
    const goalDifference = team.goals_for - team.goals_against;
    const points = team.wins * 3 + team.draws;
    const pointsPerGame = team.matches_played > 0 ? points / team.matches_played : 0;
    const goalsPerGame = team.matches_played > 0 ? team.goals_for / team.matches_played : 0;
    
    return {
      ...team,
      winRate,
      goalDifference,
      points,
      pointsPerGame,
      goalsPerGame
    };
  });
  
  // Filter teams based on selectedTeamIds if provided, otherwise take top teams by points
  let teamsToDisplay = teamsWithMetrics;
  
  if (selectedTeamIds && selectedTeamIds.length > 0) {
    teamsToDisplay = teamsWithMetrics.filter(team => selectedTeamIds.includes(team.id));
  } else {
    // Sort by points and take top N
    teamsToDisplay = [...teamsWithMetrics]
      .sort((a, b) => b.points - a.points)
      .slice(0, maxTeams);
  }

  // Find max values for scaling
  const maxPointsPerGame = Math.max(...teamsWithMetrics.map(t => t.pointsPerGame), 3);
  const maxGoalsPerGame = Math.max(...teamsWithMetrics.map(t => t.goalsPerGame)) * 1.2;
  const allGoalDiffs = teamsWithMetrics.map(t => t.goalDifference);
  const maxGoalDiff = Math.max(...allGoalDiffs.map(gd => Math.abs(gd))) * 1.2;

  // Define team-specific colors
  const getTeamColors = (teamName: string) => {
    const name = teamName.toLowerCase();
    if (name.includes('red')) {
      return {
        border: '#FF6188',
        background: 'rgba(255, 97, 136, 0.3)' // #FF6188 with 0.3 opacity
      };
    } else if (name.includes('black')) {
      return {
        border: '#000000',
        background: 'rgba(0, 0, 0, 0.3)' // #000000 with 0.3 opacity
      };
    } else if (name.includes('light blue') || name.includes('blue')) {
      return {
        border: '#79DBFB',
        background: 'rgba(121, 219, 251, 0.3)' // #79DBFB with 0.3 opacity
      };
    } else if (name.includes('fcb') || name.includes('united')) {
      return {
        border: '#5050f0',
        background: 'rgba(80, 80, 240, 0.3)' // #5050f0 with 0.3 opacity
      };
    }
    
    // Fallback colors for other teams
    const hue = Math.floor(Math.random() * 360);
    return {
      border: `hsl(${hue}, 70%, 60%)`,
      background: `hsla(${hue}, 70%, 60%, 0.3)`
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Team Performance Comparison',
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            const dataIndex = context.dataIndex;
            
            switch(dataIndex) {
              case 0: return `${label}: ${value.toFixed(1)}%`;
              case 1: return `${label}: ${value.toFixed(2)} ppg`;
              case 2: return `${label}: ${value.toFixed(2)} gpg`;
              case 3: return `${label}: ${value > 0 ? '+' : ''}${value.toFixed(0)}`;
              default: return `${label}: ${value}`;
            }
          }
        }
      }
    },
    scales: {
      r: {
        min: 0,
        // Slightly increase max value to avoid points being at the edge
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          display: false
        },
        pointLabels: {
          font: {
            size: 12
          }
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
  };

  // Normalize values to 0-100 scale for better radar visualization
  const normalizeValue = (value: number, max: number) => (value / max) * 100;

  const data = {
    labels: ['Win Rate (%)', 'Points Per Game', 'Goals Per Game', 'Goal Difference'],
    datasets: teamsToDisplay.map((team) => {
      const colors = getTeamColors(team.name);
      return {
        label: team.name,
        data: [
          team.winRate,  // Already a percentage
          normalizeValue(team.pointsPerGame, maxPointsPerGame),
          normalizeValue(team.goalsPerGame, maxGoalsPerGame),
          normalizeValue(team.goalDifference, maxGoalDiff) * 0.5 + 50, // Center at 50%
        ],
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 2,
      };
    }),
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="h-80">
        <Radar options={options} data={data} />
      </div>
      <div className="mt-2 text-sm text-gray-500 text-center">
        <p>Metrics normalized to percentage scale for visualization</p>
      </div>
    </div>
  );
};

export default TeamPerformanceRadar; 