import { LitElement, html } from "lit";
import { initializeSignIn, getCredential, signOut, getAuthStatus, validateAuth } from "../services/google-auth.js";
import { getData, saveData, deleteData, syncData } from "../services/api.js";
import { WorkoutEngine } from "../services/workout-engine.js";
import "./workout-session.js";
import "./history-view.js";
import "./onboarding-flow.js";
import "./settings-view.js";
import "./workout-templates.js";
import "./achievements-view.js";
import "./readiness-modal.js";

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
    retryCount: { type: Number },
    // Gamification properties
    userLevel: { type: Number },
    userXP: { type: Number },
    currentStreak: { type: Number },
    showCelebration: { type: Boolean },
    celebrationData: { type: Object },
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
    this.offlineMode = false;
    this.retryCount = 0;
    this._viewHistory = ['home'];
    
    // Gamification defaults
    this.userLevel = 1;
    this.userXP = 0;
    this.currentStreak = 0;
    this.showCelebration = false;
    this.celebrationData = null;
  }

  connectedCallback() {
    super.connectedCallback();
    
    // Event listeners
    window.addEventListener('google-library-loaded', this.setupSignIn.bind(this));
    window.addEventListener('app-offline-mode', this._handleOfflineMode.bind(this));
    window.addEventListener('app-online', this._handleOnlineMode.bind(this));
    window.addEventListener('user-signed-in', () => this.fetchUserData());
    window.addEventListener('theme-change', (e) => this._handleThemeChange(e.detail.theme));
    
    // Component event listeners
    this.addEventListener('show-toast', (e) => this._showToast(e.detail.message, e.detail.type));
    this.addEventListener('workout-cancelled', this._exitWorkout.bind(this));
    this.addEventListener('workout-completed', this._onWorkoutCompleted.bind(this));
    this.addEventListener('start-workout-with-template', this._startWorkoutWithTemplate.bind(this));
    this.addEventListener('change-view', this._handleChangeView.bind(this));
    this.addEventListener('sign-out', this._handleSignOut);
    this.addEventListener('delete-data', this._handleDeleteData);

    this._applyTheme();
    
    // Try to setup sign-in immediately if Google is already loaded
    setTimeout(() => this.setupSignIn(), 100);
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

  _handleOfflineMode(event) {
    console.log("App running in offline mode:", event.detail);
    this.offlineMode = true;
    this._showToast("Running in offline mode. Some features may be limited.", "info", 6000);
  }

  _handleOnlineMode() {
    console.log("App back online");
    this.offlineMode = false;
    this._showToast("Connection restored!", "success");
    
    // Try to sync any pending data
    this._syncOfflineData();
  }

  async _syncOfflineData() {
    try {
      const result = await syncData();
      if (result.success && result.syncedCount > 0) {
        this._showToast(`Synced ${result.syncedCount} items from offline storage`, "success");
      }
    } catch (error) {
      console.error("Error syncing offline data:", error);
    }
  }

  setupSignIn() {
    const signInButtonContainer = this.querySelector("#google-signin-button");
    if (signInButtonContainer && !this.userCredential) {
      try {
        initializeSignIn(signInButtonContainer, (credential) => {
          this._handleSignIn(credential);
        });
      } catch (error) {
        console.error("Error setting up sign-in:", error);
        this._showToast("Sign-in setup failed. App will work in offline mode.", "warning");
      }
    }
  }

  _showToast(message, type = 'success', duration = 4000) {
    this.toast = { message, type };
    setTimeout(() => {
      this.toast = null;
    }, duration);
  }

  _handleSignIn(credential) {
    try {
      this.userCredential = credential;
      this.offlineMode = false;
      this._showToast("Successfully signed in!", "success");
      window.dispatchEvent(new CustomEvent('user-signed-in'));
    } catch (error) {
      console.error("Error handling sign-in:", error);
      this._showToast("Sign-in successful but with limited features", "warning");
    }
  }

  async fetchUserData() {
    this.loadingMessage = "Loading your data...";
    this.errorMessage = "";
    this.retryCount++;
    
    try {
      // Validate authentication first
      const authValidation = validateAuth();
      if (!authValidation.valid) {
        throw new Error(authValidation.reason || "Authentication invalid");
      }

      const token = getCredential().credential;
      const response = await getData(token);
      
      if (response && response.data) {
        setTimeout(() => {
          this.userData = response.data;
          this._initializeGamificationData();
          
          if (!this.userData.onboardingComplete) {
            this.showOnboarding = true;
          }
          
          this.loadingMessage = "";
          this.retryCount = 0; // Reset retry count on success
          
          // Show warnings for offline data usage
          if (response.warning) {
            this._showToast(response.warning, "info", 6000);
          }
          
          if (response.isOffline) {
            this.offlineMode = true;
          }
        }, 1000);
      } else {
        throw new Error(response.error || "Unexpected API response format.");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      
      // More sophisticated error handling based on error type
      if (error.message.includes("Authentication")) {
        this.errorMessage = "Authentication expired. Please sign in again.";
        this._handleSignOut();
      } else if (error.message.includes("Network") || error.message.includes("fetch")) {
        this.errorMessage = "Network connection issues. Check your internet and try again.";
        this.offlineMode = true;
      } else if (error.message.includes("CORS") || error.message.includes("blocked")) {
        this.errorMessage = "Server access blocked. This may be due to browser settings or ad blockers.";
        this.offlineMode = true;
      } else {
        this.errorMessage = "Unable to load your data. The app will work in offline mode.";
        this.offlineMode = true;
      }
      
      this.loadingMessage = "";
      
      // Show retry option for network errors
      if (this.retryCount < 3 && (error.message.includes("Network") || error.message.includes("fetch"))) {
        setTimeout(() => {
          this._showToast("Retrying connection...", "info");
          this.fetchUserData();
        }, 2000 * this.retryCount);
      }
    }
  }

  _initializeGamificationData() {
    // Calculate user level and XP based on workout history
    const workouts = this.userData.workouts || [];
    const totalWorkouts = workouts.length;
    
    // Calculate XP (100 XP per workout + bonus for streaks)
    this.userXP = this.userData.totalXP || (totalWorkouts * 100);
    
    // Calculate level (every 1000 XP = 1 level)
    this.userLevel = Math.floor(this.userXP / 1000) + 1;
    
    // Calculate current streak
    this.currentStreak = this._calculateStreak(workouts);
  }

  _calculateStreak(workouts) {
    if (!workouts || workouts.length === 0) return 0;
    
    const sortedWorkouts = workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let currentDate = new Date();
    
    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date);
      const diffTime = Math.abs(currentDate - workoutDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  _handleOnboardingComplete(e) {
    try {
      const onboardingData = e.detail.userData;
      const fullUserData = { 
        ...this.userData, 
        ...onboardingData, 
        onboardingComplete: true, 
        workoutsCompletedThisMeso: 0 
      };
      
      const engine = new WorkoutEngine(fullUserData);
      const muscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms'];
      const mesocycle = engine.generateMesocycle(muscleGroups);
      
      this.userData = {
        ...fullUserData,
        mesocycle: mesocycle,
        currentWeek: 1,
        totalXP: 0,
        level: 1,
      };
      
      // Save data
      const token = getCredential()?.credential;
      if (token) {
        saveData(this.userData, token).catch(error => {
          console.error("Error saving onboarding data:", error);
          this._showToast("Profile created locally. Will sync when possible.", "warning");
        });
      }
      
      this.showOnboarding = false;
      this._showToast("Profile created! Your new workout plan is ready.", "success");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      this._showToast("Error setting up profile. Please try again.", "error");
    }
  }

  _retryFetchUserData() {
    this.errorMessage = "";
    this.retryCount = 0;
    this.fetchUserData();
  }

  _showCelebration(type, data) {
    this.celebrationData = { type, ...data };
    this.showCelebration = true;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.showCelebration = false;
    }, 3000);
  }

  render() {
    return html`
      ${this.renderToast()}
      ${this.showCelebration ? this.renderCelebration() : ''}
      ${this._renderCurrentView()}
      <canvas id="confetti-canvas"></canvas>
    `;
  }

  renderCelebration() {
    if (!this.celebrationData) return '';
    
    const { type, title, message, icon } = this.celebrationData;
    
    return html`
      <div class="celebration-popup">
        <div class="celebration-icon">${icon || '🎉'}</div>
        <div class="celebration-title">${title}</div>
        <div class="celebration-text">${message}</div>
        <button class="celebration-button" @click=${() => this.showCelebration = false}>
          Awesome!
        </button>
      </div>
    `;
  }

  renderHomeScreen() {
    return html`
      <div id="home-screen" class="container">
        <!-- Enhanced Header with Gamification -->
        <div class="home-header">
          <div class="greeting">Good ${this._getTimeOfDay()},</div>
          <h1 class="display-text">PROGRESSION</h1>
          
          ${this.offlineMode ? html`
            <div class="offline-indicator">
              📴 Offline Mode - Limited features available
            </div>
          ` : ''}
          
          <!-- Level System -->
          <div class="level-system">
            <div class="level-header">
              <div class="level-badge">
                <div class="level-icon">⚡</div>
                <div class="level-info">
                  <h3>Fitness Warrior</h3>
                  <p>Level ${this.userLevel}</p>
                </div>
              </div>
              <div class="xp-counter">
                <div class="xp-value">${this.userXP.toLocaleString()}</div>
                <div class="xp-label">XP</div>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(this.userXP % 1000) / 10}%"></div>
            </div>
            <div class="progress-text">${this.userXP % 1000} / 1000 XP to next level</div>
          </div>

          <!-- Streak Display -->
          ${this.currentStreak > 0 ? html`
            <div class="streak-container card">
              <div class="streak-flame">🔥</div>
              <div class="streak-count">${this.currentStreak}</div>
              <div class="streak-label">Day Streak</div>
            </div>
          ` : ''}
        </div>

        <!-- Enhanced Navigation -->
        <nav class="home-nav-buttons">
          <button class="hub-option card-interactive" @click=${() => this.showReadinessModal = true}>
            <div class="hub-option-icon">💪</div>
            <div class="hub-option-text">
              <h3>Start Workout</h3>
              <p>Begin your training session</p>
            </div>
          </button>
          
          <button class="hub-option card-interactive" @click=${() => this.currentView = 'templates'}>
            <div class="hub-option-icon">📖</div>
            <div class="hub-option-text">
              <h3>Templates</h3>
              <p>Custom workout routines</p>
            </div>
          </button>
          
          <button class="hub-option card-interactive" @click=${() => this.currentView = 'history'}>
            <div class="hub-option-icon">📊</div>
            <div class="hub-option-text">
              <h3>Progress</h3>
              <p>Track your journey</p>
            </div>
          </button>
          
          <button class="hub-option card-interactive" @click=${() => this.currentView = 'achievements'}>
            <div class="hub-option-icon">🏆</div>
            <div class="hub-option-text">
              <h3>Achievements</h3>
              <p>Unlock rewards</p>
            </div>
          </button>
        </nav>

        <!-- Settings Button -->
        <button class="btn btn-icon" @click=${() => this.currentView = 'settings'} aria-label="Settings" style="position: absolute; bottom: 2rem; right: 2rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </div>
    `;
  }

  _getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  _renderHeader(title, showBackButton = true) {
    return html`
        <header class="app-header">
            ${showBackButton ? html`
            <button class="btn btn-icon" @click=${this._goBack} aria-label="Back">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            </button>
            ` : ''}
            <h1>${title}</h1>
        </header>
    `;
  }
  
  _handleChangeView(event) {
    const newView = event.detail.view;
    if (newView !== this.currentView) {
      this._viewHistory.push(this.currentView);
      this.currentView = newView;
    }
  }

  _goBack() {
      if (this._viewHistory.length > 1) {
          this.currentView = this._viewHistory.pop();
      } else {
          this.currentView = 'home';
      }
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
        case "templates": return html`<div class="container">${this._renderHeader("Workout Templates")}<workout-templates></workout-templates></div>`;
        case "history": return html`<div class="container">${this._renderHeader("Workout History")}<history-view></history-view></div>`;
        case "settings": return html`<div class="container">${this._renderHeader("Settings")}<settings-view></settings-view></div>`;
        case "achievements": return html`<div class="container">${this._renderHeader("Achievements")}<achievements-view></achievements-view></div>`;
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
        <h1 class="display-text">PROGRESSION</h1>
        <p>Your intelligent workout partner that adapts to you in real-time.</p>
        
        ${this.offlineMode ? html`
          <div class="offline-notice">
            <p>⚠️ Running in offline mode</p>
            <p>Sign in when connection is restored for full features</p>
          </div>
        ` : ''}
        
        <div id="google-signin-button" aria-label="Sign in with Google button"></div>
        
        ${this.offlineMode ? html`
          <button class="btn btn-secondary" @click=${this._startOfflineMode} style="margin-top: 1rem;">
            Continue Offline
          </button>
        ` : ''}
      </div>
    `;
  }

  _startOfflineMode() {
    // Create a basic offline user data structure
    this.userData = {
      onboardingComplete: false,
      workouts: [],
      templates: [],
      currentWeek: 1,
      workoutsCompletedThisMeso: 0,
      totalXP: 0,
      level: 1,
      offlineUser: true
    };
    
    this.userCredential = { credential: 'offline-mode' };
    this.showOnboarding = true;
    this._showToast("Started in offline mode. Data will be saved locally.", "info");
  }

  renderSkeletonHomeScreen() {
    return html`
      <div class="container" aria-live="polite" aria-busy="true">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-divider"></div>
        <div class="skeleton skeleton-btn-large"></div>
        <div class="skeleton skeleton-btn-large"></div>
        <div class="skeleton skeleton-btn-large"></div>
        ${this.loadingMessage ? html`<p class="loading-message">${this.loadingMessage}</p>` : ''}
      </div>
    `;
  }

  renderErrorScreen() {
    const authStatus = getAuthStatus();
    
    return html`
      <div class="container error-container" role="alert">
        <h2>⚠️ Connection Issue</h2>
        <p>${this.errorMessage}</p>
        
        ${this.offlineMode ? html`
          <div class="offline-options">
            <p><strong>You can still:</strong></p>
            <ul>
              <li>Create and edit workout templates</li>
              <li>Log workouts (saved locally)</li>
              <li>View cached workout history</li>
            </ul>
          </div>
        ` : ''}
        
        <div class="error-actions">
          <button class="btn btn-primary" @click=${this._retryFetchUserData}>
            Retry Connection
          </button>
          
          ${this.offlineMode ? html`
            <button class="btn btn-secondary" @click=${this._startOfflineMode}>
              Continue Offline
            </button>
          ` : ''}
        </div>
        
        <details style="margin-top: 1rem; color: var(--color-text-secondary); font-size: 0.9rem;">
          <summary>Technical Details</summary>
          <pre style="font-size: 0.8rem; overflow-x: auto;">
Retry attempts: ${this.retryCount}/3
Offline mode: ${this.offlineMode}
Auth status: ${JSON.stringify(authStatus, null, 2)}
          </pre>
        </details>
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
            ${this._renderHeader("Workout Complete!", false)}
            <div class="summary-stats-grid">
              <div class="card"><h4>Time</h4><p>${Math.floor(lastWorkout.durationInSeconds / 60)}m ${lastWorkout.durationInSeconds % 60}s</p></div>
              <div class="card"><h4>Volume</h4><p>${Math.round(lastWorkout.totalVolume)} ${this.units}</p></div>
              <div class="card"><h4>Sets</h4><p>${lastWorkout.exercises.reduce((acc, ex) => acc + ex.completedSets.length, 0)}</p></div>
              <div class="card"><h4>XP Gained</h4><p class="text-gradient">+${lastWorkout.xpGained || 100}</p></div>
            </div>
            <div class="summary-actions"><button class="btn btn-primary" @click=${() => this.currentView = 'home'}>Continue</button></div>
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
    try {
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
    } catch (error) {
      console.error("Error handling readiness submit:", error);
      this._showToast("Error starting workout. Please try again.", "error");
      this.showReadinessModal = false;
    }
  }
  
  _startWorkoutWithTemplate(event) {
    this.workout = { ...event.detail.template };
    this.isWorkoutActive = true;
  }

  _exitWorkout() {
    this.isWorkoutActive = false;
    this.currentView = "home";
  }

  async _onWorkoutCompleted(event) {
    try {
      this.isWorkoutActive = false;
      this.currentView = "summary";
      this.lastCompletedWorkout = event.detail.workoutData;
      
      // Add XP and check for level up
      const xpGained = 100; // Base XP per workout
      const newXP = this.userXP + xpGained;
      const oldLevel = this.userLevel;
      const newLevel = Math.floor(newXP / 1000) + 1;
      
      this.userXP = newXP;
      this.userLevel = newLevel;
      this.lastCompletedWorkout.xpGained = xpGained;
      
      // Check for celebrations
      if (newLevel > oldLevel) {
        this._showCelebration('level_up', {
          title: 'Level Up!',
          message: `You've reached level ${newLevel}!`,
          icon: '⚡'
        });
      }
      
      // Update streak
      this.currentStreak = this._calculateStreak([...this.userData.workouts || [], this.lastCompletedWorkout]);
      
      // Check for streak achievements
      if (this.currentStreak === 7) {
        this._showCelebration('achievement', {
          title: 'Achievement Unlocked!',
          message: '7-day workout streak!',
          icon: '🔥'
        });
      }
      
      if (this.lastCompletedWorkout.newPRs?.length > 0) {
          // Trigger confetti for PRs if available
          if (typeof confetti !== 'undefined') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
      }
      
      const workoutsThisMeso = (this.userData.workoutsCompletedThisMeso || 0) + 1;
      const workoutsPerWeek = this.userData.daysPerWeek || 4;
      const workoutsInMeso = workoutsPerWeek * 4;

      let updatedUserData = { 
        ...this.userData, 
        workoutsCompletedThisMeso: workoutsThisMeso,
        totalXP: newXP,
        level: newLevel
      };

      if (workoutsThisMeso >= workoutsInMeso) {
          this._showToast("Mesocycle complete! Adapting your plan for next month...", "success");
          const engine = new WorkoutEngine(updatedUserData);
          const newBaseMEV = engine.adaptVolumeLandmarks();
          updatedUserData.baseMEV = newBaseMEV;
          const newEngine = new WorkoutEngine(updatedUserData);
          const muscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms'];
          const newMesocycle = newEngine.generateMesocycle(muscleGroups);
          updatedUserData.mesocycle = newMesocycle;
          updatedUserData.workoutsCompletedThisMeso = 0;
          updatedUserData.currentWeek = 1;
          this._showToast("Your new training plan is ready!", "success");
      }
      
      this.userData = updatedUserData;
      
      // Save data
      const token = getCredential()?.credential;
      if (token) {
        try {
          await saveData(this.userData, token);
        } catch (error) {
          console.error("Error saving workout data:", error);
          this._showToast("Workout saved locally. Will sync when possible.", "warning");
        }
      }
      
      // Refresh user data
      if (!this.offlineMode) {
        this.fetchUserData().catch(error => {
          console.warn("Failed to refresh user data after workout:", error);
        });
      }
    } catch (error) {
      console.error("Error completing workout:", error);
      this._showToast("Workout completed but there was an error saving. Please try syncing later.", "warning");
    }
  }

  async _handleDeleteData() {
    try {
      const token = getCredential()?.credential;
      if (!token) {
          this._showToast("Authentication error. Please sign in again.", "error");
          return;
      }

      const response = await deleteData(token);
      if (response.success) {
          this._showToast("All your data has been successfully deleted.", "success");
          this._handleSignOut();
      } else {
          this._showToast(`Error: ${response.error || 'Could not delete data.'}`, "error");
      }
    } catch (error) {
      console.error("Error deleting data:", error);
      this._showToast("Error deleting data. Please try again.", "error");
    }
  }

  _handleSignOut() {
    try {
      signOut();
      this.userCredential = null;
      this.userData = null;
      this.offlineMode = false;
      this.currentView = "home";
      this._showToast("You have been signed out.", "info");
    } catch (error) {
      console.error("Error signing out:", error);
      this._showToast("Error signing out. Please refresh the page.", "error");
    }
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("app-shell", AppShell);
