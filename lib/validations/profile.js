import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().max(100, 'Display name must be less than 100 characters').optional().nullable(),
  email: z.string().email('Must be a valid email').optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().nullable(),
  birthday: z.string().optional().nullable(), // birth_year as string
  relationshipStatus: z.enum(['single', 'in_relationship', 'married', 'complicated', 'prefer_not_to_say']).optional().nullable(),
  interests: z.string().max(500, 'Interests must be less than 500 characters').optional().nullable(), // From user_interests table (read-only)
  university: z.string().optional().nullable(), // Maps to school field
  department: z.string().optional().nullable(),
  favoriteQuotes: z.string().max(1000, 'Favorite quotes must be less than 1000 characters').optional().nullable(),
  favoriteCountry: z.string().max(100, 'Favorite country must be less than 100 characters').optional().nullable(),
  dailyActiveTime: z.enum(['morning', 'afternoon', 'evening', 'night', 'varies']).optional().nullable(),
  studyAbroad: z.enum(['yes', 'no', 'planning']).optional().nullable(),
  leisureActivities: z.string().max(500, 'Leisure activities must be less than 500 characters').optional().nullable(),
  avatarUrl: z.string().url('Must be a valid URL').optional().nullable(),
  country: z.string().optional().nullable(),
});

export const profileUpdateSchema = profileSchema.partial();