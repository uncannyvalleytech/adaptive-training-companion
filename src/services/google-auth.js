/**
 * @file google-auth.js
 * Enhanced Google authentication with improved error handling and fallbacks
 */

let authCredential = null;
let accessToken = null;
let isGapiLoaded = false;
let isGsiLoaded = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

const CLIENT_ID = "250304194666-7j8n6sslauu1betcqafmlb7pa779bimi.apps.googleusercontent.com";

// Required scopes for accessing user's Google Sheets
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'profile',
  'email'
].join(' ');

/**
 * Initialize Google Sign-In with comprehensive error handling
 */
export function initializeSignIn(buttonContainer, onSignIn) {
  console.log("Initializing Google Sign-In...");
  initializationAttempts++;
  
  // Check if we've exceeded max attempts
  if (initializationAttempts > MAX_INIT_ATTEMPTS) {
    console.error("Max initialization attempts reached");
    showFallbackSignIn(buttonContainer);
    return;
  }
  
  // Wait for Google Identity Services library
  if (!window.google || !window.google.accounts) {
    console.log("Google Identity Services library not loaded yet, waiting...");
    
    // Set up a listener for when it loads
    const handleGoogleLoad = () => {
      setTimeout(() => {
        initializeSignIn(buttonContainer, onSignIn);
      }, 100);
      window.removeEventListener('google-library-loaded', handleGoogleLoad);
    };
    
    window.addEventListener('google-library-loaded', handleGoogleLoad);
    
    // Fallback timeout
    setTimeout(() => {
      if (!window.google || !window.google.accounts) {
        console.warn("Google library load timeout");
        showFallbackSignIn(buttonContainer);
      }
    }, 10000);
    
    return;
  }

  isGsiLoaded = true;

  try {
    // Initialize Google Identity Services for ID token
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (credentialResponse) => {
        console.log("ID token received successfully");
        
        try {
          // Store the ID token
          authCredential = credentialResponse;
          
          // Try to get additional scopes if GAPI is available
          if (isGapiLoaded && window.gapi && window.gapi.auth2) {
            try {
              await requestAdditionalScopes();
              console.log("Additional scopes obtained successfully");
            } catch (error) {
              console.warn("Failed to get additional permissions, proceeding with ID token:", error);
            }
          } else {
            console.log("GAPI not ready, proceeding with ID token only");
          }
          
          if (onSignIn) {
            onSignIn(credentialResponse);
          }
        } catch (error) {
          console.error("Error processing sign-in:", error);
          if (onSignIn) {
            onSignIn(credentialResponse); // Still try to proceed
          }
        }
      },
      error_callback: (error) => {
        console.error("Google Sign-In error:", error);
        showSignInError(buttonContainer, "Sign-in failed. Please try again.");
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    // Render the Sign in with Google button
    if (buttonContainer) {
      try {
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
        
        console.log("Google Sign-In button rendered successfully");
      } catch (renderError) {
        console.error("Error rendering Google button:", renderError);
        showFallbackSignIn(buttonContainer);
      }
    }
    
  } catch (error) {
    console.error("Error initializing Google Sign-In:", error);
    showFallbackSignIn(buttonContainer);
  }
}

/**
 * Request additional OAuth scopes
 */
async function requestAdditionalScopes() {
  if (!window.gapi || !window.gapi.auth2) {
    throw new Error("GAPI auth2 not available");
  }

  return new Promise((resolve, reject) => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      
      if (!authInstance) {
        console.log("No auth instance available");
        return resolve();
      }
      
      // Check if user is already signed in with required scopes
      const currentUser = authInstance.currentUser.get();
      if (currentUser && currentUser.hasGrantedScopes && currentUser.hasGrantedScopes(SCOPES)) {
        const authResponse = currentUser.getAuthResponse();
        if (authResponse && authResponse.access_token) {
          accessToken = authResponse.access_token;
          console.log("User already has required scopes");
          return resolve();
        }
      }
      
      // Request additional scopes
      if (currentUser && currentUser.grant) {
        currentUser.grant({
          scope: SCOPES
        }).then((response) => {
          if (response && response.access_token) {
            accessToken = response.access_token;
            console.log("Additional scopes granted");
          }
          resolve();
        }).catch((error) => {
          console.warn("Error granting additional scopes:", error);
          resolve(); // Don't fail the entire auth flow
        });
      } else {
        resolve();
      }
    } catch (error) {
      console.warn("Exception in requestAdditionalScopes:", error);
      resolve(); // Don't fail the entire auth flow
    }
  });
}

/**
 * Initialize GAPI when available
 */
