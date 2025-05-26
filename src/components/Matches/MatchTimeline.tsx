import React from 'react';

interface GoalEvent {
  player_name: string;
  team_id: string;
  minute: number;
  is_own_goal?: boolean;
}

interface MatchTimelineProps {
  homeTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  goals: GoalEvent[];
  matchDuration?: number;
}

const MatchTimeline: React.FC<MatchTimelineProps> = ({
  homeTeamId,
  homeTeamName,
  awayTeamName,
  goals,
  matchDuration = 90
}) => {
  // Sort goals by minute
  const sortedGoals = [...goals].sort((a, b) => a.minute - b.minute);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">Match Timeline</h3>
      
      <div className="relative pt-8 pb-4">
        {/* Timeline base line */}
        <div className="absolute h-1 bg-gray-200 left-0 right-0 top-12"></div>
        
        {/* Timeline markers - every 15 minutes */}
        {Array.from({ length: Math.ceil(matchDuration / 15) + 1 }).map((_, index) => {
          const minute = index * 15;
          const position = `${(minute / matchDuration) * 100}%`;
          
          return (
            <div key={`marker-${minute}`} className="absolute" style={{ left: position, top: '42px' }}>
              <div className="h-3 w-1 bg-gray-400 -translate-x-1/2"></div>
              <div className="text-xs text-gray-500 -translate-x-1/2 mt-1">{minute}&apos;</div>
            </div>
          );
        })}
        
        {/* Half-time marker */}
        <div className="absolute" style={{ left: '50%', top: '38px' }}>
          <div className="h-6 w-1 bg-gray-600 -translate-x-1/2"></div>
          <div className="text-xs font-medium text-gray-700 -translate-x-1/2 mt-1">HT</div>
        </div>
        
        {/* Goal events */}
        {sortedGoals.map((goal, index) => {
          const position = `${(goal.minute / matchDuration) * 100}%`;
          const isHomeTeam = goal.team_id === homeTeamId;
          
          return (
            <div 
              key={`goal-${index}`} 
              className={`absolute flex flex-col items-center ${isHomeTeam ? 'top-0' : 'bottom-0'}`}
              style={{ left: position }}
            >
              <div 
                className={`h-4 w-4 rounded-full -translate-x-1/2 ${
                  isHomeTeam 
                    ? 'bg-blue-500' 
                    : 'bg-red-500'
                }`}
              ></div>
              <div 
                className={`text-xs font-medium ${
                  isHomeTeam 
                    ? 'text-blue-700' 
                    : 'text-red-700'
                } -translate-x-1/2 whitespace-nowrap max-w-[100px] truncate`}
              >
                {goal.player_name} {goal.is_own_goal ? '(OG)' : ''} {goal.minute}&apos;
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between mt-4">
        <div className="text-sm font-medium text-blue-700">{homeTeamName}</div>
        <div className="text-sm font-medium text-red-700">{awayTeamName}</div>
      </div>
    </div>
  );
};

export default MatchTimeline; 