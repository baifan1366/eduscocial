import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().max(100, 'Display name must be less than 100 characters').optional().nullable(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().nullable(),
  birthday: z.string().optional().nullable(), // birth_year as string
  interests: z.string().max(500, 'Interests must be less than 500 characters').optional().nullable(), // From user_interests table (read-only)
  university: z.string().optional().nullable(), // Maps to school field
  department: z.string().optional().nullable(),
  avatarUrl: z.string().url('Must be a valid URL').optional().nullable(),
  country: z.string().optional().nullable(),
});

export const profileUpdateSchema = profileSchema.partial();