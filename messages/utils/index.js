/**
 * Utility functions for handling internationalization messages
 */

export async function getMessages(locale) {
  try {
    // Import messages for the specified locale dynamically
    const messages = (await import(`../${locale}.json`)).default;
    return messages;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // Fallback to English if the requested locale is not available
    if (locale !== 'en') {
      return getMessages('en');
    }
    // Return empty object if even English messages can't be loaded
    return {};
  }
} 