import React from 'react';

interface PlayerPosition {
  player_id: string;
  player_name: string;
  position: string;
  x: number; // 0-100 percentage position horizontally
  y: number; // 0-100 percentage position vertically
  jersey_number?: string;
}

interface FormationVisualizerProps {
  teamName: string;
  players: PlayerPosition[];
  teamColor: string;
  isHomeTeam?: boolean;
}

const FormationVisualizer: React.FC<FormationVisualizerProps> = ({
  teamName,
  players,
  teamColor,
  isHomeTeam = true
}) => {
  // Ensure the teamColor has a valid default if not provided
  const color = teamColor || '#3b82f6'; // Default to blue if not specified
  
  // Generate a lighter version of the team color for the field
  const lightColor = `${color}33`; // 33 is 20% opacity in hex
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">{teamName} Formation</h3>
      
      <div 
        className="relative border border-green-800 rounded-lg overflow-hidden"
        style={{ 
          height: '400px',
          backgroundImage: `radial-gradient(circle at center, ${lightColor}, transparent)`,
          backgroundColor: '#e7f5e7' // Light green as football field
        }}
      >
        {/* Field markings */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white"></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white"></div>
        <div className="absolute left-1/2 top-1/2 w-16 h-16 rounded-full border border-white -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Goal areas */}
        <div className="absolute left-1/2 top-0 w-32 h-8 border-b border-l border-r border-white -translate-x-1/2"></div>
        <div className="absolute left-1/2 bottom-0 w-32 h-8 border-t border-l border-r border-white -translate-x-1/2"></div>
        
        {/* Penalty areas */}
        <div className="absolute left-1/2 top-0 w-64 h-16 border-b border-l border-r border-white -translate-x-1/2"></div>
        <div className="absolute left-1/2 bottom-0 w-64 h-16 border-t border-l border-r border-white -translate-x-1/2"></div>
        
        {/* Center circle */}
        <div className="absolute left-1/2 top-1/2 w-32 h-32 rounded-full border border-white -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Corner arcs */}
        <div className="absolute left-0 top-0 w-4 h-4 border-r border-b border-white rounded-br-full"></div>
        <div className="absolute right-0 top-0 w-4 h-4 border-l border-b border-white rounded-bl-full"></div>
        <div className="absolute left-0 bottom-0 w-4 h-4 border-r border-t border-white rounded-tr-full"></div>
        <div className="absolute right-0 bottom-0 w-4 h-4 border-l border-t border-white rounded-tl-full"></div>
        
        {/* Players */}
        {players.map((player) => {
          // Adjust positions based on home/away team
          const xPos = isHomeTeam ? player.x : 100 - player.x;
          const yPos = player.y;
          
          return (
            <div 
              key={player.player_id}
              className="absolute flex flex-col items-center"
              style={{ 
                left: `${xPos}%`, 
                top: `${yPos}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Player marker */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: color }}
              >
                {player.jersey_number || '?'}
              </div>
              
              {/* Player name */}
              <div className="mt-1 px-1 bg-white/80 rounded text-xs text-gray-800 font-medium">
                {player.player_name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FormationVisualizer; 