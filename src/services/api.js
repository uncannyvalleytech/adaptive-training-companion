/**
 * @file api.js
 * This service module is responsible for all communication
 * with our Google Apps Script backend. It centralizes the logic for
 * fetching and saving user data, ensuring that every request is
 * authenticated with the user's secure token.
 *
 * NOTE: This file is a placeholder. We will make it fully functional
 * after we create and deploy our Google Apps Script in Phase 3.
 */

// We will replace this with our actual script URL later.
const APPS_SCRIPT_URL = "";

/**
 * A placeholder function for fetching data from our backend.
 * @param {string} authToken - The user's secure ID token from Google Sign-In.
 */
export async function getData(authToken) {
  console.log("Pretending to fetch data with a secure token.");
  // In the future, this function will make a secure `fetch` call to our
  // Apps Script, sending the authToken for verification.
  return { success: true, data: {} };
}

/**
 * A placeholder function for saving data to our backend.
 * @param {object} data - The data payload to save (e.g., workout session).
 * @param {string} authToken - The user's secure ID token.
 */
export async function saveData(data, authToken) {
  console.log("Pretending to save data with a secure token:", data);
  // In the future, this function will make a secure `fetch` call
  // to save the user's data to their private Google Sheet.
  return { success: true };
}
