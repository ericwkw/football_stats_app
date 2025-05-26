# Football Stats App - Utility Scripts

This directory contains utility scripts for managing the Football Stats App.

## Scripts Overview

- **run-sql.js**: Executes SQL files against the database
- **update-schema.js**: Updates the database schema
- **apply_function.js**: Applies SQL functions to the database
- **create_exec_sql.js**: Creates SQL execution functions

## Database Setup

Instead of using JavaScript seeding scripts (which have been deprecated), we recommend using SQL scripts directly from the `sql/setup/` directory:

```bash
# To set up the database schema
psql -f sql/setup/complete_database_setup.sql postgres://username:password@localhost:5432/football_stats

# To add sample data (if needed)
psql -f sql/debug/anonymized_mock_data.sql postgres://username:password@localhost:5432/football_stats
```

## Requirements

- Supabase project with the proper schema already set up
- Environment variables in `.env.local` file:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_KEY`

## Using the Utility Scripts

The scripts in this directory are used for development and maintenance tasks:

1. **Running SQL Files**:
   ```bash
   node scripts/run-sql.js path/to/sql/file.sql
   ```

2. **Updating Schema**:
   ```bash
   npm run update-schema
   ```

3. **Fixing Team Impact Functions**:
   ```bash
   npm run fix-team-impact
   ``` 