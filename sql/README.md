# SQL Directory

This directory contains SQL files for the Football Stats App database.

## Directory Structure

- `debug/`: SQL queries for debugging and troubleshooting
- `functions/`: SQL function definitions
- `fixes/`: SQL fixes for database issues
- `maintenance/`: Database maintenance scripts
- `optimizations/`: Performance optimization scripts
- `player_stats/`: Player statistics queries
- `queries/`: Common SQL queries
- `samples/`: Sample data and queries
- `setup/`: Database setup and initialization scripts
- `team_stats/`: Team statistics queries
- `views/`: SQL view definitions
- `workarounds/`: Client-side workarounds

## Key Files

- `direct_function_fix.sql`: The main fix for player impact functions, correcting table references and column ambiguities
- `fix_team_performance_data.sql`: Fix for team performance data issues

## Development Notes

1. When making changes to the database schema or functions, create a new SQL file in the appropriate directory
2. Always test SQL changes locally before applying to production
3. Document any changes that affect the API or data structure 