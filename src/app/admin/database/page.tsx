'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/UI/PageHeader';

export default function AdminDatabasePage() {
  const [activeTab, setActiveTab] = useState('tables');

  // Mock database tables and their details
  const tables = [
    { name: 'players', records: 105, lastUpdated: '2023-06-12' },
    { name: 'teams', records: 12, lastUpdated: '2023-06-10' },
    { name: 'matches', records: 48, lastUpdated: '2023-06-15' },
    { name: 'player_match_stats', records: 576, lastUpdated: '2023-06-15' },
    { name: 'player_match_assignments', records: 576, lastUpdated: '2023-06-15' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Database Management" 
        description="Manage database configurations and maintenance" 
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
                <strong>Placeholder Page:</strong> This is a placeholder for the Database Management functionality which will be implemented in a future update.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Database Management</h2>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'tables'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tables
              </button>
              <button
                onClick={() => setActiveTab('backup')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'backup'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Backup & Restore
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'maintenance'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Maintenance
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'tables' && (
              <div>
                <p className="text-gray-600 mb-4">View and manage database tables.</p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Table Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Records
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tables.map((table) => (
                        <tr key={table.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {table.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {table.records}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {table.lastUpdated}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">Export</button>
                            <button className="text-red-600 hover:text-red-900" disabled>Truncate</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 text-gray-500 text-sm">
                  <p>Note: Direct database operations require admin privileges.</p>
                </div>
              </div>
            )}
            
            {activeTab === 'backup' && (
              <div>
                <p className="text-gray-600 mb-4">Backup and restore your database.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Create Backup</h3>
                    <p className="text-gray-500 mb-4">Create a complete backup of your database.</p>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Create Backup
                    </button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Restore Backup</h3>
                    <p className="text-gray-500 mb-4">Restore from a previous backup file.</p>
                    <div className="flex flex-col space-y-2">
                      <input 
                        type="file" 
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Restore Database
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Recent Backups</h3>
                  <p className="text-gray-500 mb-4">No recent backups found.</p>
                </div>
              </div>
            )}
            
            {activeTab === 'maintenance' && (
              <div>
                <p className="text-gray-600 mb-4">Perform database maintenance operations.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Optimize Database</h3>
                    <p className="text-gray-500 mb-4">Run optimization routines to improve performance.</p>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Optimize Now
                    </button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Repair Tables</h3>
                    <p className="text-gray-500 mb-4">Check and repair database tables.</p>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Repair Tables
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Clear Cache</h3>
                  <p className="text-gray-500 mb-4">Clear database query cache and temporary data.</p>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Clear Cache
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Database Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Database Type</p>
              <p className="text-lg font-semibold text-gray-800">PostgreSQL</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Total Size</p>
              <p className="text-lg font-semibold text-gray-800">24.5 MB</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Last Optimized</p>
              <p className="text-lg font-semibold text-gray-800">Never</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 