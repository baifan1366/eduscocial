# NextAuth.js Configuration

This document describes the authentication configuration using NextAuth.js for the EduSocial application.

## Overview

EduSocial uses NextAuth.js for authentication and session management. The configuration supports both credential-based (username/password) authentication and OAuth providers (currently Google).

## Configuration Files

### Main Configuration

The NextAuth.js configuration is defined in `app/api/auth/[...nextauth]/route.js`:

```js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
// ... other imports

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({ /* ... */ }),
    GoogleProvider({ /* ... */ }),
  ],
  // ... other configuration options
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Authentication Provider Component

The application is wrapped with the NextAuth SessionProvider in `components/auth/AuthProvider.jsx`:

```jsx
import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### Authentication Hook

A custom hook for accessing authentication functionality is provided in `hooks/useAuth.js`:

```js
import { useSession, signIn, signOut } from 'next-auth/react';
import { isAdmin, isModerator } from '@/lib/auth';

export function useAuth() {
  const { data: session, status } = useSession();
  // ... authentication utilities
  
  return {
    user,
    session,
    // ... other auth-related values and functions
  };
}
```

### Authentication Middleware

Route protection is implemented in `middleware.js`:

```js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
// ... other imports

export async function middleware(request) {
  // ... authentication and authorization checks
}
```

## Environment Variables

The NextAuth.js configuration requires the following environment variables:

```
# NextAuth
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (for PrismaAdapter)
DATABASE_URL=your-database-url
```

## Usage Examples

### Client-Side Authentication

```jsx
'use client';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user, loading, isAdmin, logout } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      {isAdmin && <div>Admin Panel</div>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Server-Side Authentication

```jsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      user: session.user,
    },
  };
}
```

## Route Protection

The middleware automatically protects routes defined in the `protectedRoutes` array:

- `/dashboard/*`
- `/profile/*`
- `/settings/*`

Admin-only routes are defined in the `adminRoutes` array:

- `/admin/*`

## Educational Email Restriction

The application restricts registration to educational email addresses only. This is enforced in:

1. The `isEducationalEmail` function in `lib/auth.js`
2. The OAuth provider configurations
3. The registration API endpoint 