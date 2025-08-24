/**
 * @file local-storage.js
 * Local storage service for offline-only app functionality.
 * UPDATED: Includes default workout templates on initial load.
 */

const LOCAL_STORAGE_KEY = 'userWorkoutData';

/**
 * Creates the default user data structure.
 * This now includes a pre-populated list of workout templates.
 */
function createDefaultUserData() {
  const defaultTemplates = [];

  return {
    onboardingComplete: false,
    workouts: [],
    templates: defaultTemplates,
    currentWeek: 1,
    workoutsCompletedThisMeso: 0,
    totalXP: 0,
    level: 1,
    baseMEV: {
      chest: 8,
      back: 10,
      shoulders: 8,
      arms: 6,
      legs: 14,
    }
  };
}

export function getDataLocally() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure data has required structure, including the default templates if they are missing
      const defaultData = createDefaultUserData();
      const mergedTemplates = parsed.templates && parsed.templates.length > 0 ? parsed.templates : defaultData.templates;
      return { ...defaultData, ...parsed, templates: mergedTemplates };
    }
    // If no data exists, return the default data with templates
    return createDefaultUserData();
  } catch (error) {
    console.error('Error reading local data:', error);
    // Fallback to default data in case of parsing error
    return createDefaultUserData();
  }
}

export function saveDataLocally(data) {
  try {
    // Get existing data and merge
    const existing = getDataLocally() || createDefaultUserData();
    const updatedData = { ...existing, ...data };

    // Handle arrays specially
    if (data.workouts && Array.isArray(data.workouts)) {
      updatedData.workouts = [...(existing.workouts || []), ...data.workouts];
    }

    if (data.templates && Array.isArray(data.templates)) {
      updatedData.templates = data.templates;
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));
    return { success: true };
  } catch (error) {
    console.error('Error saving local data:', error);
    return { success: false, error: error.message };
  }
}

export function deleteDataLocally() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error deleting local data:', error);
    return { success: false, error: error.message };
  }
}

export function getCredential() {
  return { credential: 'local-mode-user' };
}
