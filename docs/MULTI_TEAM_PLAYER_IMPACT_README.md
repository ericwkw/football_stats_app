# Multi-Team Player Impact Analysis

This feature extends the Soccer Stats App to analyze how players perform across different teams they've been assigned to in matches. The analysis provides valuable insights into player effectiveness in various team contexts.

## Overview

Players in this system can be assigned to different teams for different matches. This feature analyzes:

1. **Player impact across all teams** - How a player affects win rates and scoring across every team they've played with
2. **Optimal player combinations** - Which teammates work best with a specific player in each team
3. **Performance comparison** - How the same player's effectiveness varies between teams

## Database Functions

### 1. `get_player_all_teams_impact`

This function calculates a player's impact metrics across all teams they've played with:

- Team win rate with vs. without the player
- Goals scored with vs. without the player
- Statistical significance indicators
- Per-team performance metrics

### 2. `get_player_team_combinations`

This function identifies which player combinations work best together within a team:

- Win rate when players play together vs. apart
- Goal impact of player pairings
- Ranked list of most effective teammate combinations

## Frontend Components

### 1. Team Selector

A flexible component that allows filtering analysis by:
- All teams the player has played with
- Specific individual teams
- External vs. internal teams

### 2. Multi-Team Impact Chart

Visualizes how a player's impact varies across different teams with:
- Comparative win rate bars
- Impact score indicators
- Statistical significance warnings

### 3. Player Combinations Chart

Shows optimal teammate pairings with:
- Horizontal impact bars
- Detailed metrics table
- Statistical confidence indicators

## Implementation

### SQL Implementation

The SQL functions in `player_team_analysis_setup.sql` use Common Table Expressions (CTEs) and window functions to:
1. Find all teams a player has played with
2. Calculate performance metrics for each team
3. Compare team performance with and without the player
4. Identify statistically significant patterns

### React Components

The React components in `src/components/Charts/` provide:
1. Interactive filtering and visualization
2. Mobile-responsive design
3. Helpful tooltips explaining metrics
4. Statistical significance warnings

## How to Use

1. Navigate to a player's profile page
2. Click the "View Team Impact Analysis" button
3. View the player's impact across all teams
4. Select specific teams for deeper analysis
5. Examine player combinations for optimal team composition

## Technical Notes

- All SQL functions include proper error handling and parameter validation
- Database functions use prepared statements for security
- Components are fully typed with TypeScript interfaces
- Charts use responsive design for all device sizes

## Deployment

To deploy this feature:

1. Run the SQL setup script on your Supabase database:
   ```sql
   -- Run the setup script
   \i player_team_analysis_setup.sql
   ```

2. Ensure the frontend components are compiled and deployed with the application.

3. Test the feature by navigating to a player's profile page and clicking the "View Team Impact Analysis" button. 