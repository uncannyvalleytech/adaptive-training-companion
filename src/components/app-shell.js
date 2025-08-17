/**
 * @file app-shell.js
 * This is the main Lit component that acts as the shell for the entire application.
 * It orchestrates the display of different views (like login, home, workout)
 * based on the application's state, primarily the user's authentication status.
 */

import { LitElement, html } from "lit";
import { initializeSignIn, getCredential } from "../services/google-auth.js";
import { getData, syncData, getQueuedWorkoutsCount } from "../services/api.js";
import "./workout-session.js";
import "./history-view.js";
import "./onboarding-flow.js";
import "./settings-view.js";
import "./workout-templates.js";
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

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
    offlineQueueCount: { type: Number },
    isBiometricsAvailable: { type: Boolean },
    lastCompletedWorkout: { type: Object }, // New property to hold the workout data for the summary screen
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
    this.offlineQueueCount = getQueuedWorkoutsCount();
    this.isBiometricsAvailable = false;
    this.lastCompletedWorkout = null;
    
    this._checkBiometricsAvailability();
  }

  static styles = [];

  connectedCallback() {
    super.connectedCallback();
    this.waitForGoogleLibrary();
    this.addEventListener('show-toast', (e) => this._showToast(e.detail.message, e.detail.type));
    this.addEventListener('workout-cancelled', this._exitWorkout.bind(this));
    this.addEventListener('workout-completed', this._onWorkoutCompleted.bind(this));
    window.addEventListener('user-signed-in', () => this.fetchUserData());
    window.addEventListener('theme-change', (e) => this._handleThemeChange(e.detail.theme));
    window.addEventListener('units-change', (e) => this._handleUnitsChange(e.detail.units));
    this.addEventListener('start-workout-with-template', this._startWorkoutWithTemplate.bind(this));
    window.addEventListener('offline-data-queued', (e) => this._handleOfflineQueue(e.detail.count));
    window.addEventListener('sync-complete', (e) => this._showToast(e.detail.message, e.detail.type));
    window.addEventListener('sync-failed', (e) => this._showToast(e.detail.message, e.detail.type));
    window.addEventListener('online', this._handleOnlineStatus.bind(this));
    this._applyTheme();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('user-signed-in', this.fetchUserData.bind(this));
    window.removeEventListener('theme-change', this._handleThemeChange.bind(this));
    window.removeEventListener('units-change', this._handleUnitsChange.bind(this));
    this.removeEventListener('start-workout-with-template', this._startWorkoutWithTemplate.bind(this));
    window.removeEventListener('offline-data-queued', this._handleOfflineQueue.bind(this));
    window.removeEventListener('sync-complete', this._showToast.bind(this));
    window.removeEventListener('sync-failed', this._showToast.bind(this));
    window.removeEventListener('online', this._handleOnlineStatus.bind(this));
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
  
  _handleOfflineQueue(count) {
    this.offlineQueueCount = count;
    this._showToast(`Workout saved offline. ${count} pending sync.`, "info");
  }

  _handleOnlineStatus() {
    this._showToast("Back online! Syncing data...", "info");
    syncData();
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
  
  async _checkBiometricsAvailability() {
      if (window.SimpleWebAuthnBrowser) {
          this.isBiometricsAvailable = await SimpleWebAuthnBrowser.isWebAuthnAvailable();
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
  
  async _shareWorkout(workout) {
      if (navigator.share) {
          try {
              const shareData = {
                  title: 'Workout Complete!',
                  text: `I just crushed my workout: "${workout.name}"! I completed it in ${Math.floor(workout.durationInSeconds / 60)} minutes with a total volume of ${workout.totalVolume} ${this.units}.`,
                  url: 'https://adaptive-training-companion.com', // Replace with your app's URL
              };
              await navigator.share(shareData);
              this._showToast("Workout shared successfully!", "success");
          } catch (err) {
              console.error('Error sharing:', err);
              this._showToast("Sharing failed.", "error");
          }
      } else {
          this._showToast("Web Share API is not supported in this browser.", "info");
      }
  }

  render() {
    const showNav = this.userCredential && !this.isWorkoutActive && this.userData && !this.showOnboarding && this.currentView !== 'summary';
    return html`
      ${this.renderToast()}
      ${this._renderCurrentView()}
      ${showNav ? this.renderBottomNav() : ''}
      ${this.offlineQueueCount > 0 ? this.renderOfflineStatus() : ''}
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
      return html`
        <header class="app-header">
          <h1>PROGRESSION</h1>
          <button 
            class="icon-btn" 
            @click=${() => this.currentView = 'settings'}
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 7.4 19a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 5 7.4a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0-.33 1.82l-.06.06a2 2 0 0 1 0 2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.82.33z"></path><path d="M12 12c-2.485 0-4.5 2.015-4.5 4.5S9.515 21 12 21s4.5-2.015 4.5-4.5S14.485 12 12 12z" clip-rule="evenodd" fill-rule="evenodd" d="M12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4z" d="M12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4zM12.22 2h-.44C9.79 2 8 3.79 8 6s1.79 4 4.22 4h.44C14.21 10 16 8.21 16 6s-1.79-4-3.78-4z" fill="var(--color-text-primary)"></path></svg>
          </button>
        </header>

        <div class="main-content">
          ${(() => {
            switch (this.currentView) {
              case "home":
                return this.renderHomeScreen();
              case "history":
                return html`<history-view .units=${this.units}></history-view>`;
              case "templates":
                return html`<workout-templates></workout-templates>`;
              case "settings":
                return this.renderSettingsScreen();
              case "summary":
                return this.renderWorkoutSummary();
              default:
                return this.renderHomeScreen();
            }
          })()}
        </div>
      `;
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
  
  renderOfflineStatus() {
    return html`
      <div class="offline-status">
        <p>Offline: ${this.offlineQueueCount} workout(s) pending sync.</p>
      </div>
    `;
  }

  renderLoginScreen() {
    return html`
      <div class="login-container">
        <h1>PROGRESSION</h1>
        <p>Your intelligent workout partner that adapts to you in real-time.</p>
        <div id="google-signin-button" aria-label="Sign in with Google button"></div>
        ${this.isBiometricsAvailable
          ? html`
              <button 
                class="btn-primary" 
                @click=${this._loginWithBiometrics}
                aria-label="Sign in with biometrics (Face ID or fingerprint)">
                Sign in with Biometrics
              </button>
            `
          : ''}
        ${!this.isGoogleLibraryLoaded
          ? html`<p aria-live="polite"><em>Loading Sign-In button...</em></p>`
          : ""}
      </div>
    `;
  }
  
  async _loginWithBiometrics() {
      try {
          const authResponse = await startAuthentication({
              challenge: 'your_biometric_challenge', 
              rpId: window.location.hostname,
              userVerification: 'preferred',
          });
          
          console.log("Biometric authentication successful!", authResponse);
          this._showToast("Signed in with biometrics!", "success");
          this._handleSignIn({ credential: 'biometric-token' });
      } catch (error) {
          console.error("Biometric authentication failed:", error);
          this._showToast("Biometric sign-in failed. Please try again.", "error");
      }
  }

  renderSkeletonHomeScreen() {
    return html`
      <div class="home-container container" aria-live="polite" aria-busy="true">
        <div class="welcome-message">
          <div class="skeleton skeleton-heading"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
        <div class="card">
          <div class="skeleton skeleton-progress-title"></div>
          <div class="skeleton skeleton-progress-stat"></div>
          <div class="skeleton skeleton-progress-stat"></div>
          <div class="skeleton skeleton-progress-stat"></div>
        </div>
        <div class="action-buttons-skeleton">
          <div class="skeleton skeleton-btn"></div>
          <div class="skeleton skeleton-btn"></div>
          <div class="skeleton skeleton-btn"></div>
        </div>
      </div>
    `;
  }

  renderErrorScreen() {
    return html`
      <div class="error-container container" role="alert">
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

    const lastWorkout = this.userData.workouts?.[0];
    const lastWorkoutDate = lastWorkout 
      ? new Date(lastWorkout.date).toLocaleDateString()
      : "Never";
      
    return html`
      <div class="home-container container">
        <div class="welcome-message">
          <h2>Welcome Back, ${this.userData.userEmail?.split('@')[0] || 'Athlete'}!</h2>
          <p>Ready to push your limits today?</p>
        </div>

        <div class="card stats-section" role="region" aria-labelledby="progress-title">
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
        
        ${lastWorkout ? html`
          <div class="card action-card social-share-card">
            <div class="card-text">
              <h3>Celebrate Your Progress!</h3>
              <p>Share your last workout with friends.</p>
            </div>
            <button class="btn-primary" @click=${() => this._shareWorkout(lastWorkout)}>
                Share This Workout
            </button>
          </div>
        ` : ''}

        <div class="home-action-cards">
          <div class="card link-card action-card" @click=${this._startWorkout}>
            <div class="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-8m0 0v-8m0 8h8m-8 0H4"></path></svg>
            </div>
            <div class="card-text">
              <h3>Start New Workout</h3>
              <p>Begin a new session from scratch.</p>
            </div>
          </div>
          <div class="card link-card action-card" @click=${() => this.currentView = 'templates'}>
            <div class="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div class="card-text">
              <h3>My Templates</h3>
              <p>Create or load a saved workout plan.</p>
            </div>
          </div>
          <div class="card link-card action-card" @click=${() => this.currentView = 'history'}>
            <div class="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17H2L12 3z"></path></svg>
            </div>
            <div class="card-text">
              <h3>Workout History</h3>
              <p>Review past workouts and track progress.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderWorkoutScreen() {
    return html`
      <workout-session 
        .units=${this.units}
        .workout=${this.workout}
        @workout-completed=${this._onWorkoutCompleted}
        @workout-cancelled=${this._onWorkoutCancelled}>
      </workout-session>
    `;
  }
  
  renderWorkoutSummary() {
    const lastWorkout = this.lastCompletedWorkout;
    if (!lastWorkout) {
        this.currentView = 'home';
        return;
    }
    const workoutDate = new Date(lastWorkout.date).toLocaleDateString();

    return html`
        <div class="container workout-summary-container">
            <header class="app-header">
                <h1>Workout Complete!</h1>
                <p>On ${workoutDate}</p>
            </header>

            <div class="card stats-section">
                <h3>Summary</h3>
                <div class="stat-item">
                    <span>Total Volume</span>
                    <span>${lastWorkout.totalVolume} ${this.units}</span>
                </div>
                <div class="stat-item">
                    <span>Duration</span>
                    <span>${Math.floor(lastWorkout.durationInSeconds / 60)} minutes</span>
                </div>
                <div class="stat-item">
                    <span>Total Sets</span>
                    <span>${lastWorkout.exercises.reduce((total, ex) => total + ex.completedSets.length, 0)}</span>
                </div>
            </div>

            <div class="card actions-section">
              <button class="btn-primary" @click=${() => this._shareWorkout(lastWorkout)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v-1a3 3 0 0 1 3-3h13a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3z"></path><path d="M12 2v2"></path><path d="M12 10v-2"></path><path d="M12 22v-2"></path></svg>
                Share This Workout
              </button>
              <button class="btn-secondary" @click=${() => this.currentView = 'home'}>
                Back to Home
              </button>
            </div>
        </div>
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
    const navItems = [
      { view: 'home', icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`, label: 'Home' },
      { view: 'history', icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17H2L12 3z"></path></svg>`, label: 'History' },
      { view: 'templates', icon: html`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`, label: 'Templates' },
    ];

    return html`
      <nav class="bottom-nav">
        ${navItems.map(item => html`
          <button 
            class="nav-button ${this.currentView === item.view ? 'active' : ''}" 
            @click=${() => this.currentView = item.view}
            aria-label=${item.label}
          >
            ${item.icon}
            <span>${item.label}</span>
          </button>
        `)}
      </nav>
    `;
  }

  _startWorkout() {
    this.isWorkoutActive = true;
    this.workout = { ...initialWorkout };
  }
  
  _startWorkoutWithTemplate(event) {
    const template = event.detail.template;
    this.workout = { ...template };
    this.isWorkoutActive = true;
  }

  _exitWorkout() {
    this.isWorkoutActive = false;
    this.currentView = "home";
  }

  _onWorkoutCompleted(event) {
    this.isWorkoutActive = false;
    this.currentView = "summary";
    this.lastCompletedWorkout = event.detail.workoutData;
    this.offlineQueueCount = getQueuedWorkoutsCount();
    const toastMessage = event.detail?.message || "Workout saved successfully!";
    const toastType = event.detail?.type || "success";
    this._showToast(toastMessage, toastType);
    this.fetchUserData();
  }
  
  _onWorkoutCancelled() {
    this.isWorkoutActive = false;
    this.currentView = "home";
    this._showToast("Workout discarded.", "info");
  }
}

customElements.define("app-shell", AppShell);
