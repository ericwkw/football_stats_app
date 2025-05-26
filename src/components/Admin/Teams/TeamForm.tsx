// /Users/wuf/_codes/_Trae/football_stats_app/src/components/Admin/Teams/TeamForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Team } from '@/types/database';

interface TeamFormProps {
  team?: Team | null; // Optional: if provided, form is in edit mode
  onFormSubmit: () => void;
  onCancel: () => void;
}

const initialFormState: Omit<Team, 'id' | 'created_at'> = {
  name: '',
  primary_shirt_color: '#000000', // Default to black
  team_type: 'club',
};

export default function TeamForm({ team, onFormSubmit, onCancel }: TeamFormProps) {
  const [formData, setFormData] = useState<Omit<Team, 'id' | 'created_at'>>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        primary_shirt_color: team.primary_shirt_color,
        team_type: team.team_type || 'club',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [team]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!formData.name || !formData.primary_shirt_color) {
      setError('Team name and primary shirt color are required.');
      setLoading(false);
      return;
    }

    try {
      let response;
      const teamDataToSave = {
        ...formData,
        secondary_shirt_color: null, // Always set to null
        team_type: formData.team_type || 'club',
      };

      if (team && team.id) {
        // Update existing team
        response = await supabase
          .from('teams')
          .update(teamDataToSave)
          .eq('id', team.id)
          .select();
      } else {
        // Create new team
        response = await supabase
          .from('teams')
          .insert(teamDataToSave)
          .select();
      }

      if (response.error) {
        throw response.error;
      }

      setMessage(team && team.id ? 'Team updated successfully!' : 'Team created successfully!');
      setLoading(false);
      onFormSubmit(); // Callback to refresh list or close form
    } catch (err: any) {
      console.error('Error saving team:', err);
      setError(`Failed to save team: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-lg rounded-lg mb-8 space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">{team ? 'Edit Team' : 'Add New Team'}</h2>
      
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
      {message && <p className="text-green-500 bg-green-100 p-3 rounded-md">{message}</p>}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="primary_shirt_color" className="block text-sm font-medium text-gray-700 mb-1">Shirt Color</label>
        <div className="flex items-center">
          <input
            type="color"
            name="primary_shirt_color"
            id="primary_shirt_color"
            value={formData.primary_shirt_color}
            onChange={handleChange}
            required
            className="mt-1 h-10 px-1 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <span className="ml-3 text-sm text-gray-500">
            {formData.primary_shirt_color === '#1e40af' ? 'Light Blue' : 
             formData.primary_shirt_color === '#b91c1c' ? 'Red' : 
             formData.primary_shirt_color === '#172554' ? 'Black' : 'Custom'}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="team_type" className="block text-sm font-medium text-gray-700 mb-1">Team Type</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, team_type: 'club' }))}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              formData.team_type === 'club'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Club
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, team_type: 'external' }))}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              formData.team_type === 'external'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            External
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, team_type: 'internal' }))}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              formData.team_type === 'internal'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Internal
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-4 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (team ? 'Saving...' : 'Creating...') : (team ? 'Save Changes' : 'Create Team')}
        </button>
      </div>
    </form>
  );
}