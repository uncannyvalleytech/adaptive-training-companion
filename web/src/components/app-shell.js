/*
===============================================
SECTION 1: COMPONENT AND SERVICE IMPORTS
===============================================
*/
// 1.A: Import Core Libraries
import { LitElement, html } from "lit";
// 1.B: Import Services
import { WorkoutEngine } from "../services/workout-engine.js";
import { saveDataLocally, getDataLocally, deleteDataLocally } from "../services/local-storage.js";

// 1.C: Import all View Components
import "./onboarding-flow.js";
import "./workout-session.js";
import "./workout-summary.js";
import "./history-view.js";
import "./settings-view.js";
import "./workout-templates.js";
import "./analytics-dashboard.js";
import "./goals-view.js";
import "./readiness-modal.js";
import "./equipment-settings-modal.js";

/*
===============================================
SECTION 2: APP-SHELL COMPONENT DEFINITION
===============================================
*/
// 2.A: Properties
class AppShell extends LitElement {
  static properties = {
    currentView: { type: String },
    userData: { type: Object },
    isLoading: { type: Boolean },
    currentWorkout: { type: Object },
    lastCompletedWorkout: { type: Object },
    showReadinessModal: { type: Boolean },
    toast: { type: Object },
    editingRoutineId: { type: String, state: true },
  };

  // 2.B: Constructor
  constructor() {
    super();
    this.isLoading = true;
    this.userData = null;
    this.currentView = 'loading';
    this.currentWorkout = null;
    this.lastCompletedWorkout = null;
    this.showReadinessModal = false;
    this.toast = { show: false, message: '', type: '' };
    this.workoutEngine = null;
    this.editingRoutineId = null;
  }

/*
===============================================
SECTION 3: LIFECYCLE AND INITIALIZATION METHODS
===============================================
*/
// 3.A: Connected Callback
  connectedCallback() {
    super.connectedCallback();
    this.loadUserData();
    this.addEventListener('onboarding-complete', this._handleOnboardingComplete);
    this.addEventListener('start-workout-with-template', this._handleStartWorkoutWithTemplate);
    this.addEventListener('program-selected', this._handleProgramSelected);
    this.addEventListener('workout-completed', this._handleWorkoutCompleted);
    this.addEventListener('summary-continue', this._handleSummaryContinue);
    this.addEventListener('workout-cancelled', this._handleWorkoutCancelled);
    this.addEventListener('show-toast', this._showToast);
    this.addEventListener('theme-change', this._handleThemeChange);
    this.addEventListener('units-change', this._handleUnitsChange);
    this.addEventListener('sign-out', this._handleSignOut);
    this.addEventListener('delete-data', this._handleDeleteData);
    this.addEventListener('edit-routine', this._handleEditRoutine);
    this.addEventListener('delete-routine', this._handleDeleteRoutine);
    this.addEventListener('routine-saved', this._handleRoutineSaved);
    this.addEventListener('equipment-updated', this.loadUserData);


  }

// 3.B: Disconnected Callback
  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up event listeners
    this.removeEventListener('onboarding-complete', this._handleOnboardingComplete);
    this.removeEventListener('start-workout-with-template', this._handleStartWorkoutWithTemplate);
    this.removeEventListener('program-selected', this._handleProgramSelected);
    this.removeEventListener('workout-completed', this._handleWorkoutCompleted);
    this.removeEventListener('summary-continue', this._handleSummaryContinue);
    this.removeEventListener('workout-cancelled', this._handleWorkoutCancelled);
    this.removeEventListener('show-toast', this._showToast);
    this.removeEventListener('theme-change', this._handleThemeChange);
    this.removeEventListener('units-change', this._handleUnitsChange);
    this.removeEventListener('sign-out', this._handleSignOut);
    this.removeEventListener('delete-data', this._handleDeleteData);
    this.removeEventListener('edit-routine', this._handleEditRoutine);
    this.removeEventListener('delete-routine', this._handleDeleteRoutine);
    this.removeEventListener('routine-saved', this._handleRoutineSaved);
    this.removeEventListener('equipment-updated', this.loadUserData);

  }

// 3.C: Load User Data
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
// 4.A: Handle Onboarding Complete
  _handleOnboardingComplete(e) {
    const onboardingData = e.detail.userData;
    this.userData = { ...this.userData, ...onboardingData, onboardingComplete: true };
    saveDataLocally(this.userData);
    this.workoutEngine = new WorkoutEngine(this.userData);
    this.currentView = 'home';
    this._showToast({ detail: { message: "Profile created! Welcome!", type: "success" }});
  }

// 4.B: Handle Start Workout
  _handleStartWorkoutWithTemplate(e) {
    this.currentWorkout = e.detail.template;
    this.showReadinessModal = true;
  }
  
