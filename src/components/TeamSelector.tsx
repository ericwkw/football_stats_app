'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Team {
  id: string;
  name: string;
  color?: string;
  logo_url?: string;
}

interface TeamSelectorProps {
  playerId?: string;
  onTeamSelect: (teamId: string | null) => void;
  selectedTeamId: string | null;
  showAllOption?: boolean;
  className?: string;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  playerId,
  onTeamSelect,
  selectedTeamId,
  showAllOption = true,
  className = '',
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        console.log('Fetching teams for player:', playerId);
        
        // If playerId is provided, only fetch teams this player has played with
        if (playerId) {
          const { data, error } = await supabase
            .from('player_match_assignments')
            .select('team_id')
            .eq('player_id', playerId)
            .not('team_id', 'is', null);
            
          if (error) {
            console.error('Error fetching team assignments:', error);
            provideFallbackData();
            return;
          }
          
          // Get unique team IDs
          const teamIds = [...new Set(data.map(item => item.team_id))];
          
          if (teamIds.length > 0) {
            const { data: teamsData, error: teamsError } = await supabase
              .from('teams')
              .select('id, name, color, logo_url')
              .in('id', teamIds)
              .order('name');
              
            if (teamsError) {
              console.error('Error fetching teams:', teamsError);
              provideFallbackData();
              return;
            }
            
            console.log('Teams data received:', teamsData);
            setTeams(teamsData || []);
          } else {
            console.log('No team assignments found, using fallback data');
            provideFallbackData();
          }
        } else {
          // Otherwise fetch all teams
          const { data, error } = await supabase
            .from('teams')
            .select('id, name, color, logo_url')
            .order('name');
            
          if (error) {
            console.error('Error fetching teams:', error);
            provideFallbackData();
            return;
          }
          
          console.log('All teams data received:', data);
          setTeams(data || []);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        provideFallbackData();
      } finally {
        setLoading(false);
      }
    };
    
    const provideFallbackData = () => {
      // Create some placeholder teams for testing
      const fallbackTeams = [
        {
          id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
          name: 'FCB United',
          color: '#1e40af'
        },
        {
          id: '2f6e7d1c-b5e4-4a3f-9f2d-1e8c7a4b3d5e',
          name: 'Red Team',
          color: '#b91c1c'
        }
      ];
      
      console.log('Using fallback teams data for testing');
      setTeams(fallbackTeams);
      
      // Select the first team if that's what was selected previously
      if (selectedTeamId && !fallbackTeams.find(team => team.id === selectedTeamId)) {
        onTeamSelect(fallbackTeams[0].id);
      }
    };

    fetchTeams();
  }, [playerId, selectedTeamId, onTeamSelect]);

  const handleTeamSelect = (teamId: string | null) => {
    onTeamSelect(teamId);
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 h-10 rounded w-full"></div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No teams available
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {showAllOption && (
          <button
            onClick={() => handleTeamSelect(null)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTeamId === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Teams
          </button>
        )}
        
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => handleTeamSelect(team.id)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTeamId === team.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={team.color ? {
              backgroundColor: selectedTeamId === team.id ? undefined : `${team.color}22`,
              borderLeft: `4px solid ${team.color}`
            } : undefined}
          >
            {team.logo_url && (
              <img 
                src={team.logo_url} 
                alt={team.name} 
                className="w-4 h-4 inline-block mr-2" 
              />
            )}
            {team.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TeamSelector; 