# Football Stats App

A Next.js application for tracking and analyzing football statistics.

## Features

- **Teams Management**: Track teams by shirt colors for internal matches, combine as "FCB United" for external matches
- **Player Management**: Add and manage players with positions
- **Match Recording**: Record match details, scores, and individual player statistics
- **Per-Match Team Assignments**: Assign players to different teams (shirt colors) for each match
- **Statistics**: View and sort player and team statistics, with goals/assists against external teams weighted 3x
- **Player Impact Analysis**: Analyze how players affect team performance and identify effective player combinations
- **Authentication**: Admin-only access for data management

## Technology Stack

- **Frontend**: Next.js 15.3.2 with TypeScript
- **CSS Framework**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Project Structure

The project has been organized for better maintainability:

### Main Directories

- `src/`: Application source code
  - `app/`: Next.js application routes and components
  - `components/`: Reusable UI components
  - `lib/`: Utility functions and libraries
  - `types/`: TypeScript type definitions

- `sql/`: Database-related SQL files
  - `functions/`: SQL functions for database operations
  - `setup/`: Database setup and initialization scripts
  - `fixes/`: SQL fixes for database issues
  - `views/`: SQL view definitions
  - `queries/`: Common SQL queries
  - `optimizations/`: Performance optimization scripts
  - `workarounds/`: Client-side workarounds
  - `samples/`: Sample data and queries

- `scripts/`: Utility scripts for development and deployment
  - `sql/`: SQL scripts used by the JS utilities

- `docs/`: Documentation
  - `setup/`: Setup and installation guides
  - `deployment/`: Deployment instructions
  - `functions/`: Documentation for database functions

- `public/`: Static assets

### Security and Environment Setup

**IMPORTANT: Before running or deploying this application:**

1. Create a `.env.local` file based on `.env.example` with your own API keys
2. **NEVER commit your `.env.local` file to the repository**
3. Get your Supabase URL and API keys from your Supabase project dashboard
4. If you're using Supabase for the first time, follow the setup guide in `docs/setup/SUPABASE_SETUP.md`

```
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
```

### Getting Started

1. Follow the installation guide in `docs/setup/INSTALLATION_GUIDE.md`
2. Set up the database using scripts in `sql/setup/`
3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Application Features

- **Public Pages**: Home page, player stats, team stats, match results
- **Admin Pages**: Protected pages for data management
  - Manage Players: Add, edit, delete players
  - Manage Teams: Add, edit, delete teams
  - Manage Matches: Add, edit, delete matches and record player stats
  - Match Stats Page: Add player stats and assign players to teams for each match

## License

This project is licensed under the MIT License.

## Additional Resources

- Check the documentation in the `docs/` directory for detailed guides
- The `scripts/` directory contains utilities for database seeding and updates