// 4.C: Handle Program Selection
  _handleProgramSelected(e) {
    const { program, duration, startWorkoutIndex } = e.detail;
    const newPlan = this.workoutEngine.generateProgramPlan(program, duration, startWorkoutIndex);
    
    this.userData.activeProgram = newPlan;
    saveDataLocally({ activeProgram: newPlan });
    
    this._showToast({ detail: { message: "New program has been saved!", type: "success" }});
    this.currentView = 'home';
  }

// 4.D: Handle Readiness Submission
  _handleReadinessSubmit(readinessData) {
    this.showReadinessModal = false;
    const recoveryScore = this.workoutEngine.calculateRecoveryScore(readinessData);
    const adjustedWorkout = this.workoutEngine.adjustWorkout(this.currentWorkout, recoveryScore);
    this.currentWorkout = adjustedWorkout;
    this.currentView = 'workout';
    this._showToast({ detail: { message: adjustedWorkout.adjustmentNote || "Workout Started!", type: 'info' } });
  }

// 4.E: Skip Readiness
  _skipReadiness() {
    this.showReadinessModal = false;
    this.currentView = 'workout';
  }

// 4.F: Handle Workout Completion
  _handleWorkoutCompleted(e) {
    const { workoutData, completedWorkoutDay } = e.detail;
    if (this.userData.activeProgram && completedWorkoutDay) {
        const program = this.userData.activeProgram;
        const workoutIndex = program.workouts.findIndex(w => w.day === completedWorkoutDay);
        if (workoutIndex > -1) {
            program.workouts[workoutIndex].completed = true;
            saveDataLocally({ activeProgram: program });
        }
    }
    
    this.lastCompletedWorkout = workoutData;
    this.currentView = 'summary';
  }

// 4.G: Handle Summary Continue
  _handleSummaryContinue(e) {
      const { xpGained } = e.detail;
      this.userData.totalXP = (this.userData.totalXP || 0) + xpGained;
      this.userData.level = Math.floor(this.userData.totalXP / 1000) + 1;
      saveDataLocally({ totalXP: this.userData.totalXP, level: this.userData.level });
      
      this.currentView = 'home';
      this.lastCompletedWorkout = null;
      this.loadUserData();
  }

// 4.H: Handle Workout Cancellation
  _handleWorkoutCancelled() {
    this.currentView = 'home';
    this.currentWorkout = null;
  }
  
// 4.I: Handle Theme Change
  _handleThemeChange(e) {
    document.body.dataset.theme = e.detail.theme;
  }
  
// 4.J: Handle Units Change
  _handleUnitsChange(e) {
    console.log(`Units changed to ${e.detail.units}`);
  }
  
// 4.K: Handle Sign Out
  _handleSignOut() {
    this._handleDeleteData();
  }
  
// 4.L: Handle Delete Data
  _handleDeleteData() {
    deleteDataLocally();
    window.location.reload();
  }

// 4.M: Handle Edit Routine
  _handleEditRoutine(e) {
    this.editingRoutineId = e.detail.routineId;
    this.currentView = 'templates';
  }

// 4.N: Handle Delete Routine
  _handleDeleteRoutine(e) {
    const { routineId } = e.detail;
    const updatedTemplates = this.userData.templates.filter(t => t.id !== routineId);
    saveDataLocally({ templates: updatedTemplates });
    this.loadUserData(); 
    this._showToast({ detail: { message: "Routine deleted.", type: "success" } });
  }

// 4.O: Handle Routine Saved
  _handleRoutineSaved() {
    this.editingRoutineId = null;
    this.loadUserData();
    this.currentView = 'settings';
  }

/*
===============================================
SECTION 5: UI METHODS (NAVIGATION, TOAST, THEME)
===============================================
*/
// 5.A: Navigate to View
  _navigateTo(view) {
    this.currentView = view;
  }

// 5.B: Show Toast Notification
  _showToast(e) {
    const { message, type } = e.detail;
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast = { show: false, message: '', type: '' };
    }, 3000);
  }

// 5.C: Apply Theme
  _applyTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.dataset.theme = theme;
  }
  
/*
===============================================
SECTION 6: VIEW RENDERING LOGIC
===============================================
*/
// 6.A: Main Render Method
  render() {
    if (this.isLoading) {
      return html`<div></div>`;
    }

    return html`
      <div class="app-container">
        <main>
          ${this._renderCurrentView()}
        </main>
        ${this.currentView !== 'onboarding' && this.currentView !== 'workout' && this.currentView !== 'summary' ? this._renderNavBar() : ''}
        ${this.showReadinessModal ? this._renderReadinessModal() : ''}
        ${this.toast.show ? this._renderToast() : ''}
      </div>
    `;
  }

