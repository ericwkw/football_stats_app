/**
 * Seed script to create three teams for player assignments
 * 
 * This script creates:
 * 1. FCB United (blue)
 * 2. Red Team (red)
 * 3. Blue Rovers (dark blue)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client from environment
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedTeams() {
  try {
    console.log('Starting to seed teams...');

    // Define the teams with specific IDs to match the player script
    const teams = [
      {
        id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        name: 'FCB United',
        color: '#1e40af', // Blue
        founded_year: 2015,
        description: 'A strong team with an emphasis on teamwork and technical skill.',
      },
      {
        id: '2f6e7d1c-b5e4-4a3f-9f2d-1e8c7a4b3d5e',
        name: 'Red Team',
        color: '#b91c1c', // Red
        founded_year: 2016,
        description: 'Known for their aggressive playing style and attacking formations.',
      },
      {
        id: '3e4f5g6h-7i8j-9k0l-1m2n-3o4p5q6r7s8t',
        name: 'Blue Rovers',
        color: '#172554', // Dark Blue
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
      return;
    }

    console.log('Teams created successfully!');
    console.log(`Created ${teams.length} teams:`);
    teams.forEach(team => console.log(`- ${team.name} (${team.color})`));

  } catch (error) {
    console.error('Error in team seed script:', error);
  }
}

// Run the seed function
seedTeams(); 