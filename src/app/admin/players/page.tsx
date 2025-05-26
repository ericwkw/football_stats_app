'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PlayerList from '@/components/Admin/Players/PlayerList';
import AddPlayerForm from '@/components/Admin/Players/AddPlayerForm';
import { Player } from '@/types/database'; // Import Player type
import { User } from '@supabase/supabase-js'; // Import User type from Supabase

export default function PlayerManagementPage() {
  const [user, setUser] = useState<User | null>(null); // Proper typing for user
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state
  const [playerListKey, setPlayerListKey] = useState(0); // Key to trigger PlayerList refresh
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (!data?.user) {
          router.push('/login');
        } else {
          setUser(data.user);
        }
      } catch (err: unknown) {
        console.error('Authentication error:', err);
        setError(err instanceof Error ? err.message : 'Failed to authenticate user');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleDeletePlayer = async (playerId: string) => {
    if (!window.confirm('Are you sure you want to delete this player?')) {
      return;
    }
    try {
      const { error } = await supabase.from('players').delete().eq('id', playerId);
      if (error) throw error;
      
      // Use a more subtle notification instead of alert
      setError(null);
      setPlayerListKey(prevKey => prevKey + 1); // Refresh player list
    } catch (err: unknown) {
      console.error('Error deleting player:', err);
      setError(err instanceof Error ? `Error deleting player: ${err.message}` : 'An unknown error occurred');
    }
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setShowEditModal(true);
    setError(null); // Clear any previous errors
  };

  const handlePlayerUpdated = () => {
    setShowEditModal(false);
    setEditingPlayer(null);
    setPlayerListKey(prevKey => prevKey + 1);
  };

  const handlePlayerAdded = () => {
    setPlayerListKey(prevKey => prevKey + 1);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="p-4 rounded-lg bg-white shadow">
        <p className="text-gray-700">Loading...</p>
      </div>
    </div>;
  }

  if (!user) {
    return null; // Router.push already handles the redirect
  }

  return (
    <div className="container p-4 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Player Management</h1>
        <Link href="/admin" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Back to Admin Dashboard
        </Link>
      </div>
      
      {/* Show error message if present */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-2 text-red-700 hover:text-red-900 font-bold"
          >
            ×
          </button>
        </div>
      )}
      
      {!showEditModal && (
        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-700">Add New Player</h2>
          <AddPlayerForm onPlayerAdded={handlePlayerAdded} />
        </div>
      )}

      {showEditModal && editingPlayer && (
        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-700">Edit Player: {editingPlayer.name}</h2>
          <AddPlayerForm 
            onPlayerAdded={handlePlayerUpdated} 
            playerToEdit={editingPlayer} 
            onCancel={() => {
              setShowEditModal(false);
              setEditingPlayer(null);
            }}
          />
        </div>
      )}

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">Current Players</h2>
        <PlayerList 
          key={playerListKey} 
          onEditPlayer={handleEditPlayer} 
          onDeletePlayer={handleDeletePlayer} 
        />
      </div>
    </div>
  );
}