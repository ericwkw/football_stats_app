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

interface GoalkeeperCleanSheetsChartProps {
  goalkeepers: {
    player_id: string;
    player_name: string;
    matches_played: number;
    clean_sheets: number;
    clean_sheet_percentage?: number; // Add the new field as optional to maintain compatibility
  }[];
  limit?: number;
}

const GoalkeeperCleanSheetsChart = ({ goalkeepers, limit = 10 }: GoalkeeperCleanSheetsChartProps) => {
  // Sort goalkeepers by clean sheets in descending order and limit to top N
  const topGoalkeepers = [...goalkeepers]
    .sort((a, b) => b.clean_sheets - a.clean_sheets)
    .slice(0, limit);
  
  // Find the maximum number of clean sheets to set the x-axis max value
  const maxCleanSheets = topGoalkeepers.length > 0 
    ? Math.max(...topGoalkeepers.map(gk => gk.clean_sheets)) 
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
        text: 'Top Clean Sheets',
      },
      tooltip: {
        callbacks: {
          label: (context: { dataIndex: number }) => {
            const goalkeeper = topGoalkeepers[context.dataIndex];
            // Use the provided percentage if available, otherwise calculate it
            const percentage = goalkeeper.clean_sheet_percentage !== undefined
              ? goalkeeper.clean_sheet_percentage
              : goalkeeper.matches_played > 0
                ? Number(((goalkeeper.clean_sheets / goalkeeper.matches_played) * 100).toFixed(1))
                : 0;
            
            return `${goalkeeper.clean_sheets} clean sheets (${percentage}% of matches)`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: maxCleanSheets + 3, // Set max to be 3 more than the highest value
        title: {
          display: true,
          text: 'Clean Sheets'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Goalkeeper'
        }
      }
    },
  };

  const data = {
    labels: topGoalkeepers.map(gk => gk.player_name),
    datasets: [
      {
        label: 'Clean Sheets',
        data: topGoalkeepers.map(gk => gk.clean_sheets),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
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

export default GoalkeeperCleanSheetsChart; 