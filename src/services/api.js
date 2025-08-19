/**
 * @file api.js
 * This service module is responsible for all communication
 * with our Google Apps Script backend. It centralizes the logic for
 * fetching, saving, and deleting user data.
 */

// --- CONFIGURATION ---
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx08n3XtFt7GctKO4dBwH9LzTxSQgBqsEpb6xU2SiqfCivUM6vafQ4G2yevZfsAXdc/exec";

// Constants for local storage keys
const LOCAL_STORAGE_KEY = 'userWorkoutData';
const OFFLINE_QUEUE_KEY = 'offlineWorkoutQueue';

/**
 * A generic function to make a secure, authenticated request to our backend.
 * @param {string} action - The name of the action to perform.
 * @param {string} token - The user's secure ID token from Google Sign-In.
 * @param {object} [payload] - Optional data to send with the request.
 * @returns {Promise<object>} The JSON response from the backend.
 */
async function makeApiRequest(action, token, payload = {}) {
  if (!token) {
    return { success: false, error: "Authentication token is missing." };
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, token, payload }),
      redirect: "follow",
    });
    return await response.json();
  } catch (error) {
    console.error("API Request Failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches the user's initial data from the backend.
 * @param {string} authToken - The user's secure ID token.
 */
export async function getData(authToken) {
  const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cachedData) {
    return { success: true, data: JSON.parse(cachedData) };
  }
  
  if (!navigator.onLine) {
    return { success: false, error: "No cached data and offline." };
  }

  const response = await makeApiRequest("getData", authToken);
  if (response.success) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(response.data));
  }
  return response;
}

/**
 * Saves data to the backend.
 * @param {object} data - The data payload to save.
 * @param {string} authToken - The user's secure ID token.
 */
export async function saveData(data, authToken) {
  // Optimistically update local cache for a faster UI response
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

  if (!navigator.onLine) {
    // Queue the data for later sync
    queueOfflineData(data, authToken);
    console.log("Offline mode: Data saved locally. Will sync later.");
    return { success: true, isOffline: true };
  }

  return await makeApiRequest("saveData", authToken, { data });
}

/**
 * Deletes all user data from the backend.
 * @param {string} authToken - The user's secure ID token.
 * @returns {Promise<object>} The response from the backend.
 */
export async function deleteData(authToken) {
  // Clear local cache immediately
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  
  if (!navigator.onLine) {
    // If offline, we can't contact the server. The user will be logged out,
    // and on next login, their data will appear gone. Syncing on next login
    // would be complex, so we'll assume online for this action.
    return { success: false, error: "Cannot delete data while offline." };
  }

  return await makeApiRequest("deleteData", authToken);
}

/**
 * Queue data for offline sync
 * @param {object} data - The data to queue
 * @param {string} authToken - The user's auth token
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
 * @returns {number} Number of queued workout data entries
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
    return;
  }

  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  if (queue.length === 0) {
    return;
  }

  console.log(`Syncing ${queue.length} offline data entries...`);

  for (const queuedItem of queue) {
    try {
      await makeApiRequest("saveData", queuedItem.authToken, { data: queuedItem.data });
    } catch (error) {
      console.error("Failed to sync offline data:", error);
      // Keep the failed items in queue for next attempt
      return;
    }
  }

  // Clear the queue after successful sync
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  console.log("Offline data sync completed successfully");
}
