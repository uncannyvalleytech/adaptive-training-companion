/**
 * @file app-shell.js
 * This is the main Lit component that acts as the shell for the entire application.
 * It orchestrates the display of different views (like login, home, workout)
 * based on the application's state, primarily the user's authentication status.
 */

import { LitElement, html } from "lit";
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
    toast: { type: Object },
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
    this.toast = null;
  }

  // This component will use styles from the global stylesheet
  static styles = [];

  connectedCallback() {
    super.connectedCallback();
    this.waitForGoogleLibrary();
    this.addEventListener('show-toast', (e) => this._showToast(e.detail.message, e.detail.type));
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

  _showToast(message, type = 'success', duration = 3000) {
    this.toast = { message, type };
    setTimeout(() => {
      this.toast = null;
    }, duration);
  }

  _handleSignIn(credential) {
    this.userCredential = credential;
    this._showToast("Successfully signed in!", "success");
  }

  async fetchUserData() {
    this.loadingMessage = "Fetching your data...";
    this.errorMessage = "";
    try {
      const token = getCredential().credential;
      const response = await getData(token);
      
      if (response && response.data) {
        setTimeout(() => {
          this.userData = response.data;
          this.loadingMessage = "";
        }, 1000);
      } else {
        throw new Error(response.error || "Unexpected API response format.");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      this.errorMessage = "Failed to load your data. Please try again.";
      this._showToast(this.errorMessage, "error");
      this.loadingMessage = "";
    }
  }

  _retryFetchUserData() {
    this.errorMessage = "";
    this.fetchUserData();
  }

  render() {
    const showNav = this.userCredential && !this.isWorkoutActive && this.userData;
    return html`
      ${this.renderToast()}
      ${this._renderCurrentView()}
      ${showNav ? this.renderBottomNav() : ''}
    `;
  }
  
  _renderCurrentView() {
    if (!this.userCredential) {
      return this.renderLoginScreen();
    } else if (this.errorMessage) {
      return this.renderErrorScreen();
    } else if (!this.userData) {
      return this.renderSkeletonHomeScreen();
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

  renderToast() {
    if (!this.toast) return '';
    return html`
      <div class="toast-notification ${this.toast.type}" role="alert">
        ${this.toast.message}
      </div>
    `;
  }

  renderLoginScreen() {
    return html`
      <div class="login-container">
        <h1>Adaptive Training Companion</h1>
        <p>Your intelligent workout partner that adapts to you in real-time.</p>
        <div id="google-signin-button" aria-label="Sign in with Google button"></div>
        ${!this.isGoogleLibraryLoaded
          ? html`<p aria-live="polite"><em>Loading Sign-In button...</em></p>`
          : ""}
      </div>
    `;
  }

  renderSkeletonHomeScreen() {
    return html`
      <div class="home-container" aria-live="polite" aria-busy="true">
        <div class="welcome-message">
          <div class="skeleton" style="height: var(--font-size-xxl); width: 80%; margin-bottom: var(--space-2);"></div>
          <div class="skeleton" style="height: var(--font-size-md); width: 60%;"></div>
        </div>
        <div class="glass-card">
          <div class="skeleton" style="height: var(--font-size-lg); width: 40%; margin-bottom: var(--space-4);"></div>
          <div class="skeleton" style="height: 1.5rem; width: 100%; margin-bottom: var(--space-2);"></div>
          <div class="skeleton" style="height: 1.5rem; width: 100%; margin-bottom: var(--space-2);"></div>
          <div class="skeleton" style="height: 1.5rem; width: 100%;"></div>
        </div>
        <div class="action-buttons">
          <div class="skeleton" style="height: 44px; width: 200px; border-radius: var(--border-radius-md);"></div>
        </div>
      </div>
    `;
  }

  renderErrorScreen() {
    return html`
      <div class="error-container" role="alert">
        <h2>Oops! Something went wrong</h2>
        <p>${this.errorMessage}</p>
        <button class="btn-primary" @click=${this._retryFetchUserData}>
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

        <div class="glass-card stats-section" role="region" aria-labelledby="progress-title">
          <h3 id="progress-title">Your Progress</h3>
          <div class="stat-item">
            <span>Total Workouts</span>
            <span>${workoutCount}</span>
          </div>
          <div class="stat-item">
            <span>Total Sets Completed</span>
            <span>${totalSets}</span>
          </div>
          <div class="stat-item">
            <span>Last Workout</span>
            <span>${lastWorkoutDate}</span>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-primary" @click=${this._startWorkout} aria-label="Start a new workout">
            Start New Workout
          </button>
        </div>
      </div>
    `;
  }

  renderWorkoutScreen() {
    return html`
      <workout-session 
        @workout-completed=${this._onWorkoutCompleted}
        @workout-cancelled=${this._exitWorkout}>
      </workout-session>
    `;
  }

  renderHistoryScreen() {
    return html`<history-view></history-view>`;
  }

  renderBottomNav() {
    return html`
      <nav class="bottom-nav">
        <button 
          class="nav-button ${this.currentView === 'home' ? 'active' : ''}" 
          @click=${() => this.currentView = 'home'}
          aria-label="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
          <span>Home</span>
        </button>
        <button 
          class="nav-button ${this.currentView === 'history' ? 'active' : ''}" 
          @click=${() => this.currentView = 'history'}
          aria-label="History"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 14.25v4.5A2.25 2.25 0 006 21h12a2.25 2.25 0 002.25-2.25v-4.5M3.75 14.25L12 18.75m0 0L20.25 14.25M12 18.75v-15" /></svg>
          <span>History</span>
        </button>
      </nav>
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
    this._showToast("Workout saved successfully!", "success");
    this.fetchUserData();
  }
}

customElements.define("app-shell", AppShell);
