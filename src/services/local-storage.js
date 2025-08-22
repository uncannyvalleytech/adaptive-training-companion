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
  const defaultTemplates = [
    {
      name: "Beginner Full Body A",
      exercises: [
        { name: "Barbell Squat", sets: [{}, {}, {}], targetReps: "8-10" },
        { name: "Barbell Bench Press", sets: [{}, {}, {}], targetReps: "8-10" },
        { name: "Bent Over Barbell Row", sets: [{}, {}, {}], targetReps: "8-10" },
        { name: "Leg Press", sets: [{}, {}], targetReps: "10-12" },
        { name: "Plank", sets: [{}, {}, {}], targetReps: "30-60s" }
      ]
    },
    {
      name: "Beginner Full Body B",
      exercises: [
        { name: "Barbell Deadlift", sets: [{}, {}, {}], targetReps: "6-8" },
        { name: "Overhead Press", sets: [{}, {}, {}], targetReps: "8-10" },
        { name: "Lat Pulldown", sets: [{}, {}, {}], targetReps: "8-10" },
        { name: "Dumbbell Lunges", sets: [{}, {}], targetReps: "10-12 per leg" },
        { name: "Lying Leg Raises", sets: [{}, {}, {}], targetReps: "12-15" }
      ]
    },
    {
      name: "Intermediate Push",
      exercises: [
        { name: "Barbell Bench Press", sets: [{}, {}, {}], targetReps: "6-10" },
        { name: "Seated Dumbbell Shoulder Press", sets: [{}, {}, {}], targetReps: "8-12" },
        { name: "Incline Dumbbell Press", sets: [{}, {}, {}], targetReps: "8-12" },
        { name: "Lateral Raise", sets: [{}, {}], targetReps: "12-15" },
        { name: "Triceps Rope Pushdown", sets: [{}, {}], targetReps: "12-15" }
      ]
    },
    {
      name: "Intermediate Pull",
      exercises: [
        { name: "Deadlifts", sets: [{}, {}, {}], targetReps: "5-8" },
        { name: "Pull-Ups (or Lat Pulldowns)", sets: [{}, {}, {}], targetReps: "8-10" },
        { name: "Seated Cable Row", sets: [{}, {}, {}], targetReps: "10-12" },
        { name: "Face Pulls", sets: [{}, {}], targetReps: "15-20" },
        { name: "Barbell Bicep Curls", sets: [{}, {}], targetReps: "12-15" }
      ]
    },
    {
      name: "Intermediate Legs",
      exercises: [
        { name: "Barbell Squats", sets: [{}, {}, {}], targetReps: "6-10" },
        { name: "Romanian Deadlifts", sets: [{}, {}, {}], targetReps: "10-12" },
        { name: "Leg Press", sets: [{}, {}, {}], targetReps: "10-12" },
        { name: "Leg Curls", sets: [{}, {}], targetReps: "12-15" },
        { name: "Calf Raises", sets: [{}, {}, {}, {}], targetReps: "15-20" }
      ]
    }
  ];

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
