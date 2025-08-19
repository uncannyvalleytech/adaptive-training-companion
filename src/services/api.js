/**
 * @file api.js
 * Enhanced API service with improved CORS handling and offline support
 */

// --- CONFIGURATION ---
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby9IYSEA1jz6D6IzUtIZGuqDYkvdPa4W88icDUbqbC1BeqImAeWPVmVe1yHWFWNTata/exec";

// Constants for local storage keys
const LOCAL_STORAGE_KEY = 'userWorkoutData';
const OFFLINE_QUEUE_KEY = 'offlineWorkoutQueue';

/**
 * Enhanced API request function with better CORS handling
 */
async function makeApiRequest(action, token, payload = {}) {
  if (!token) {
    return { success: false, error: "Authentication token is missing." };
  }

  // Prepare the request data
  const requestData = { action, token, payload };

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Please sign in again.");
      } else if (response.status === 403) {
        throw new Error("Permission denied. Please check your Google account permissions.");
      } else if (response.status === 0 || response.status >= 500) {
        throw new Error("Server temporarily unavailable. Please try again later.");
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error("API Request Failed:", error);
    
    // Provide more specific error messages
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return { 
        success: false, 
        error: "Unable to connect to server. Please check your internet connection.",
        isNetworkError: true
      };
    } else {
      return { 
        success: false, 
        error: error.message || "An unexpected error occurred. Please try again."
      };
    }
  }
}

/**
 * Test the API connection with a simple POST
 */
export async function testApiConnection() {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "test" }),
      mode: 'cors',
    });
    return response.ok;
  } catch (error) {
    console.error("API connection test failed:", error);
    return false;
  }
}

/**
 * Create default user data structure
 */
function createDefaultUserData() {
  return {
    onboardingComplete: false,
    workouts: [],
    templates: [],
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

/**
 * Fetches the user's data with comprehensive offline fallback
 */
export async function getData(authToken) {
  // First, try to get cached data
  const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  let parsedCachedData = null;
  
  try {
    parsedCachedData = cachedData ? JSON.parse(cachedData) : null;
  } catch (e) {
    console.warn("Invalid cached data, clearing:", e);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }

  // If offline, use cached data or create default
  if (!navigator.onLine) {
    if (parsedCachedData) {
      return { 
        success: true, 
        data: parsedCachedData, 
        isOffline: true,
        warning: "You're offline. Using cached data."
      };
    } else {
      const defaultData = createDefaultUserData();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultData));
      return { 
        success: true, 
        data: defaultData, 
        isOffline: true,
        warning: "You're offline. Created new local profile."
      };
    }
  }

  // Try to fetch from server
  try {
    const response = await makeApiRequest("getData", authToken);
    
    if (response.success && response.data) {
      // Ensure data has required structure
      const validatedData = { ...createDefaultUserData(), ...response.data };
      
      // Cache the successful response
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validatedData));
      return { success: true, data: validatedData };
      
    } else if (response.isNetworkError) {
      // Network error - use cached data or create default
      if (parsedCachedData) {
        console.warn("Server request failed, using cached data:", response.error);
        return { 
          success: true, 
          data: parsedCachedData, 
          warning: "Server unavailable. Using offline data."
        };
      } else {
        // No cached data, create default and queue for later sync
        const defaultData = createDefaultUserData();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultData));
        return { 
          success: true, 
          data: defaultData,
          warning: "Server unavailable. Created new local profile."
        };
      }
    } else {
      // Other error - still try to use cached data
      if (parsedCachedData) {
        return { 
          success: true, 
          data: parsedCachedData, 
          warning: "Server error. Using offline data."
        };
      } else {
        return { 
          success: false, 
          error: response.error || "Failed to load data and no offline data available."
        };
      }
    }
  } catch (error) {
    // Unexpected error - use cached data if available
    console.error("Unexpected error in getData:", error);
    
    if (parsedCachedData) {
      return { 
        success: true, 
        data: parsedCachedData, 
        warning: "Unexpected error. Using offline data."
      };
    } else {
      return { 
        success: false, 
        error: "Unexpected error and no offline data available."
      };
    }
  }
}

/**
 * Saves data with enhanced offline queueing
 */
