import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
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
  Legend,
  ArcElement
);

interface TeamPerformance {
  scenario: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  win_rate: number;
  goals_scored_avg: number;
  goals_conceded_avg: number;
}

interface PlayerTeamImpactChartProps {
  playerName: string;
  teamName: string;
  performance: TeamPerformance[];
  isLoading?: boolean;
}

const PlayerTeamImpactChart: React.FC<PlayerTeamImpactChartProps> = ({
  playerName,
  teamName,
  performance,
  isLoading = false
}) => {
  // Find "With Player" and "Without Player" scenarios
  const withPlayer = performance.find(p => p.scenario === 'With Player');
  const withoutPlayer = performance.find(p => p.scenario === 'Without Player');
  
  // Calculate impact for visualization
  const winRateDelta = withPlayer && withoutPlayer 
    ? withPlayer.win_rate - withoutPlayer.win_rate 
    : 0;
  
  const goalsScoredDelta = withPlayer && withoutPlayer 
    ? withPlayer.goals_scored_avg - withoutPlayer.goals_scored_avg 
    : 0;
  
  const goalsConcededDelta = withPlayer && withoutPlayer 
    ? withPlayer.goals_conceded_avg - withoutPlayer.goals_conceded_avg 
    : 0;
  
  // Create comparison dataset
  const metrics = [
    {label: 'Win Rate (%)', with: Math.min(withPlayer?.win_rate || 0, 100), without: Math.min(withoutPlayer?.win_rate || 0, 100)},
    {label: 'Goals Scored Avg', with: withPlayer?.goals_scored_avg || 0, without: withoutPlayer?.goals_scored_avg || 0},
    {label: 'Goals Conceded Avg', with: withPlayer?.goals_conceded_avg || 0, without: withoutPlayer?.goals_conceded_avg || 0},
  ];
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `${playerName}'s Impact on ${teamName} Performance`,
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
            const isWithPlayer = context.datasetIndex === 0;
            
            if (context.dataIndex === 0) { // Win Rate
              return `${isWithPlayer ? 'With' : 'Without'} ${playerName}: ${context.parsed.y.toFixed(1)}%`;
            }
            
            const value = context.parsed.y.toFixed(2);
            const withText = isWithPlayer ? 'With' : 'Without';
            const matchesText = isWithPlayer 
              ? `(${withPlayer?.matches_played || 0} matches)` 
              : `(${withoutPlayer?.matches_played || 0} matches)`;
              
            return `${withText} ${playerName} ${matchesText}: ${value}`;
          },
          afterBody: function(tooltipItems: TooltipItem<'bar'>[]) {
            const dataIndex = tooltipItems[0].dataIndex;
            
            if (dataIndex === 0) { // Win Rate
              const delta = winRateDelta.toFixed(1);
              return [`Impact: ${winRateDelta > 0 ? '+' : ''}${delta}% win rate`];
            } else if (dataIndex === 1) { // Goals Scored
              const delta = goalsScoredDelta.toFixed(2);
              return [`Impact: ${goalsScoredDelta > 0 ? '+' : ''}${delta} goals scored`];
            } else if (dataIndex === 2) { // Goals Conceded
              const delta = goalsConcededDelta.toFixed(2);
              return [`Impact: ${goalsConcededDelta > 0 ? '+' : ''}${delta} goals conceded`];
            }
            return [];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        // For win rate, we know it's capped at 100, so set max at 100 if win rate is the highest value
        max: Math.max(100, // Ensure win rate has at least 100 max
            Math.max(withPlayer?.goals_scored_avg || 0, withoutPlayer?.goals_scored_avg || 0) + 1,
            Math.max(withPlayer?.goals_conceded_avg || 0, withoutPlayer?.goals_conceded_avg || 0) + 1
        ),
        ticks: {
          precision: 2
        }
      }
    }
  };

  const data = {
    labels: metrics.map(m => m.label),
    datasets: [
      {
        label: `With ${playerName} (${withPlayer?.matches_played || 0} matches)`,
        data: metrics.map(m => m.with),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: `Without ${playerName} (${withoutPlayer?.matches_played || 0} matches)`,
        data: metrics.map(m => m.without),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Summary statistics
  const summary = [
    {
      label: 'Win Rate Impact', 
      value: winRateDelta.toFixed(1) + '%',
      positive: winRateDelta > 0,
      description: `${Math.abs(winRateDelta).toFixed(1)}% ${winRateDelta >= 0 ? 'higher' : 'lower'} win rate with ${playerName}`
    },
    {
      label: 'Goals Scored Impact', 
      value: goalsScoredDelta.toFixed(2),
      positive: goalsScoredDelta > 0,
      description: `${Math.abs(goalsScoredDelta).toFixed(2)} more goals ${goalsScoredDelta >= 0 ? 'scored' : 'conceded'} per game with ${playerName}`
    },
    {
      label: 'Goals Conceded Impact', 
      value: goalsConcededDelta.toFixed(2),
      // Note: Lower goals conceded is positive, so negative delta is positive
      positive: goalsConcededDelta < 0,
      description: `${Math.abs(goalsConcededDelta).toFixed(2)} ${goalsConcededDelta <= 0 ? 'fewer' : 'more'} goals conceded per game with ${playerName}`
    },
  ];

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded mb-6"></div>
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 p-3 rounded">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="h-64 mb-6">
        <Bar options={options} data={data} aria-label={`Chart showing ${playerName}'s impact on ${teamName} performance`} />
      </div>
      
      <div className="mt-4">
        <h4 className="text-lg font-medium text-gray-800 mb-3">Impact Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary.map((stat, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded shadow-sm transition-all hover:shadow-md">
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 mt-1">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
      
      {(withPlayer && withoutPlayer) && (
        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <p className="flex justify-between">
            <span>With {playerName}: {withPlayer.matches_played} matches</span>
            <span>Without {playerName}: {withoutPlayer.matches_played} matches</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerTeamImpactChart; 