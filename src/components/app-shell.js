/*
===============================================
SECTION 1: COMPONENT AND SERVICE IMPORTS
===============================================
*/

import { LitElement, html } from "lit";
import { WorkoutEngine } from "../services/workout-engine.js";
import { saveDataLocally, getDataLocally, deleteDataLocally } from "../services/local-storage.js";

// Import all view components
import "./onboarding-flow.js";
import "./workout-session.js";
import "./history-view.js";
import "./settings-view.js";
import "./workout-templates.js";
import "./analytics-dashboard.js";
import "./achievements-view.js";
import "./readiness-modal.js";

/*
===============================================
SECTION 2: APP-SHELL COMPONENT DEFINITION
===============================================
*/

class AppShell extends LitElement {
  static properties = {
    currentView: { type: String },
    userData: { type: Object },
    isLoading: { type: Boolean },
    currentWorkout: { type: Object },
    showReadinessModal: { type: Boolean },
    toast: { type: Object },
  };

  constructor() {
    super();
    this.isLoading = true;
    this.userData = null;
    this.currentView = 'loading';
    this.currentWorkout = null;
    this.showReadinessModal = false;
    this.toast = { show: false, message: '', type: '' };
    this.workoutEngine = null;
  }

/*
===============================================
SECTION 3: LIFECYCLE AND INITIALIZATION METHODS
===============================================
*/

  connectedCallback() {
    super.connectedCallback();
    this.loadUserData();
    this.addEventListener('onboarding-complete', this._handleOnboardingComplete);
    this.addEventListener('start-workout-with-template', this._handleStartWorkoutWithTemplate);
    this.addEventListener('workout-completed', this._handleWorkoutCompleted);
    this.addEventListener('workout-cancelled', this._handleWorkoutCancelled);
    this.addEventListener('show-toast', this._showToast);
    this.addEventListener('theme-change', this._handleThemeChange);
    this.addEventListener('units-change', this._handleUnitsChange);
    this.addEventListener('sign-out', this._handleSignOut);
    this.addEventListener('delete-data', this._handleDeleteData);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up event listeners
    this.removeEventListener('onboarding-complete', this._handleOnboardingComplete);
    this.removeEventListener('start-workout-with-template', this._handleStartWorkoutWithTemplate);
    this.removeEventListener('workout-completed', this._handleWorkoutCompleted);
    this.removeEventListener('workout-cancelled', this._handleWorkoutCancelled);
    this.removeEventListener('show-toast', this._showToast);
    this.removeEventListener('theme-change', this._handleThemeChange);
    this.removeEventListener('units-change', this._handleUnitsChange);
    this.removeEventListener('sign-out', this._handleSignOut);
    this.removeEventListener('delete-data', this._handleDeleteData);
  }

  loadUserData() {
    this.isLoading = true;
    try {
      const data = getDataLocally();
      this.userData = data;
      this.workoutEngine = new WorkoutEngine(this.userData);
      
      if (!this.userData.onboardingComplete) {
        this.currentView = 'onboarding';
      } else {
        this.currentView = 'home';
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      this.currentView = 'error';
    } finally {
      this.isLoading = false;
      this._applyTheme();
    }
  }

/*
===============================================
SECTION 4: EVENT HANDLERS
===============================================
*/

  _handleOnboardingComplete(e) {
    const onboardingData = e.detail.userData;
    this.userData = { ...this.userData, ...onboardingData, onboardingComplete: true };
    saveDataLocally(this.userData);
    this.workoutEngine = new WorkoutEngine(this.userData);
    this.currentView = 'home';
    this._showToast({ detail: { message: "Profile created! Welcome!", type: "success" }});
  }

  _handleStartWorkoutWithTemplate(e) {
    this.currentWorkout = e.detail.template;
    this.showReadinessModal = true;
  }
  
  _handleReadinessSubmit(readinessData) {
    this.showReadinessModal = false;
    const recoveryScore = this.workoutEngine.calculateRecoveryScore(readinessData);
    const adjustedWorkout = this.workoutEngine.adjustWorkout(this.currentWorkout, recoveryScore);
    this.currentWorkout = adjustedWorkout;
    this.currentView = 'workout';
    this._showToast({ detail: { message: adjustedWorkout.adjustmentNote || "Workout Started!", type: 'info' } });
  }

  _skipReadiness() {
    this.showReadinessModal = false;
    this.currentView = 'workout';
  }

  _handleWorkoutCompleted(e) {
    // We already saved the workout in workout-session.js
    // We just need to update the view and show a confirmation
    this.currentView = 'home';
    this.currentWorkout = null;
    this.loadUserData(); // Reload data to reflect new workout
    this._showToast({ detail: { message: 'Workout completed and saved!', type: 'success' } });
  }

  _handleWorkoutCancelled() {
    this.currentView = 'home';
    this.currentWorkout = null;
  }
  
  _handleThemeChange(e) {
    document.body.dataset.theme = e.detail.theme;
  }
  
  _handleUnitsChange(e) {
    // The units are saved in settings-view, this is just to acknowledge
    console.log(`Units changed to ${e.detail.units}`);
  }
  
  _handleSignOut() {
    // For local storage, "signing out" is the same as deleting data
    this._handleDeleteData();
  }
  
  _handleDeleteData() {
    deleteDataLocally();
    window.location.reload();
  }

/*
===============================================
SECTION 5: UI METHODS (NAVIGATION, TOAST, THEME)
===============================================
*/

  _navigateTo(view) {
    this.currentView = view;
  }

  _showToast(e) {
    const { message, type } = e.detail;
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast = { show: false, message: '', type: '' };
    }, 3000);
  }

  _applyTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.dataset.theme = theme;
  }
  
