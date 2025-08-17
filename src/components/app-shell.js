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
import "./onboarding-flow.js";
import "./settings-view.js";
import "./workout-templates.js";

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
    showOnboarding: { type: Boolean },
    theme: { type: String },
    units: { type: String },
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
    this.showOnboarding = false;
    this.theme = localStorage.getItem('theme') || 'dark';
    this.units = localStorage.getItem('units') || 'lbs';
  }

  static styles = [];

  connectedCallback() {
    super.connectedCallback();
    this.waitForGoogleLibrary();
    this.addEventListener('show-toast', (e) => this._showToast(e.detail.message, e.detail.type));
    this.addEventListener('workout-cancelled', this._exitWorkout.bind(this));
    window.addEventListener('user-signed-in', () => this.fetchUserData());
    window.addEventListener('theme-change', (e) => this._handleThemeChange(e.detail.theme));
    window.addEventListener('units-change', (e) => this._handleUnitsChange(e.detail.units));
    this._applyTheme();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('user-signed-in', this.fetchUserData.bind(this));
    window.removeEventListener('theme-change', this._handleThemeChange.bind(this));
    window.removeEventListener('units-change', this._handleUnitsChange.bind(this));
  }
  
  _applyTheme() {
    document.body.setAttribute('data-theme', this.theme);
  }

  _handleThemeChange(theme) {
    this.theme = theme;
    this._applyTheme();
  }
  
  _handleUnitsChange(units) {
    this.units = units;
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
    window.dispatchEvent(new CustomEvent('user-signed-in'));
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
          if (!this.userData.workouts || this.userData.workouts.length === 0) {
              if (localStorage.getItem('onboardingComplete') !== 'true') {
                  this.showOnboarding = true;
              }
          }
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

  _handleOnboardingComplete() {
      localStorage.setItem('onboardingComplete', 'true');
      this.showOnboarding = false;
  }

  _retryFetchUserData() {
    this.errorMessage = "";
    this.fetchUserData();
  }

  render() {
    const showNav = this.userCredential && !this.isWorkoutActive && this.userData && !this.showOnboarding;
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
    } else if (this.showOnboarding) {
        return html`<onboarding-flow @onboarding-complete=${this._handleOnboardingComplete}></onboarding-flow>`;
    } else if (this.isWorkoutActive) {
      return this.renderWorkoutScreen();
    } else {
      switch (this.currentView) {
        case "home":
          return this.renderHomeScreen();
        case "history":
          return html`<history-view .units=${this.units}></history-view>`;
        case "templates":
          return html`<workout-templates></workout-templates>`;
        case "settings":
          return this.renderSettingsScreen();
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
        .units=${this.units}
        @workout-completed=${this._onWorkoutCompleted}
        @workout-cancelled=${this._onWorkoutCancelled}>
      </workout-session>
    `;
  }

  renderHistoryScreen() {
    return html`
      <history-view
        .units=${this.units}
      ></history-view>
    `;
  }
  
  renderSettingsScreen() {
    return html`
      <settings-view
        .theme=${this.theme}
        .units=${this.units}
      ></settings-view>
    `;
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
        <button
          class="nav-button ${this.currentView === 'templates' ? 'active' : ''}"
          @click=${() => this.currentView = 'templates'}
          aria-label="Workout Templates"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 100 1.5.75.75 0 000-1.5zM12 12a.75.75 0 100 1.5.75.75 0 000-1.5zM12 17.25a.75.75 0 100 1.5.75.75 0 000-1.5zM12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>
          <span>Templates</span>
        </button>
        <button 
          class="nav-button ${this.currentView === 'settings' ? 'active' : ''}" 
          @click=${() => this.currentView = 'settings'}
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.125 1.125 0 011.97.426c1.558.337 2.25 2.274 1.25 3.593a1.125 1.125 0 01-.426 1.97c1.756.426 1.756 2.924 0 3.35a1.125 1.125 0 01.426 1.97c1.29.92 2.052 2.302 1.25 3.593a1.125 1.125 0 01-.426 1.97c-1.756.426-2.924-1.756-3.35 0a1.125 1.125 0 01-1.97.426c-1.558.337-2.25-2.274-1.25-3.593a1.125 1.125 0 01-.426-1.97c-1.756-.426-1.756-2.924 0-3.35a1.125 1.125 0 01-.426-1.97c-1.29-.92-2.052-2.302-1.25-3.593a1.125 1.125 0 01-.426-1.97z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 12c-2.485 0-4.5 2.015-4.5 4.5S9.515 21 12 21s4.5-2.015 4.5-4.5S14.485 12 12 12z" clip-rule="evenodd" fill-rule="evenodd" /></svg>
          <span>Settings</span>
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
  
  _onWorkoutCancelled() {
    this.isWorkoutActive = false;
    this.currentView = "home";
    this._showToast("Workout discarded.", "info");
  }
}

customElements.define("app-shell", AppShell);
