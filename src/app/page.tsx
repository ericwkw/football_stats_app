'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import PageHeader from '@/components/UI/PageHeader';
import { 
  TeamGoalsChart, 
  TopScorersChart,
  TopAssistsChart,
  GoalkeeperCleanSheetsChart 
} from '@/components/Charts';
import ResponsiveTableWrapper from '@/components/UI/ResponsiveTableWrapper';

interface TopScorer {
  player_id: string;
  player_name: string;
  matches_played: number;
  goals: number;
  weighted_goals: number;
}

interface TopAssist {
  player_id: string;
  player_name: string;
  matches_played: number;
  assists: number;
  weighted_assists: number;
}

interface TopGoalkeeper {
  player_id: string;
  player_name: string;
  matches_played: number;
  clean_sheets: number;
  clean_sheet_percentage: number;
}

interface TeamStats {
  id: string;
  name: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
}

interface MatchData {
  id: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  venue: string;
  home_team: {
    id: string;
    name: string;
  };
  away_team: {
    id: string;
    name: string;
  };
}

interface Leaderboards {
  top_scorers: TopScorer[];
  top_assists: TopAssist[];
  top_goalkeepers: TopGoalkeeper[];
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [topAssists, setTopAssists] = useState<TopAssist[]>([]);
  const [topGoalkeepers, setTopGoalkeepers] = useState<TopGoalkeeper[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchData[]>([]);
  
  // Debug states
  const [debugLeaderboardsRaw, setDebugLeaderboardsRaw] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data: leaderboardsData, error: leaderboardsError } = await supabase
          .rpc('get_simplified_leaderboards');
        
        if (leaderboardsError) throw new Error(`Failed to fetch leaderboards: ${leaderboardsError.message}`);
        
        setDebugLeaderboardsRaw(JSON.stringify(leaderboardsData, null, 2));
        
        const leaderboards = leaderboardsData as Leaderboards;
        setTopScorers(leaderboards.top_scorers || []);
        setTopAssists(leaderboards.top_assists || []);
        setTopGoalkeepers(leaderboards.top_goalkeepers || []);
        
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_internal_team_statistics');
        
