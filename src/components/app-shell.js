/**
 * @file app-shell.js
 * This is the main Lit component that acts as the shell for the entire application.
 * It orchestrates the display of different views (like login, home, workout)
 * based on the application's state, primarily the user's authentication status.
 */

// We have updated the import path for Lit to work correctly with Vite.
import { LitElement, html } from "lit";
import { initializeSignIn, getCredential } from "../services/google-auth.js";
import { getData } from "../services/api.js";
import "../style.css"; // Import the main stylesheet
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

  static styles = []; // The component's styles will now be handled by the imported stylesheet.

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

  _retryFetchUserData() {
    this.errorMessage = "";
    this.fetchUserData();
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
      <div class="background-shapes">
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
      </div>
      <div class="login-container">
        <h1>Welcome to the Adaptive Training Companion</h1>
        <p>Your intelligent workout partner that adapts to you in real-time.</p>
        <br>
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
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>${this.loadingMessage}</p>
      </div>
    `;
  }

  renderErrorScreen() {
    return html`
      <div class="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>${this.errorMessage}</p>
        <button class="retry-button" @click=${this._retryFetchUserData}>
          Retry
        </button>
      </div>
    `;
  }

  renderHomeScreen() {
    const workoutCount = this.userData.workouts?.length || 0;
    const totalSets = this.userData.workouts?.reduce((total, workout) => {
      return total + workout.exercises.reduce((exerciseTotal, exercise) => {
        return exerciseTotal + (exercise.completedSets?.length || 0);
      }, 0);
    }, 0) || 0;

    const lastWorkoutDate = workoutCount > 0 
      ? new Date(this.userData.workouts[workoutCount - 1].date).toLocaleDateString()
      : "Never";

    return html`
      <div class="background-shapes">
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
      </div>
      <div class="home-container">
        <div class="welcome-message">
          <h1>Welcome Back, ${this.userData.userEmail?.split('@')[0] || 'Athlete'}!</h1>
          <p>Ready to push your limits today?</p>
        </div>

        <div class="glass-card stats-section">
          <h3 class="stats-title">Your Progress</h3>
          <div class="stat-item">
            <span class="stat-label">Total Workouts</span>
            <span class="stat-value">${workoutCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Sets Completed</span>
            <span class="stat-value">${totalSets}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Last Workout</span>
            <span class="stat-value">${lastWorkoutDate}</span>
          </div>
        </div>

        <div class="action-buttons">
          <button class="start-workout-btn btn-primary" @click=${this._startWorkout}>
            🏋️ Start New Workout
          </button>
          <button class="view-history-btn btn-secondary" @click=${this._viewHistory}>
            📊 View Workout History
          </button>
        </div>
      </div>
    `;
  }

  renderWorkoutScreen() {
    return html`
      <button class="back-button" @click=${this._exitWorkout}>
        ← Back to Home
      </button>
      <workout-session 
        @workout-completed=${this._onWorkoutCompleted}
        @workout-cancelled=${this._exitWorkout}>
      </workout-session>
    `;
  }

  renderHistoryScreen() {
    return html`
      <button class="back-button" @click=${this._backToHome}>
        ← Back to Home
      </button>
      <history-view></history-view>
    `;
  }

  _startWorkout() {
    this.isWorkoutActive = true;
  }

  _exitWorkout() {
    this.isWorkoutActive = false;
    this.currentView = "home";
  }

  _onWorkoutCompleted() {
    this.isWorkoutActive = false;
    this.currentView = "home";
    // Refresh user data to show updated stats
    this.fetchUserData();
  }

  _viewHistory() {
    this.currentView = "history";
  }

  _backToHome() {
    this.currentView = "home";
  }
}

customElements.define("app-shell", AppShell);
