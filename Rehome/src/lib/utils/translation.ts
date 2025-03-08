import i18next from 'i18next';

/**
 * Translates a key using i18next
 * @param key The translation key
 * @param options Optional parameters for the translation
 * @returns The translated string
 */
export const translate = (key: string, options?: Record<string, any>): string => {
  return i18next.t(key, options);
};

/**
 * Changes the current language
 * @param language The language code to change to
 * @returns A promise that resolves when the language has been changed
 */
export const changeLanguage = async (language: string): Promise<void> => {
  await i18next.changeLanguage(language);
};

/**
 * Gets the current language
 * @returns The current language code
 */
export const getCurrentLanguage = (): string => {
  return i18next.language;
};

/**
 * Checks if a key exists in the current language
 * @param key The translation key to check
 * @returns True if the key exists, false otherwise
 */
export const hasTranslation = (key: string): boolean => {
  return i18next.exists(key);
}; 