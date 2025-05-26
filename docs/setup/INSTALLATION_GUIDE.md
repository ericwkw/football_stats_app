# Football Stats App Installation Guide

This document provides comprehensive instructions for setting up and deploying the Football Stats application.

## Prerequisites

1. A Supabase account and project
2. Access to the Supabase SQL editor
3. Node.js 18+ and npm/yarn

## Environment Setup

1. Clone the repository
2. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_KEY=your_supabase_service_key_here
   ```
   
   ⚠️ **SECURITY WARNING**:
   - Never commit `.env.local` to version control
   - Ensure `.env*` is in your `.gitignore` file
   - Rotate your Supabase keys regularly
   - Use the service key only for secure server-side operations

3. Install dependencies:
   ```
   yarn install # or npm install
   ```

## Database Setup

### 1. Basic Schema Setup

Run the SQL script from `sql/setup/complete_database_setup.sql` in the Supabase SQL editor. This will:

- Create all required tables (teams, players, matches, player_match_stats, player_match_assignments)
- Set up appropriate indexes
- Create basic Row Level Security policies
- Install required extensions

### 2. Player Match Assignments Setup (Optional)

If you want to track which team each player was assigned to for each match, run the `sql/setup/player_match_assignments_setup.sql` script.

### 3. Player Impact Analysis Setup

For advanced player impact analysis features, run the `sql/setup/player_team_analysis_setup.sql` script.

## Security Setup

### 1. Row Level Security (RLS)

Ensure Row Level Security is enabled for all tables to prevent unauthorized access:

```sql
-- Basic RLS setup for all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_assignments ENABLE ROW LEVEL SECURITY;

-- Create a policy for authenticated users only
CREATE POLICY "Allow full access to authenticated users" ON teams 
    FOR ALL 
    TO authenticated 
    USING (true);

-- Repeat for other tables...
```

### 2. Authentication Setup

Configure authentication in the Supabase dashboard:
1. Navigate to Authentication → Settings
2. Enable the Email provider (or other providers as needed)
3. Configure the Site URL to match your deployment URL
4. For local development, add `http://localhost:3000` to the Additional Redirect URLs

## Function Deployment

### Installing SQL Functions

You have two options to install the SQL functions:

#### Option 1: Using the Consolidated Functions (Recommended)

Run the `sql/functions/consolidated_functions.sql` script in the Supabase SQL editor. This contains all functions needed by the application.

#### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase functions deploy --project-ref <YOUR_PROJECT_ID> --file sql/functions/consolidated_functions.sql
```

### Verifying Function Installation

After deploying the functions, you can verify they're working properly by running these test queries:

```sql
-- Test basic statistics functions
SELECT * FROM get_top_scorers(5);
SELECT * FROM get_team_statistics();

-- Test player impact functions
SELECT * FROM get_player_win_impact(5);
SELECT * FROM get_player_combinations(3, 5);
```

## Troubleshooting

### Function Deployment Errors

If you encounter errors like:
```
ERROR: 42P13: cannot change return type of existing function
DETAIL: Row type defined by OUT parameters is different.
```

This means the functions already exist with different return types. You have two options:

1. Use the consolidated_functions.sql file which includes DROP statements already
2. Manually drop the functions first:

```sql
DROP FUNCTION IF EXISTS get_player_win_impact(integer);
DROP FUNCTION IF EXISTS get_player_combinations(integer, integer);
DROP FUNCTION IF EXISTS get_team_performance_with_player(text, text);
-- etc.
```

### Database Errors

If you need to reset your database, you can drop all tables and start over:

```sql
DROP TABLE IF EXISTS player_match_assignments CASCADE;
DROP TABLE IF EXISTS player_match_stats CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
```

## Running the Application

After database setup is complete, you can run the application:

```bash
# Development mode
yarn dev # or npm run dev

# Production build
yarn build # or npm run build
yarn start # or npm start
```

The application will be available at http://localhost:3000

## Additional Resources

For more detailed information, see:
- `docs/SUPABASE_SETUP.md` - Detailed Supabase configuration
- `docs/FUNCTION_FIX_GUIDE.md` - Troubleshooting function issues
- `docs/TEAM_PERFORMANCE_FIX_GUIDE.md` - Team performance calculation details 