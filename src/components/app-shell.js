import { LitElement, html } from "lit";
import { initializeSignIn, signOut, validateAuth, getCredential } from "../services/google-auth.js";
import { getData, saveData, deleteData, syncData, getQueuedWorkoutsCount } from "../services/api.js";
import { WorkoutEngine } from "../services/workout-engine.js";

// Import all view components
import "./workout-session.js";
import "./history-view.js";
import "./onboarding-flow.js";
import "./settings-view.js";
import "./workout-templates.js";
import "./achievements-view.js";
import "./readiness-modal.js";
import "./motivational-elements.js";

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
    lastCompletedWorkout: { type: Object },
    workout: { type: Object },
    offlineMode: { type: Boolean },
    userLevel: { type: Number },
    userXP: { type: Number },
    currentStreak: { type: Number },
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
    this.lastCompletedWorkout = null;
    this.workout = null;
    this.offlineMode = !navigator.onLine;
    this._viewHistory = ['home'];
    this.userLevel = 1;
    this.userXP = 0;
    this.currentStreak = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('google-library-loaded', this._initAuth.bind(this));
    window.addEventListener('app-online', this._handleOnlineMode.bind(this));
    window.addEventListener('theme-change', (e) => this._applyTheme(e.detail.theme));
    window.addEventListener('units-change', (e) => (this.units = e.detail.units));
    this.addEventListener('show-toast', (e) => this._showToast(e.detail.message, e.detail.type));
    this.addEventListener('workout-cancelled', this._exitWorkout.bind(this));
    this.addEventListener('workout-completed', this._onWorkoutCompleted.bind(this));
    this.addEventListener('start-workout-with-template', this._startWorkoutWithTemplate.bind(this));
    this.addEventListener('setView', (e) => this._setView(e.detail.view));
    this.addEventListener('sign-out', this._handleSignOut.bind(this));
    this.addEventListener('delete-data', this._handleDeleteData.bind(this));
    this._applyTheme();
    this._initAuth();
  }
  
  _initAuth() {
    const authPreference = localStorage.getItem('userAuthPreference');
    if (authPreference === 'google') {
        this.loadingMessage = "Authenticating session...";
        const credential = getCredential();
        const validation = validateAuth();
        if (credential && validation.valid) {
            this._handleSignIn(credential, true);
        } else {
             this.loadingMessage = "";
             this.setupSignInButton();
        }
    } else if (authPreference === 'offline') {
        this._startOfflineMode(true);
    } else {
        this.loadingMessage = "";
        this.setupSignInButton();
    }
  }

  setupSignInButton() {
      setTimeout(() => {
        const signInButtonContainer = this.querySelector("#google-signin-button");
        if (signInButtonContainer) {
            initializeSignIn(signInButtonContainer, (credential) => {
              this._handleSignIn(credential, false);
            });
        }
      }, 50);
  }

  _applyTheme(newTheme) {
    if (newTheme) this.theme = newTheme;
    document.body.setAttribute('data-theme', this.theme);
  }

  _handleOnlineMode() {
    this.offlineMode = false;
    this._showToast("Connection restored! Syncing data...", "success");
    syncData();
  }

  _showToast(message, type = 'success', duration = 4000) {
    this.toast = { message, type };
    setTimeout(() => { this.toast = null; }, duration);
  }

  _handleSignIn(credential, isAutoSignIn = false) {
    this.userCredential = credential;
    localStorage.setItem('userAuthPreference', 'google');
    if (!isAutoSignIn) this._showToast("Successfully signed in!", "success");
    this.fetchUserData();
  }

  async fetchUserData() {
    this.loadingMessage = "Loading your data...";
    this.errorMessage = "";
    try {
      const token = this.userCredential?.credential;
      if (!token) throw new Error("Authentication token not available.");
      const response = await getData(token);
      if (response.success && response.data) {
        this.userData = response.data;
        this._initializeGamificationData();
        if (!this.userData.onboardingComplete) this.showOnboarding = true;
        if (response.warning) this._showToast(response.warning, "info", 6000);
      } else {
        throw new Error(response.error || "Failed to fetch data.");
      }
    } catch (error) {
      this.errorMessage = "Could not load your profile. Please try again.";
    } finally {
      this.loadingMessage = "";
    }
  }

  _startOfflineMode(isAutoStart = false) {
    localStorage.setItem('userAuthPreference', 'offline');
    this.offlineMode = true;
    this.userCredential = { credential: 'offline-mode-user' };
    const localData = localStorage.getItem('userWorkoutData');
    if (localData) {
        try {
            this.userData = JSON.parse(localData);
            if (!this.userData.onboardingComplete) this.showOnboarding = true;
        } catch (e) {
            this.userData = createDefaultUserData();
            this.showOnboarding = true;
        }
    } else {
        this.userData = createDefaultUserData();
        this.showOnboarding = true;
    }
    if (!isAutoStart) this._showToast("Started in offline mode.", "info");
    this._initializeGamificationData();
    this.loadingMessage = "";
  }

  _handleSignOut() {
    signOut(); 
    localStorage.removeItem('userAuthPreference');
    this.userCredential = null;
    this.userData = null;
    this.currentView = 'home';
    this._viewHistory = ['home'];
    this._showToast("You have been signed out.", "info");
    this.setupSignInButton();
  }
  
  _setView(view) {
      if (view !== this.currentView) {
          this._viewHistory.push(this.currentView);
          this.currentView = view;
      }
  }

  _goBack() {
      if (this.isWorkoutActive) {
          this._exitWorkout();
      } else if (this._viewHistory.length > 1) {
          this.currentView = this._viewHistory.pop();
      } else {
          this.currentView = 'home';
      }
  }
  
  _initializeGamificationData() {
    const workouts = this.userData?.workouts || [];
    this.userXP = this.userData?.totalXP || (workouts.length * 100);
    this.userLevel = Math.floor(this.userXP / 1000) + 1;
    this.currentStreak = this._calculateStreak(workouts);
  }
  
  _calculateStreak(workouts) {
    if (!workouts || workouts.length === 0) return 0;
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let today = new Date();
    today.setHours(0,0,0,0);
    if (sortedWorkouts.length > 0) {
        let lastWorkoutDate = new Date(sortedWorkouts[0].date);
        lastWorkoutDate.setHours(0,0,0,0);
        let diffDays = (today - lastWorkoutDate) / (1000 * 60 * 60 * 24);
        if (diffDays <= 1) {
            streak = 1;
            for (let i = 0; i < sortedWorkouts.length - 1; i++) {
                let current = new Date(sortedWorkouts[i].date);
                current.setHours(0,0,0,0);
                let previous = new Date(sortedWorkouts[i+1].date);
                previous.setHours(0,0,0,0);
                if ((current - previous) / (1000 * 60 * 60 * 24) === 1) {
                    streak++;
                } else {
                    break;
                }
            }
        }
    }
    return streak;
  }
  
  _handleOnboardingComplete(e) {
      const onboardingData = e.detail.userData;
      this.userData = { 
        ...createDefaultUserData(),
        ...this.userData, 
        ...onboardingData, 
        onboardingComplete: true
      };
      const engine = new WorkoutEngine(this.userData);
      this.userData.mesocycle = engine.generateMesocycle(['chest', 'back', 'legs', 'shoulders', 'arms']);
      this.showOnboarding = false;
      this._showToast("Profile created! Your new workout plan is ready.", "success");
      saveData(this.userData, this.userCredential.credential);
  }
  
  _exitWorkout() {
      this.isWorkoutActive = false;
      this.currentView = "home";
  }

  async _onWorkoutCompleted(event) {
      this.isWorkoutActive = false;
      this.lastCompletedWorkout = event.detail.workoutData;
      const xpGained = 100 + (this.lastCompletedWorkout.newPRs?.length || 0) * 25;
      this.userXP += xpGained;
      this.lastCompletedWorkout.xpGained = xpGained;
      if (Math.floor(this.userXP / 1000) + 1 > this.userLevel) {
          this._showToast("Level Up!", "success");
      }
      this.userLevel = Math.floor(this.userXP / 1000) + 1;
      this.userData.workouts.push(this.lastCompletedWorkout);
      this.userData.totalXP = this.userXP;
      this.currentStreak = this._calculateStreak(this.userData.workouts);
      await saveData(this.userData, this.userCredential.credential);
      this.currentView = "summary";
  }

  _startWorkoutWithTemplate(event) {
      this.workout = { ...event.detail.template };
      this.isWorkoutActive = true;
  }
  
  async _handleDeleteData() {
    const token = this.userCredential?.credential;
    if (!token || this.offlineMode) {
        localStorage.removeItem('userWorkoutData');
        this._showToast("Local data deleted.", "info");
        this._handleSignOut();
        return;
    }
    const response = await deleteData(token);
    if (response.success) {
        this._showToast("All data successfully deleted.", "success");
        this._handleSignOut();
    } else {
        this._showToast(`Error: ${response.error}`, "error");
    }
  }

  _getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
  
  render() {
    return html`
      ${this.renderToast()}
      ${this._renderCurrentView()}
    `;
  }
  
  // NEW: Reusable header with back button
  _renderHeader(title) {
    return html`
      <header class="app-header">
        <button class="btn btn-icon" @click=${this._goBack} aria-label="Back">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        </button>
        <h1>${title}</h1>
        <div style="width: 48px;"></div> <!-- Spacer for centering title -->
      </header>
    `;
  }

  _renderCurrentView() {
    if (!this.userCredential) return this.loadingMessage ? this.renderSkeletonScreen() : this.renderLoginScreen();
    if (this.errorMessage) return this.renderErrorScreen();
    if (!this.userData) return this.renderSkeletonScreen(this.loadingMessage);
    if (this.showOnboarding) return html`<onboarding-flow @onboarding-complete=${this._handleOnboardingComplete}></onboarding-flow>`;
    if (this.showReadinessModal) return html`<readiness-modal .onSubmit=${(data) => this._handleReadinessSubmit(data)} .onClose=${() => this.showReadinessModal = false}></readiness-modal>`;
    if (this.isWorkoutActive) return html`<workout-session .workout=${this.workout}></workout-session>`;

    // UPDATED: Added headers to all sub-views
    switch (this.currentView) {
      case "home": return this.renderHomeScreen();
      case "templates": return html`<div class="container">${this._renderHeader("Templates")}<workout-templates></workout-templates></div>`;
      case "history": return html`<div class="container">${this._renderHeader("Progress")}<history-view></history-view></div>`;
      case "settings": return html`<div class="container">${this._renderHeader("Settings")}<settings-view .theme=${this.theme} .units=${this.units}></settings-view></div>`;
      case "achievements": return html`<div class="container">${this._renderHeader("Achievements")}<achievements-view></achievements-view></div>`;
      case "summary": return this.renderWorkoutSummary();
      default: return this.renderHomeScreen();
    }
  }

  renderLoginScreen() {
    return html`
      <div class="onboarding-container">
        <h1 class="display-text">PROGRESSION</h1>
        <p class="main-title" style="font-size: 1.25rem; margin-bottom: 2rem;">Adaptive Training Companion</p>
        <div class="card" style="width: 100%; max-width: 400px; text-align: center;">
            <p style="margin-bottom: 1rem; color: var(--color-text-secondary);">Choose how to save your data:</p>
            <div id="google-signin-button" style="margin-bottom: 1rem;"></div>
            <button class="btn btn-secondary" @click=${() => this._startOfflineMode(false)}>
                Stay Offline (Save to Device)
            </button>
        </div>
      </div>
    `;
  }
  
  // UPDATED: Settings button moved and centered
  renderHomeScreen() {
    return html`
      <div id="home-screen" class="container">
        <div class="home-header">
          <div class="greeting">Good ${this._getTimeOfDay()},</div>
          <h1 class="display-text">PROGRESSION</h1>
        </div>
        <level-progress .currentLevel=${this.userLevel} .currentXP=${this.userXP} .xpToNext=${1000}></level-progress>
        ${this.currentStreak > 0 ? html`<workout-streak .streak=${this.currentStreak}></workout-streak>` : ''}
        <nav class="home-nav-buttons">
          <button class="hub-option card-interactive" @click=${() => this.showReadinessModal = true}>
            <div class="hub-option-icon">💪</div>
            <div class="hub-option-text"><h3>Start Workout</h3><p>Begin your training session</p></div>
          </button>
          <button class="hub-option card-interactive" @click=${() => this._setView('templates')}>
            <div class="hub-option-icon">📖</div>
            <div class="hub-option-text"><h3>Templates</h3><p>Custom workout routines</p></div>
          </button>
          <button class="hub-option card-interactive" @click=${() => this._setView('history')}>
            <div class="hub-option-icon">📊</div>
            <div class="hub-option-text"><h3>Progress</h3><p>Track your journey</p></div>
          </button>
          <button class="hub-option card-interactive" @click=${() => this._setView('achievements')}>
            <div class="hub-option-icon">🏆</div>
            <div class="hub-option-text"><h3>Achievements</h3><p>Unlock rewards</p></div>
          </button>
        </nav>
        <div class="home-footer-actions">
            <button class="btn btn-icon" @click=${() => this._setView('settings')} aria-label="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
        </div>
      </div>
    `;
  }
  
  renderToast() {
      if (!this.toast) return '';
      return html`<div class="toast-notification ${this.toast.type}" role="alert">${this.toast.message}</div>`;
  }
  
  renderSkeletonScreen(message = "Loading...") {
    return html`
      <div class="container" aria-live="polite" aria-busy="true">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-btn-large"></div>
        <p>${message}</p>
      </div>
    `;
  }

  renderErrorScreen() {
    return html`
      <div class="container error-container" role="alert">
        <h2>⚠️ Error</h2>
        <p>${this.errorMessage}</p>
        <button class="btn btn-primary" @click=${() => window.location.reload()}>Reload App</button>
      </div>
    `;
  }

  renderWorkoutSummary() {
      const workout = this.lastCompletedWorkout;
      if (!workout) return this.renderHomeScreen();
      return html`
          <div class="container">
              <header class="app-header"><h1>Workout Complete!</h1></header>
              <div class="card">
                  <p>Duration: ${Math.floor(workout.durationInSeconds / 60)}m ${workout.durationInSeconds % 60}s</p>
                  <p>Total Volume: ${workout.totalVolume} ${this.units}</p>
                  <p>XP Gained: +${workout.xpGained || 100}</p>
              </div>
              <button class="btn btn-primary cta-button" @click=${() => this._setView('home')}>Done</button>
          </div>
      `;
  }

  _handleReadinessSubmit(readinessData) {
      const engine = new WorkoutEngine(this.userData);
      const recoveryScore = engine.calculateRecoveryScore(readinessData);
      const readinessScore = engine.getDailyReadiness(recoveryScore);
      const plannedWorkout = this._getPlannedWorkout();
      if (plannedWorkout) {
          this.workout = engine.adjustWorkout(plannedWorkout, readinessScore);
          this._showToast(this.workout.adjustmentNote, "info");
          this.isWorkoutActive = true;
      } else {
          this._showToast("Could not generate a workout.", "error");
      }
      this.showReadinessModal = false;
  }

  _getPlannedWorkout() {
      if (!this.userData?.mesocycle?.weeks) return null;
      const engine = new WorkoutEngine(this.userData);
      const currentWeekData = this.userData.mesocycle.weeks.find(w => w.week === this.userData.currentWeek);
      return engine.generateDailyWorkout(['chest', 'shoulders', 'arms'], currentWeekData);
  }

  createRenderRoot() {
    return this;
  }
}

function createDefaultUserData() {
    return {
        onboardingComplete: false,
        workouts: [],
        templates: [],
        currentWeek: 1,
        workoutsCompletedThisMeso: 0,
        totalXP: 0,
        level: 1,
        baseMEV: { chest: 8, back: 10, shoulders: 8, arms: 6, legs: 14 }
    };
}

customElements.define("app-shell", AppShell);
