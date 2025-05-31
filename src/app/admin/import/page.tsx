'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ImportForm from '@/components/Admin/DataImport/ImportForm';
import PageHeader from '@/components/UI/PageHeader';

export default function DataImportPage() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // In a production app, you would check if the user is an admin here
    // For this example, we'll just simulate a check
    const checkAdmin = async () => {
      try {
        // This would normally be a real auth check
        const isAdminUser = true; // Replace with actual auth check
        setIsAdmin(isAdminUser);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader 
          title="Access Denied" 
          description="You do not have permission to access this page" 
        />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>You must be an administrator to access this page.</p>
          </div>
          <Link href="/" className="text-indigo-600 hover:text-indigo-900">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Data Import" 
        description="Import historical data into the system" 
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-indigo-600 hover:text-indigo-900">
            ← Back to Admin Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Import Historical Data</h2>
          <p className="text-gray-600">
            Use this tool to import historical data from CSV files. You can import teams, players, matches, and player statistics.
          </p>
        </div>

        <ImportForm />

        <div className="mt-12 bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Instructions</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium text-gray-800">Data Format</h4>
              <p className="text-gray-600">
                All imports must be in CSV format with headers. You can download templates for each data type using the "Download Template" button.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-800">Import Order</h4>
              <p className="text-gray-600">
                For best results, import data in the following order:
              </p>
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-600">
                <li>Teams - Create all team records first</li>
                <li>Players - Import players after teams are created</li>
                <li>Matches - Set up match records</li>
                <li>Player Stats - Import statistics for each player in each match</li>
              </ol>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-800">Using Team Names for Players</h4>
              <p className="text-gray-600">
                You can now import players using team names instead of team IDs. Simply:
              </p>
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-600">
                <li>Select "Players (with team names)" as the data type</li>
                <li>Download the template which uses a <code>team_name</code> column instead of <code>team_id</code></li>
                <li>Fill in the team names exactly as they appear in your database</li>
                <li>Upload and import as usual</li>
              </ol>
              <p className="text-gray-600 mt-2">
                This simplifies the import process as you don't need to look up team UUIDs.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-800">Dry Run Mode</h4>
              <p className="text-gray-600">
                Use "Dry Run Mode" to validate your data before making changes to the database. This will check for any formatting issues or missing required fields.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-800">External IDs</h4>
              <p className="text-gray-600">
                The "external_id" field is used to identify records when importing. If you plan to update records later, make sure to include unique external IDs.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 