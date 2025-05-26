// /Users/wuf/_codes/_Trae/football_stats_app/src/app/admin/teams/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Team } from '@/types/database';
import TeamList from '@/components/Admin/Teams/TeamList';
import TeamForm from '@/components/Admin/Teams/TeamForm';

export default function ManageTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching teams:', error);
      setError(error.message);
    } else {
      setTeams(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingTeam(null);
    fetchTeams(); // Refresh the list
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setShowForm(true);
  };

  const handleDelete = async (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      // Optional: Add a check for players associated with this team before deleting
      // For now, directly attempt deletion.
      setLoading(true); // Indicate loading state for the page or a specific part
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
      
      if (deleteError) {
        console.error('Error deleting team:', deleteError);
        setError(`Failed to delete team: ${deleteError.message}. It might be referenced by existing players or matches.`);
        // Keep loading false or set it based on overall page state
      } else {
        setTeams(prevTeams => prevTeams.filter(t => t.id !== teamId)); // Optimistic update
        // Or call fetchTeams() for a full refresh, which is safer
        // fetchTeams(); 
        setError(null); // Clear previous errors
      }
      setLoading(false); // Reset loading state
    }
  };

  if (loading) return <p className="text-gray-700">Loading teams...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Teams</h1>
        <button
          onClick={() => { setEditingTeam(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
        >
          Add New Team
        </button>
      </div>

      {showForm ? (
        <TeamForm
          team={editingTeam}
          onFormSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingTeam(null); setError(null); }}
        />
      ) : (
        <TeamList 
          teams={teams} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          loading={loading} // Pass loading state to TeamList
        />
      )}

      <div className="mt-8">
        <Link href="/admin" className="text-blue-600 hover:underline">
          &larr; Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
}