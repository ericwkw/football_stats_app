# Player Impact Analysis Implementation

## Overview

This implementation adds powerful player impact analysis features to the Soccer Stats App. These features enable coaches and players to understand:

1. How individual players affect team win rates
2. Which player combinations work well together
3. How specific players impact their team's overall performance

## SQL Functions Implemented

Three key SQL functions have been implemented:

### 1. `get_player_win_impact`

Analyzes how players affect team win rates by comparing individual player win percentages to the league average. Players with a positive win rate delta have a positive impact on their teams.

```sql
SELECT * FROM get_player_win_impact(10); -- get top 10 players by impact
```

### 2. `get_player_combinations`

Identifies effective player pairings by analyzing win rates when specific players play together. It also calculates how they perform when playing against each other.

```sql
SELECT * FROM get_player_combinations(3, 10); -- min 3 matches together, top 10 pairs
```

### 3. `get_team_performance_with_player`

Compares team performance statistics with and without a specific player to quantify that player's impact on a particular team.

```sql
SELECT * FROM get_team_performance_with_player('player_uuid', 'team_uuid');
```

## UI Components

The app includes three chart components to visualize this data:

1. **PlayerWinImpactChart** - Horizontal bar chart showing players' win rate delta
2. **PlayerCombinationsChart** - Bar chart showing win rates for player combinations
3. **PlayerTeamImpactChart** - Comparison chart showing team performance with/without a specific player

## How to Deploy

1. Install the SQL functions by running the SQL scripts in Supabase:
   - Use the `player_impact_functions.sql` file to install just these functions
   - Or use `all_sql_functions.sql` to install all app functions

2. For detailed deployment instructions, see `DEPLOY_FUNCTIONS.md`

## Usage

1. **Analytics Dashboard** - View overall player impact and combinations
   - Navigate to `/analytics` to see player win impact analysis and combinations analysis
   - Use sliders to adjust minimum matches and display limits

2. **Player Detail Pages** - View player-specific impact
   - Navigate to `/players/[playerId]` to see a specific player's impact
   - Team performance comparison shows how the team does with vs. without this player

## Files Created/Modified

- `player_impact_functions.sql` - SQL functions for player impact analysis
- `install_player_impact_functions.sql` - Script to install and test the functions
- `all_sql_functions.sql` - Comprehensive SQL file with all app functions
- `DEPLOY_FUNCTIONS.md` - Deployment guide for Supabase

## Next Steps

1. Ensure you have deployed the SQL functions to your Supabase database
2. Start the app with `npm run dev` and navigate to the analytics page
3. Test with real player and match data to see the impact analysis in action 