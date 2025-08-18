import { LitElement, html } from "lit";
import { initializeSignIn, getCredential } from "../services/google-auth.js";
import { getData, saveData } from "../services/api.js";
import { WorkoutEngine } from "../services/workout-engine.js";
import "./workout-session.js";
import "./history-view.js";
import "./onboarding-flow.js";
import "./settings-view.js";
import "./workout-templates.js";
import "./achievements-view.js";
import "./readiness-modal.js";
import { startAuthentication } from '@simplewebauthn/browser';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';

class AppShell extends LitElement {
  static properties = {
    userCredential: { type: Object },
    userData: { type: Object },
    loadingMessage: { type: String },
    errorMessage: { type: String },
    isWorkoutActive: { type: Boolean },
    currentView: { type: String },
    toast: { type: Object },
    showOnboarding: { type: Boolean },
    showReadinessModal: { type: Boolean },
    theme: { type: String },
    units: { type: String },
    isBiometricsAvailable: { type: Boolean },
    lastCompletedWorkout: { type: Object },
    workout: { type: Object },
  };

  constructor() {
    super();
    this.userCredential = null;
    this.userData = null;
    this.loadingMessage = "Initializing...";
    this.errorMessage = "";
    this.isWorkoutActive = false;
    this.currentView = "home";
    this.toast = null;
    this.showOnboarding = false;
    this.showReadinessModal = false;
    this.theme = localStorage.getItem('theme') || 'dark';
    this.units = localStorage.getItem('units') || 'lbs';
    this.isBiometricsAvailable = false;
    this.lastCompletedWorkout = null;
    this.workout = null;
    
    this._checkBiometricsAvailability();
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('google-library-loaded', this.setupSignIn.bind(this));
    this.addEventListener('show-toast', (e) => this._showToast(e.detail.message, e.detail.type));
    this.addEventListener('workout-cancelled', this._exitWorkout.bind(this));
    this.addEventListener('workout-completed', this._onWorkoutCompleted.bind(this));
    window.addEventListener('user-signed-in', () => this.fetchUserData());
    window.addEventListener('theme-change', (e) => this._handleThemeChange(e.detail.theme));
    this.addEventListener('start-workout-with-template', this._startWorkoutWithTemplate.bind(this));
    this._applyTheme();
  }
  
  firstUpdated() {
    this.setupSignIn();
  }

  _applyTheme() {
    document.body.setAttribute('data-theme', this.theme);
  }

  _handleThemeChange(theme) {
    this.theme = theme;
    this._applyTheme();
  }
  
  async _checkBiometricsAvailability() {
      if (window.SimpleWebAuthnBrowser) {
          this.isBiometricsAvailable = await startAuthentication.isWebAuthnAvailable();
      }
  }

  setupSignIn() {
    const signInButtonContainer = this.querySelector("#google-signin-button");
    if (signInButtonContainer) {
      initializeSignIn(signInButtonContainer, (credential) => {
        this._handleSignIn(credential);
      });
    }
  }

