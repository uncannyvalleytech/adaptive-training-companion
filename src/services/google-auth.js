/**
 * @file google-auth.js
 * Fixed version with better timing and error handling
 */

let authCredential = null;
let accessToken = null;
let isGapiLoaded = false;
let isGsiLoaded = false;

const CLIENT_ID = "250304194666-7j8n6sslauu1betcqafmlb7pa779bimi.apps.googleusercontent.com";

// Required scopes for accessing user's Google Sheets
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'profile',
  'email'
].join(' ');

export function initializeSignIn(buttonContainer, onSignIn) {
  console.log("Initializing Google Sign-In...");
  
  // Wait for both libraries to be loaded
  if (!window.google || !window.google.accounts) {
    console.log("Google Identity Services library not loaded yet, waiting...");
    // Set up a listener for when it loads
    window.addEventListener('google-library-loaded', () => {
      setTimeout(() => initializeSignIn(buttonContainer, onSignIn), 100);
    });
    return;
  }

  isGsiLoaded = true;

  try {
    // Initialize Google Identity Services for ID token
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (credentialResponse) => {
        console.log("ID token received:", credentialResponse);
        
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
      },
      auto_select: false,
      cancel_on_tap_outside: true
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
      
      console.log("Google Sign-In button rendered successfully");
    }
    
  } catch (error) {
    console.error("Error initializing Google Sign-In:", error);
    
    // Show fallback message
    if (buttonContainer) {
      buttonContainer.innerHTML = `
        <div style="padding: 12px 24px; background: #f8f9fa; border: 1px solid #dadce0; border-radius: 4px; text-align: center;">
          <p style="margin: 0; color: #5f6368;">Sign-in temporarily unavailable</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #80868b;">Please try refreshing the page</p>
        </div>
      `;
    }
  }
}

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

// Initialize GAPI when available
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

export function signOut() {
  console.log("Signing out...");
  
  // Sign out of Google Identity Services
  if (window.google && window.google.accounts && window.google.accounts.id) {
    try {
      window.google.accounts.id.disableAutoSelect();
    } catch (error) {
      console.warn("Error disabling auto-select:", error);
    }
  }
  
  // Sign out of OAuth2 if available
  if (window.gapi && window.gapi.auth2) {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance) {
        authInstance.signOut().catch(console.warn);
      }
    } catch (error) {
      console.warn("Error signing out of GAPI:", error);
    }
  }
  
  authCredential = null;
  accessToken = null;
  console.log("User has been signed out.");
}

export function getCredential() {
  return authCredential;
}

export function getAccessToken() {
  return accessToken;
}

export function isSignedIn() {
  return authCredential !== null;
}

// Health check function
export function getAuthStatus() {
  return {
    hasCredential: !!authCredential,
    hasAccessToken: !!accessToken,
    isGapiLoaded,
    isGsiLoaded
  };
}
