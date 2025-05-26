'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/Auth/LogoutButton';
import Link from 'next/link';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null); // Consider using a more specific type for user
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState({
    players: 0,
    teams: 0,
    matches: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
        if (!error && !data?.user) { // Not logged in, no Supabase error
            setUser(null);
        }
      } else {
        setUser(data.user);
      }
      setLoading(false); // Auth loading is complete
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (user) {
      const fetchSummaryStats = async () => {
        setStatsLoading(true);
        setStatsError(null);
        try {
          const [playersRes, teamsRes, matchesRes] = await Promise.all([
            supabase.from('players').select('*', { count: 'exact', head: true }),
            supabase.from('teams').select('*', { count: 'exact', head: true }),
            supabase.from('matches').select('*', { count: 'exact', head: true }),
          ]);

          if (playersRes.error) throw new Error(`Players: ${playersRes.error.message}`);
          if (teamsRes.error) throw new Error(`Teams: ${teamsRes.error.message}`);
          if (matchesRes.error) throw new Error(`Matches: ${matchesRes.error.message}`);

          setSummaryStats({
            players: playersRes.count || 0,
            teams: teamsRes.count || 0,
            matches: matchesRes.count || 0,
          });
        } catch (error: any) {
          console.error('Error fetching summary stats:', error);
          setStatsError(error.message);
        } finally {
          setStatsLoading(false);
        }
      };
      fetchSummaryStats();
    } else {
      // If user is null (e.g., initial state before auth check, or after logout)
      setSummaryStats({ players: 0, teams: 0, matches: 0 }); // Reset stats
      setStatsLoading(false); // Ensure stats are not in loading state
    }
  }, [user]); // Add user to dependency array to re-fetch stats if user changes

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      router.push('/login');
    }
  };

  if (loading) { // This is for user auth loading
    return <p>Loading...</p>;
  }

  if (!user) {
    return null; // Or a redirect component, router.push already handles it
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900">Admin Dashboard</h1>
        <p className="text-center text-gray-700">Welcome, {user.email}!</p>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Quick Stats</h2>
          {statsLoading ? (
            <p className="text-gray-600">Loading stats...</p>
          ) : statsError ? (
            <p className="text-red-500">Error loading stats: {statsError}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{summaryStats.players}</p>
                <p className="text-sm text-gray-500">Total Players</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">{summaryStats.teams}</p>
                <p className="text-sm text-gray-500">Total Teams</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">{summaryStats.matches}</p>
                <p className="text-sm text-gray-500">Total Matches</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center space-y-4">
          <Link href="/admin/players" className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
            Manage Players
          </Link>
          <Link href="/admin/matches" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Manage Matches
          </Link>
          <Link href="/admin/teams" className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
            Manage Teams
          </Link>
          <LogoutButton />
        </div>
        <p className="mt-4 text-sm text-center text-gray-500">
          This is a protected admin page.
        </p>
      </div>
    </div>
  );
}