export async function saveData(data, authToken) {
  // Always update local cache immediately for responsive UI
  const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  let updatedData = data;
  
  if (cachedData) {
    try {
      const existing = JSON.parse(cachedData);
      updatedData = { ...existing, ...data };
      
      // Handle arrays properly (append workouts, replace templates)
      if (data.workouts && Array.isArray(data.workouts)) {
        updatedData.workouts = [...(existing.workouts || []), ...data.workouts];
      }
      if (data.templates && Array.isArray(data.templates)) {
        updatedData.templates = data.templates; // Replace templates
      }
    } catch (e) {
      console.warn("Error parsing cached data during save:", e);
      updatedData = { ...createDefaultUserData(), ...data };
    }
  }
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));

  // If offline, queue for later sync
  if (!navigator.onLine) {
    queueOfflineData(data, authToken);
    console.log("Offline mode: Data saved locally and queued for sync.");
    return { 
      success: true, 
      isOffline: true,
      warning: "Data saved offline. Will sync when connection is restored."
    };
  }

  // Try to save to server
  try {
    const response = await makeApiRequest("saveData", authToken, { data });
    
    if (response.success) {
      console.log("Data saved successfully to server");
      return response;
    } else if (response.isNetworkError) {
      // Network error - queue for later
      queueOfflineData(data, authToken);
      console.warn("Save failed due to network, data queued:", response.error);
      return { 
        success: true, 
        warning: "Data saved locally. Will sync when server is available."
      };
    } else {
      // Other server error - still queue for retry
      queueOfflineData(data, authToken);
      return { 
        success: true, 
        warning: "Server error. Data saved locally and queued for retry."
      };
    }
  } catch (error) {
    // Unexpected error - queue for later
    console.error("Unexpected error during save:", error);
    queueOfflineData(data, authToken);
    return { 
      success: true, 
      warning: "Unexpected error. Data saved locally and queued for retry."
    };
  }
}

/**
 * Deletes all user data
 */
export async function deleteData(authToken) {
  // Clear local cache immediately
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  
  if (!navigator.onLine) {
    return { 
      success: false, 
      error: "Cannot delete server data while offline. Local data has been cleared."
    };
  }

  try {
    const response = await makeApiRequest("deleteData", authToken);
    return response;
  } catch (error) {
    console.error("Error deleting data:", error);
    return { 
      success: false, 
      error: "Error deleting server data, but local data has been cleared."
    };
  }
}

/**
 * Queue data for offline sync
 */
function queueOfflineData(data, authToken) {
  try {
    const existingQueue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    existingQueue.push({
      data,
      authToken,
      timestamp: Date.now()
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existingQueue));
  } catch (e) {
    console.error("Error queueing offline data:", e);
  }
}

/**
 * Get the count of queued workouts for offline sync
 */
export function getQueuedWorkoutsCount() {
  try {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    return queue.length;
  } catch (e) {
    console.error("Error reading offline queue:", e);
    return 0;
  }
}

/**
 * Sync any queued offline data when back online
 */
export async function syncData() {
  if (!navigator.onLine) {
    return { success: false, error: "Still offline" };
  }

  let queue;
  try {
    queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch (e) {
    console.error("Error reading sync queue:", e);
    return { success: false, error: "Error reading sync queue" };
  }

  if (queue.length === 0) {
    return { success: true, message: "No data to sync" };
  }

  console.log(`Syncing ${queue.length} offline data entries...`);
  
  let syncedCount = 0;
  let failedItems = [];

  for (const queuedItem of queue) {
    try {
      const response = await makeApiRequest("saveData", queuedItem.authToken, { data: queuedItem.data });
      if (response.success) {
        syncedCount++;
      } else {
        console.warn("Failed to sync item:", response.error);
        failedItems.push(queuedItem);
      }
    } catch (error) {
      console.error("Failed to sync offline data item:", error);
      failedItems.push(queuedItem);
    }
  }

  // Update queue with failed items only
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedItems));
  } catch (e) {
    console.error("Error updating sync queue:", e);
  }
  
  if (failedItems.length === 0) {
    console.log("All offline data synced successfully");
    return { success: true, syncedCount };
  } else {
    console.warn(`Synced ${syncedCount} items, ${failedItems.length} failed`);
    return { success: true, syncedCount, failedCount: failedItems.length };
  }
}

/**
 * Initialize API with connection test
 */
export async function initializeApi() {
  const isConnected = await testApiConnection();
  console.log('API connection test:', isConnected ? 'PASSED' : 'FAILED');
  
  if (!isConnected) {
    console.warn('API not accessible, running in offline mode');
  }
  
  return isConnected;
}
