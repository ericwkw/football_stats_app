"use client";
// p /Users/wuf/_codes/_Trae/football_stats_app/src/components/Admin/Teams/TeamList.tsx

import React from 'react';
import { Team } from '@/types/database';

interface TeamListProps {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
  loading?: boolean;
}

export default function TeamList({ teams, onEdit, onDelete, loading }: TeamListProps) {
  if (loading) {
    return <p className="text-center text-gray-600 py-4">Loading teams...</p>;
  }

  if (teams.length === 0) {
    return <p className="text-center text-gray-600 py-4">No teams found. Add a new team to get started!</p>;
  }

  // Helper function to get a human-readable color name
  const getColorName = (hexColor: string): string => {
    // Map hex colors to readable names
    const colorMap: Record<string, string> = {
      '#1e40af': 'Light Blue', // FCB United
      '#b91c1c': 'Red',       // Red Team
      '#172554': 'Black',     // Blue Rovers
    };
    
    return colorMap[hexColor] || 'Custom';
  };

  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Shirt Color
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {teams.map((team) => (
            <tr key={team.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {team.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {team.team_type ? team.team_type.charAt(0).toUpperCase() + team.team_type.slice(1) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  <span
                    style={{ 
                      backgroundColor: team.primary_shirt_color, 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                  >
                    {team.primary_shirt_color}
                  </span>
                  <span className="ml-2">{getColorName(team.primary_shirt_color)}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(team)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(team.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}