# Internationalization (i18n) Guide for Rehome

This guide explains how to use the internationalization (i18n) system in the Rehome application.

## Overview

The Rehome application uses the following libraries for internationalization:

- **i18next**: Core internationalization framework
- **react-i18next**: React bindings for i18next
- **i18next-browser-languagedetector**: Detects the user's preferred language
- **i18next-http-backend**: Loads translation files from the server

## Translation Files

Translation files are stored in the `public/locales` directory, organized by language code:

```
public/
  locales/
    en/
      translation.json
    nl/
      translation.json
    // Add more languages as needed
```

Each `translation.json` file contains key-value pairs for translations.

## Using Translations in Components

### Basic Usage

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('homepage.welcome')}</h1>
      <p>{t('homepage.subtitle')}</p>
    </div>
  );
}
```

### With Variables

```tsx
import { useTranslation } from 'react-i18next';

function Greeting({ name }) {
  const { t } = useTranslation();
  
  return <p>{t('greeting', { name })}</p>;
}
```

In your translation file:
```json
{
  "greeting": "Hello, {{name}}!"
}
```

### Using the Higher-Order Component

```tsx
import { withTranslation } from '../hooks/withTranslation';

interface MyComponentProps {
  name: string;
  t: (key: string, options?: any) => string;
}

function MyComponent({ name, t }: MyComponentProps) {
  return (
    <div>
      <h1>{t('homepage.welcome')}</h1>
      <p>{t('greeting', { name })}</p>
    </div>
  );
}

export default withTranslation(MyComponent);
```

## Changing Languages

Use the `useLanguage` hook to change languages:

```tsx
import { useLanguage } from '../hooks/useLanguage';

function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, languageOptions } = useLanguage();
  
  return (
    <select 
      value={currentLanguage} 
      onChange={(e) => changeLanguage(e.target.value)}
    >
      {languageOptions.map(option => (
        <option key={option.code} value={option.code}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
```

## Adding a New Language

1. Create a new directory in `public/locales` with the language code (e.g., `fr` for French)
2. Copy an existing `translation.json` file and translate the values
3. Add the language to the `defaultLanguageOptions` array in `src/hooks/useLanguage.tsx`

```tsx
const defaultLanguageOptions = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
  { code: "fr", label: "Français" }, // New language
];
```

## Best Practices

1. Use nested keys to organize translations (e.g., `navbar.login` instead of `navbarLogin`)
2. Keep translation keys consistent across languages
3. Use variables for dynamic content
4. Add new translations as you develop new features
5. Consider using a translation management system for larger projects

## Utility Functions

The `src/lib/utils/translation.ts` file provides utility functions for working with translations:

- `translate(key, options)`: Translates a key
- `changeLanguage(language)`: Changes the current language
- `getCurrentLanguage()`: Gets the current language
- `hasTranslation(key)`: Checks if a key exists in the current language 