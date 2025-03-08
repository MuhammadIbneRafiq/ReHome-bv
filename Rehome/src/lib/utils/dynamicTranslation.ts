import i18next from 'i18next';

/**
 * Dynamically translates content based on a key pattern and data object
 * 
 * @param keyPattern The pattern for translation keys (e.g., "furniture.{{id}}")
 * @param data The data object containing values to replace in the pattern
 * @param fallback Fallback text if translation is not found
 * @returns The translated text
 */
export const dynamicTranslate = (
  keyPattern: string, 
  data: Record<string, any>, 
  fallback?: string
): string => {
  // Replace placeholders in the key pattern with values from the data object
  const translationKey = keyPattern.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] || key;
  });

  // Check if the translation exists
  if (i18next.exists(translationKey)) {
    return i18next.t(translationKey);
  }

  // If no translation exists and a fallback is provided, use it
  if (fallback !== undefined) {
    return fallback;
  }

  // Otherwise, return the original value from the data
  // This is useful for dynamic content that might not have translations
  return data.originalText || translationKey;
};

/**
 * Translates a furniture item's name and description
 * 
 * @param item The furniture item object
 * @returns Object with translated name and description
 */
export const translateFurnitureItem = (item: { 
  id: number | string; 
  name: string; 
  description: string;
}): { name: string; description: string } => {
  // Try to find translations for this specific item by ID or slug
  const itemKey = `furniture.${item.id}`;
  const nameKey = `${itemKey}_name`;
  const descKey = `${itemKey}_desc`;

  // Check if we have specific translations for this item
  const hasSpecificTranslation = i18next.exists(nameKey);

  if (hasSpecificTranslation) {
    return {
      name: i18next.t(nameKey),
      description: i18next.t(descKey)
    };
  }

  // If no specific translation, try to match by name pattern
  // Convert the name to a slug-like format for lookup
  const nameSlug = item.name.toLowerCase().replace(/\s+/g, '_');
  
  return {
    name: dynamicTranslate(`furniture.${nameSlug}`, { originalText: item.name }, item.name),
    description: dynamicTranslate(`furniture.${nameSlug}_desc`, { originalText: item.description }, item.description)
  };
}; 