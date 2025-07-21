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
  phoneNumber: z.string().optional().nullable(),  
  name: z.string().optional().nullable(),
  role: z.enum(['admin', 'business', 'user']).optional().nullable(),
  companyName: z.string().optional().nullable(),
  companyDescription: z.string().optional().nullable(),
  companyLocation: z.string().optional().nullable(),
  companyCountry: z.string().optional().nullable(),
  companyCity: z.string().optional().nullable(),
  companyAddress: z.string().optional().nullable(),
  companyZipCode: z.string().optional().nullable(),
  companyPhoneNumber: z.string().optional().nullable(),
  companyEmail: z.string().email('Must be a valid email').optional().nullable(),
  companyFacebook: z.string().optional().nullable(),
  companyInstagram: z.string().optional().nullable(),
  companyTwitter: z.string().optional().nullable(),
  companyLinkedin: z.string().optional().nullable(),
  companyYoutube: z.string().optional().nullable(),
  companyWebsite: z.string().url('Must be a valid URL').optional().nullable(),
  companyLogoUrl: z.string().url('Must be a valid URL').optional().nullable(),
});

export const profileUpdateSchema = profileSchema.partial();