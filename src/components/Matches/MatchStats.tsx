import React from 'react';

interface StatCategory {
  label: string;
  home: number;
  away: number;
}

interface MatchStatsProps {
  homeTeamName: string;
  awayTeamName: string;
  statistics: StatCategory[];
}

const MatchStats: React.FC<MatchStatsProps> = ({
  homeTeamName,
  awayTeamName,
  statistics
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">Match Statistics</h3>
      
      <div className="space-y-4">
        {statistics.map((stat, index) => {
          // Calculate percentages for visualization
          const total = stat.home + stat.away;
          const homePercent = total > 0 ? (stat.home / total) * 100 : 50;
          const awayPercent = total > 0 ? (stat.away / total) * 100 : 50;
          
          return (
            <div key={index} className="space-y-1">
              {/* Stat label */}
              <div className="flex justify-between text-sm text-gray-600">
                <span>{stat.label}</span>
              </div>
              
              {/* Team values */}
              <div className="flex justify-between text-sm font-medium">
                <span className="text-blue-700">{stat.home}</span>
                <span className="text-red-700">{stat.away}</span>
              </div>
              
              {/* Progress bar */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-blue-500 rounded-l-full" 
                  style={{ width: `${homePercent}%` }}
                ></div>
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-red-500 rounded-r-full" 
                  style={{ width: `${awayPercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex justify-between mt-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span>{homeTeamName}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span>{awayTeamName}</span>
        </div>
      </div>
    </div>
  );
};

export default MatchStats; 