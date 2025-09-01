/**
 * @file google-auth.js
 * Enhanced Google authentication with a robust, promise-based loading mechanism
 */

let authCredential = null;
let accessToken = null;
let googleLibraryPromise = null;

const CLIENT_ID = "250304194666-7j8n6sslauu1betcqafmlb7pa779bimi.apps.googleusercontent.com";
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file profile email';

/**
 * Returns a promise that resolves when the Google Sign-In library is loaded.
 * This is the primary method to prevent race conditions.
 */
export function ensureGoogleLibraryLoaded() {
  if (googleLibraryPromise) {
    return googleLibraryPromise;
  }

  googleLibraryPromise = new Promise((resolve, reject) => {
    // Check if it's already available
    if (window.google && window.google.accounts) {
      console.log("Google library already loaded.");
      resolve();
      return;
    }

    // If not, set a timeout and wait for the 'google-library-loaded' event
    const timeout = setTimeout(() => {
      reject(new Error("Google library load timed out."));
    }, 10000); // 10-second timeout

    window.addEventListener('google-library-loaded', () => {
      clearTimeout(timeout);
      console.log("Caught google-library-loaded event, resolving promise.");
      if (window.gapi) {
        initializeGapi();
      }
      resolve();
    }, { once: true }); // Use 'once' to prevent memory leaks
  });

  return googleLibraryPromise;
}

/**
 * Initialize Google Sign-In. This should only be called after ensureGoogleLibraryLoaded resolves.
 */
export function initializeSignIn(buttonContainer, onSignIn) {
  console.log("Initializing Google Sign-In...");
  
  if (!window.google || !window.google.accounts) {
    console.error("FATAL: initializeSignIn called before Google library was ready.");
    showFallbackSignIn(buttonContainer);
    return;
  }

  try {
    // Initialize Google Identity Services for ID token
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (credentialResponse) => {
        console.log("ID token received successfully.");
        authCredential = credentialResponse;
        if (onSignIn) onSignIn(credentialResponse);
      },
      error_callback: (error) => {
        console.error("Google Sign-In error:", error);
        showSignInError(buttonContainer, "Sign-in failed. Please try again.");
      }
    });

    // Render the Sign in with Google button
    if (buttonContainer) {
      window.google.accounts.id.renderButton(
        buttonContainer,
        { 
          theme: "filled_blue", 
          size: "large", 
          type: "standard",
          shape: "rectangular",
          text: "signin_with",
          logo_alignment: "left"
        }
      );
      console.log("Google Sign-In button rendered successfully.");
    }
  } catch (error) {
    console.error("Error initializing Google Sign-In:", error);
    showFallbackSignIn(buttonContainer);
  }
}

/**
 * Initialize the Google API client for requesting additional scopes.
 */
function initializeGapi() {
  if (!window.gapi) {
    console.warn("GAPI script not available for initialization.");
    return;
  }
  try {
    window.gapi.load('auth2', () => {
      window.gapi.auth2.init({
        client_id: CLIENT_ID,
        scope: SCOPES
      }).then(() => {
        console.log("GAPI Auth2 initialized successfully.");
      }).catch(error => console.warn("GAPI Auth2 initialization failed:", error));
    });
  } catch(error) {
    console.error("Error loading GAPI auth2 library:", error);
  }
}

/**
 * Renders a fallback UI when Google services fail to load.
 */
function showFallbackSignIn(buttonContainer) {
  if (!buttonContainer) return;
  buttonContainer.innerHTML = `
    <div style="padding: 12px; background: #2A2D3D; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; color: var(--color-text-primary);">
      <div style="margin-bottom: 8px; font-weight: bold;">Google Sign-In Unavailable</div>
      <div style="font-size: 14px; color: var(--color-text-secondary); margin-bottom: 12px;">
        Unable to connect to Google services. This may be due to:
        <ul style="text-align: left; margin: 8px 0; padding-left: 20px; list-style-type: circle;">
          <li>Network connectivity issues</li>
          <li>Browser security settings</li>
          <li>Ad blockers or extensions</li>
        </ul>
      </div>
      <button onclick="window.location.reload()" style="background: var(--color-accent-primary); color: var(--color-surface-primary); border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;">
        Retry
      </button>
    </div>
  `;
}

function showSignInError(buttonContainer, message) {
  if (!buttonContainer) return;
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `padding: 12px; background: #fef7f0; border: 1px solid #f9c23c; border-radius: 8px; color: #b7791f; text-align: center; margin-top: 8px;`;
  errorDiv.textContent = message;
  buttonContainer.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

export function signOut() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.disableAutoSelect();
  }
  authCredential = null;
  accessToken = null;
  console.log("User has been signed out.");
}

export function getCredential() { return authCredential; }
export function getAccessToken() { return accessToken; }
export function isSignedIn() { return authCredential !== null; }
export function validateAuth() {
  if (!authCredential) return { valid: false, reason: "No credential" };
  try {
    const payload = JSON.parse(atob(authCredential.credential.split('.')[1]));
    if (Date.now() >= payload.exp * 1000) {
      return { valid: false, reason: "Token expired" };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: "Invalid token" };
  }
}
