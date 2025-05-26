// src/app/admin/matches/edit/[matchId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AddMatchForm from '@/components/Admin/Matches/AddMatchForm';
import { Match } from '@/types/database';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function EditMatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [initialMatchData, setInitialMatchData] = useState<Match | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      setLoadingUser(true);
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data?.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
      setLoadingUser(false);
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (!matchId || !user) return; // Wait for user to be authenticated

    const fetchMatch = async () => {
      setLoadingMatch(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (fetchError) {
        console.error('Error fetching match for edit:', fetchError);
        setError(fetchError.message);
        setInitialMatchData(null);
      } else {
        setInitialMatchData(data as Match);
      }
      setLoadingMatch(false);
    };

    fetchMatch();
  }, [matchId, user]);

  const handleMatchUpdated = () => {
    toast.success('Match updated successfully!');
    router.push('/admin/matches'); // Redirect to the match list page
  };

  if (loadingUser || (user && loadingMatch)) {
    return <p className="p-4 text-gray-700">Loading match details...</p>;
  }

  if (!user) {
    // This case should ideally be handled by the redirect in checkUser, 
    // but as a fallback:
    return <p className="p-4 text-red-500">Access denied. Please log in.</p>;
  }
  
  if (error) {
    return (
      <div className="container p-4 mx-auto">
        <p className="text-red-500">Error loading match: {error}</p>
        <Link href="/admin/matches" className="mt-4 text-blue-600 hover:text-blue-800">
          Back to Match List
        </Link>
      </div>
    );
  }

  if (!initialMatchData) {
    return (
      <div className="container p-4 mx-auto">
        <p className="text-gray-700">Match not found or you do not have permission to edit it.</p>
        <Link href="/admin/matches" className="mt-4 text-blue-600 hover:text-blue-800">
          Back to Match List
        </Link>
      </div>
    );
  }

  return (
    <div className="container p-4 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Match</h1>
        <Link href="/admin/matches" className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700">
          Back to Match List
        </Link>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <AddMatchForm 
          onMatchAdded={handleMatchUpdated} // Re-use for update scenario
          existingMatchData={initialMatchData} 
        />
      </div>
    </div>
  );
}