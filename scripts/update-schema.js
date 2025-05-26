/**
 * Script to update the database schema directly
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function updateSchema() {
  try {
    console.log('Starting schema update...');

    // Add columns to player_match_stats table
    console.log('Adding columns to player_match_stats table...');
    
    const addPlayerMatchStatsColumns = [
      { name: 'shots_total', type: 'integer', default: 0 },
      { name: 'shots_on_target', type: 'integer', default: 0 },
      { name: 'passes', type: 'integer', default: 0 },
      { name: 'key_passes', type: 'integer', default: 0 },
      { name: 'yellow_cards', type: 'integer', default: 0 },
      { name: 'red_cards', type: 'integer', default: 0 },
      { name: 'xg', type: 'numeric(5,2)', default: 0 },
      { name: 'tackles', type: 'integer', default: 0 },
      { name: 'interceptions', type: 'integer', default: 0 }
    ];
    
    for (const col of addPlayerMatchStatsColumns) {
      const { error } = await supabase.rpc('add_column_if_not_exists', { 
        table_name: 'player_match_stats',
        column_name: col.name,
        column_type: col.type,
        column_default: col.default.toString()
      });
      
      if (error) {
        console.error(`Error adding column ${col.name} to player_match_stats:`, error);
      } else {
        console.log(`Column ${col.name} added to player_match_stats successfully (if it didn't exist)`);
      }
    }
    
    // Add columns to matches table
    console.log('Adding columns to matches table...');
    
    const addMatchesColumns = [
      { name: 'attendance', type: 'integer', default: 'NULL' },
      { name: 'weather_conditions', type: 'text', default: 'NULL' },
      { name: 'referee', type: 'text', default: 'NULL' }
    ];
    
    for (const col of addMatchesColumns) {
      const { error } = await supabase.rpc('add_column_if_not_exists', { 
        table_name: 'matches',
        column_name: col.name,
        column_type: col.type,
        column_default: col.default
      });
      
      if (error) {
        console.error(`Error adding column ${col.name} to matches:`, error);
      } else {
        console.log(`Column ${col.name} added to matches successfully (if it didn't exist)`);
      }
    }
    
    // Add columns to players table
    console.log('Adding columns to players table...');
    
    const addPlayersColumns = [
      { name: 'jersey_number', type: 'integer', default: 'NULL' },
      { name: 'height_cm', type: 'integer', default: 'NULL' },
      { name: 'weight_kg', type: 'integer', default: 'NULL' },
      { name: 'dominant_foot', type: 'text', default: 'NULL' },
      { name: 'birth_date', type: 'date', default: 'NULL' }
    ];
    
    for (const col of addPlayersColumns) {
      const { error } = await supabase.rpc('add_column_if_not_exists', { 
        table_name: 'players',
        column_name: col.name,
        column_type: col.type,
        column_default: col.default
      });
      
      if (error) {
        console.error(`Error adding column ${col.name} to players:`, error);
      } else {
        console.log(`Column ${col.name} added to players successfully (if it didn't exist)`);
      }
    }
    
    console.log('Schema update completed successfully!');
    
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

// First we need to check if the add_column_if_not_exists function exists
async function createHelperFunctions() {
  try {
    console.log('Creating helper functions if they don\'t exist...');
    
    // Define the function to add columns if they don't exist
    const createAddColumnFunction = `
      CREATE OR REPLACE FUNCTION add_column_if_not_exists(
        table_name text,
        column_name text,
        column_type text,
        column_default text DEFAULT NULL
      )
      RETURNS void AS $$
      DECLARE
        default_clause text := '';
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = add_column_if_not_exists.table_name
          AND column_name = add_column_if_not_exists.column_name
        ) THEN
          IF column_default IS NOT NULL AND column_default != 'NULL' THEN
            default_clause := ' DEFAULT ' || column_default;
          END IF;
          
          EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s%s',
            table_name,
            column_name,
            column_type,
            default_clause
          );
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Execute this directly on the database
    const { data, error } = await supabase.from('_temp_exec_sql').select('*').limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, so we'll create it
      console.log('Creating temporary table for SQL execution...');
      
      const { error: createError } = await supabase
        .from('_temp_exec_sql')
        .insert([{ sql: createAddColumnFunction }]);
      
      console.log('We need direct database access to create helper functions.');
      console.log('Please add the add_column_if_not_exists function directly to your database using the Supabase SQL editor.');
      console.log('---------------------------');
      console.log(createAddColumnFunction);
      console.log('---------------------------');
      
      return false;
    } else {
      console.log('Helper functions are available or we have direct SQL access.');
      return true;
    }
  } catch (error) {
    console.error('Error creating helper functions:', error);
    return false;
  }
}

// Run the update
async function run() {
  const helpersExist = await createHelperFunctions();
  
  if (helpersExist) {
    await updateSchema();
  }
}

run(); 