# Football Stats - Import Templates

These CSV templates make it easy to import your football/soccer data into the application.

## Template Overview

1. **Teams Import (`teams_simple.csv`)**
   - Use this first to add your teams
   - Required fields: name, team_type, primary_shirt_color

2. **Players Import (`players_simple.csv`)**
   - Use this second to add your players
   - Required fields: name, position, team_name
   - Players are automatically assigned to their teams

3. **Matches Import (`matches_simple.csv`)**
   - Use this to add match fixtures and results
   - Required fields: match_date, home_team_name, away_team_name, venue, match_type
   - Scores can be left blank for future matches

4. **Player Match Stats (`player_stats_simple.csv`)**
   - Use this to record player statistics for each match
   - Required fields: player_name, match_date, opponent, team_name
   - Track goals, assists, own goals, and minutes played

5. **Player Match Assignments (`player_assignments_simple.csv`)**
   - Use this when players play for different teams than their regular team
   - Required fields: player_name, match_date, home_team, away_team, assigned_team

## Import Process

1. Download the template you need
2. Fill in the required data in a spreadsheet program
3. Save as CSV (comma-separated values)
4. Upload through the Admin interface

## Tips for Success

- Make sure names match exactly (e.g., "Light Blue" not "LightBlue" or "light blue")
- The system will try to find matches based on date and team names
- For players, positions must be one of: Forward, Midfielder, Defender, Goalkeeper
- For match types, use: internal_friendly or external_game

## Example Workflow

1. Import teams using `teams_simple.csv`
2. Import players using `players_simple.csv`
3. Import matches using `matches_simple.csv`
4. Import player statistics using `player_stats_simple.csv`
5. If needed, import special team assignments using `player_assignments_simple.csv` 