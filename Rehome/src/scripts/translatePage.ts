/**
 * This script helps extract text from a React component and generate translation keys.
 * It's meant to be used as a reference, not executed directly.
 * 
 * Usage example:
 * 1. Copy the component code
 * 2. Run the script with the component code as input
 * 3. Use the generated translation keys in your translation files
 * 4. Update the component to use the translation keys
 */

/**
 * Extracts text from JSX elements
 * @param code The component code
 * @returns An array of extracted text
 */
function extractTextFromJSX(code: string): string[] {
  // This is a simplified version, a real implementation would use a parser
  const textMatches = code.match(/>([^<>]+)</g) || [];
  const texts = textMatches.map(match => match.slice(1, -1).trim()).filter(Boolean);
  
  // Also extract text from attributes like placeholder, title, etc.
  const attrMatches = code.match(/(?:placeholder|title|alt|aria-label)="([^"]+)"/g) || [];
  const attrTexts = attrMatches.map(match => {
    const [_, text] = match.match(/="([^"]+)"/) || [];
    return text;
  }).filter(Boolean);
  
  return [...new Set([...texts, ...attrTexts])];
}

/**
 * Generates translation keys from extracted text
 * @param texts Array of extracted text
 * @param prefix Prefix for the translation keys
 * @returns An object with translation keys and values
 */
function generateTranslationKeys(texts: string[], prefix: string): Record<string, string> {
  const translations: Record<string, string> = {};
  
  texts.forEach((text, index) => {
    // Convert text to a valid key
    const key = text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    // Add prefix and index to ensure uniqueness
    const fullKey = `${prefix}.${key || `text_${index}`}`;
    
    translations[fullKey] = text;
  });
  
  return translations;
}

/**
 * Generates translation JSON for both languages
 * @param translations Translation keys and values
 * @returns JSON strings for English and Dutch translations
 */
function generateTranslationJSON(translations: Record<string, string>): { en: string, nl: string } {
  const en = JSON.stringify(translations, null, 2);
  
  // This is a placeholder. In a real implementation, you would use a translation API
  // or manually translate the values
  const nl = JSON.stringify(
    Object.fromEntries(
      Object.entries(translations).map(([key, value]) => [key, `[NL] ${value}`])
    ), 
    null, 
    2
  );
  
  return { en, nl };
}

/**
 * Main function to process a component
 * @param componentCode The component code
 * @param componentName The name of the component
 * @returns Generated translation keys and instructions
 */
function processComponent(componentCode: string, componentName: string): string {
  const texts = extractTextFromJSX(componentCode);
  const prefix = componentName.toLowerCase();
  const translations = generateTranslationKeys(texts, prefix);
  const { en, nl } = generateTranslationJSON(translations);
  
  return `
// Extracted translation keys for ${componentName}:

// Add these to your English translation file (en/translation.json):
${en}

// Add these to your Dutch translation file (nl/translation.json):
// (Note: These are placeholder translations, you should translate them properly)
${nl}

// Update your component to use these translation keys:
import { useTranslation } from 'react-i18next';

const ${componentName} = () => {
  const { t } = useTranslation();
  
  // Replace text with t() calls, for example:
  // Before: <h1>Hello World</h1>
  // After: <h1>{t('${prefix}.hello_world')}</h1>
  
  // ...rest of your component
};
`;
}

// Example usage:
// const result = processComponent(myComponentCode, 'LoginPage');
// console.log(result);

export { extractTextFromJSX, generateTranslationKeys, generateTranslationJSON, processComponent }; 