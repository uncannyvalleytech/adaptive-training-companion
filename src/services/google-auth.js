/**
 * @file google-auth.js
 * This service handles all interactions with the Google Identity Services library.
 * It is responsible for initializing the Sign-In with Google button,
 * handling the callback when a user successfully signs in, and managing
 * the user's authentication state (like their profile info and secure token).
 */

// A variable to hold the user's authentication information.
let authCredential = null;

// --- CONFIGURATION ---
// Replace this with the Client ID you just created.
const CLIENT_ID =
  "250304194666-7j8n6sslauu1betcqafmlb7pa779bimi.apps.googleusercontent.com";

/**
 * Initializes the Google Sign-In flow and renders the button.
 * @param {HTMLElement} buttonContainer - The div where the button should be rendered.
 * @param {function} onSignIn - A callback function to run when the user signs in.
 */
export function initializeSignIn(buttonContainer, onSignIn) {
  if (!window.google || !window.google.accounts) {
    console.error("Google Identity Services library not loaded.");
    return;
  }

  try {
    // 1. Initialize the Google Identity Services client
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      // This is the function that Google will call after a successful sign-in
      callback: (credentialResponse) => {
        handleCredentialResponse(credentialResponse, onSignIn);
      },
    });

    // 2. Render the "Sign in with Google" button
    window.google.accounts.id.renderButton(
      buttonContainer, // The element where we want to display the button
      { theme: "outline", size: "large", type: "standard" } // Button customization
    );
  } catch (error) {
    console.error("Error initializing Google Sign-In:", error);
  }
}

/**
 * Handles the response from Google after a user signs in.
 * @param {object} response - The credential response object from Google.
 * @param {function} onSignIn - The callback function to notify our app.
 */
function handleCredentialResponse(response, onSignIn) {
  console.log("User signed in successfully!");
  authCredential = response;
  // Notify the main application that the user has signed in.
  if (onSignIn) {
    onSignIn(response);
  }
}

/**
 * Handles the sign-out process.
 */
export function signOut() {
  if (window.google && window.google.accounts) {
    window.google.accounts.id.disableAutoSelect();
  }
  authCredential = null;
  console.log("User has been signed out.");
}

/**
 * A utility function to get the current user's credential.
 * @returns {object | null} The user's credential object or null if not signed in.
 */
export function getCredential() {
  return authCredential;
}
