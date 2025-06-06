'use client';

import React, { useState } from 'react';

type DataType = 'matches' | 'players' | 'players_team_name' | 'teams' | 'teams_simplified' | 'player_stats';

interface ImportResult {
  success: boolean;
  message: string;
  records?: number;
  errors?: string[];
}

const ImportForm: React.FC = () => {
  const [dataType, setDataType] = useState<DataType>('teams');
  const [file, setFile] = useState<File | null>(null);
  const [isDryRun, setIsDryRun] = useState<boolean>(true);
  const [isSkipDuplicates, setIsSkipDuplicates] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null); // Clear previous results
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setResult({
        success: false,
        message: 'Please select a file to upload',
      });
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      // Parse the CSV file
      const fileContent = await file.text();
      
      // Determine the API endpoint based on data type
      let apiEndpoint = '/api/admin/import-data';
      let apiDataType = dataType;
      
      // Use the special team name-based endpoint for players_team_name
      if (dataType === 'players_team_name') {
        apiEndpoint = '/api/admin/import-players-by-team-name';
        apiDataType = 'players'; // The underlying data type is still 'players'
      }
      // Use the simplified teams import endpoint
      else if (dataType === 'teams_simplified') {
        apiEndpoint = '/api/admin/import-teams-simplified';
        apiDataType = 'teams'; // The underlying data type is still 'teams'
      }
      
      // Call the import API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType: apiDataType,
          data: fileContent,
          dryRun: isDryRun,
          skipDuplicates: isSkipDuplicates,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }
      
      const data = await response.json();
      setResult({
        success: true,
        message: data.message || 'Import completed successfully',
        records: data.records,
        errors: data.errors,
      });
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred during import',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download template function
  const downloadTemplate = () => {
    const templateUrls = {
      teams: '/api/templates/teams_template.csv',
      teams_simplified: '/api/templates/teams_simplified_template.csv',
      players: '/api/templates/players_template.csv',
      players_team_name: '/api/templates/players_team_name_template.csv',
      matches: '/api/templates/matches_template.csv',
      player_stats: '/api/templates/player_stats_template.csv',
    };
    
    const url = templateUrls[dataType];
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-6">Import Historical Data</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Type
          </label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value as DataType)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="teams">Teams (detailed)</option>
            <option value="teams_simplified">Teams (simplified)</option>
            <option value="players">Players (with team IDs)</option>
            <option value="players_team_name">Players (with team names)</option>
            <option value="matches">Matches</option>
            <option value="player_stats">Player Match Statistics</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Upload a CSV file containing your data.
            <button
              type="button"
              onClick={downloadTemplate}
              className="ml-2 text-indigo-600 hover:text-indigo-900"
            >
              Download Template
            </button>
          </p>
        </div>
        
        <div className="flex space-x-6">
          <div className="flex items-center">
            <input
              id="dry-run"
              type="checkbox"
              checked={isDryRun}
              onChange={(e) => setIsDryRun(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="dry-run" className="ml-2 block text-sm text-gray-700">
              Dry Run Mode (no changes will be made)
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="skip-duplicates"
              type="checkbox"
              checked={isSkipDuplicates}
              onChange={(e) => setIsSkipDuplicates(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="skip-duplicates" className="ml-2 block text-sm text-gray-700">
              Skip Duplicates
            </label>
          </div>
        </div>
        
        {dataType === 'teams_simplified' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-700">Using Simplified Teams Import</h4>
            <p className="text-sm text-blue-600 mt-1">
              This option allows you to import teams with just names and types.
              The system will automatically assign colors based on predefined team names:
            </p>
            <ul className="mt-2 text-sm text-blue-600 list-disc list-inside">
              <li>Light Blue: #79DBFB</li>
              <li>Red: #FF6188</li>
              <li>Black: #000000</li>
              <li>FCB United: #5050f0</li>
            </ul>
          </div>
        )}
        
        <div>
          <button
            type="submit"
            disabled={isLoading || !file}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              isLoading || !file
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {isLoading ? 'Importing...' : isDryRun ? 'Run Validation' : 'Import Data'}
          </button>
        </div>
      </form>
      
      {/* Result display */}
      {result && (
        <div
          className={`mt-6 p-4 rounded-md ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          <h3 className="text-lg font-medium">
            {result.success ? 'Import Successful' : 'Import Failed'}
          </h3>
          <p className="mt-2">{result.message}</p>
          
          {result.records !== undefined && (
            <p className="mt-1">
              Records processed: <span className="font-semibold">{result.records}</span>
            </p>
          )}
          
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium">Errors:</h4>
              <ul className="mt-1 list-disc list-inside">
                {result.errors.slice(0, 10).map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
                {result.errors.length > 10 && (
                  <li className="text-sm font-medium">
                    ... and {result.errors.length - 10} more errors
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportForm; 