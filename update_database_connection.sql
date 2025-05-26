-- Database Connection Update Instructions
-- This file provides guidance on safely updating database references

/*
IMPORTANT: Do NOT run this as a SQL script. These are instructions to manually update your environment.

1. If you want to keep using the existing database (recommended approach):
   - Edit your package.json file to revert the database name back to 'soccer_stats' in the scripts section
   - This is the safest approach to avoid data migration
   - Example:
     "add-mock-data": "psql -f sql/debug/mock_team_impact_data.sql postgres://username:password@localhost:5432/soccer_stats",
     "fix-team-impact": "psql -f sql/fixes/fix_team_impact_function.sql postgres://username:password@localhost:5432/soccer_stats"

2. If you want to rename the database (more complex):
   a. Create a new database named 'football_stats'
   b. Export data from 'soccer_stats'
   c. Import data to 'football_stats'
   d. Update all connection strings in your application
   e. Update your .env or .env.local file
   
   This approach requires database administration experience and carries risk of data loss.
*/

-- Sample command to create a new database (if you choose option 2):
-- CREATE DATABASE football_stats; 