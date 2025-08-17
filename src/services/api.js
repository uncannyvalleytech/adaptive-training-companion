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
  "https://script.google.com/macros/s/AKfycbylU-b34I6Vxe5Ik22pV4Jr_xXQpEugTDIgiOnJahOTSU-yD_RYdKvTS5U4EmtoT1u5/exec";

/**
 * A generic function to make a secure, authenticated request to our backend.
 * @param {string} action - The name of the action to perform (e.g., 'getData').
 * @param {string} token - The user's secure ID token from Google Sign-In.
 * @param {object} [payload] - Optional data to send with the request (for saving).
 * @returns {Promise<object>} The JSON response from the backend.
 */
async function makeApiRequest(action, token, payload = {}) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "YOUR_WEB_APP_URL_HERE") {
    console.error("API URL is not configured in src/services/api.js");
    return { success: false, error: "API URL is not configured." };
  }
  if (!token) {
    return { success: false, error: "Authentication token is missing." };
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: action,
        token: token,
        payload: payload,
      }),
      redirect: "follow",
    });

    // Now we can properly read the JSON response from the Apps Script.
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
  return makeApiRequest("getData", authToken);
}

/**
 * Saves data to the backend.
 * @param {object} data - The data payload to save.
 * @param {string} authToken - The user's secure ID token.
 */
export async function saveData(data, authToken) {
  // Check if the browser is offline
  if (!navigator.onLine) {
    console.log("Offline mode: Queueing workout for later sync.");
    const queuedWorkouts = JSON.parse(localStorage.getItem('queuedWorkouts') || '[]');
    queuedWorkouts.push({ data, authToken });
    localStorage.setItem('queuedWorkouts', JSON.stringify(queuedWorkouts));
    return { success: true }; // Return a success message for the user
  }

  return makeApiRequest("saveData", authToken, { data });
}

/**
 * Syncs any pending workout data from localStorage to the backend.
 */
export async function syncData() {
  const queuedWorkouts = JSON.parse(localStorage.getItem('queuedWorkouts') || '[]');
  if (queuedWorkouts.length > 0 && navigator.onLine) {
    console.log("Online: Syncing queued workouts...");
    for (const workout of queuedWorkouts) {
      // Re-use makeApiRequest for each queued workout
      await makeApiRequest("saveData", workout.authToken, { data: workout.data });
    }
    localStorage.removeItem('queuedWorkouts'); // Clear the queue after successful sync
    console.log("Sync complete.");
  }
}

/**
 * Generates a smart recommendation for the next set based on user feedback.
 * @param {object} context - The context for the recommendation, including last set data.
 * @returns {Promise<object>} The recommendation from the model.
 */
export async function generateRecommendation(context) {
  try {
    let chatHistory = [];
    const prompt = `Based on the last completed set for the exercise "${context.exerciseName}" with ${context.lastSet.reps} reps and an RPE of ${context.lastSet.rpe}, and the user's feedback, what is the best suggestion for the next set? The target RPE was ${context.targetRpe}. The user's feedback was: ${JSON.stringify(context.lastSet.feedback)}. Provide a new reps, new RPE, and a brief explanation in JSON format.
    Example: {"reps": 10, "rpe": 8, "adjustment": "Because you felt good, we're increasing the RPE slightly to keep you challenged."}
    `;
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    
    const payload = {
        contents: chatHistory,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "reps": { "type": "NUMBER" },
                    "rpe": { "type": "NUMBER" },
                    "adjustment": { "type": "STRING" }
                },
                "propertyOrdering": ["reps", "rpe", "adjustment"]
            }
        }
    };
    
    // Replace the API key with your own if needed, or leave it as-is for the runtime environment.
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      const json = result.candidates[0].content.parts[0].text;
      return JSON.parse(json);
    } else {
      console.error("API response was not in the expected format.");
      return null;
    }
  } catch (error) {
    console.error("Failed to generate recommendation:", error);
    // Fallback to a simple rule-based suggestion if API call fails
    return { reps: context.lastSet.reps, rpe: context.lastSet.rpe, adjustment: "Failed to generate smart recommendation. Using a fallback." };
  }
}
