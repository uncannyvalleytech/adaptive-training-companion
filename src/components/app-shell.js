/**
 * @file app-shell.js
 * This is the main Lit component that acts as the shell for the entire application.
 * It orchestrates the display of different views (like login, home, workout)
 * based on the application's state, primarily the user's authentication status.
 */

import { LitElement, html, css } from "lit";
import { initializeSignIn, getCredential } from "../services/google-auth.js";
import { getData } from "../services/api.js";

class AppShell extends LitElement {
  static properties = {
    userCredential: { type: Object },
    isGoogleLibraryLoaded: { type: Boolean },
    userData: { type: Object },
    loadingMessage: { type: String },
    errorMessage: { type: String },
  };

  constructor() {
    super();
    this.userCredential = null;
    this.isGoogleLibraryLoaded = false;
    this.userData = null;
    this.loadingMessage = "Initializing...";
    this.errorMessage = "";
  }

  connectedCallback() {
    super.connectedCallback();
    // This function will wait until the Google library is ready.
    this.waitForGoogleLibrary();
  }

  // This function repeatedly checks for the Google library.
  // This is a much more reliable way to handle the timing issue.
  waitForGoogleLibrary() {
    if (window.google && window.google.accounts) {
      this.isGoogleLibraryLoaded = true;
    } else {
      // If it's not ready, check again in a moment.
      setTimeout(() => this.waitForGoogleLibrary(), 100);
    }
  }

  // This function runs after the component's render is updated.
  // We wait until the google library is loaded before trying to set up the button.
  updated(changedProperties) {
    if (
      changedProperties.has("isGoogleLibraryLoaded") &&
      this.isGoogleLibraryLoaded
    ) {
      this.setupSignIn();
    }

    // When the userCredential changes (i.e., the user signs in), fetch their data.
    if (changedProperties.has("userCredential") && this.userCredential) {
      this.fetchUserData();
    }
  }

  setupSignIn() {
    const signInButtonContainer = this.shadowRoot.querySelector(
      "#google-signin-button"
    );
    if (signInButtonContainer) {
      initializeSignIn(signInButtonContainer, (credential) => {
        this._handleSignIn(credential);
      });
    }
  }

  _handleSignIn(credential) {
    this.userCredential = credential;
    console.log("User has been passed to the app shell:", this.userCredential);
  }

  async fetchUserData() {
    this.loadingMessage = "Fetching your data...";
    this.errorMessage = "";
    try {
      // The secure token from Google is what we'll use to authenticate with our backend.
      const token = getCredential().credential;
      const response = await getData(token);
      if (response.success === false) {
        throw new Error(response.error);
      }
      this.userData = response;
      this.loadingMessage = ""; // Clear the loading message on success
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      this.errorMessage = "Failed to load your data. Please try again.";
      this.loadingMessage = "";
    }
  }

  render() {
    if (!this.userCredential) {
      return this.renderLoginScreen();
    } else if (!this.userData && this.loadingMessage) {
      return this.renderLoadingScreen();
    } else if (this.errorMessage) {
      return this.renderErrorScreen();
    } else {
      return this.renderHomeScreen();
    }
  }

  renderLoginScreen() {
    return html`
      <style>
        /* This is a local style for this component only */
        .login-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
        }
      </style>
      <div class="login-container">
        <h1>Welcome to the Adaptive Training Companion</h1>
        <p>Please sign in to continue.</p>
        <!-- The Google Sign-In button will be rendered here -->
        <div id="google-signin-button"></div>
        <!-- Show a message if the library is slow to load -->
        ${!this.isGoogleLibraryLoaded
          ? html`<p><em>Loading Sign-In button...</em></p>`
          : ""}
      </div>
    `;
  }

  renderLoadingScreen() {
    return html`
      <style>
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
        }
      </style>
      <div class="loading-container">
        <p>${this.loadingMessage}</p>
      </div>
    `;
  }

  renderErrorScreen() {
    return html`
      <style>
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
          color: red;
        }
      </style>
      <div class="error-container">
        <p>${this.errorMessage}</p>
      </div>
    `;
  }

  renderHomeScreen() {
    return html`
      <div>
        <h1>Welcome Back, ${this.userData.userEmail}!</h1>
        <p>You have ${this.userData.workouts.length} workouts logged.</p>
        <p>Your user ID is: ${this.userData.userId}</p>
      </div>
    `;
  }
}

customElements.define("app-shell", AppShell);
