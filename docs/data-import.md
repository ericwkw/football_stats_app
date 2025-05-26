# Historical Data Import Guide

This guide provides instructions for importing historical football stats data into the application using the CSV import tools.

## Overview

The Football Stats App provides two ways to import historical data:

1. **Web Interface**: A user-friendly admin interface for uploading and importing CSV files
2. **Command Line Tool**: A script for more advanced users or for automating imports

Both methods support importing:
- Teams
- Players
- Matches
- Player match statistics

## Using the Web Interface

1. Navigate to `/admin/import` in your browser
2. Select the data type you want to import
3. Download a template for the selected data type by clicking "Download Template"
4. Fill in the template with your data and save it as a CSV file
5. Upload the CSV file using the file selector
6. Choose import options:
   - **Dry Run Mode**: Validate the data without making changes (recommended for testing)
   - **Skip Duplicates**: Ignore records that would cause conflicts
7. Click "Run Validation" (dry run) or "Import Data" (live import)
8. Review the results

## Using the Command Line Tool

The command line tool is useful for importing large datasets or automating the import process.

### Prerequisites

- Node.js installed
- Access to the application's database credentials

### Basic Usage

```bash
# Run in dry-run mode first to validate data
npx ts-node src/scripts/import-historical-data.ts --file ./data/teams.csv --type teams --dry-run

# Import the data if validation passes
npx ts-node src/scripts/import-historical-data.ts --file ./data/teams.csv --type teams
```

### Available Options

```
--file, -f <path>       Path to the CSV file to import
--type, -t <dataType>   Type of data to import: matches, players, teams, player_stats
--dry-run              Run in dry-run mode (no changes will be made)
--no-skip-duplicates   Don't skip duplicate records
--help, -h             Show this help message
```

## Data Format

### Teams CSV Format

Fields:
- `name` (required): Team name
- `team_type`: "internal" or "external" (default: "internal")
- `primary_shirt_color`: Color code (default: "#000000")
- `secondary_shirt_color`: Color code or null
- `logo_url`: URL to team logo or null
- `external_id`: Unique ID for the team (used for updates)
- `is_active`: "true" or "false" (default: "true")

### Players CSV Format

Fields:
- `name` (required): Player name
- `position`: Player position (forward, midfielder, defender, goalkeeper)
- `team_id`: ID of the player's team
- `date_of_birth`: Date in YYYY-MM-DD format
- `height_cm`: Height in centimeters
- `preferred_foot`: "left", "right", or "both"
- `jersey_number`: Player's jersey number
- `external_id`: Unique ID for the player (used for updates)
- `is_active`: "true" or "false" (default: "true")

### Matches CSV Format

Fields:
- `match_date` (required): Date in YYYY-MM-DD format
- `home_team_id` (required): ID of the home team
- `away_team_id` (required): ID of the away team
- `home_score`: Goals scored by home team
- `away_score`: Goals scored by away team
- `venue`: Location of the match
- `match_type`: "league", "cup", "friendly", etc.
- `notes`: Additional information
- `external_id`: Unique ID for the match (used for updates)

### Player Match Stats CSV Format

Fields:
- `player_id` (required): ID of the player
- `match_id` (required): ID of the match
- `team_id` (required): ID of the player's team
- `goals`: Number of goals scored
- `assists`: Number of assists
- `minutes_played`: Minutes played in the match
- `yellow_cards`: Number of yellow cards
- `red_cards`: Number of red cards
- `clean_sheet`: "true" or "false" (for goalkeepers)
- `external_id`: Unique ID for the stats entry (used for updates)

## Import Order

For the best results, import data in the following order:

1. Teams
2. Players
3. Matches
4. Player Match Statistics

This ensures that all necessary relationships between records are established.

## Tips for Successful Imports

- Always validate your data using the "Dry Run" option before importing
- Use unique and consistent external IDs to make future updates easier
- Make sure dates are in the correct format (YYYY-MM-DD)
- For large datasets, consider splitting the import into multiple files
- Back up your database before importing large amounts of data

## Troubleshooting

Common issues:

- **Missing required fields**: Make sure all required fields are present in your CSV
- **Invalid format**: Ensure your CSV is properly formatted with headers
- **Duplicate records**: Use the "Skip Duplicates" option or provide unique external IDs
- **Foreign key constraints**: Import teams before players, and matches before player stats

If you encounter persistent issues, check the error messages displayed in the interface or command line for specific guidance.