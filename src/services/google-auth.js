/**
 * @file google-auth.js
 * Updated to handle Sheets API access
 */

let authCredential = null;
let accessToken = null;

const CLIENT_ID = "250304194666-7j8n6sslauu1betcqafmlb7pa779bimi.apps.googleusercontent.com";

// Required scopes for accessing user's Google Sheets
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'profile',
  'email'
].join(' ');

export function initializeSignIn(buttonContainer, onSignIn) {
  if (!window.google || !window.google.accounts) {
    console.error("Google Identity Services library not loaded.");
    return;
  }

  try {
    // Initialize Google Identity Services for ID token
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (credentialResponse) => {
        console.log("ID token received, now requesting access token...");
        
        // Store the ID token
        authCredential = credentialResponse;
        
        // Request additional scopes for Sheets access
        try {
          await requestAdditionalScopes();
          if (onSignIn) {
            onSignIn(credentialResponse);
          }
        } catch (error) {
          console.error("Failed to get additional permissions:", error);
          // You might want to show an error message to the user here
        }
      },
    });

    // Render the Sign in with Google button
    window.google.accounts.id.renderButton(
      buttonContainer,
      { theme: "outline", size: "large", type: "standard" }
    );
  } catch (error) {
    console.error("Error initializing Google Sign-In:", error);
  }
}

async function requestAdditionalScopes() {
  return new Promise((resolve, reject) => {
    // Load the OAuth2 library
    window.gapi.load('auth2', () => {
      window.gapi.auth2.init({
        client_id: CLIENT_ID,
      }).then(() => {
        const authInstance = window.gapi.auth2.getAuthInstance();
        
        // Request additional scopes
        authInstance.signIn({
          scope: SCOPES
        }).then((googleUser) => {
          // Get the access token
          accessToken = googleUser.getAuthResponse().access_token;
          console.log("Access token obtained for Sheets API");
          resolve();
        }).catch((error) => {
          console.error("Error getting additional scopes:", error);
          reject(error);
        });
      }).catch(reject);
    });
  });
}

export function signOut() {
  if (window.google && window.google.accounts) {
    window.google.accounts.id.disableAutoSelect();
  }
  
  // Also sign out of OAuth2
  if (window.gapi && window.gapi.auth2) {
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (authInstance) {
      authInstance.signOut();
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
