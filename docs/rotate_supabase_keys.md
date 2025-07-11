# Guide to Rotating Supabase API Keys

This guide explains the process for regular rotation of your Supabase API keys as a security best practice.

## Steps to Rotate Your Supabase API Keys

1. **Log in to Supabase Dashboard**:
   - Go to https://supabase.com and log in to your account
   - Select your project

2. **Rotate API Keys**:
   - Navigate to Project Settings → API
   - Click on "Rotate" next to the "anon public" key
   - Confirm the rotation
   - Copy the new anon key
   - For the service role key, click "Rotate" next to the "service_role" key
   - Confirm the rotation
   - Copy the new service role key

3. **Update Your .env.local File**:
   - Open your .env.local file
   - Replace the old NEXT_PUBLIC_SUPABASE_ANON_KEY with the new anon key
   - Replace the old SUPABASE_SERVICE_KEY with the new service role key
   - Save the file

4. **Update Any Deployed Applications**:
   - If you have deployed applications using these keys:
     - Update the environment variables in your hosting provider (Vercel, Netlify, etc.)
     - Redeploy your application

5. **Verify Application Functionality**:
   - Run your application locally to verify it works with the new keys
   - Test critical functionality, especially authentication and database operations

## Important Security Notes

- The old keys will continue to work for a short time after rotation to avoid disruption
- After verifying everything works, you can disable the old keys from the Supabase dashboard
- Never commit API keys or sensitive credentials to version control
- Consider using a secrets manager for production environments 