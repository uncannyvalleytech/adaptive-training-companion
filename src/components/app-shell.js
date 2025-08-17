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

  static styles = css`
    :host {
      display: block;
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      color: red;
    }

    .home-container {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .welcome-message {
      margin-bottom: 2rem;
    }

    .stats-section {
      background-color: var(--color-surface, #f8f9fa);
      border: 1px solid var(--color-border, #dee2e6);
      border-radius: var(--border-radius, 0.5rem);
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
    }

    .stats-title {
      margin: 0 0 1rem 0;
      color: var(--color-text-primary, #212529);
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--color-border, #dee2e6);
    }

    .stat-item:last-child {
      border-bottom: none;
    }

    .stat-label {
      color: var(--color-text-secondary, #6c757d);
    }

    .stat-value {
      font-weight: 600;
      color: var(--color-text-primary, #212529);
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .start-workout-btn {
      width: 100%;
      padding: 1rem;
      background-color: var(--color-primary, #0d6efd);
      color: white;
      border: none;
      border-radius: var(--border-radius, 0.5rem);
      cursor: pointer;
      font-size: 1.1rem;
      font-weight: 600;
      transition: background-color 0.2s ease;
    }

    .start-workout-btn:hover {
      background-color: var(--color-primary-hover, #0b5ed7);
    }

    .view-history-btn {
      width: 100%;
      padding: 1rem;
      background-color: var(--color-surface, #f8f9fa);
      color: var(--color-text-primary, #212529);
      border: 1px solid var(--color-border, #dee2e6);
      border-radius: var(--border-radius, 0.5rem);
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }

    .view-history-btn:hover {
      background-color: var(--color-border, #dee2e6);
    }

    .back-button {
      background: none;
      border: none;
      color: var(--color-primary, #0d6efd);
      cursor: pointer;
      font-size: 1rem;
      padding: 0.5rem 0;
      margin-bottom: 1rem;
      text-decoration: underline;
    }

    .back-button:hover {
      color: var(--color-primary-hover, #0b5ed7);
    }

    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid var(--color-border, #dee2e6);
      border-radius: 50%;
      border-top-color: var(--color-primary, #0d6efd);
      animation: spin 1s ease-in-out infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .retry-button {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background-color: var(--color-primary, #0d6efd);
      color: white;
      border: none;
      border-radius: var(--border-radius, 0.5rem);
      cursor: pointer;
      font-size: 1rem;
    }

    .retry-button:hover {
      background-color: var(--color-primary-hover, #0b5ed7);
    }
  `;

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
      <div class="home-container">
        <div class="welcome-message">
          <h1>Welcome Back, ${this.userData.userEmail?.split('@')[0] || 'Athlete'}!</h1>
          <p>Ready to push your limits today?</p>
        </div>

        <div class="stats-section">
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
          <button class="start-workout-btn" @click=${this._startWorkout}>
            🏋️ Start New Workout
          </button>
          <button class="view-history-btn" @click=${this._viewHistory}>
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
