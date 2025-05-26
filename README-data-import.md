# Historical Data Import Implementation

## Overview

This implementation provides tools for importing historical football statistics data into the application without disrupting existing functionality. It includes:

1. A command-line script for importing data from CSV files
2. A web interface for uploading and importing data
3. CSV templates for each data type
4. Comprehensive documentation

## Components

### 1. Import Script

- **Location**: `src/scripts/import-historical-data.ts`
- **Usage**: `npm run import-data -- --file <file> --type <type> [options]`
- **Features**:
  - Support for importing teams, players, matches, and player stats
  - Validation of data before import
  - Batch processing for large datasets
  - Dry run mode for testing
  - Duplicate handling

### 2. Web Interface

- **Location**: 
  - Component: `src/components/Admin/DataImport/ImportForm.tsx`
  - Page: `src/app/admin/import/page.tsx`
  - API: `src/app/api/admin/import-data/route.ts`
- **Features**:
  - User-friendly interface for uploading and importing data
  - Template downloads
  - Validation before import
  - Detailed error reporting
  - Progress and result feedback

### 3. CSV Templates

- **Location**: 
  - Source: `src/data/templates/`
  - Public: `public/templates/`
- **Templates**:
  - `teams_template.csv` - Team data template
  - `players_template.csv` - Player data template
  - `matches_template.csv` - Match data template
  - `player_stats_template.csv` - Player match statistics template

### 4. Documentation

- **Location**: `docs/data-import.md`
- **Contents**:
  - Detailed instructions for using both import methods
  - Data format specifications
  - Tips for successful imports
  - Troubleshooting guide

## Technical Details

### Data Flow

1. CSV data is uploaded or provided via command line
2. Data is parsed and validated against schema requirements
3. Records are processed and transformed into the correct format
4. Data is imported in batches to avoid memory issues
5. Related records are handled with proper foreign key relationships
6. Results are reported back to the user

### Security Considerations

- File validation to prevent malicious uploads
- Secure API endpoints with proper authentication
- Input sanitization to prevent injection attacks
- Controlled template downloads through API routes

## Integration with Existing System

The data import system seamlessly integrates with the existing application by:

1. Using the same Supabase database client
2. Following existing data schema and relationships
3. Preserving referential integrity between entities
4. Adopting the application's UI/UX design patterns
5. Working alongside existing CRUD operations

## Usage

For detailed usage instructions, please refer to the [Data Import Guide](docs/data-import.md). 