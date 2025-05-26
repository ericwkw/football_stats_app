/**
 * Simplified seed script for Soccer Stats App
 * 
 * This script creates:
 * 1. Three teams
 * 2. Three players
 * 3. Seven matches with minimal stats
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Initialize Supabase client from environment
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Team IDs (consistent IDs for all operations)
const FCB_UNITED_ID = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';
const RED_TEAM_ID = '2f6e7d1c-b5e4-4a3f-9f2d-1e8c7a4b3d5e';
const BLUE_ROVERS_ID = '3e4f5g6h-7i8j-9k0l-1m2n-3o4p5q6r7s8t';

async function seedTeams() {
  try {
    console.log('Starting to seed teams...');

    // Define the teams with specific IDs
    const teams = [
      {
        id: FCB_UNITED_ID,
        name: 'FCB United',
        primary_shirt_color: '#1e40af', // Blue
        founded_year: 2015,
        description: 'A strong team with an emphasis on teamwork and technical skill.',
      },
      {
        id: RED_TEAM_ID,
        name: 'Red Team',
        primary_shirt_color: '#b91c1c', // Red
        founded_year: 2016,
        description: 'Known for their aggressive playing style and attacking formations.',
      },
      {
        id: BLUE_ROVERS_ID,
        name: 'Blue Rovers',
        primary_shirt_color: '#172554', // Dark Blue
        founded_year: 2014,
        description: 'A defensive powerhouse with excellent counter-attacking capabilities.',
      }
    ];

    // Insert teams with upsert to handle existing teams
    const { error } = await supabase
      .from('teams')
      .upsert(teams, { onConflict: 'id' });

    if (error) {
      console.error('Error inserting teams:', error);
      return false;
    }

    console.log('Teams created successfully!');
    console.log(`Created ${teams.length} teams:`);
    teams.forEach(team => console.log(`- ${team.name} (${team.color})`));
    return true;

  } catch (error) {
    console.error('Error in team seed function:', error);
    return false;
  }
}

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
      return false;
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
        home_score: 3,
        away_score: 1,
        venue: 'Home Stadium',
        match_type: 'internal_friendly'
      },
      // FCB United vs Blue Rovers (John plays for FCB, Michael for Blue)
      {
        id: 'match02-22bb-33cc-44dd-55ee66ff77gg',
        match_date: new Date(nowDate.setDate(nowDate.getDate() - 25)).toISOString(),
        home_team_id: FCB_UNITED_ID,
        away_team_id: BLUE_ROVERS_ID,
        home_score: 4,
        away_score: 0,
        venue: 'Home Stadium',
        match_type: 'internal_friendly'
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
        match_type: 'internal_friendly'
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
        match_type: 'internal_friendly'
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
        match_type: 'internal_friendly'
      },
      // Michael playing for FCB United against Red Team
      {
        id: 'match06-66ff-77gg-88hh-99ii00jj11kk',
        match_date: new Date(nowDate.setDate(nowDate.getDate() - 5)).toISOString(),
        home_team_id: FCB_UNITED_ID,
        away_team_id: RED_TEAM_ID,
        home_score: 2,
        away_score: 0,
        venue: 'Home Stadium',
        match_type: 'internal_friendly'
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
      return false;
    }

    console.log('Matches created successfully');

    // 3. Create player stats and team assignments for each match
    const playerStats = [
      // Match 1: FCB United vs Red Team
      { id: 'stat-01', match_id: matches[0].id, player_id: players[0].id, goals: 2, assists: 1, minutes_played: 90 },  // John: 2 goals, 1 assist
      { id: 'stat-02', match_id: matches[0].id, player_id: players[1].id, goals: 1, assists: 0, minutes_played: 90 },  // Emma: 1 goal
      
      // Match 2: FCB United vs Blue Rovers
      { id: 'stat-03', match_id: matches[1].id, player_id: players[0].id, goals: 3, assists: 1, minutes_played: 90 },  // John: 3 goals, 1 assist
      { id: 'stat-04', match_id: matches[1].id, player_id: players[2].id, goals: 0, assists: 0, minutes_played: 90 },  // Michael: defensive work
      
      // Match 3: Red Team vs Blue Rovers
      { id: 'stat-05', match_id: matches[2].id, player_id: players[1].id, goals: 1, assists: 0, minutes_played: 90 },  // Emma: 1 goal
      { id: 'stat-06', match_id: matches[2].id, player_id: players[2].id, goals: 1, assists: 1, minutes_played: 90 },  // Michael: 1 goal, 1 assist
      
      // Match 4: Red Team vs Blue Rovers (John on Red)
      { id: 'stat-07', match_id: matches[3].id, player_id: players[0].id, goals: 1, assists: 0, minutes_played: 90 },  // John: 1 goal - less effective on Red Team
      { id: 'stat-08', match_id: matches[3].id, player_id: players[2].id, goals: 1, assists: 1, minutes_played: 90 },  // Michael: 1 goal, 1 assist
      
      // Match 5: FCB United vs Blue Rovers (Emma on FCB)
      { id: 'stat-09', match_id: matches[4].id, player_id: players[1].id, goals: 1, assists: 2, minutes_played: 90 },  // Emma: 1 goal, 2 assists - better on FCB
      { id: 'stat-10', match_id: matches[4].id, player_id: players[2].id, goals: 0, assists: 1, minutes_played: 90 },  // Michael: 1 assist
      
      // Match 6: FCB United vs Red Team (Michael on FCB)
      { id: 'stat-11', match_id: matches[5].id, player_id: players[2].id, goals: 0, assists: 2, minutes_played: 90 },  // Michael: 2 assists on FCB
      { id: 'stat-12', match_id: matches[5].id, player_id: players[1].id, goals: 0, assists: 0, minutes_played: 85 },  // Emma: struggled back on Red Team
      
      // Match 7: External match (John and Emma on FCB)
      { id: 'stat-13', match_id: matches[6].id, player_id: players[0].id, goals: 2, assists: 2, minutes_played: 90 },  // John: 2 goals, 2 assists - strong combination
      { id: 'stat-14', match_id: matches[6].id, player_id: players[1].id, goals: 2, assists: 1, minutes_played: 90 },  // Emma: 2 goals, 1 assist - strong with John
    ];

    // Insert player stats
    const { error: statsError } = await supabase
      .from('player_match_stats')
      .upsert(playerStats, { onConflict: 'id' });

    if (statsError) {
      console.error('Error inserting player stats:', statsError);
      return false;
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
      return false;
    }

    console.log('Player team assignments created successfully');
    return true;

  } catch (error) {
    console.error('Error in players seed function:', error);
    return false;
  }
}

// Main seeding function
async function runSeed() {
  console.log('Starting simplified database seeding process...');

  try {
    // 1. First seed the teams
    const teamsSuccess = await seedTeams();
    if (!teamsSuccess) {
      throw new Error('Failed to seed teams data');
    }
    console.log('Teams seeding completed successfully.');
    
    // 2. Then seed players, matches, and their relationships
    const playersSuccess = await seedPlayersAndMatches();
    if (!playersSuccess) {
      throw new Error('Failed to seed players and matches data');
    }
    console.log('Players and matches seeding completed successfully.');
    
    console.log('All seeding operations completed successfully!');
    console.log(`
    ✅ Database now contains:
    - 3 teams (FCB United, Red Team, Blue Rovers)
    - 3 players (John Doe, Emma Smith, Michael Johnson)
    - 7 matches with their respective player assignments
    - Player statistics across different teams
    
    You can now view the multi-team impact charts and player combinations.
    `);
    
  } catch (error) {
    console.error('Error during seeding process:', error);
    process.exit(1);
  }
}

// Run the seed function
runSeed(); 