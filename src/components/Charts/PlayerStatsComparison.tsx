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

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PlayerData {
  player_id: string;
  player_name: string;
  goals: number;
  assists: number;
  matches_played: number;
  clean_sheets?: number;
}

interface PlayerStatsComparisonProps {
  players: PlayerData[];
  title?: string;
}

const PlayerStatsComparison = ({ 
  players, 
  title = "Player Performance" 
}: PlayerStatsComparisonProps) => {
  // Find the maximum value for goals and assists to set the y-axis max
  const maxValue = Math.max(
    ...players.map(player => player.goals),
    ...players.map(player => player.assists),
    ...(players.some(p => p.clean_sheets !== undefined) 
      ? players.map(player => player.clean_sheets || 0) 
      : [0])
  );
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      x: {
        stacked: false,
        title: {
          display: true,
          text: 'Player'
        }
      },
      y: {
        stacked: false,
        beginAtZero: true,
        max: maxValue + 10, // Set max to be 10 more than the highest value
        title: {
          display: true,
          text: 'Count'
        }
      },
    },
  };

  const data = {
    labels: players.map(player => player.player_name),
    datasets: [
      {
        label: 'Goals',
        data: players.map(player => player.goals),
        backgroundColor: 'rgba(0, 100, 0, 0.8)', // Dark green
        borderColor: 'rgba(0, 100, 0, 1)',
        borderWidth: 1,
      },
      {
        label: 'Assists',
        data: players.map(player => player.assists),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      ...(players.some(p => p.clean_sheets !== undefined) 
        ? [{
            label: 'Clean Sheets',
            data: players.map(player => player.clean_sheets || 0),
            backgroundColor: 'rgba(153, 102, 255, 0.8)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
          }] 
        : []),
    ],
  };

  // Calculate stats for each player
  const playerStats = players.map(player => ({
    name: player.player_name,
    matchesPlayed: player.matches_played,
    goals: player.goals,
    assists: player.assists,
    goalsPerGame: player.matches_played > 0 ? (player.goals / player.matches_played).toFixed(2) : '0',
    assistsPerGame: player.matches_played > 0 ? (player.assists / player.matches_played).toFixed(2) : '0'
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="h-80">
        <Bar options={options} data={data} />
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2">
        {playerStats.map((stat, index) => (
          <React.Fragment key={index}>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-sm font-medium text-gray-500">Matches Played</div>
              <div className="text-lg font-bold">{stat.name}: {stat.matchesPlayed}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-sm font-medium text-gray-500">Goals per Game</div>
              <div className="text-lg font-bold">{stat.name}: {stat.goalsPerGame}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-sm font-medium text-gray-500">Assists per Game</div>
              <div className="text-lg font-bold">{stat.name}: {stat.assistsPerGame}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
      
      {/* Chart is already rendered above */}
    </div>
  );
};

export default PlayerStatsComparison; 