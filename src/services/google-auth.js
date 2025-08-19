/**
 * @file google-auth.js
 * Fixed version for Sheets API access
 */

let authCredential = null;
let accessToken = null;
let isGapiLoaded = false;

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
  
  if (!window.google || !window.google.accounts) {
    console.error("Google Identity Services library not loaded.");
    return;
  }

  try {
    // Initialize Google Identity Services for ID token
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (credentialResponse) => {
        console.log("ID token received:", credentialResponse);
        
        // Store the ID token
        authCredential = credentialResponse;
        
        // Try to get additional scopes, but don't fail if it doesn't work
        try {
          if (isGapiLoaded) {
            await requestAdditionalScopes();
            console.log("Additional scopes obtained successfully");
          } else {
            console.log("GAPI not loaded, proceeding with ID token only");
          }
        } catch (error) {
          console.warn("Failed to get additional permissions, proceeding with ID token:", error);
          // Continue anyway - the ID token is sufficient for basic authentication
        }
        
        if (onSignIn) {
          onSignIn(credentialResponse);
        }
      },
    });

    // Render the Sign in with Google button
    window.google.accounts.id.renderButton(
      buttonContainer,
      { theme: "outline", size: "large", type: "standard" }
    );
    
    console.log("Google Sign-In button rendered successfully");
  } catch (error) {
    console.error("Error initializing Google Sign-In:", error);
  }
}

async function requestAdditionalScopes() {
  if (!window.gapi || !window.gapi.auth2) {
    console.log("GAPI auth2 not available");
    return;
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
      if (currentUser.hasGrantedScopes(SCOPES)) {
        accessToken = currentUser.getAuthResponse().access_token;
        console.log("User already has required scopes");
        return resolve();
      }
      
      // Request additional scopes
      currentUser.grant({
        scope: SCOPES
      }).then((response) => {
        accessToken = response.access_token;
        console.log("Additional scopes granted");
        resolve();
      }).catch((error) => {
        console.warn("Error granting additional scopes:", error);
        // Don't reject - continue with basic authentication
        resolve();
      });
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
    });
  } catch (error) {
    console.warn("Exception initializing GAPI:", error);
  }
}

export function signOut() {
  console.log("Signing out...");
  
  if (window.google && window.google.accounts) {
    window.google.accounts.id.disableAutoSelect();
  }
  
  // Also sign out of OAuth2 if available
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
