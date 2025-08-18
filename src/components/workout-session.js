import { LitElement, html } from "lit";
import { saveData, getData } from "../services/api.js";
import { getCredential } from "../services/google-auth.js";
import "./workout-feedback-modal.js";

class WorkoutSession extends LitElement {
  static properties = {
    workout: { type: Object },
    isSaving: { type: Boolean },
    errors: { type: Object },
    isResting: { type: Boolean },
    restTimeRemaining: { type: Number },
    units: { type: String },
    workoutStartTime: { type: Number },
    stopwatchInterval: { type: Object },
    stopwatchDisplay: { type: String },
    newPRs: { type: Array },
  };

  constructor() {
    super();
    this.workout = null;
    this.isSaving = false;
    this.errors = {};
    this.isResting = false;
    this.restTimeRemaining = 90; // Default rest time
    this.units = 'lbs';
    this.newPRs = [];
    this.workoutStartTime = Date.now();
    this.stopwatchInterval = null;
    this.stopwatchDisplay = "00:00";
  }

  connectedCallback() {
    super.connectedCallback();
    this.startStopwatch();
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

  _handleSetInput(e, exerciseIndex, setIndex, field) {
    const value = e.target.value;
    this.workout.exercises[exerciseIndex].sets[setIndex][field] = value;
  }

  _toggleSetComplete(exerciseIndex, setIndex) {
    const isComplete = this.workout.exercises[exerciseIndex].sets[setIndex].completed;
    this.workout.exercises[exerciseIndex].sets[setIndex].completed = !isComplete;
    this.requestUpdate();
  }

  _goBack() {
    // Dispatch an event to tell the app-shell to change the view
    this.dispatchEvent(new CustomEvent('setView', {
        detail: { view: 'home' },
        bubbles: true,
        composed: true
    }));
  }

  async _completeWorkout() {
    this.isSaving = true;
    this.stopStopwatch();
    const durationInSeconds = Math.floor((Date.now() - this.workoutStartTime) / 1000);

    // Basic calculation for total volume
    const totalVolume = this.workout.exercises.reduce((total, exercise) => {
        const exerciseVolume = exercise.sets.reduce((sum, set) => {
            if (set.completed && set.weight && set.reps) {
                return sum + (parseInt(set.weight, 10) * parseInt(set.reps, 10));
            }
            return sum;
        }, 0);
        return total + exerciseVolume;
    }, 0);

    const workoutToSave = {
        date: new Date().toISOString(),
        name: this.workout.name,
        durationInSeconds,
        totalVolume,
        exercises: this.workout.exercises.map(ex => ({
            name: ex.name,
            completedSets: ex.sets.filter(s => s.completed)
        })),
        newPRs: [], 
    };

    const token = getCredential().credential;
    await saveData([workoutToSave], token);

    this.isSaving = false;
    this.dispatchEvent(new CustomEvent('workout-completed', {
        detail: { workoutData: workoutToSave },
        bubbles: true,
        composed: true
    }));
  }

  render() {
    if (!this.workout) {
      return html`<p>Loading workout...</p>`;
    }

    return html`
      <div id="daily-workout-view" class="container">
        <div class="workout-header">
            <button class="back-btn" @click=${this._goBack} aria-label="Back to Home">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </button>
            <h2 id="workout-day-title">${this.workout.name}</h2>
            <p id="workout-date">${new Date().toLocaleDateString()}</p>
        </div>

        <div class="timer-container">
            <div class="timer-section">
                <span class="timer-label">TIME</span>
                <span class="timer-display">${this.stopwatchDisplay}</span>
            </div>
            <div class="timer-section rest-timer-section">
                <span class="timer-label">REST</span>
                <span class="timer-display">01:30</span>
            </div>
        </div>

        <div id="exercise-list-container">
            ${this.workout.exercises.map((ex, exIndex) => html`
                <div class="exercise-card">
                    <div class="exercise-header">
                        <h3 class="exercise-title">${ex.name}</h3>
                        <span class="target-reps">Target: ${ex.targetReps} reps</span>
                    </div>
                    ${ex.sets.map((set, setIndex) => html`
                        <div class="set-row">
                            <span class="set-number">${setIndex + 1}</span>
                            <input type="number" class="set-input" placeholder="-- ${this.units}" .value=${set.weight || ''} @input=${e => this._handleSetInput(e, exIndex, setIndex, 'weight')}>
                            <input type="number" class="set-input" placeholder="-- reps" .value=${set.reps || ''} @input=${e => this._handleSetInput(e, exIndex, setIndex, 'reps')}>
                            <button class="set-complete-btn ${set.completed ? 'completed' : ''}" @click=${() => this._toggleSetComplete(exIndex, setIndex)}>
                                ${set.completed ? '✓' : ''}
                            </button>
                        </div>
                    `)}
                </div>
            `)}
        </div>
        <div class="workout-actions">
            <button id="complete-workout-btn" class="cta-button" @click=${this._completeWorkout} ?disabled=${this.isSaving}>
                ${this.isSaving ? 'Saving...' : 'Complete Workout'}
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
