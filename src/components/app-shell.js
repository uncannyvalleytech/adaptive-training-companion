import { LitElement, html } from "lit";
import { initializeSignIn, getCredential, signOut } from "../services/google-auth.js";
import { getData, saveData, deleteData } from "../services/api.js";
import { WorkoutEngine } from "../services/workout-engine.js";
import "./workout-session.js";
import "./history-view.js";
import "./onboarding-flow.js";
import "./settings-view.js";
import "./workout-templates.js";
import "./achievements-view.js";
import "./readiness-modal.js";
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
    // New gamification properties
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
    this.isBiometricsAvailable = false;
    this.lastCompletedWorkout = null;
    this.workout = null;
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
    window.addEventListener('google-library-loaded', this.setupSignIn.bind(this));
    this.addEventListener('show-toast', (e) => this._showToast(e.detail.message, e.detail.type));
    this.addEventListener('workout-cancelled', this._exitWorkout.bind(this));
    this.addEventListener('workout-completed', this._onWorkoutCompleted.bind(this));
    window.addEventListener('user-signed-in', () => this.fetchUserData());
    window.addEventListener('theme-change', (e) => this._handleThemeChange(e.detail.theme));
    this.addEventListener('start-workout-with-template', this._startWorkoutWithTemplate.bind(this));
    this.addEventListener('change-view', this._handleChangeView.bind(this));
    
    this.addEventListener('sign-out', this._handleSignOut);
    this.addEventListener('delete-data', this._handleDeleteData);

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

  setupSignIn() {
    const signInButtonContainer = this.querySelector("#google-signin-button");
    if (signInButtonContainer && !this.userCredential) {
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
          // Initialize gamification data
          this._initializeGamificationData();
          if (!this.userData.onboardingComplete) {
              this.showOnboarding = true;
          }
          this.loadingMessage = "";
          
          // Show warning if using offline data
          if (response.warning) {
            this._showToast(response.warning, "info");
          }
        }, 1000);
      } else {
        throw new Error(response.error || "Unexpected API response format.");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      
      // More user-friendly error messages
      if (error.message.includes("Network error")) {
        this.errorMessage = "Unable to connect to server. Please check your internet connection and try again.";
      } else if (error.message.includes("CORS") || error.message.includes("Server configuration")) {
        this.errorMessage = "Server is temporarily unavailable. Please try again in a few minutes.";
      } else {
        this.errorMessage = "Failed to load your data. Please try again.";
      }
      
      this.loadingMessage = "";
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
      const onboardingData = e.detail.userData;
      const fullUserData = { ...this.userData, ...onboardingData, onboardingComplete: true, workoutsCompletedThisMeso: 0 };
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

  _showCelebration(type, data) {
    this.celebrationData = { type, ...data };
    this.showCelebration = true;
    this._triggerConfetti();
    
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
        <button class="btn btn-primary" @click=${this._retryFetchUserData}>Retry</button>
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
        this._triggerConfetti();
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
    const token = getCredential().credential;
    saveData(this.userData, token);
    this.fetchUserData();
  }

  async _handleDeleteData() {
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
  }

  _handleSignOut() {
    signOut();
    this.userCredential = null;
    this.userData = null;
    this._showToast("You have been signed out.", "info");
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("app-shell", AppShell);
