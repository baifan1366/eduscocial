# OAuth Provider Setup for EduSocial

This document explains how to set up Google and GitHub OAuth providers for EduSocial.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-long-random-secret-here

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add your application name
7. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000` (for development)
   - Your production URL
8. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-production-domain.com/api/auth/callback/google`
9. Click "Create" and note down your Client ID and Client Secret
10. Add these values to your `.env.local` file

## GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - Application name: EduSocial
   - Homepage URL: `http://localhost:3000` (development) or your production URL
   - Authorization callback URL: 
     - `http://localhost:3000/api/auth/callback/github` (for development)
     - `https://your-production-domain.com/api/auth/callback/github`
4. Click "Register application"
5. Generate a new client secret
6. Add the Client ID and Client Secret to your `.env.local` file

## Implementation Notes

1. Educational Email Verification:
   - The system checks if the email is from an educational domain
   - Users with non-educational emails will be rejected
   - This is handled in the `isEducationalEmail` function in `lib/auth.js`

2. Session Management:
   - OAuth tokens are stored in Redis for better security
   - User sessions are also maintained in Redis
   - User provider connections are stored in the `user_providers` database table

3. OAuth Provider Data:
   - Profile data is mapped to our internal user structure
   - We store basic information like name, email, and avatar URL

## Testing

To test the OAuth implementation:

1. Ensure you've set up your `.env.local` file with correct provider credentials
2. Start the development server: `npm run dev`
3. Navigate to `/login` and click on the Google or GitHub buttons
4. You should be redirected to the provider's login page
5. After successful authentication, you'll be redirected back to the application 