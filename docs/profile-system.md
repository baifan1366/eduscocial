# Profile System Documentation

## Overview
The profile system allows users to create and manage their card self-introduction using existing fields from the users table and related tables.

## Architecture

### Database Schema
- **Primary Table**: `users` (existing fields)
- **Related Table**: `user_interests` (for interests data)
- **Active Fields**:
  - `display_name`: User's display name
  - `bio`: User's biography/about section
  - `birth_year`: User's birth year (integer)
  - `school`: School/organization (maps to university in frontend)
  - `department`: User's department
  - `avatar_url`: Profile picture URL
  - `country`: User's country
- **Related Data**:
  - `user_interests`: Links to hashtags and topics for interests

### API Endpoints
- **GET** `/api/users/profile` - Fetch user profile data
- **PUT** `/api/users/profile` - Update user profile data

### Validation
- **Schema**: `lib/validations/profile.js`
- **Library**: Zod for runtime validation
- **Required Fields**: interests, study_abroad, leisure_activities

### Context Management
- **Context**: `ProfileContext` in `contexts/profile-context.js`
- **Provider**: `ProfileProvider` wraps components that need profile data
- **Hook**: `useProfile()` for accessing profile state and actions

### Components

#### ProfileForm (`components/profile/profile-form.jsx`)
- Main profile editing interface
- Uses ProfileContext for state management
- Handles loading states and error handling
- Responsive design with dark/light theme support

#### ProfileField (`components/profile/profile-field.jsx`)
- Reusable field component for profile editing
- Supports different input types (text, textarea, select, date)
- Inline editing with save/cancel functionality
- Validation and error handling

#### ProfileSkeleton (`components/profile/profile-skeleton.jsx`)
- Loading skeleton for profile page
- Matches the layout of the actual profile form
- Smooth loading experience

## Features

### Field Types
1. **Text Input**: Basic text fields (university, favorite_country)
2. **Textarea**: Multi-line text (interests, favorite_quotes, study_abroad, leisure_activities)
3. **Select Dropdown**: Predefined options (relationship_status, daily_active_time)
4. **Date Input**: Birthday selection

### Validation Rules
- **Required Fields**: Must be filled before saving
- **Character Limits**: Enforced on text fields
- **Enum Validation**: Select fields validate against predefined options

### User Experience
- **Inline Editing**: Click edit button to modify individual fields
- **Auto-save**: Fields save automatically when edited
- **Bulk Save**: Save all changes with main save button
- **Toast Notifications**: Success/error feedback
- **Loading States**: Skeleton loading and button states
- **Responsive Design**: Works on mobile and desktop

## Usage

### Setup
1. Add ProfileProvider to your app providers
2. Import and use ProfileForm component in profile pages
3. Ensure database table is created using the SQL schema

### Example Implementation
```jsx
import { ProfileProvider } from '@/contexts/profile-context';
import { ProfileForm } from '@/components/profile/profile-form';

export default function ProfilePage() {
  return (
    <ProfileProvider>
      <ProfileForm />
    </ProfileProvider>
  );
}
```

### Using Profile Data in Other Components
```jsx
import { useProfile } from '@/contexts/profile-context';

function MyComponent() {
  const { profile, loading, updateProfile } = useProfile();
  
  if (loading) return <div>Loading...</div>;
  
  return <div>{profile.interests}</div>;
}
```

## Security
- Authentication required for all profile operations
- User can only access/modify their own profile
- Input validation on both client and server
- SQL injection protection through parameterized queries

## Performance
- Context-based state management reduces unnecessary re-renders
- Optimistic updates for better user experience
- Efficient database queries with proper indexing
- Skeleton loading for perceived performance

## Error Handling
- Network error handling with retry options
- Validation error display
- Toast notifications for user feedback
- Graceful degradation when data is unavailable

## Internationalization
- All text content uses next-intl for translations
- Profile field labels and messages are translatable
- Supports multiple languages through message files

## Testing
- Zod schema validation ensures data integrity
- API endpoints handle edge cases
- Component error boundaries prevent crashes
- Loading states tested for all scenarios