# Football Stats App

A Next.js application for tracking and analyzing football statistics.

## Features

- **Teams Management**: Track teams by shirt colors for internal matches, combine as "FCB United" for external matches
- **Player Management**: Add and manage players with positions
- **Match Recording**: Record match details, scores, and individual player statistics
- **Statistics**: View player and team statistics, with goals/assists against external teams weighted 3x
- **Player Impact Analysis**: Analyze how players affect team performance
- **Authentication**: Admin-only access for data management

## Technology Stack

- Next.js 15.3.2 with TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Node.js v23.9.0+

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/ericwkw/football_stats_app.git
   cd football_stats_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   ```bash
   # Copy the example.env file and fill in your details
   cp example.env .env.local
   # Then edit the .env.local file with your actual credentials
   ```

   Required variables in your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_KEY=your_supabase_service_key_here
   DATABASE_URL=postgres://username:password@host:port/database
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

- `src/`: Application source code (components, pages, utilities)
- `sql/`: Database-related SQL files
- `docs/`: Documentation and setup guides
- `scripts/`: Utility scripts for development

## Database Setup

For a complete database setup, use the provided scripts:
```bash
# This uses the secure database connection script
npm run create-exec-sql
npm run update-schema
npm run add-mock-data
```

Or follow the detailed guide in `docs/setup/INSTALLATION_GUIDE.md`.

## Security Notes

- **NEVER** commit your `.env.local` file to the repository
- Rotate your Supabase keys regularly
- Check `SECURITY_CHECKLIST.md` for more security tips
- We use secure Node.js scripts for database operations instead of exposing credentials in commands

## Deployment

This project is configured for easy deployment on Vercel. Make sure to set up the following environment variables in your Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

After setting these variables, your deployment should work correctly.

## License

This project is licensed under the MIT License.
