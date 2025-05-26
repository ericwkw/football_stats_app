'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/UI/PageHeader';

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('players');

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Analytics" 
        description="Detailed statistics and performance metrics" 
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
                <strong>Placeholder Page:</strong> This is a placeholder for the Analytics functionality which will be implemented in a future update.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Performance Analytics</h2>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('players')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'players'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Players
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'teams'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Teams
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'matches'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Matches
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'trends'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Trends
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'players' && (
              <div>
                <p className="text-gray-600 mb-4">Player performance metrics will be displayed here.</p>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Top Goal Scorers</h3>
                    <p className="text-gray-500">Chart will be displayed here.</p>
                  </div>
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Top Assists</h3>
                    <p className="text-gray-500">Chart will be displayed here.</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'teams' && (
              <div>
                <p className="text-gray-600 mb-4">Team performance metrics will be displayed here.</p>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Team Win Rates</h3>
                    <p className="text-gray-500">Chart will be displayed here.</p>
                  </div>
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Goals For/Against</h3>
                    <p className="text-gray-500">Chart will be displayed here.</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'matches' && (
              <div>
                <p className="text-gray-600 mb-4">Match statistics will be displayed here.</p>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Match Results</h3>
                    <p className="text-gray-500">Chart will be displayed here.</p>
                  </div>
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Score Distribution</h3>
                    <p className="text-gray-500">Chart will be displayed here.</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'trends' && (
              <div>
                <p className="text-gray-600 mb-4">Performance trends over time will be displayed here.</p>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Seasonal Trends</h3>
                    <p className="text-gray-500">Chart will be displayed here.</p>
                  </div>
                  <div className="flex-1 p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Performance Forecasts</h3>
                    <p className="text-gray-500">Chart will be displayed here.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Custom Reports</h3>
          <p className="text-gray-600 mb-4">Generate custom reports based on specific criteria.</p>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-gray-500 mb-4">Custom report builder will be available in a future update.</p>
            <button disabled className="px-4 py-2 bg-gray-200 text-gray-500 rounded-md cursor-not-allowed">
              Create Custom Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 