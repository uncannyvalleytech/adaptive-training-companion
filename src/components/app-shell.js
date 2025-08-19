// src/components/app-shell.js

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
import "./motivational-elements.js"; // Ensures motivational elements are defined

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
    // Gamification properties
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
    
    // Gamification defaults
    this.userLevel = 1;
    this.userXP = 0;
    this.currentStreak = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Event listeners
    window.addEventListener('google-library-loaded', this._initAuth.bind(this));
    window.addEventListener('app-online', this._handleOnlineMode.bind(this));
    window.addEventListener('theme-change', (e) => this._applyTheme(e.detail.theme));
    window.addEventListener('units-change', (e) => (this.units = e.detail.units));
    
    // Component event listeners
    this.addEventListener('show-toast', (e) => this._showToast(e.detail.message, e.detail.type));
    this.addEventListener('workout-cancelled', this._exitWorkout.bind(this));
    this.addEventListener('workout-completed', this._onWorkoutCompleted.bind(this));
    this.addEventListener('start-workout-with-template', this._startWorkoutWithTemplate.bind(this));
    this.addEventListener('setView', (e) => this._setView(e.detail.view));
    this.addEventListener('sign-out', this._handleSignOut.bind(this));
    this.addEventListener('delete-data', this._handleDeleteData.bind(this));

    this._applyTheme();
    
    // Attempt to initialize auth immediately
    this._initAuth();
  }
  
  _initAuth() {
    const authPreference = localStorage.getItem('userAuthPreference');
    
    if (authPreference === 'google') {
        this.loadingMessage = "Authenticating session...";
        // Attempt automatic sign-in
        const credential = getCredential();
        const validation = validateAuth();

        if (credential && validation.valid) {
            console.log("Automatic sign-in: Existing credential is valid.");
            this._handleSignIn(credential, true);
        } else {
             console.log("No valid credential found, showing login.");
             this.loadingMessage = ""; // Stop loading to show login screen
             this.setupSignInButton();
        }
    } else if (authPreference === 'offline') {
        console.log("Starting in offline mode based on user preference.");
        this._startOfflineMode(true); // Start in offline mode without user interaction
    } else {
        // No preference set, show the login screen
        this.loadingMessage = "";
        this.setupSignInButton();
    }
  }

  setupSignInButton() {
      // Ensure this runs after the component has rendered
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
    if (!isAutoSignIn) {
      this._showToast("Successfully signed in!", "success");
    }
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
        if (!this.userData.onboardingComplete) {
          this.showOnboarding = true;
        }
        if (response.warning) {
          this._showToast(response.warning, "info", 6000);
        }
      } else {
        throw new Error(response.error || "Failed to fetch data.");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      this.errorMessage = "Could not load your profile. Please try again.";
    } finally {
      this.loadingMessage = "";
    }
  }

  // --- NEW METHOD: Start in Offline Mode ---
  _startOfflineMode(isAutoStart = false) {
    localStorage.setItem('userAuthPreference', 'offline');
    this.offlineMode = true;
    this.userCredential = { credential: 'offline-mode-user' }; // Mock credential
    
    // Check for local data first
    const localData = localStorage.getItem('userWorkoutData');
    if (localData) {
        this.userData = JSON.parse(localData);
        if (!this.userData.onboardingComplete) {
            this.showOnboarding = true;
        }
    } else {
        // Create a default structure if no local data exists
        this.userData = createDefaultUserData();
        this.showOnboarding = true; // Force onboarding for new offline profiles
    }

    if (!isAutoStart) {
      this._showToast("Started in offline mode. Data will be saved locally.", "info");
    }
    
    this._initializeGamificationData();
    this.loadingMessage = "";
  }

  // --- UPDATED: Handle Sign Out ---
  _handleSignOut() {
    // Clear Google session
    signOut(); 
    // Clear local preference and data
    localStorage.removeItem('userAuthPreference');
    
    // Reset all component state
    this.userCredential = null;
    this.userData = null;
    this.currentView = 'home';
    this._viewHistory = ['home'];
    
    this._showToast("You have been signed out.", "info");
    // Re-initialize auth to show login button
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
  
  // (All other methods like _onWorkoutCompleted, _handleOnboardingComplete, gamification, etc. remain the same)
  // ... [The rest of your existing methods from app-shell.js go here] ...
  
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
        this._showToast("Local data deleted. Sign in to delete server data.", "info");
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
  
  render() {
    return html`
      ${this.renderToast()}
      ${this._renderCurrentView()}
    `;
  }
  
  _renderCurrentView() {
    // 1. Authentication Check
    if (!this.userCredential) {
      return this.loadingMessage ? this.renderSkeletonScreen() : this.renderLoginScreen();
    }
    
    // 2. Error Check
    if (this.errorMessage) {
      return this.renderErrorScreen();
    }
    
    // 3. Loading/Data Check
    if (!this.userData) {
      return this.renderSkeletonScreen(this.loadingMessage);
    }
    
    // 4. Onboarding Check
    if (this.showOnboarding) {
      return html`<onboarding-flow @onboarding-complete=${this._handleOnboardingComplete}></onboarding-flow>`;
    }
    
    // 5. Readiness Modal Check
    if (this.showReadinessModal) {
      return html`<readiness-modal .onSubmit=${(data) => this._handleReadinessSubmit(data)} .onClose=${() => this.showReadinessModal = false}></readiness-modal>`;
    }

    // 6. Active Workout Check
    if (this.isWorkoutActive) {
      return html`<workout-session .workout=${this.workout}></workout-session>`;
    }

    // 7. Render Current View
    switch (this.currentView) {
      case "home": return this.renderHomeScreen();
      case "templates": return html`<workout-templates></workout-templates>`;
      case "history": return html`<history-view></history-view>`;
      case "settings": return html`<settings-view .theme=${this.theme} .units=${this.units}></settings-view>`;
      case "achievements": return html`<achievements-view></achievements-view>`;
      case "summary": return this.renderWorkoutSummary();
      default: return this.renderHomeScreen();
    }
  }

  // --- NEW RENDER METHOD: Login Screen ---
  renderLoginScreen() {
    return html`
      <div class="onboarding-container">
        <h1 class="display-text">PROGRESSION</h1>
        <p class="main-title" style="font-size: 1.25rem; margin-bottom: 2rem;">Adaptive Training Companion</p>
        
        <div class="card" style="width: 100%; max-width: 400px; text-align: center;">
            <p style="margin-bottom: 1rem; color: var(--color-text-secondary);">Choose how to save your data:</p>
            <div id="google-signin-button" style="margin-bottom: 1rem;">
                </div>
            <button class="btn btn-secondary" @click=${() => this._startOfflineMode(false)}>
                Stay Offline (Save to Device)
            </button>
        </div>
      </div>
    `;
  }
  
  // (The rest of your render methods: renderHomeScreen, renderWorkoutScreen, renderToast, etc.)
  // ... [Other render methods go here] ...
  renderHomeScreen() {
    return html`
        <div id="home-screen" class="container">
            <div class="home-header">
                <div class="greeting">Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},</div>
                <h1 class="display-text">PROGRESSION</h1>
            </div>
            <level-progress .currentLevel=${this.userLevel} .currentXP=${this.userXP}></level-progress>
            <workout-streak .streak=${this.currentStreak}></workout-streak>
            <nav class="home-nav-buttons">
                <button class="hub-option card-interactive" @click=${() => this.showReadinessModal = true}>Start Workout</button>
                <button class="hub-option card-interactive" @click=${() => this._setView('templates')}>Templates</button>
                <button class="hub-option card-interactive" @click=${() => this._setView('history')}>Progress</button>
                <button class="hub-option card-interactive" @click=${() => this._setView('achievements')}>Achievements</button>
            </nav>
            <button class="btn btn-icon" @click=${() => this._setView('settings')} aria-label="Settings">⚙️</button>
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
              ${this._renderHeader("Workout Complete!", false)}
              <div class="card">
                  <p>Duration: ${Math.floor(workout.durationInSeconds / 60)}m ${workout.durationInSeconds % 60}s</p>
                  <p>Total Volume: ${workout.totalVolume} ${this.units}</p>
                  <p>XP Gained: +${workout.xpGained || 100}</p>
              </div>
              <button class="btn btn-primary" @click=${() => this._setView('home')}>Done</button>
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
      // This is a simplification; a real implementation would determine the muscle groups for the day
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
