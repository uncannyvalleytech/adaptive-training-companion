/**
 * @file app-shell.js
 * This is the main Lit component that acts as the shell for the entire application.
 * It orchestrates the display of different views (like login, home, workout)
 * based on the application's state, primarily the user's authentication status.
 */

// We have updated the import path for Lit to work correctly with Vite.
import { LitElement, html, css } from "lit";
import { initializeSignIn, getCredential } from "../services/google-auth.js";
import { getData } from "../services/api.js";
import "./workout-session.js";
import "./history-view.js";

class AppShell extends LitElement {
  static properties = {
    userCredential: { type: Object },
    isGoogleLibraryLoaded: { type: Boolean },
    userData: { type: Object },
    loadingMessage: { type: String },
    errorMessage: { type: String },
    isWorkoutActive: { type: Boolean },
    currentView: { type: String },
  };

  constructor() {
    super();
    this.userCredential = null;
    this.isGoogleLibraryLoaded = false;
    this.userData = null;
    this.loadingMessage = "Initializing...";
    this.errorMessage = "";
    this.isWorkoutActive = false;
    this.currentView = "home";
  }

  connectedCallback() {
    super.connectedCallback();
    this.waitForGoogleLibrary();
  }

  waitForGoogleLibrary() {
    if (window.google && window.google.accounts) {
      this.isGoogleLibraryLoaded = true;
    } else {
      setTimeout(() => this.waitForGoogleLibrary(), 100);
    }
  }

  updated(changedProperties) {
    if (
      changedProperties.has("isGoogleLibraryLoaded") &&
      this.isGoogleLibraryLoaded
    ) {
      this.setupSignIn();
    }

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
      const token = getCredential().credential;
      const response = await getData(token);
      
      console.log("API Response:", response);
      
      if (response && response.data) {
        this.userData = response.data;
        this.loadingMessage = "";
      } else {
        throw new Error(response.error || "Unexpected API response format.");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      this.errorMessage = "Failed to load your data. Please try again.";
      this.loadingMessage = "";
    }
  }

  render() {
    if (!this.userCredential) {
      return this.renderLoginScreen();
    } else if (this.errorMessage) {
      return this.renderErrorScreen();
    } else if (!this.userData) {
      return this.renderLoadingScreen();
    } else if (this.isWorkoutActive) {
      return this.renderWorkoutScreen();
    } else {
      switch (this.currentView) {
        case "home":
          return this.renderHomeScreen();
        case "history":
          return this.renderHistoryScreen();
        default:
          return this.renderHomeScreen();
      }
    }
  }

  renderLoginScreen() {
    return html`
      <style>
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
        <div id="google-signin-button"></div>
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
      <style>
        .home-container {
          padding: 1rem;
          max-width: 800px;
          margin: 0 auto;
        }
        .start-workout-btn {
          width: 100%;
          padding: 1rem;
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          margin-top: 1rem;
        }
        .start-workout-btn:hover {
          background-color: var(--color-primary-hover);
        }
        .view-history-btn {
          width: 100%;
          padding: 1rem;
          background-color: var(--color-surface);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          cursor: pointer;
          margin-top: 1rem;
        }
      </style>
      <div class="home-container">
        <h1>Welcome Back, ${this.userData.userEmail}!</h1>
        <p>You have ${this.userData.workouts?.length || 0} workouts logged.</p>
        <button class="start-workout-btn" @click=${this._startWorkout}>Start Workout</button>
        <button class="view-history-btn" @click=${this._viewHistory}>View History</button>
      </div>
    `;
  }

  renderWorkoutScreen() {
    return html`<workout-session></workout-session>`;
  }

  renderHistoryScreen() {
    return html`<history-view></history-view>`;
  }

  _startWorkout() {
    this.isWorkoutActive = true;
  }

  _viewHistory() {
    this.currentView = "history";
  }
}

customElements.define("app-shell", AppShell);
