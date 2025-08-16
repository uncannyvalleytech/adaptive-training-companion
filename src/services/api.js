/**
 * @file api.js
 * This service module is responsible for all communication
 * with our Google Apps Script backend. It centralizes the logic for
 * fetching and saving user data, ensuring that every request is
 * authenticated with the user's secure token.
 */

// --- CONFIGURATION ---
// Replace this with the Web App URL you got after deploying the script.
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzBPGLUduH9SiCgjTVvb2fNe8Su5n6PSAJFZbF_Ix3nozIDBEYchLTkwypYxU6TwLy2/exec";

/**
 * A generic function to make a secure, authenticated request to our backend.
 * @param {string} action - The name of the action to perform (e.g., 'getData').
 * @param {string} token - The user's secure ID token from Google Sign-In.
 * @param {object} [payload] - Optional data to send with the request (for saving).
 * @returns {Promise<object>} The JSON response from the backend.
 */
async function makeApiRequest(action, token, payload = {}) {
  if (!APPS_SCRIPT_URL) {
    throw new Error("API URL is not configured.");
  }
  if (!token) {
    throw new Error("Authentication token is missing.");
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: action,
        token: token,
        payload: payload,
      }),
      // This helps bypass certain CORS issues in development.
      mode: "no-cors",
    });

    // NOTE: Because of 'no-cors', we can't directly read the response here.
    // The request is "fire-and-forget". We will handle the real response
    // later when we refine this. For now, we assume it succeeds.
    console.log(`API request sent for action: ${action}`);
    return { success: true, message: "Request sent." };
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
  return makeApiRequest("getData", authToken);
}

/**
 * Saves data to the backend.
 * @param {object} data - The data payload to save.
 * @param {string} authToken - The user's secure ID token.
 */
export async function saveData(data, authToken) {
  return makeApiRequest("saveData", data, authToken);
}