/*
===============================================
SECTION 6: VIEW RENDERING LOGIC
===============================================
*/

  render() {
    if (this.isLoading) {
      return html`<div></div>`; // The main index.html has the loading spinner
    }

    return html`
      <div class="app-container">
        <main>
          ${this._renderCurrentView()}
        </main>
        ${this.currentView !== 'onboarding' && this.currentView !== 'workout' ? this._renderNavBar() : ''}
        ${this.showReadinessModal ? this._renderReadinessModal() : ''}
        ${this.toast.show ? this._renderToast() : ''}
      </div>
    `;
  }

  _renderCurrentView() {
    switch (this.currentView) {
      case 'onboarding':
        return html`<onboarding-flow></onboarding-flow>`;
      case 'home':
        return this._renderHomeView();
      case 'templates':
        return html`<workout-templates></workout-templates>`;
      case 'history':
        return html`<history-view></history-view>`;
      case 'analytics':
        return html`<analytics-dashboard></analytics-dashboard>`;
      case 'settings':
        return html`<settings-view></settings-view>`;
       case 'achievements':
        return html`<achievements-view></achievements-view>`;
      case 'workout':
        return html`<workout-session .workout=${this.currentWorkout}></workout-session>`;
      default:
        return html`<h1>Error</h1><p>Unknown view: ${this.currentView}</p>`;
    }
  }

  _renderHomeView() {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning!";
        if (hour < 18) return "Good afternoon!";
        return "Good evening!";
    };

    const dayOfWeek = new Date().getDay();
    const split = this.workoutEngine.getWorkoutSplit(this.userData.daysPerWeek || 4);
    const todaySplitDay = split[dayOfWeek % split.length];
    
    const suggestedWorkout = {
      name: `Today's Suggested: ${todaySplitDay.name}`,
      exercises: this.workoutEngine.generateDailyWorkout(todaySplitDay.groups).exercises
    };

    return html`
      <div id="home-screen" class="container">
        <div class="home-header">
          <h1 class="main-title">${getGreeting()}</h1>
        </div>
        
        <nav class="home-nav-buttons">
            <button class="hub-option card-interactive" @click=${() => this._handleStartWorkoutWithTemplate({ detail: { template: suggestedWorkout }})}>
                <div class="hub-option-icon">🏋️</div>
                <div class="hub-option-text">
                    <h3>Start Workout</h3>
                    <p>Begin your training session</p>
                </div>
            </button>
            <button class="hub-option card-interactive" @click=${() => this._navigateTo('templates')}>
                <div class="hub-option-icon">📋</div>
                <div class="hub-option-text">
                    <h3>Routine</h3>
                    <p>Custom workout routines</p>
                </div>
            </button>
            <button class="hub-option card-interactive" @click=${() => this._navigateTo('history')}>
                <div class="hub-option-icon">📊</div>
                <div class="hub-option-text">
                    <h3>Progress</h3>
                    <p>Track your journey</p>
                </div>
            </button>
            <button class="hub-option card-interactive" @click=${() => this._navigateTo('achievements')}>
                <div class="hub-option-icon">🏆</div>
                <div class="hub-option-text">
                    <h3>Achievements</h3>
                    <p>Unlock rewards</p>
                </div>
            </button>
        </nav>
      </div>
    `;
  }

  _renderNavBar() {
    const navItems = [
      { view: 'home', label: 'Home', icon: '🏠' },
      { view: 'templates', label: 'Routines', icon: '📋' },
      { view: 'history', label: 'History', icon: '📊' },
      { view: 'analytics', label: 'Analytics', icon: '📈' },
      { view: 'settings', label: 'Settings', icon: '⚙️' },
    ];
    return html`
      <nav class="bottom-nav">
        ${navItems.map(item => html`
          <button 
            class="nav-item ${this.currentView === item.view ? 'active' : ''}" 
            @click=${() => this._navigateTo(item.view)}
            aria-label=${item.label}
          >
            <span class="nav-icon">${item.icon}</span>
            <span class="nav-label">${item.label}</span>
          </button>
        `)}
      </nav>
    `;
  }
  
  _renderReadinessModal() {
    return html`
      <readiness-modal
        .onSubmit=${(data) => this._handleReadinessSubmit(data)}
        .onClose=${() => this._skipReadiness()}
      ></readiness-modal>
    `;
  }

  _renderToast() {
    return html`
      <div class="toast-notification ${this.toast.type}">
        ${this.toast.message}
      </div>
    `;
  }

/*
===============================================
SECTION 7: STYLES AND ELEMENT DEFINITION
===============================================
*/

  createRenderRoot() {
    // This component will use the global stylesheet
    return this;
  }
}

customElements.define("app-shell", AppShell);
