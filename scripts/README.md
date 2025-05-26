# Football Stats App - Data Seeding Scripts

This directory contains scripts for seeding the Supabase database with sample data to visualize player impacts across multiple teams.

## Scripts Overview

- **seed-all.js**: Master script that runs all seeding operations in sequence
- **seed-teams.js**: Creates three demo teams with specific IDs and colors
- **seed-players-with-teams.js**: Creates players, matches, and their relationships

## What These Scripts Create

### Teams
- **FCB United** (Blue): Home team for many matches
- **Red Team** (Red): Second main team where players switch to
- **Blue Rovers** (Dark Blue): Third team to demonstrate player impact

### Players
- **John Doe** (Forward): Initially on FCB United, also plays for Red Team
- **Emma Smith** (Midfielder): Initially on Red Team, also plays for FCB United
- **Michael Johnson** (Defender): Initially on Blue Rovers, also plays for FCB United

### Matches & Player Relationships
- 7 matches between the teams
- Players switching teams across different matches
- Goals and assists recorded for each player
- Team assignments tracking which player played for which team in each match

## How to Run

The simplest way to seed your database is to run:

```bash
npm run seed
```

This will:
1. Create the three teams
2. Create the three players
3. Create matches with player stats
4. Create player-team assignments

## Requirements

- Supabase project with the proper schema already set up
- Environment variables in `.env.local` file:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY` (not the anon key)

## Purpose

These scripts help demonstrate the multi-team impact visualization features of the app, showing how players perform on different teams. After running the scripts, you can:

1. View John Doe's profile to see his impact on both FCB United and Red Team
2. See Emma Smith's goal contributions for both teams
3. Explore player combinations to see which players work well together

The data is specifically crafted to show statistical significance in some cases and limited data in others, to demonstrate the app's visual indicators. 