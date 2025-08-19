/**
 * @file api.js
 * Enhanced API service with better CORS handling and offline support
 */

// --- CONFIGURATION ---
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx08n3XtFt7GctKO4dBwH9LzTxSQgBqsEpb6xU2SiqfCivUM6vafQ4G2yevZfsAXdc/exec";

// Constants for local storage keys
const LOCAL_STORAGE_KEY = 'userWorkoutData';
const OFFLINE_QUEUE_KEY = 'offlineWorkoutQueue';

/**
 * Enhanced API request function with better error handling
 */
async function makeApiRequest(action, token, payload = {}) {
  if (!token) {
    return { success: false, error: "Authentication token is missing." };
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ action, token, payload }),
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit' // Don't send credentials
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Request Failed:", error);
    
    // More specific error messages
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return { success: false, error: "Network error. Please check your connection and try again." };
    } else if (error.message.includes('CORS')) {
      return { success: false, error: "Server configuration error. Please try again later." };
    } else {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Test the API connection
 */
export async function testApiConnection() {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "GET",
      mode: 'cors'
    });
    return response.ok;
  } catch (error) {
    console.error("API connection test failed:", error);
    return false;
  }
}

/**
 * Fetches the user's initial data from the backend with offline fallback
 */
export async function getData(authToken) {
  // First, try to get cached data
  const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  
  if (!navigator.onLine) {
    if (cachedData) {
      return { success: true, data: JSON.parse(cachedData), isOffline: true };
    } else {
      return { success: false, error: "No cached data available and you're offline." };
    }
  }

  // Try to fetch from server
  try {
    const response = await makeApiRequest("getData", authToken);
    
    if (response.success) {
      // Cache the successful response
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(response.data));
      return response;
    } else {
      // If server fails but we have cached data, use it
      if (cachedData) {
        console.warn("Server request failed, using cached data:", response.error);
        return { 
          success: true, 
          data: JSON.parse(cachedData), 
          warning: "Using offline data. Some features may be limited." 
        };
      } else {
        return response;
      }
    }
  } catch (error) {
    // Network error - use cached data if available
    if (cachedData) {
      console.warn("Network error, using cached data:", error);
      return { 
        success: true, 
        data: JSON.parse(cachedData), 
        warning: "Using offline data due to network error." 
      };
    } else {
      return { success: false, error: "Network error and no cached data available." };
    }
  }
}

/**
 * Saves data to the backend with offline queueing
 */
export async function saveData(data, authToken) {
  // Always update local cache immediately for responsive UI
  const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  let updatedData = data;
  
  if (cachedData) {
    const existing = JSON.parse(cachedData);
    updatedData = { ...existing, ...data };
    
    // Handle arrays properly (append workouts, replace templates)
    if (data.workouts && Array.isArray(data.workouts)) {
      updatedData.workouts = [...(existing.workouts || []), ...data.workouts];
    }
  }
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));

  if (!navigator.onLine) {
    // Queue for later sync
    queueOfflineData(data, authToken);
    console.log("Offline mode: Data saved locally and queued for sync.");
    return { success: true, isOffline: true };
  }

  try {
    const response = await makeApiRequest("saveData", authToken, { data });
    
    if (!response.success) {
      // If save fails, queue it for later
      queueOfflineData(data, authToken);
      console.warn("Save failed, data queued for retry:", response.error);
      return { success: true, warning: "Data saved locally, will sync when possible." };
    }
    
    return response;
  } catch (error) {
    // Network error - queue for later
    queueOfflineData(data, authToken);
    console.warn("Network error during save, data queued:", error);
    return { success: true, warning: "Data saved locally, will sync when connection is restored." };
  }
}

/**
 * Deletes all user data from the backend
 */
export async function deleteData(authToken) {
  // Clear local cache immediately
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  
  if (!navigator.onLine) {
    return { success: false, error: "Cannot delete data while offline. Please try again when connected." };
  }

  return await makeApiRequest("deleteData", authToken);
}

/**
 * Queue data for offline sync
 */
function queueOfflineData(data, authToken) {
  const existingQueue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  existingQueue.push({
    data,
    authToken,
    timestamp: Date.now()
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existingQueue));
}

/**
 * Get the count of queued workouts for offline sync
 */
export function getQueuedWorkoutsCount() {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  return queue.length;
}

/**
 * Sync any queued offline data when back online
 */
export async function syncData() {
  if (!navigator.onLine) {
    return { success: false, error: "Still offline" };
  }

  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
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
        failedItems.push(queuedItem);
      }
    } catch (error) {
      console.error("Failed to sync offline data item:", error);
      failedItems.push(queuedItem);
    }
  }

  // Update queue with failed items only
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedItems));
  
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
