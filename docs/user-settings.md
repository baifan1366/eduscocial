# User Settings System

This document describes the user settings system in EduSocial, which allows users to customize their experience and store their preferences.

## Database Schema

User settings are stored in the `user_preferences` table in the database:

```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB,
    language TEXT DEFAULT 'zh-TW',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);
```

The `settings` column uses JSONB to store a flexible schema of user preferences.

## Default Settings

When a user doesn't have any saved settings, the system provides these defaults:

```javascript
{
  general: {
    notifications: {
      email: true,
      push: true,
      mentions: true,
      comments: true,
      likes: true
    },
    visibility: {
      profile: 'public',
      activity: 'friends',
      email: 'private'
    }
  },
  preferences: {
    theme: 'system', // system, light, dark
    language: 'en',
    fontSize: 'medium', // small, medium, large
    reducedMotion: false,
    highContrast: false
  },
  security: {
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30 // days
  }
}
```

## API Endpoints

### GET /api/users/settings

Retrieves the user's settings. If no settings exist, returns the default settings.

**Response:**
```json
{
  "settings": {
    "general": { ... },
    "preferences": { ... },
    "security": { ... }
  }
}
```

### POST /api/users/settings

Updates the user's settings.

**Request Body:**
```json
{
  "settings": {
    "general": { ... },
    "preferences": { ... },
    "security": { ... }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings saved successfully"
}
```

## Frontend Implementation

### Settings Provider

The `SettingsProvider` component provides settings context to the entire application:

```jsx
<SettingsProvider>
  <App />
</SettingsProvider>
```

### useSettings Hook

The `useSettings` hook allows components to access and update settings:

```jsx
const { settings, loading, updateSetting, updateSettings } = useSettings();

// Update a specific setting
await updateSetting('preferences.theme', 'dark');

// Update multiple settings at once
await updateSettings({
  preferences: {
    ...settings.preferences,
    theme: 'dark',
    fontSize: 'large'
  }
});
```

### Settings Components

The settings are organized into three main components:

1. `GeneralSettings` - Notifications and privacy settings
2. `PreferencesSettings` - Theme, language, and accessibility settings
3. `SecuritySettings` - Security and account protection settings

These components are used in the `SettingsPanel` component, which provides a tabbed interface for users to manage their settings.

## Real-time Application

Some settings are applied immediately when changed:

1. **Theme** - Changes between light, dark, or system theme
2. **Font Size** - Updates the font size throughout the application
3. **Reduced Motion** - Reduces animations for accessibility
4. **High Contrast** - Increases contrast for better readability

## Persistence

Settings are persisted to the database and retrieved when the user logs in, ensuring a consistent experience across sessions and devices. w