// 6.B: Render Current View
  _renderCurrentView() {
    switch (this.currentView) {
      case 'onboarding':
        return html`<onboarding-flow></onboarding-flow>`;
      case 'home':
        return this._renderHomeView();
      case 'templates':
        return html`<workout-templates .editingRoutineId=${this.editingRoutineId}></workout-templates>`;
      case 'history':
        return html`<history-view></history-view>`;
      case 'analytics':
        return html`<analytics-dashboard></analytics-dashboard>`;
      case 'settings':
        return html`<settings-view></settings-view>`;
       case 'goals':
        return html`<goals-view></goals-view>`;
      case 'workout':
        return html`<workout-session .workout=${this.currentWorkout} .userData=${this.userData}></workout-session>`;
      case 'summary':
        return html`<workout-summary .workoutData=${this.lastCompletedWorkout} .userData=${this.userData}></workout-summary>`;
      default:
        return html`<h1>Error</h1><p>Unknown view: ${this.currentView}</p>`;
    }
  }

// 6.C: Render Home View
  _renderHomeView() {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning!";
        if (hour < 18) return "Good afternoon!";
        return "Good evening!";
    };

    let startWorkoutButton;
    if (this.userData.activeProgram) {
        const nextWorkout = this.userData.activeProgram.workouts.find(w => !w.completed);
        if (nextWorkout) {
            startWorkoutButton = html`
                <button class="hub-option card-interactive" @click=${() => this._handleStartWorkoutWithTemplate({ detail: { template: nextWorkout }})}>
                    <div class="hub-option-icon">🏋️</div>
                    <div class="hub-option-text">
                        <h3>Day ${nextWorkout.day}: ${nextWorkout.name.split(' - ')[1]}</h3>
                        <p>Your next scheduled workout</p>
                    </div>
                </button>
            `;
        } else {
            startWorkoutButton = html`
                <button class="hub-option card-interactive" @click=${() => this._navigateTo('templates')}>
                    <div class="hub-option-icon">🎉</div>
                    <div class="hub-option-text">
                        <h3>Program Complete!</h3>
                        <p>Select a new program to continue</p>
                    </div>
                </button>
            `;
        }
    } else {
        const dayOfWeek = new Date().getDay();
        const split = this.workoutEngine.getWorkoutSplit(this.userData.daysPerWeek || 4);
        const todaySplitDay = split[dayOfWeek % split.length];
        
        const suggestedWorkout = {
          name: `Today's Suggested: ${todaySplitDay.name}`,
          exercises: this.workoutEngine.generateDailyWorkout(todaySplitDay.groups).exercises
        };

        startWorkoutButton = html`
            <button class="hub-option card-interactive" @click=${() => this._handleStartWorkoutWithTemplate({ detail: { template: suggestedWorkout }})}>
                <div class="hub-option-icon">🏋️</div>
                <div class="hub-option-text">
                    <h3>Start Workout</h3>
                    <p>Begin your training session</p>
                </div>
            </button>
        `;
    }

    return html`
      <div id="home-screen" class="container">
        <div class="home-header">
          <h1 class="main-title">${getGreeting()}</h1>
        </div>
        
        <nav class="home-nav-buttons">
            ${startWorkoutButton}
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
            <button class="hub-option card-interactive" @click=${() => this._navigateTo('goals')}>
                <div class="hub-option-icon">🏆</div>
                <div class="hub-option-text">
                    <h3>Goals</h3>
                    <p>Set and track your goals</p>
                </div>
            </button>
        </nav>
      </div>
    `;
  }

// 6.D: Render Navigation Bar
  _renderNavBar() {
    const navItems = [
      { view: 'home', label: 'Home', icon: '🏠' },
      { view: 'templates', label: 'Routines', icon: '📋' },
      { view: 'history', label: 'History', icon: '📊' },
      { view: 'goals', label: 'Goals', icon: '🏆' },
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
            <span class.nav-icon">${item.icon}</span>
            <span class="nav-label">${item.label}</span>
          </button>
        `)}
      </nav>
    `;
  }
  
// 6.E: Render Readiness Modal
  _renderReadinessModal() {
    return html`
      <readiness-modal
        .onSubmit=${(data) => this._handleReadinessSubmit(data)}
        .onClose=${() => this._skipReadiness()}
      ></readiness-modal>
    `;
  }

// 6.F: Render Toast Notification
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
// 7.A: Create Render Root
  createRenderRoot() {
    // This component will use the global stylesheet
    return this;
  }
}

// 7.B: Custom Element Definition
customElements.define("app-shell", AppShell);
