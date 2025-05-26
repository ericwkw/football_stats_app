'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import PageHeader from '@/components/UI/PageHeader';

export default function AdminDashboardPage() {
  const [statsLoading, setStatsLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState({
    players: 0,
    teams: 0,
    matches: 0,
    goals: 0,
  });

  useEffect(() => {
    const fetchSummaryStats = async () => {
      setStatsLoading(true);
      try {
        const [playersRes, teamsRes, matchesRes, goalsRes] = await Promise.all([
          supabase.from('players').select('*', { count: 'exact', head: true }),
          supabase.from('teams').select('*', { count: 'exact', head: true }),
          supabase.from('matches').select('*', { count: 'exact', head: true }),
          supabase.from('player_match_stats').select('goals'),
        ]);

        // Calculate total goals from player match stats
        const totalGoals = goalsRes.data ? goalsRes.data.reduce((sum, stat) => sum + (stat.goals || 0), 0) : 0;

        setSummaryStats({
          players: playersRes.count || 0,
          teams: teamsRes.count || 0,
          matches: matchesRes.count || 0,
          goals: totalGoals,
        });
      } catch (error) {
        console.error('Error fetching summary stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchSummaryStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Quick Stats" 
        description="Overview of your football stats" 
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-indigo-600 hover:text-indigo-900">
            ← Back to Admin Home
          </Link>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> This page shows a quick overview of your stats. For detailed analytics, visit the Analytics section.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Stats</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Players Stat Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Players</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {statsLoading ? '...' : summaryStats.players}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/admin/players" className="text-sm text-blue-500 hover:text-blue-700">
                  View all players →
                </Link>
              </div>
            </div>

            {/* Teams Stat Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Teams</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {statsLoading ? '...' : summaryStats.teams}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/admin/teams" className="text-sm text-green-500 hover:text-green-700">
                  View all teams →
                </Link>
              </div>
            </div>

            {/* Matches Stat Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Matches</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {statsLoading ? '...' : summaryStats.matches}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/admin/matches" className="text-sm text-purple-500 hover:text-purple-700">
                  View all matches →
                </Link>
              </div>
            </div>

            {/* Goals Stat Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Goals</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {statsLoading ? '...' : summaryStats.goals}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/admin/analytics" className="text-sm text-yellow-500 hover:text-yellow-700">
                  View analytics →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <p className="text-gray-500">Activity data will be shown here in a future update.</p>
        </div>
      </main>
    </div>
  );
} 