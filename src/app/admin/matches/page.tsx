'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MatchList from '@/components/Admin/Matches/MatchList';
import AddMatchForm from '@/components/Admin/Matches/AddMatchForm';
import { toast } from 'react-toastify'; // Assuming react-toastify is used for notifications

export default function MatchManagementPage() {
  const [user, setUser] = useState<any>(null); // Consider using a more specific type for user
  const [loading, setLoading] = useState(true);
  const [matchListKey, setMatchListKey] = useState(0); // Key to trigger MatchList refresh
  const [actionMessage, setActionMessage] = useState<string | null>(null); // For success/error messages
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return null; // Or a redirect component, router.push already handles it
  }

  const handleDeleteMatch = async (matchId: string) => {
    setActionMessage(null);
    try {
      // Optional: First, delete related player_stats if cascade delete is not set up
      // const { error: playerStatsError } = await supabase
      //   .from('player_stats')
      //   .delete()
      //   .eq('match_id', matchId);

      // if (playerStatsError) {
      //   throw playerStatsError;
      // }

      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) {
        throw error;
      }
      toast.success('Match deleted successfully!');
      setMatchListKey(prevKey => prevKey + 1); // Refresh the list
    } catch (error: any) { // Explicitly type error as any or Error
      console.error('Error deleting match:', error);
      toast.error(`Error deleting match: ${error.message}`);
      setActionMessage(`Error deleting match: ${error.message}`);
    }
  };

  return (
    <div className="container p-4 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Match Management</h1>
        <Link href="/admin" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Back to Admin Dashboard
        </Link>
      </div>
      
      <div className="p-6 mb-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">Add New Match</h2>
        <AddMatchForm onMatchAdded={() => setMatchListKey(prevKey => prevKey + 1)} />
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">Current Matches</h2>
        {actionMessage && (
          <p className={`mb-4 ${actionMessage.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {actionMessage}
          </p>
        )}
        <MatchList key={matchListKey} onMatchDeleted={handleDeleteMatch} />
      </div>
    </div>
  );
}