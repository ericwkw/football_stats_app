'use client';

import React from 'react';
import SimplePlayerImpactChart from './Charts/SimplePlayerImpactChart';

interface TeamPerformanceProps {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
}

const TeamPerformance: React.FC<TeamPerformanceProps> = ({
  playerId,
  playerName,
  teamId,
  teamName
}) => {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Team Performance Impact</h2>
      <div className="bg-white rounded-lg shadow-md">
        <SimplePlayerImpactChart 
          playerId={playerId}
          playerName={playerName}
          teamId={teamId}
          teamName={teamName}
        />
      </div>
    </div>
  );
};

export default TeamPerformance; 