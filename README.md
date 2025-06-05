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

## Security Fixes

The application includes several scripts in the `sql/fixes/` directory to address PostgreSQL security vulnerabilities:

1. **Function Security**: Fixed database functions to use `SECURITY INVOKER` instead of `SECURITY DEFINER` to ensure functions run with the permissions of the calling user, not the function creator.

2. **Search Path Protection**: Added explicit `SET search_path = public` to all functions to prevent search path manipulation attacks.

3. **Table Name Qualification**: Updated all table references to use fully qualified names (`public.table_name`) to prevent confusion attacks.

4. **Combined Fixes**: A combined script `all_security_fixes_combined.sql` is available for applying all fixes at once.

5. **Search Path Fix**: If the search path issues persist after applying the main fixes, use the additional `fix_search_path_correctly.sql` script which uses ALTER FUNCTION statements to explicitly set the search path.

6. **Comprehensive Fix**: For persistent security issues, the `fix_all_functions_security.sql` script uses ALTER FUNCTION statements to set both SECURITY INVOKER and search_path for all functions in a single operation.

To apply the security fixes:
```bash
# Using the scripts (requires DB connection)
npm run apply-security-fixes    # Apply all fixes
npm run fix-search-path         # Apply search path fix if needed
npm run fix-all-functions       # Apply comprehensive fix if other fixes don't work
npm run check-function-security # Check current security status

# Or apply them in Supabase SQL Editor using the scripts:
# 1. First try: sql/fixes/all_security_fixes_combined.sql
# 2. If issues persist: sql/fixes/fix_search_path_correctly.sql
# 3. If still having issues: sql/fixes/fix_all_functions_security.sql
```

If you encounter errors about "position" being a reserved keyword, make sure that all instances of `position text` in function definitions are changed to `"position" text` using double quotes.

These fixes address critical security issues related to function execution context and search path manipulation.

## Deployment

This project is configured for easy deployment on Vercel. Make sure to set up the following environment variables in your Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

After setting these variables, your deployment should work correctly.

## License

This project is licensed under the MIT License.
