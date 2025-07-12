# Prisma Documentation

## Overview

This project uses Prisma ORM to interact with the PostgreSQL database hosted on Supabase. Prisma provides type-safe database access, auto-completion, and runtime validation.

## Setup

The Prisma schema has been generated from the existing database using introspection and is located at `prisma/schema.prisma`.

## Environmental Variables

Make sure you have the following environment variables in your `.env` file:

```
DATABASE_URL=postgresql://[username]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://[username]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

## Basic Usage

```javascript
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Example: Fetch users
async function getUsers() {
  const users = await prisma.users.findMany();
  return users;
}

// Example: Create a post
async function createPost(authorId, title, content, boardId) {
  const post = await prisma.posts.create({
    data: {
      author_id: authorId,
      title,
      content,
      board_id: boardId,
      created_at: new Date(),
      updated_at: new Date(),
    }
  });
  return post;
}

// Always disconnect when done
async function cleanup() {
  await prisma.$disconnect();
}
```

## Database Schema Notes

The database contains many tables with relationships. Some important ones:

- `users` - User accounts
- `posts` - User posts/content
- `comments` - Comments on posts
- `boards` - Communities/boards for posts
- `notifications` - User notifications

## Special Types

There are a few special PostgreSQL types that are not fully supported by Prisma:

1. `tsvector` fields used for search (in `boards`, `comments`, `posts`, `users`)
2. `vector` type in `post_embeddings`
3. Various check constraints on tables

These fields can still be accessed, but type safety might be limited.

## Schema Updates

If the database schema changes, you can update the Prisma schema by running:

```bash
npx prisma db pull
npx prisma generate
```

## Deployment

For production deployment, make sure to set the environment variables securely and not expose them in client-side code. 