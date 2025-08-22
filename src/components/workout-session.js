import { LitElement, html } from "lit";
import { saveDataLocally } from "../services/local-storage.js";
import "./motivational-elements.js";

class WorkoutSession extends LitElement {
  static properties = {
    workout: { type: Object },
    isSaving: { type: Boolean },
    units: { type: String },
    workoutStartTime: { type: Number },
    stopwatchInterval: { type: Object },
    stopwatchDisplay: { type: String },
    expandedGroups: { type: Object },
  };

  constructor() {
    super();
    this.workout = null;
    this.isSaving = false;
    this.units = localStorage.getItem('units') || 'lbs';
    this.workoutStartTime = Date.now();
    this.stopwatchInterval = null;
    this.stopwatchDisplay = "00:00";
    this.expandedGroups = {};
  }

  connectedCallback() {
    super.connectedCallback();
    this.startStopwatch();
    // Pre-expand all muscle groups by default
    if (this.workout && this.workout.exercises) {
      const allGroups = this._getGroupedExercises();
      Object.keys(allGroups).forEach(group => {
        this.expandedGroups[group] = true;
      });
      this.requestUpdate();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopStopwatch();
  }

  startStopwatch() {
    this.workoutStartTime = Date.now();
    this.stopwatchInterval = setInterval(() => {
        const elapsed = Date.now() - this.workoutStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        this.stopwatchDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  stopStopwatch() {
    clearInterval(this.stopwatchInterval);
  }

  _handleSetInput(exerciseIndex, setIndex, field, value) {
    // Find the original exercise in the workout object to modify it
    const originalExercise = this.workout.exercises.find(ex => ex.originalIndex === exerciseIndex);
    if(originalExercise) {
        if (!originalExercise.sets[setIndex]) {
            originalExercise.sets[setIndex] = {};
        }
        originalExercise.sets[setIndex][field] = value;
        this.requestUpdate();
    }
  }

  _toggleSetComplete(exerciseIndex, setIndex) {
    const originalExercise = this.workout.exercises.find(ex => ex.originalIndex === exerciseIndex);
     if(originalExercise) {
        const set = originalExercise.sets[setIndex];
        if(set){
            set.completed = !set.completed;
            this.requestUpdate();
        }
    }
  }

  async _completeWorkout() {
    this.isSaving = true;
    try {
        this.stopStopwatch();
        const durationInSeconds = Math.floor((Date.now() - this.workoutStartTime) / 1000);
        const totalVolume = this.workout.exercises.reduce((total, exercise) => {
            const exerciseVolume = (exercise.sets || []).reduce((sum, set) => {
                const weight = parseInt(set.weight, 10);
                const reps = parseInt(set.reps, 10);
                if (set.completed && !isNaN(weight) && !isNaN(reps)) {
                    return sum + (weight * reps);
                }
                return sum;
            }, 0);
            return total + exerciseVolume;
        }, 0);

        const workoutToSave = {
            date: new Date().toISOString(),
            name: this.workout.name || 'Workout Session',
            durationInSeconds,
            totalVolume,
            exercises: this.workout.exercises.map(ex => ({
                name: ex.name,
                completedSets: (ex.sets || []).filter(s => s.completed),
                category: ex.category || 'strength',
                muscleGroup: ex.muscleGroup || 'unknown'
            })),
        };

        const response = saveDataLocally({ workouts: [workoutToSave] });

        if (response.success) {
            this.dispatchEvent(new CustomEvent('workout-completed', {
                detail: { workoutData: workoutToSave },
                bubbles: true,
                composed: true
            }));
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        this.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Error saving workout: ${error.message}`, type: 'error' }, bubbles: true, composed: true }));
    } finally {
        this.isSaving = false;
    }
  }

  _getGroupedExercises() {
    if (!this.workout || !this.workout.exercises) {
      return {};
    }
    return this.workout.exercises.reduce((acc, exercise, index) => {
      const group = (exercise.muscleGroup || 'GENERAL').toUpperCase();
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push({ ...exercise, originalIndex: index });
      return acc;
    }, {});
  }

  _toggleGroup(groupName) {
    this.expandedGroups = {
      ...this.expandedGroups,
      [groupName]: !this.expandedGroups[groupName]
    };
  }

  render() {
    if (!this.workout || !this.workout.exercises) {
      return html`<div class="container"><div class="skeleton skeleton-text">Loading workout...</div></div>`;
    }

    const groupedExercises = this._getGroupedExercises();
    const workoutDate = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return html`
      <div id="workout-session-view" class="container">
        <header class="app-header">
          <div>
             <h1 class="workout-session-title">WEEK 4 DAY 5</h1>
             <p class="workout-session-subtitle">${workoutDate}</p>
          </div>
          <button class="btn btn-icon" aria-label="Calendar View">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </button>
        </header>
        
        <div class="workout-log-container">
          ${Object.entries(groupedExercises).map(([groupName, exercises]) => html`
            <div class="muscle-group-container">
              <button class="muscle-group-header" @click=${() => this._toggleGroup(groupName)}>
                <h2 class="muscle-group-title">${groupName}</h2>
                <span class="chevron ${this.expandedGroups[groupName] ? 'expanded' : ''}">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
              </button>
              
              <div class="exercise-list-container ${this.expandedGroups[groupName] ? 'expanded' : ''}">
                ${exercises.map(exercise => html`
                  <div class="card exercise-log-card">
                    <div class="exercise-log-header">
                      <div class="exercise-log-name">
                        <h3>${exercise.name}</h3>
                        <p>${exercise.type}</p>
                      </div>
                      <div class="exercise-log-actions">
                        <button class="btn-icon-sm" aria-label="Exercise Info">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        </button>
                        <button class="btn-icon-sm" aria-label="More Options">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                        </button>
                      </div>
                    </div>
                    <div class="log-table-header">
                      <span>SET</span>
                      <span>WEIGHT</span>
                      <span>REPS</span>
                      <span>LOG</span>
                    </div>
                    ${(exercise.sets || []).map((set, setIndex) => html`
                      <div class="set-row-log ${set.completed ? 'completed' : ''}">
                        <span class="set-log-number">${setIndex + 1}</span>
                        <input type="number" class="set-input-log" placeholder="-" .value=${set.weight || ''} @input=${(e) => this._handleSetInput(exercise.originalIndex, setIndex, 'weight', e.target.value)}>
                        <input type="number" class="set-input-log" placeholder="-" .value=${set.reps || ''} @input=${(e) => this._handleSetInput(exercise.originalIndex, setIndex, 'reps', e.target.value)}>
                        <button class="set-log-checkbox" @click=${() => this._toggleSetComplete(exercise.originalIndex, setIndex)} aria-label="Log Set ${setIndex + 1}">
                          ${set.completed ? html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                        </button>
                      </div>
                    `)}
                  </div>
                `)}
              </div>
            </div>
          `)}
        </div>
        <div class="workout-actions">
            <button class="btn btn-secondary" @click=${() => this.dispatchEvent(new CustomEvent('workout-cancelled', { bubbles: true, composed: true }))}>
                End Workout
            </button>
            <button class="btn btn-primary cta-button" @click=${this._completeWorkout} ?disabled=${this.isSaving}>
                ${this.isSaving ? html`<div class="spinner"></div>` : 'Complete Workout'}
            </button>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("workout-session", WorkoutSession);
