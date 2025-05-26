/**
 * Seed script to create three players with stats across multiple teams
 * 
 * This script creates:
 * 1. Three players (John Doe, Emma Smith, Michael Johnson)
 * 2. Multiple matches with them playing for different teams
 * 3. Match stats including goals, assists, and team assignments
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client from environment
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Team IDs (existing teams in the database)
// Note: Replace these with actual team IDs from your database
const FCB_UNITED_ID = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';
const RED_TEAM_ID = '2f6e7d1c-b5e4-4a3f-9f2d-1e8c7a4b3d5e';
const BLUE_ROVERS_ID = '3e4f5g6h-7i8j-9k0l-1m2n-3o4p5q6r7s8t';

async function seedPlayersAndMatches() {
  try {
    console.log('Starting to seed players and match data...');

    // 1. Create the three players if they don't exist
    const players = [
      {
        id: '11aa22bb-33cc-44dd-55ee-66ff77gg88hh',
        name: 'John Doe',
        position: 'Forward',
        team_id: FCB_UNITED_ID, // Current team
      },
      {
        id: '22bb33cc-44dd-55ee-66ff-77gg88hh99ii',
        name: 'Emma Smith',
        position: 'Midfielder',
        team_id: RED_TEAM_ID, // Current team
      },
      {
        id: '33cc44dd-55ee-66ff-77gg-88hh99ii00jj',
        name: 'Michael Johnson',
        position: 'Defender',
        team_id: BLUE_ROVERS_ID, // Current team
      }
    ];

    // Insert players
    const { error: playersError } = await supabase
      .from('players')
      .upsert(players, { onConflict: 'id' });

    if (playersError) {
      console.error('Error inserting players:', playersError);
      return;
    }

    console.log('Players created successfully');

    // 2. Create matches with different teams
    // The matches will be created to ensure each player has played in multiple teams
    const nowDate = new Date();
    const matches = [
      // FCB United vs Red Team (John and Emma play for their current teams)
      {
        id: 'match01-11aa-22bb-33cc-44dd55ee66ff',
        match_date: new Date(nowDate.setDate(nowDate.getDate() - 30)).toISOString(),
        home_team_id: FCB_UNITED_ID,
        away_team_id: RED_TEAM_ID,
        home_score: 2,
        away_score: 1,
        venue: 'Home Stadium',
        match_type: 'league_game'
      },
      // FCB United vs Blue Rovers (John plays for FCB, Michael for Blue)
      {
        id: 'match02-22bb-33cc-44dd-55ee66ff77gg',
        match_date: new Date(nowDate.setDate(nowDate.getDate() - 25)).toISOString(),
        home_team_id: FCB_UNITED_ID,
        away_team_id: BLUE_ROVERS_ID,
        home_score: 3,
        away_score: 0,
        venue: 'Home Stadium',
        match_type: 'league_game'
      },
      // Red Team vs Blue Rovers (Emma plays for Red, Michael for Blue)
      {
        id: 'match03-33cc-44dd-55ee-66ff77gg88hh',
        match_date: new Date(nowDate.setDate(nowDate.getDate() - 20)).toISOString(),
        home_team_id: RED_TEAM_ID,
        away_team_id: BLUE_ROVERS_ID,
        home_score: 1,
        away_score: 2,
        venue: 'Red Stadium',
        match_type: 'league_game'
      },
      // John playing for Red Team against Blue Rovers
      {
        id: 'match04-44dd-55ee-66ff-77gg88hh99ii',
        match_date: new Date(nowDate.setDate(nowDate.getDate() - 15)).toISOString(),
        home_team_id: RED_TEAM_ID,
        away_team_id: BLUE_ROVERS_ID,
        home_score: 2,
        away_score: 2,
        venue: 'Red Stadium',
        match_type: 'league_game'
      },
      // Emma playing for FCB United against Blue Rovers
      {
        id: 'match05-55ee-66ff-77gg-88hh99ii00jj',
        match_date: new Date(nowDate.setDate(nowDate.getDate() - 10)).toISOString(),
        home_team_id: FCB_UNITED_ID,
        away_team_id: BLUE_ROVERS_ID,
        home_score: 3,
        away_score: 1,
        venue: 'Home Stadium',
        match_type: 'league_game'
      },
      // Michael playing for FCB United against Red Team
      {
        id: 'match06-66ff-77gg-88hh-99ii00jj11kk',
        match_date: new Date(nowDate.setDate(nowDate.getDate() - 5)).toISOString(),
        home_team_id: FCB_UNITED_ID,
        away_team_id: RED_TEAM_ID,
        home_score: 1,
        away_score: 0,
        venue: 'Home Stadium',
        match_type: 'league_game'
      },
      // External match with John and Emma on same team
      {
        id: 'match07-77gg-88hh-99ii-00jj11kk22ll',
        match_date: new Date(nowDate.setDate(nowDate.getDate() - 2)).toISOString(),
        home_team_id: FCB_UNITED_ID,
        away_team_id: null,
        home_score: 4,
        away_score: 2,
        venue: 'External Venue',
        match_type: 'external_game'
      }
    ];

    // Insert matches
    const { error: matchesError } = await supabase
      .from('matches')
      .upsert(matches, { onConflict: 'id' });

    if (matchesError) {
      console.error('Error inserting matches:', matchesError);
      return;
    }

    console.log('Matches created successfully');

    // 3. Create player stats and team assignments for each match
    const playerStats = [
      // Match 1: FCB United vs Red Team
      { id: 'stat-01', match_id: matches[0].id, player_id: players[0].id, goals: 2, assists: 0, minutes_played: 90 },  // John: 2 goals
      { id: 'stat-02', match_id: matches[0].id, player_id: players[1].id, goals: 1, assists: 0, minutes_played: 90 },  // Emma: 1 goal
      
      // Match 2: FCB United vs Blue Rovers
      { id: 'stat-03', match_id: matches[1].id, player_id: players[0].id, goals: 2, assists: 1, minutes_played: 90 },  // John: 2 goals, 1 assist
      { id: 'stat-04', match_id: matches[1].id, player_id: players[2].id, goals: 0, assists: 0, minutes_played: 90 },  // Michael: defensive work
      
      // Match 3: Red Team vs Blue Rovers
      { id: 'stat-05', match_id: matches[2].id, player_id: players[1].id, goals: 1, assists: 0, minutes_played: 90 },  // Emma: 1 goal
      { id: 'stat-06', match_id: matches[2].id, player_id: players[2].id, goals: 1, assists: 0, minutes_played: 90 },  // Michael: 1 goal
      
      // Match 4: Red Team vs Blue Rovers (John on Red)
      { id: 'stat-07', match_id: matches[3].id, player_id: players[0].id, goals: 1, assists: 1, minutes_played: 90 },  // John: 1 goal, 1 assist
      { id: 'stat-08', match_id: matches[3].id, player_id: players[2].id, goals: 1, assists: 0, minutes_played: 90 },  // Michael: 1 goal
      
      // Match 5: FCB United vs Blue Rovers (Emma on FCB)
      { id: 'stat-09', match_id: matches[4].id, player_id: players[1].id, goals: 1, assists: 2, minutes_played: 90 },  // Emma: 1 goal, 2 assists
      { id: 'stat-10', match_id: matches[4].id, player_id: players[2].id, goals: 0, assists: 1, minutes_played: 90 },  // Michael: 1 assist
      
      // Match 6: FCB United vs Red Team (Michael on FCB)
      { id: 'stat-11', match_id: matches[5].id, player_id: players[2].id, goals: 0, assists: 1, minutes_played: 90 },  // Michael: 1 assist
      { id: 'stat-12', match_id: matches[5].id, player_id: players[1].id, goals: 0, assists: 0, minutes_played: 90 },  // Emma: no contribution
      
      // Match 7: External match (John and Emma on FCB)
      { id: 'stat-13', match_id: matches[6].id, player_id: players[0].id, goals: 2, assists: 1, minutes_played: 90 },  // John: 2 goals, 1 assist
      { id: 'stat-14', match_id: matches[6].id, player_id: players[1].id, goals: 1, assists: 2, minutes_played: 90 },  // Emma: 1 goal, 2 assists
    ];

    // Insert player stats
    const { error: statsError } = await supabase
      .from('player_stats')
      .upsert(playerStats, { onConflict: 'id' });

    if (statsError) {
      console.error('Error inserting player stats:', statsError);
      return;
    }

    console.log('Player stats created successfully');

    // 4. Create player match assignments (associate players with teams for each match)
    const playerAssignments = [
      // Match 1
      { player_id: players[0].id, match_id: matches[0].id, team_id: FCB_UNITED_ID },  // John on FCB
      { player_id: players[1].id, match_id: matches[0].id, team_id: RED_TEAM_ID },    // Emma on Red
      
      // Match 2
      { player_id: players[0].id, match_id: matches[1].id, team_id: FCB_UNITED_ID },  // John on FCB
      { player_id: players[2].id, match_id: matches[1].id, team_id: BLUE_ROVERS_ID }, // Michael on Blue
      
      // Match 3
      { player_id: players[1].id, match_id: matches[2].id, team_id: RED_TEAM_ID },    // Emma on Red
      { player_id: players[2].id, match_id: matches[2].id, team_id: BLUE_ROVERS_ID }, // Michael on Blue
      
      // Match 4
      { player_id: players[0].id, match_id: matches[3].id, team_id: RED_TEAM_ID },    // John on Red (different team)
      { player_id: players[2].id, match_id: matches[3].id, team_id: BLUE_ROVERS_ID }, // Michael on Blue
      
      // Match 5
      { player_id: players[1].id, match_id: matches[4].id, team_id: FCB_UNITED_ID },  // Emma on FCB (different team)
      { player_id: players[2].id, match_id: matches[4].id, team_id: BLUE_ROVERS_ID }, // Michael on Blue
      
      // Match 6
      { player_id: players[2].id, match_id: matches[5].id, team_id: FCB_UNITED_ID },  // Michael on FCB (different team)
      { player_id: players[1].id, match_id: matches[5].id, team_id: RED_TEAM_ID },    // Emma on Red
      
      // Match 7 (External)
      { player_id: players[0].id, match_id: matches[6].id, team_id: FCB_UNITED_ID },  // John on FCB
      { player_id: players[1].id, match_id: matches[6].id, team_id: FCB_UNITED_ID },  // Emma on FCB (with John)
    ];

    // Insert player assignments
    const { error: assignmentsError } = await supabase
      .from('player_match_assignments')
      .upsert(playerAssignments, { 
        onConflict: ['player_id', 'match_id'] 
      });

    if (assignmentsError) {
      console.error('Error inserting player assignments:', assignmentsError);
      return;
    }

    console.log('Player team assignments created successfully');
    console.log('All data seeded successfully!');
    console.log(`
      Created:
      - ${players.length} players
      - ${matches.length} matches
      - ${playerStats.length} player stats entries
      - ${playerAssignments.length} team assignments
    `);

  } catch (error) {
    console.error('Error in seed script:', error);
  }
}

// Run the seed function
seedPlayersAndMatches(); 