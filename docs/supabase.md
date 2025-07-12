# Supabase Integration

This document outlines how Supabase is integrated into the EduSocial platform.

## Overview

Supabase is used as the primary database provider for the application. It provides:
- PostgreSQL database
- Authentication services
- Real-time subscriptions
- Storage for files and images
- Row-level security for data access control

## Configuration

The Supabase client is configured in `lib/supabase.js` with separate clients for browser and server environments.

### Environment Variables

Required environment variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

The database schema mirrors the previous Prisma schema with tables for:
- users
- posts
- comments
- tags
- likes
- bookmarks
- notifications
- reports

## Authentication

Authentication is handled through:
1. NextAuth.js for session management
2. Supabase for user data storage and verification

## Security

Row-level security policies are implemented to ensure users can only:
- Read their own private data
- Read public data from other users
- Modify their own data
- Admin users have elevated permissions

## Usage Examples

### Fetching Data

```javascript
// Simple query
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single();

// Join query
const { data, error } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    content,
    users (id, username)
  `)
  .eq('is_published', true);
```

### Inserting Data

```javascript
const { data, error } = await supabase
  .from('posts')
  .insert({
    title: 'New Post',
    content: 'Post content',
    user_id: userId
  })
  .select()
  .single();
```

### Updating Data

```javascript
const { error } = await supabase
  .from('users')
  .update({ last_login_at: new Date() })
  .eq('id', userId);
```

## Migration from Prisma

The migration from Prisma to Supabase involved:
1. Creating equivalent tables in Supabase
2. Updating authentication logic
3. Converting Prisma queries to Supabase queries
4. Setting up appropriate row-level security policies 