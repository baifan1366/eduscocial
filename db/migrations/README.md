# Database Migrations

This directory contains SQL migration scripts for the database schema.

## How to run migrations

### Using psql (PostgreSQL CLI)

```bash
# Connect to your database
psql -U <username> -d <database_name>

# Run a migration file
\i path/to/migration/file.sql
```

### Using Supabase CLI

If you're using Supabase:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Run a migration (replace with your project reference)
supabase db push --db-url <your-database-url> -f db/migrations/add_status_to_posts.sql
```

## Available Migrations

1. `add_status_to_posts.sql` - Adds a 'status' column to the posts table with values 'pending', 'published', or 'rejected'. 