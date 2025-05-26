'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import PageHeader from '@/components/UI/PageHeader';
import { 
  TeamGoalsChart, 
  TeamPointsChart
} from '@/components/Charts';

interface TeamStats {
  id: string;
  name: string;
  primary_shirt_color: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
}

export default function TeamsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalTeams, setInternalTeams] = useState<TeamStats[]>([]);
  const [clubTeams, setClubTeams] = useState<TeamStats[]>([]);
  const [activeTab, setActiveTab] = useState<'internal' | 'club'>('internal');

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get internal team statistics from our SQL function
        const { data: internalStatsData, error: internalStatsError } = await supabase
          .rpc('get_internal_team_statistics');
        
        if (internalStatsError) throw new Error(`Failed to fetch internal team statistics: ${internalStatsError.message}`);
        
        // Get club team statistics from our SQL function
        const { data: clubStatsData, error: clubStatsError } = await supabase
          .rpc('get_club_team_statistics');
        
        if (clubStatsError) throw new Error(`Failed to fetch club team statistics: ${clubStatsError.message}`);
        
        // Get team colors and additional info
        const { data: allTeamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, primary_shirt_color, team_type');
        
        if (teamsError) throw new Error(`Failed to fetch team data: ${teamsError.message}`);

        // Define the data types
        type StatRecord = {
          id: string;
          name: string;
          matches_played: number;
          wins: number;
          draws: number;
          losses: number;
          goals_for: number;
          goals_against: number;
        };
        
        type TeamRecord = {
          id: string;
          name: string;
          primary_shirt_color: string;
          team_type: string;
        };
        
        // Merge the internal team data
        const internalTeamData = (internalStatsData as StatRecord[]).map(stats => {
          const teamInfo = (allTeamsData as TeamRecord[]).find(t => t.id === stats.id) || {
            primary_shirt_color: ''
          };
          return {
            ...stats,
            ...teamInfo
          };
        });

        // Merge the club team data
        const clubTeamData = (clubStatsData as StatRecord[]).map(stats => {
          const teamInfo = (allTeamsData as TeamRecord[]).find(t => t.id === stats.id) || {
            primary_shirt_color: ''
          };
          return {
            ...stats,
            ...teamInfo
          };
        });
        
        setInternalTeams(internalTeamData);
        setClubTeams(clubTeamData);
      } catch (err: unknown) {
        console.error('Error fetching team data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, []);

  // Get the correct teams array based on active tab
  const teams = activeTab === 'internal' ? internalTeams : clubTeams;

  // Calculate points and sort teams by points, goal difference, etc.
  const sortedTeams = [...teams].sort((a, b) => {
    // Points (3 for win, 1 for draw)
    const pointsA = a.wins * 3 + a.draws;
    const pointsB = b.wins * 3 + b.draws;
    if (pointsB !== pointsA) return pointsB - pointsA;
    
    // Goal difference
    const gdA = a.goals_for - a.goals_against;
    const gdB = b.goals_for - b.goals_against;
    if (gdB !== gdA) return gdB - gdA;
    
    // Goals for
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    
    // Alphabetical by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Team Statistics" 
        description="View performance data for all teams" 
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl">Loading team statistics...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Tabs for Internal vs Club teams */}
            <div className="mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('internal')}
                  className={`py-2 px-4 font-medium text-sm ${
                    activeTab === 'internal'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Internal Teams
                </button>
                <button
                  onClick={() => setActiveTab('club')}
                  className={`py-2 px-4 font-medium text-sm ${
                    activeTab === 'club'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Club Teams
                </button>
              </div>
            </div>
            
            {/* Team Charts Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {activeTab === 'internal' ? 'Internal Teams' : 'Club Teams'} Performance Visualizations
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Team Goals Chart */}
                <div>
                  <TeamGoalsChart teams={teams} />
                </div>
                
                {/* Team Points Pie Chart - only show for internal teams */}
                {activeTab === 'internal' && (
                  <div>
                    <TeamPointsChart teams={teams} />
                  </div>
                )}
              </div>
            </section>
            
            {/* Team Statistics Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GD</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedTeams.length > 0 ? (
                      sortedTeams.map((team, index) => {
                        const goalDifference = team.goals_for - team.goals_against;
                        const points = team.wins * 3 + team.draws;
                        
                        return (
                          <tr key={team.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <Link href={`/teams/${team.id}`} className="hover:underline">
                                {team.name}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span 
                                className="inline-block w-6 h-6 rounded-full" 
                                style={{ backgroundColor: team.primary_shirt_color || 'gray' }}
                                title={team.primary_shirt_color}
                              ></span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.matches_played}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.wins}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.draws}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.losses}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.goals_for}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.goals_against}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${goalDifference > 0 ? 'text-green-600' : goalDifference < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                              {goalDifference > 0 ? `+${goalDifference}` : goalDifference}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{points}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                          No team statistics available for {activeTab === 'internal' ? 'internal teams' : 'club teams'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}