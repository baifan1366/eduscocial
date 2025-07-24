# Internationalization (i18n) Guide for EduSocial

This document outlines how to use and maintain the internationalization (i18n) system for the EduSocial platform.

## Overview

EduSocial uses `next-intl` for internationalization, allowing content to be displayed in multiple languages based on the user's locale preference. The project currently supports:

- English (en)
- Chinese (zh)

## How to Use Translations

### 1. In Client Components

```jsx
'use client';

import { useTranslations } from 'next-intl';

export default function ClientComponent() {
  const t = useTranslations('NamespaceKey');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### 2. In Server Components

```jsx
import { getTranslations } from 'next-intl/server';

export default async function ServerComponent() {
  const t = await getTranslations('NamespaceKey');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

## Example: NewPost Component

The `NewPostClient.jsx` component demonstrates proper usage of the i18n system:

```jsx
'use client';

import { useTranslations } from 'next-intl';

export default function NewPostClient() {
  const t = useTranslations('NewPost');
  
  // Usage in text content
  return <h1>{t('title')}</h1>;
  
  // Usage in attributes
  return <input placeholder={t('enterTitle')} />;
  
  // Usage with dynamic content
  return <p>{t('welcomeBack', { name: user.name })}</p>;
}
```

## Translation Files

Translation files are stored in the `messages/` directory with filenames corresponding to locale codes:

- `messages/en.json`: English translations
- `messages/zh.json`: Chinese translations

## Adding New Translations

To add translations for a new component or feature:

1. Create a new section in each language file with a meaningful namespace
2. Add all necessary translation keys and values
3. Use the namespace with the `useTranslations` hook in your component

Example addition to both language files:

```json
// In messages/en.json
{
  "FeatureName": {
    "title": "Feature Title",
    "description": "Feature description in English"
  }
}

// In messages/zh.json
{
  "FeatureName": {
    "title": "功能标题",
    "description": "中文功能描述"
  }
}
```

## Best Practices

1. **Use namespaces** to organize translations by feature or component
2. **Keep keys consistent** across all language files
3. **Use semantic key names** that describe the content purpose (e.g., `welcomeMessage` instead of `text1`)
4. **Format dates, numbers and currencies** using the locale-aware formatters provided by next-intl
5. **Extract all hardcoded strings** into translation files - never leave user-facing text untranslated

## Handling Pluralization and Formatting

For pluralization:

```jsx
// In translation file
{
  "items": {
    "one": "You have {count} item",
    "other": "You have {count} items"
  }
}

// In component
t('items', { count: itemsCount })
```

For dates:

```jsx
// Get locale-aware date formatter
const format = useFormatter();

// Format date based on user's locale
format.dateTime(date, { dateStyle: 'full' })
```

## Adding New Locales

To add support for a new language:

1. Create a new file in `messages/` named after the locale code (e.g., `fr.json` for French)
2. Copy the structure from an existing language file
3. Translate all values to the new language
4. Update the locale detection and routing configuration in the app as needed 