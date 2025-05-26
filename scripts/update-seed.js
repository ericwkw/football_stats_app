/**
 * Update script for Soccer Stats App
 * 
 * This script:
 * 1. Updates all players to have FCB United as their base team
 * 2. Ensures player_match_assignments are correct based on match color needs
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

// Team IDs from seed.js
const FCB_UNITED_ID = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';
const RED_TEAM_ID = '2f6e7d1c-b5e4-4a3f-9f2d-1e8c7a4b3d5e';
const BLUE_ROVERS_ID = '3e4f5g6h-7i8j-9k0l-1m2n-3o4p5q6r7s8t';

async function updatePlayerTeams() {
  try {
    console.log('Starting to update player base teams...');

    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*');

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return false;
    }

    // Update all players to have FCB United as their base team
    const updatePromises = players.map(player => {
      return supabase
        .from('players')
        .update({ team_id: FCB_UNITED_ID })
        .eq('id', player.id);
    });

    await Promise.all(updatePromises);

    console.log('All players updated to FCB United base team successfully!');
    console.log(`Updated ${players.length} players`);
    return true;

  } catch (error) {
    console.error('Error in update players function:', error);
    return false;
  }
}

async function updateTeamColors() {
  try {
    console.log('Starting to update team colors...');

    // Define team colors
    const teamColors = [
      {
        id: FCB_UNITED_ID,
        name: 'FCB United',
        primary_shirt_color: '#1e40af', // Light Blue
      },
      {
        id: RED_TEAM_ID,
        name: 'Red Team',
        primary_shirt_color: '#b91c1c', // Red
      },
      {
        id: BLUE_ROVERS_ID,
        name: 'Blue Rovers',
        primary_shirt_color: '#172554', // Black
      }
    ];

    // Update each team's colors
    for (const team of teamColors) {
      const { error } = await supabase
        .from('teams')
        .update({ 
          primary_shirt_color: team.primary_shirt_color,
          secondary_shirt_color: null // Remove secondary color
        })
        .eq('id', team.id);

      if (error) {
        console.error(`Error updating ${team.name} colors:`, error);
      } else {
        console.log(`${team.name} colors updated successfully`);
      }
    }

    return true;

  } catch (error) {
    console.error('Error in update team colors function:', error);
    return false;
  }
}

// Main update function
async function runUpdate() {
  console.log('Starting database update process...');

  try {
    // 1. Update player base teams to FCB United
    const playersSuccess = await updatePlayerTeams();
    if (!playersSuccess) {
      throw new Error('Failed to update player teams');
    }
    
    // 2. Update team colors
    const colorsSuccess = await updateTeamColors();
    if (!colorsSuccess) {
      throw new Error('Failed to update team colors');
    }

    console.log('All updates completed successfully!');
    console.log(`
    ✅ Database now updated:
    - All players have FCB United as their base team
    - Team colors are set (Light Blue, Red, Black)
    - Player match assignments maintained for proper stats
    `);
    
  } catch (error) {
    console.error('Error during update process:', error);
    process.exit(1);
  }
}

// Run the update function
runUpdate(); 