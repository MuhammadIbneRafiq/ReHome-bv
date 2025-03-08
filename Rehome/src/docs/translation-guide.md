# Guide to Applying Translations to All Pages

This guide will help you apply translations to all pages in your Rehome application.

## Prerequisites

Make sure you have the following set up:

1. The i18n configuration in `src/i18n.ts`
2. The language context and hook in `src/hooks/useLanguage.tsx`
3. Translation files in `public/locales/en/translation.json` and `public/locales/nl/translation.json`
4. The dynamic translation utility in `src/lib/utils/dynamicTranslation.ts`

## Step-by-Step Process for Each Page

### 1. Import the Required Hooks

Add these imports to the top of your component file:

```tsx
import { useTranslation } from 'react-i18next';
```

### 2. Initialize the Translation Hook

Inside your component function, add:

```tsx
const { t } = useTranslation();
```

### 3. Replace Static Text with Translation Keys

Replace all static text with translation function calls:

```tsx
// Before
<h1>Welcome to Rehome</h1>

// After
<h1>{t('homepage.welcome')}</h1>
```

### 4. Add Translation Keys to Translation Files

Add the corresponding keys to your translation files:

```json
// public/locales/en/translation.json
{
  "homepage": {
    "welcome": "Welcome to Rehome"
  }
}

// public/locales/nl/translation.json
{
  "homepage": {
    "welcome": "Welkom bij Rehome"
  }
}
```

### 5. Handle Dynamic Content

For dynamic content, use the dynamic translation utility:

```tsx
import { dynamicTranslate } from '../utils/dynamicTranslation';

// For a simple dynamic value
const translatedTitle = dynamicTranslate('page.title_{{id}}', { id: pageId }, defaultTitle);

// For complex objects like furniture items
const translatedItems = items.map(item => {
  const translated = translateFurnitureItem(item);
  return {
    ...item,
    name: translated.name,
    description: translated.description
  };
});
```

## Using the Translation Script

We've created a helper script to assist with extracting text from components and generating translation keys. Here's how to use it:

1. Open the component file you want to translate
2. Copy the component code
3. Use the `processComponent` function from `src/scripts/translatePage.ts`:

```tsx
import { processComponent } from '../scripts/translatePage';

// In a temporary file or console
const result = processComponent(myComponentCode, 'ComponentName');
console.log(result);
```

4. The script will output suggested translation keys that you can add to your translation files

## Recommended Order for Translating Pages

1. Start with the most frequently used pages:
   - LandingPage
   - MarketplacePage
   - LoginPage
   - SignupPage

2. Then move to service-specific pages:
   - ItemMovingPage
   - HouseMovingPage
   - SpecialRequestPage

3. Finally, translate utility pages:
   - SellerDashboard
   - AboutUsPage
   - ContactUsPage
   - WhyChooseUsPage

## Best Practices

1. **Organize Translation Keys**: Use a hierarchical structure for your translation keys (e.g., `page.section.element`)

2. **Reuse Common Phrases**: For phrases used across multiple components, use common keys (e.g., `common.submit`)

3. **Handle Pluralization**: For content that changes based on count, use i18next's pluralization features:

```tsx
t('items', { count: 5 }) // "5 items"
t('items', { count: 1 }) // "1 item"
```

In your translation file:
```json
{
  "items": "{{count}} {{count, plural, one{item} other{items}}}"
}
```

4. **Test Both Languages**: Always test your application in both English and Dutch to ensure all content is properly translated

5. **Keep Translation Files in Sync**: Make sure to add new keys to both language files at the same time

## Handling Special Cases

### Forms and Validation Messages

For form validation messages, you can use translations in your Zod schema:

```tsx
const formSchema = z.object({
  email: z.string().min(1, () => t('validation.email_required')).email(() => t('validation.invalid_email')),
  // ...
});
```

### Dynamic Content from APIs

For content fetched from APIs, you can use the dynamic translation utilities:

```tsx
const { data } = useQuery(['products'], fetchProducts);

const translatedProducts = data?.map(product => ({
  ...product,
  name: dynamicTranslate(`products.${product.id}.name`, { originalText: product.name }, product.name),
  description: dynamicTranslate(`products.${product.id}.description`, { originalText: product.description }, product.description)
}));
```

## Conclusion

By following this guide, you can systematically apply translations to all pages in your application. Remember that translation is an ongoing process - as you add new features and content, make sure to add the corresponding translation keys to maintain a fully multilingual experience. 