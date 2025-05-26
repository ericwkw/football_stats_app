'use client';

import React, { useState } from 'react';

type DataType = 'matches' | 'players' | 'teams' | 'player_stats';

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
      
      // Call the import API
      const response = await fetch('/api/admin/import-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType,
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
      players: '/api/templates/players_template.csv',
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
            <option value="teams">Teams</option>
            <option value="players">Players</option>
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
      
      {result && (
        <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {result.success ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Import Successful' : 'Import Failed'}
              </h3>
              <div className={`mt-2 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                <p>{result.message}</p>
                {result.success && result.records && (
                  <p className="mt-1">Successfully processed {result.records} records.</p>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">Errors:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportForm; 