'use client';

import { useState } from 'react';
import TopScorersChart from '@/components/Charts/TopScorersChart';
import TopAssistsChart from '@/components/Charts/TopAssistsChart';
import GoalkeeperCleanSheetsChart from '@/components/Charts/GoalkeeperCleanSheetsChart';
import ResponsiveTableWrapper from '@/components/UI/ResponsiveTableWrapper';

export default function ResponsiveExamplesPage() {
  // Mock data for demonstration
  const [scorers] = useState([
    { player_id: '1', player_name: 'Lionel Messi', total_goals: 25, weighted_goals: 40 },
    { player_id: '2', player_name: 'Cristiano Ronaldo', total_goals: 22, weighted_goals: 35 },
    { player_id: '3', player_name: 'Robert Lewandowski', total_goals: 20, weighted_goals: 32 },
    { player_id: '4', player_name: 'Erling Haaland', total_goals: 18, weighted_goals: 30 },
    { player_id: '5', player_name: 'Kylian Mbappé', total_goals: 17, weighted_goals: 28 },
  ]);

  const [assists] = useState([
    { player_id: '1', player_name: 'Kevin De Bruyne', total_assists: 15, weighted_assists: 25 },
    { player_id: '2', player_name: 'Thomas Müller', total_assists: 14, weighted_assists: 22 },
    { player_id: '3', player_name: 'Bruno Fernandes', total_assists: 12, weighted_assists: 20 },
    { player_id: '4', player_name: 'Joshua Kimmich', total_assists: 11, weighted_assists: 18 },
    { player_id: '5', player_name: 'Trent Alexander-Arnold', total_assists: 10, weighted_assists: 16 },
  ]);

  const [goalkeepers] = useState([
    { player_id: '1', player_name: 'Alisson Becker', matches_played: 30, clean_sheets: 15, clean_sheet_percentage: 50 },
    { player_id: '2', player_name: 'Ederson', matches_played: 28, clean_sheets: 13, clean_sheet_percentage: 46.4 },
    { player_id: '3', player_name: 'Jan Oblak', matches_played: 32, clean_sheets: 12, clean_sheet_percentage: 37.5 },
    { player_id: '4', player_name: 'Manuel Neuer', matches_played: 25, clean_sheets: 10, clean_sheet_percentage: 40 },
    { player_id: '5', player_name: 'Thibaut Courtois', matches_played: 27, clean_sheets: 9, clean_sheet_percentage: 33.3 },
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Responsive Examples</h1>
      
      <p className="mb-6 text-gray-700">
        Below are examples of responsive tables and charts that automatically provide horizontal 
        scrolling on narrower screens. Resize your browser window to see how they behave.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Responsive Charts</h2>
          <p className="mb-4 text-gray-600">These charts use ResponsiveChartWrapper to ensure horizontal scrollability on narrow screens.</p>
          
          <div className="mb-8">
            <h3 className="text-xl mb-2">Top Scorers</h3>
            <TopScorersChart players={scorers} limit={5} />
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl mb-2">Top Assists</h3>
            <TopAssistsChart players={assists} limit={5} />
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl mb-2">Top Goalkeepers</h3>
            <GoalkeeperCleanSheetsChart goalkeepers={goalkeepers} limit={5} />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Responsive Tables</h2>
          <p className="mb-4 text-gray-600">These tables use ResponsiveTableWrapper to ensure horizontal scrollability on narrow screens.</p>
          
          <div className="mb-8">
            <h3 className="text-xl mb-2">Top Scorers Table</h3>
            <ResponsiveTableWrapper>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Goals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weighted Goals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ratio</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scorers.map(player => (
                    <tr key={player.player_id}>
                      <td className="px-6 py-4 whitespace-nowrap">{player.player_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{player.total_goals}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{player.weighted_goals}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{((player.weighted_goals || 0) / player.total_goals).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTableWrapper>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl mb-2">Top Assists Table</h3>
            <ResponsiveTableWrapper>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Assists</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weighted Assists</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ratio</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assists.map(player => (
                    <tr key={player.player_id}>
                      <td className="px-6 py-4 whitespace-nowrap">{player.player_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{player.total_assists}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{player.weighted_assists}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{((player.weighted_assists || 0) / player.total_assists).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTableWrapper>
          </div>
        </div>
      </div>
    </div>
  );
} 