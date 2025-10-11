// Utility functions for URL generation and parsing

/**
 * Generates a SEO-friendly recipe slug
 * @param {string} title - Recipe title
 * @param {string} id - Recipe ID (UUID) or timestamp
 * @returns {string} - URL-friendly slug like "delicious-pasta-recipe--uuid" or "delicious-pasta-recipe-1696687200000"
 */
export const generateRecipeSlug = (title, id) => {
  if (!title || !id) return '';
  
  // Convert title to URL-friendly format
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  // Handle different ID formats
  let idValue;
  if (typeof id === 'string' && id.includes('-') && id.length === 36) {
    // UUID format - use double dash as separator to distinguish from title hyphens
    idValue = id;
    return `${titleSlug}--${idValue}`;
  } else if (id instanceof Date) {
    // Date object - convert to timestamp
    idValue = id.getTime().toString();
  } else if (typeof id === 'string' && !isNaN(Date.parse(id))) {
    // Date string - convert to timestamp
    idValue = new Date(id).getTime().toString();
  } else {
    // Use as is (could be timestamp or other ID)
    idValue = id.toString();
  }
  
  return `${titleSlug}-${idValue}`;
};

/**
 * Parses a recipe slug to extract ID (UUID or timestamp)
 * @param {string} slug - Recipe slug like "delicious-pasta-recipe--uuid" or "delicious-pasta-recipe-1696687200000"
 * @returns {string} - Extracted ID (UUID or timestamp)
 */
export const parseRecipeSlug = (slug) => {
  if (!slug) return '';
  
  // Check for UUID format (separated by double dash)
  const doubleDashIndex = slug.indexOf('--');
  if (doubleDashIndex !== -1) {
    const id = slug.substring(doubleDashIndex + 2);
    // Validate UUID format
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return id;
    }
  }
  
  // Fallback: try timestamp approach (find last segment after final dash)
  const lastDashIndex = slug.lastIndexOf('-');
  if (lastDashIndex === -1) return '';
  
  const id = slug.substring(lastDashIndex + 1);
  
  // Return if it's a timestamp (numeric)
  if (/^\d+$/.test(id)) {
    return id;
  }
  
  return '';
};

/**
 * Generates user profile URL
 * @param {string} username - User's username
 * @returns {string} - Profile URL like "/johndoe"
 */
export const generateProfileUrl = (username) => {
  if (!username) return '/profile';
  return `/${username}`;
};

/**
 * Generates user's recipes page URL
 * @param {string} username - User's username
 * @returns {string} - My recipes URL like "/johndoe/my-recipes"
 */
export const generateMyRecipesUrl = (username) => {
  if (!username) return '/my-recipes';
  return `/${username}/my-recipes`;
};

/**
 * Generates create recipe page URL
 * @param {string} username - User's username
 * @returns {string} - Create recipe URL like "/johndoe/create-recipe"
 */
export const generateCreateRecipeUrl = (username) => {
  if (!username) return '/create-recipe';
  return `/${username}/create-recipe`;
};

/**
 * Generates recipe detail URL
 * @param {string} username - Recipe owner's username
 * @param {Object|string} recipeOrTitle - Recipe object or title string
 * @param {string} timestamp - Creation timestamp or ID (optional if recipe object)
 * @returns {string} - Recipe URL like "/johndoe/my-recipes/delicious-pasta-recipe-1696687200000"
 */
export const generateRecipeUrl = (username, recipeOrTitle, timestamp) => {
  if (!username) return '#';
  
  let title, id;
  
  // Handle recipe object parameter
  if (typeof recipeOrTitle === 'object' && recipeOrTitle !== null) {
    title = recipeOrTitle.title;
    id = recipeOrTitle.id || recipeOrTitle.created_at;
  } else {
    title = recipeOrTitle;
    id = timestamp;
  }
  
  if (!title || !id) return '#';
  
  const slug = generateRecipeSlug(title, id);
  return `/${username}/my-recipes/${slug}`;
};

/**
 * Generates edit recipe URL
 * @param {string} username - Recipe owner's username  
 * @param {string} recipeId - Recipe ID
 * @returns {string} - Edit recipe URL like "/johndoe/edit-recipe/recipe-id"
 */
export const generateEditRecipeUrl = (username, recipeId) => {
  if (!username || !recipeId) return '#';
  return `/${username}/edit-recipe/${recipeId}`;
};

/**
 * Validates if a string is a valid username format
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid username format
 */
export const isValidUsername = (username) => {
  if (!username) return false;
  // Username should be 3-30 characters, alphanumeric with underscores/hyphens
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
};

/**
 * Gets the current user's username from profile or generates fallback
 * @param {Object} user - User object from Supabase
 * @param {Object} profile - User profile object
 * @returns {string} - Username or fallback
 */
export const getUsernameForUrl = (user, profile) => {
  if (profile?.username) return profile.username;
  if (user?.user_metadata?.username) return user.user_metadata.username;
  if (user?.email) return user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  return 'user';
};