  _showToast(message, type = 'success', duration = 4000) {
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
          if (!this.userData.onboardingComplete) {
              this.showOnboarding = true;
          }
          this.loadingMessage = "";
        }, 1000);
      } else {
        throw new Error(response.error || "Unexpected API response format.");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      this.errorMessage = "Failed to load your data. Please try again.";
      this.loadingMessage = "";
    }
  }

  _handleOnboardingComplete(e) {
      const onboardingData = e.detail.userData;
      const fullUserData = { ...this.userData, ...onboardingData, onboardingComplete: true, workoutsCompletedThisMeso: 0 };
      const engine = new WorkoutEngine(fullUserData);
      const muscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms'];
      const mesocycle = engine.generateMesocycle(muscleGroups);
      this.userData = {
        ...fullUserData,
        mesocycle: mesocycle,
        currentWeek: 1,
      };
      const token = getCredential().credential;
      saveData(this.userData, token);
      this.showOnboarding = false;
      this._showToast("Profile created! Your new workout plan is ready.", "success");
  }

  _retryFetchUserData() {
    this.errorMessage = "";
    this.fetchUserData();
  }

  _triggerConfetti() {
    const canvas = this.querySelector('#confetti-canvas');
    if (!canvas) return;
    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
    myConfetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  }

  render() {
    return html`
      ${this.renderToast()}
      ${this._renderCurrentView()}
      <canvas id="confetti-canvas"></canvas>
    `;
  }
  
  _renderCurrentView() {
    if (!this.userCredential) return this.renderLoginScreen();
    if (this.errorMessage) return this.renderErrorScreen();
    if (!this.userData) return this.renderSkeletonHomeScreen();
    if (this.showOnboarding) return html`<onboarding-flow @onboarding-complete=${this._handleOnboardingComplete}></onboarding-flow>`;
    
    if (this.showReadinessModal) {
        return html`
            <readiness-modal
                @onClose=${() => this.showReadinessModal = false}
                @onSubmit=${this._handleReadinessSubmit}
            ></readiness-modal>
        `;
    }

    if (this.isWorkoutActive) return this.renderWorkoutScreen();

    switch (this.currentView) {
        case "home": return this.renderHomeScreen();
        case "templates": return html`<workout-templates @setView=${e => this.currentView = e.detail.view}></workout-templates>`;
        case "history": return html`<history-view @setView=${e => this.currentView = e.detail.view}></history-view>`;
        case "settings": return html`<settings-view @setView=${e => this.currentView = e.detail.view}></settings-view>`;
        case "summary": return this.renderWorkoutSummary();
        default: return this.renderHomeScreen();
    }
  }

  renderToast() {
    if (!this.toast) return '';
    return html`<div class="toast-notification ${this.toast.type}" role="alert">${this.toast.message}</div>`;
  }
  
  renderLoginScreen() {
    return html`
      <div class="login-container">
        <h1>PROGRESSION</h1>
        <p>Your intelligent workout partner that adapts to you in real-time.</p>
        <div id="google-signin-button" aria-label="Sign in with Google button"></div>
      </div>
    `;
  }

  renderSkeletonHomeScreen() {
    return html`
      <div class="container" aria-live="polite" aria-busy="true">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-divider"></div>
        <div class="skeleton skeleton-btn-large"></div>
        <div class="skeleton skeleton-btn-large"></div>
        <div class="skeleton skeleton-btn-large"></div>
      </div>
    `;
  }

  renderErrorScreen() {
    return html`
      <div class="container error-container" role="alert">
        <h2>Oops! Something went wrong</h2>
        <p>${this.errorMessage}</p>
        <button class="cta-button" @click=${this._retryFetchUserData}>Retry</button>
      </div>
    `;
  }

  renderHomeScreen() {
    return html`
      <div id="home-screen" class="container">
        <h1 class="main-title">PROGRESSION</h1>
        <div class="divider"></div>
        <nav class="home-nav-buttons">
          <button class="hub-option home-nav-btn" @click=${() => this.showReadinessModal = true}>
            <div class="hub-option-icon">▶️</div>
            <div class="hub-option-text"><h3>Start Next Workout</h3></div>
          </button>
          <button class="hub-option home-nav-btn" @click=${() => this.currentView = 'templates'}>
            <div class="hub-option-icon">📖</div>
            <div class="hub-option-text"><h3>Template Portal</h3></div>
          </button>
          <button class="hub-option home-nav-btn" @click=${() => this.currentView = 'history'}>
            <div class="hub-option-icon">📊</div>
            <div class="hub-option-text"><h3>Performance Summary</h3></div>
          </button>
        </nav>
        <button class="home-icon-btn" @click=${() => this.currentView = 'settings'} aria-label="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </div>
    `;
  }

  renderWorkoutScreen() {
    return html`
      <workout-session 
        .workout=${this.workout}
        @workout-completed=${this._onWorkoutCompleted}
        @workout-cancelled=${this._exitWorkout}
        @setView=${e => this.currentView = e.detail.view}>
      </workout-session>
    `;
  }
  
  renderWorkoutSummary() {
    const lastWorkout = this.lastCompletedWorkout;
    if (!lastWorkout) {
        this.currentView = 'home';
        return;
    }
    return html`
        <div id="workout-summary-view" class="container">
            <div class="workout-header"><h2>Workout Complete!</h2></div>
            <div class="summary-stats-grid">
              <div class="stat-card"><h4>Time</h4><p>${Math.floor(lastWorkout.durationInSeconds / 60)}m ${lastWorkout.durationInSeconds % 60}s</p></div>
              <div class="stat-card"><h4>Volume</h4><p>${Math.round(lastWorkout.totalVolume)} ${this.units}</p></div>
              <div class="stat-card"><h4>Sets</h4><p>${lastWorkout.exercises.reduce((acc, ex) => acc + ex.completedSets.length, 0)}</p></div>
              <div class="stat-card"><h4>PRs</h4><p>${lastWorkout.newPRs?.length || 0}</p></div>
            </div>
            <div class="summary-actions"><button class="cta-button" @click=${() => this.currentView = 'home'}>Done</button></div>
        </div>
    `;
  }

  _getPlannedWorkout() {
    if (this.userData && this.userData.mesocycle) {
        const engine = new WorkoutEngine(this.userData);
        const currentWeekPlan = this.userData.mesocycle.weeks[this.userData.currentWeek - 1];
        const muscleGroupsForDay = ['chest', 'shoulders', 'arms']; 
        return engine.generateDailyWorkout(muscleGroupsForDay, currentWeekPlan);
    }
    return null;
  }

  _handleReadinessSubmit(e) {
    const readinessData = e.detail;
    const engine = new WorkoutEngine(this.userData);
    const recoveryScore = engine.calculateRecoveryScore(readinessData);
    const readinessScore = engine.getDailyReadiness(recoveryScore);
    const plannedWorkout = this._getPlannedWorkout();
    
    if (plannedWorkout) {
        const adjustedWorkout = engine.adjustWorkout(plannedWorkout, readinessScore);
        this.workout = adjustedWorkout;
        this._showToast(adjustedWorkout.adjustmentNote, "info");
        this.isWorkoutActive = true;
    } else {
        this._showToast("Could not generate workout.", "error");
    }
    this.showReadinessModal = false;
  }
  
  _startWorkoutWithTemplate(event) {
    this.workout = { ...event.detail.template };
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
    if (this.lastCompletedWorkout.newPRs?.length > 0) {
        this._triggerConfetti();
    }
    
    // --- LONG-TERM PROGRESSION LOGIC ---
    const workoutsThisMeso = (this.userData.workoutsCompletedThisMeso || 0) + 1;
    const workoutsPerWeek = this.userData.daysPerWeek || 4;
    const workoutsInMeso = workoutsPerWeek * 4; // 4-week progression cycle

    let updatedUserData = { ...this.userData, workoutsCompletedThisMeso: workoutsThisMeso };

    if (workoutsThisMeso >= workoutsInMeso) {
        this._showToast("Mesocycle complete! Adapting your plan for next month...", "success");
        const engine = new WorkoutEngine(updatedUserData);
        
        // 1. Adapt volume landmarks
        const newBaseMEV = engine.adaptVolumeLandmarks();
        updatedUserData.baseMEV = newBaseMEV;

        // 2. Generate a new, harder mesocycle
        const newEngine = new WorkoutEngine(updatedUserData);
        const muscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms'];
        const newMesocycle = newEngine.generateMesocycle(muscleGroups);
        
        // 3. Reset for the next cycle
        updatedUserData.mesocycle = newMesocycle;
        updatedUserData.workoutsCompletedThisMeso = 0;
        updatedUserData.currentWeek = 1;

        this._showToast("Your new training plan is ready!", "success");
    }
    
    this.userData = updatedUserData;
    const token = getCredential().credential;
    saveData(this.userData, token); // Save the updated progress
    this.fetchUserData(); // Refresh data to reflect changes
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("app-shell", AppShell);