        if (statsError) throw new Error(`Failed to fetch team statistics: ${statsError.message}`);
        
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id,
            match_date,
            home_score,
            away_score,
            venue,
            home_team:home_team_id(id, name),
            away_team:away_team_id(id, name)
          `)
          .order('match_date', { ascending: false })
          .limit(5);
        
        if (matchesError) throw new Error(`Failed to fetch recent matches: ${matchesError.message}`);
        
        setTeamStats(statsData || []);
        
        setRecentMatches((matchesData || []) as unknown as MatchData[]);
      } catch (err: unknown) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Football Stats Dashboard" 
        description="Track team and player performance statistics" 
      />

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center">
            <p className="text-xl">Loading statistics...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Data Visualization Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Key Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Top Scorers Chart */}
                <div>
                  <TopScorersChart 
                    players={topScorers.map(scorer => ({
                      ...scorer,
                      total_goals: scorer.goals,
                    }))} 
                    limit={5} 
                    useWeighted={true}
                  />
                </div>
                
                {/* Top Assists Chart */}
                <div>
                  <TopAssistsChart 
                    players={topAssists.map(assist => ({
                      ...assist,
                      total_assists: assist.assists,
                    }))} 
                    limit={5} 
                    useWeighted={true}
                  />
                </div>
                
                {/* Goalkeeper Clean Sheets Chart */}
                <div>
                  <GoalkeeperCleanSheetsChart 
                    goalkeepers={topGoalkeepers} 
                    limit={5} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
                {/* Team Goals Chart */}
                <div>
                  <TeamGoalsChart teams={teamStats} />
                </div>
              </div>
            </section>

            {/* Team Statistics Section */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Team Statistics</h2>
                <Link href="/teams" className="text-blue-600 hover:underline">
                  View All Teams
                </Link>
              </div>
              <ResponsiveTableWrapper>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GD</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PTS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamStats.length > 0 ? (
                      [...teamStats]
                        .sort((a, b) => 
                          (b.wins * 3 + b.draws) - (a.wins * 3 + a.draws) || 
                          ((b.goals_for - b.goals_against) - (a.goals_for - a.goals_against)) ||
                          b.goals_for - a.goals_for
                        )
                        .map((team, index) => {
                          const goalDifference = team.goals_for - team.goals_against;
                          const points = team.wins * 3 + team.draws;
                          const winRate = team.matches_played > 0 ? Math.round((team.wins / team.matches_played) * 100) : 0;
                          
                          return (
                        <tr key={team.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{winRate}%</td>
                        </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                          No team statistics available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ResponsiveTableWrapper>
            </section>

            {/* Top Scorers Section */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Top Scorers</h2>
                <Link href="/players" className="text-blue-600 hover:underline">
                  View All Players
                </Link>
              </div>
              <ResponsiveTableWrapper>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goals</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weighted Goals</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topScorers.length > 0 ? (
                      topScorers.map((scorer, index) => (
                        <tr key={scorer.player_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link href={`/players/${scorer.player_id}`} className="hover:underline">
                              {scorer.player_name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scorer.matches_played}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scorer.goals}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500">{scorer.weighted_goals}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No scoring data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ResponsiveTableWrapper>
            </section>

            {/* Top Assists Section */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Top Assists</h2>
                <Link href="/players" className="text-blue-600 hover:underline">
                  View All Players
                </Link>
              </div>
              <ResponsiveTableWrapper>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assists</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weighted Assists</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topAssists.length > 0 ? (
                      topAssists.map((assist, index) => (
                        <tr key={assist.player_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link href={`/players/${assist.player_id}`} className="hover:underline">
                              {assist.player_name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assist.matches_played}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assist.assists}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500">{assist.weighted_assists}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No assist data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ResponsiveTableWrapper>
            </section>

            {/* Top Goalkeepers Section */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Top Goalkeepers</h2>
                <Link href="/players" className="text-blue-600 hover:underline">
                  View All Players
                </Link>
              </div>
              <ResponsiveTableWrapper>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goalkeeper</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clean Sheets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clean Sheet %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topGoalkeepers.length > 0 ? (
                      topGoalkeepers.map((gk, index) => (
                        <tr key={gk.player_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link href={`/players/${gk.player_id}`} className="hover:underline">
                              {gk.player_name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gk.matches_played}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gk.clean_sheets}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500">{gk.clean_sheet_percentage}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No goalkeeper data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ResponsiveTableWrapper>
            </section>

            {/* Recent Matches Section */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Recent Matches</h2>
                <Link href="/matches" className="text-blue-600 hover:underline">
                  View All Matches
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentMatches.length > 0 ? (
                  recentMatches.map((match) => (
                    <div key={match.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                      <div className="p-4">
                        <div className="text-sm text-gray-500 mb-2">
                          {new Date(match.match_date).toLocaleDateString()} - {match.venue}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-center w-2/5">
                            <p className="font-medium text-gray-900">{match.home_team.name}</p>
                          </div>
                          <div className="text-center w-1/5">
                            <div className="text-xl font-bold">
                              {match.home_score !== null ? match.home_score : '-'} - {match.away_score !== null ? match.away_score : '-'}
                            </div>
                          </div>
                          <div className="text-center w-2/5">
                            <p className="font-medium text-gray-900">{match.away_team.name}</p>
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <Link href={`/matches/${match.id}`} className="text-blue-600 hover:underline text-sm">
                            Match Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-white shadow-md rounded-lg p-6 text-center text-gray-500">
                    No recent matches available
                  </div>
                )}
              </div>
            </section>

            {/* Debug Section - only visible during development */}
            {process.env.NODE_ENV === 'development' && (
              <section className="mb-12 p-4 bg-gray-100 rounded-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Debug Information</h2>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Raw Leaderboards Data</h3>
                  <pre className="bg-white p-4 rounded overflow-auto max-h-60 text-xs">
                    {debugLeaderboardsRaw}
                  </pre>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