export function initializeGapi() {
  if (!window.gapi) {
    console.log("GAPI not available");
    return;
  }

  try {
    window.gapi.auth2.init({
      client_id: CLIENT_ID,
      scope: SCOPES
    }).then(() => {
      isGapiLoaded = true;
      console.log("GAPI Auth2 initialized successfully");
    }).catch((error) => {
      console.warn("GAPI Auth2 initialization failed:", error);
      isGapiLoaded = false;
    });
  } catch (error) {
    console.warn("Exception initializing GAPI:", error);
    isGapiLoaded = false;
  }
}

/**
 * Show fallback sign-in option when Google services fail
 */
function showFallbackSignIn(buttonContainer) {
  if (!buttonContainer) return;
  
  buttonContainer.innerHTML = `
    <div style="padding: 12px 24px; background: #f8f9fa; border: 1px solid #dadce0; 
                border-radius: 8px; text-align: center; color: #1f1f1f;">
      <div style="margin-bottom: 8px;">
        <strong>Google Sign-In Unavailable</strong>
      </div>
      <div style="font-size: 14px; color: #5f6368; margin-bottom: 12px;">
        Unable to connect to Google services. This may be due to:
        <ul style="text-align: left; margin: 8px 0; padding-left: 20px;">
          <li>Network connectivity issues</li>
          <li>Browser security settings</li>
          <li>Ad blockers or extensions</li>
        </ul>
      </div>
      <button onclick="window.location.reload()" 
              style="background: #1a73e8; color: white; border: none; padding: 8px 16px; 
                     border-radius: 4px; cursor: pointer; font-size: 14px;">
        Retry
      </button>
      <div style="font-size: 12px; color: #80868b; margin-top: 8px;">
        The app will work in offline mode with limited features
      </div>
    </div>
  `;
}

/**
 * Show sign-in error message
 */
function showSignInError(buttonContainer, message) {
  if (!buttonContainer) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    padding: 12px; background: #fef7f0; border: 1px solid #f9c23c; 
    border-radius: 8px; color: #b7791f; text-align: center; margin-top: 8px;
  `;
  errorDiv.textContent = message;
  
  buttonContainer.appendChild(errorDiv);
  
  // Remove error message after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

/**
 * Enhanced sign out with cleanup
 */
export function signOut() {
  console.log("Signing out...");
  
  try {
    // Sign out of Google Identity Services
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    // Sign out of OAuth2 if available
    if (window.gapi && window.gapi.auth2) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance) {
        authInstance.signOut().catch(error => {
          console.warn("Error signing out of GAPI:", error);
        });
      }
    }
  } catch (error) {
    console.warn("Error during sign out:", error);
  }
  
  // Clear stored credentials
  authCredential = null;
  accessToken = null;
  
  console.log("User has been signed out.");
}

/**
 * Get stored credential
 */
export function getCredential() {
  return authCredential;
}

/**
 * Get access token
 */
export function getAccessToken() {
  return accessToken;
}

/**
 * Check if user is signed in
 */
export function isSignedIn() {
  return authCredential !== null;
}

/**
 * Get detailed authentication status for debugging
 */
export function getAuthStatus() {
  return {
    hasCredential: !!authCredential,
    hasAccessToken: !!accessToken,
    isGapiLoaded,
    isGsiLoaded,
    initializationAttempts,
    googleAvailable: !!(window.google && window.google.accounts),
    gapiAvailable: !!window.gapi
  };
}

/**
 * Validate current authentication state
 */
export function validateAuth() {
  const status = getAuthStatus();
  
  if (!status.hasCredential) {
    throw new Error("No authentication credential available");
  }
  
  // Check if credential is expired (JWT tokens typically last 1 hour)
  if (authCredential && authCredential.credential) {
    try {
      const payload = JSON.parse(atob(authCredential.credential.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      if (currentTime >= expirationTime) {
        console.warn("Authentication token has expired");
        return { valid: false, reason: "Token expired" };
      }
    } catch (error) {
      console.warn("Error parsing JWT token:", error);
    }
  }
  
  return { valid: true };
}

/**
 * Refresh authentication if possible
 */
export async function refreshAuth() {
  try {
    if (window.gapi && window.gapi.auth2) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance) {
        const currentUser = authInstance.currentUser.get();
        if (currentUser) {
          const authResponse = await currentUser.reloadAuthResponse();
          if (authResponse && authResponse.access_token) {
            accessToken = authResponse.access_token;
            console.log("Authentication refreshed successfully");
            return true;
          }
        }
      }
    }
    return false;
  } catch (error) {
    console.error("Error refreshing authentication:", error);
    return false;
  }
}
