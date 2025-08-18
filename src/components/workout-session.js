import { LitElement, html } from "lit";
import { saveData } from "../services/api.js";
import { getCredential } from "../services/google-auth.js";
import "./workout-feedback-modal.js";
import "./progress-ring.js";

class WorkoutSession extends LitElement {
  static properties = {
    workout: { type: Object },
    isSaving: { type: Boolean },
    isResting: { type: Boolean },
    restTotalTime: { type: Number },
    restTimeRemaining: { type: Number },
    units: { type: String },
    workoutStartTime: { type: Number },
    stopwatchInterval: { type: Object },
    restInterval: { type: Object },
    stopwatchDisplay: { type: String },
    currentExerciseIndex: { type: Number },
  };

  constructor() {
    super();
    this.workout = null;
    this.isSaving = false;
    this.isResting = false;
    this.restTotalTime = 90;
    this.restTimeRemaining = 90;
    this.units = 'lbs';
    this.workoutStartTime = Date.now();
    this.stopwatchInterval = null;
    this.restInterval = null;
    this.stopwatchDisplay = "00:00";
    this.currentExerciseIndex = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    this.startStopwatch();
    this.addEventListener('touchstart', this._handleTouchStart, false);
    this.addEventListener('touchmove', this._handleTouchMove, false);
    this.addEventListener('touchend', this._handleTouchEnd, false);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopStopwatch();
    this.stopRestTimer();
    this.removeEventListener('touchstart', this._handleTouchStart, false);
    this.removeEventListener('touchmove', this._handleTouchMove, false);
    this.removeEventListener('touchend', this._handleTouchEnd, false);
  }

  // --- Gesture Navigation Logic ---
  _handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  _handleTouchMove(e) {
    if (!this.touchStartX || !this.touchStartY) {
      return;
    }
    // Prevent scroll while swiping
    e.preventDefault();
  }

  _handleTouchEnd(e) {
    if (!this.touchStartX || !this.touchStartY) {
      return;
    }
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - this.touchStartX;
    const dy = touchEndY - this.touchStartY;

    // Only register as a swipe if horizontal movement is greater than vertical
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) { // 50px threshold
      if (dx > 0) {
        this._previousExercise();
      } else {
        this._nextExercise();
      }
    }
    this.touchStartX = 0;
    this.touchStartY = 0;
  }
  
  _nextExercise() {
      if (this.currentExerciseIndex < this.workout.exercises.length - 1) {
          this.currentExerciseIndex++;
      }
  }
  
  _previousExercise() {
      if (this.currentExerciseIndex > 0) {
          this.currentExerciseIndex--;
      }
  }

  // --- Timer Logic ---
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
  
  startRestTimer() {
      this.isResting = true;
      this.restTimeRemaining = this.restTotalTime;
      this.restInterval = setInterval(() => {
          this.restTimeRemaining -= 1;
          if (this.restTimeRemaining <= 0) {
              this.stopRestTimer();
          }
      }, 1000);
  }

  stopRestTimer() {
      this.isResting = false;
      clearInterval(this.restInterval);
      this.restTimeRemaining = this.restTotalTime;
  }

  // --- Data Handling ---
  _handleSetInput(e, setIndex, field) {
    const value = e.target.value;
    if (!this.workout.exercises[this.currentExerciseIndex].sets[setIndex]) {
        this.workout.exercises[this.currentExerciseIndex].sets[setIndex] = {};
    }
    this.workout.exercises[this.currentExerciseIndex].sets[setIndex][field] = value;
    this.requestUpdate();
  }

  _toggleSetComplete(setIndex) {
    if (!this.workout.exercises[this.currentExerciseIndex].sets[setIndex]) {
        this.workout.exercises[this.currentExerciseIndex].sets[setIndex] = {};
    }
    const isComplete = this.workout.exercises[this.currentExerciseIndex].sets[setIndex].completed;
    this.workout.exercises[this.currentExerciseIndex].sets[setIndex].completed = !isComplete;
    
    if (!isComplete) {
        this.startRestTimer();
    } else {
        this.stopRestTimer();
    }
    this.requestUpdate();
  }

  async _completeWorkout() {
    this.isSaving = true;
    try {
        this.stopStopwatch();
        const durationInSeconds = Math.floor((Date.now() - this.workoutStartTime) / 1000);
        const totalVolume = this.workout.exercises.reduce((total, exercise) => {
            const exerciseVolume = (exercise.sets || []).reduce((sum, set) => {
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
                completedSets: (ex.sets || []).filter(s => s.completed)
            })),
            newPRs: [], 
        };

        const token = getCredential().credential;
        await saveData({ workouts: [workoutToSave] }, token);

        this.dispatchEvent(new CustomEvent('workout-completed', {
            detail: { workoutData: workoutToSave },
            bubbles: true,
            composed: true
        }));
    } catch (error) {
        this.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Error saving workout: ${error.message}`, type: 'error' }, bubbles: true, composed: true }));
    } finally {
        this.isSaving = false;
    }
  }
  
  formatTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  render() {
    if (!this.workout || !this.workout.exercises) {
      return html`<p>Loading workout...</p>`;
    }
    
    const restProgress = ((this.restTotalTime - this.restTimeRemaining) / this.restTotalTime) * 100;
    const currentExercise = this.workout.exercises[this.currentExerciseIndex];

    return html`
      <div id="daily-workout-view" class="container">
        <div class="workout-header">
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
                <progress-ring .progress=${restProgress}></progress-ring>
                <span class="timer-display">${this.formatTime(this.restTimeRemaining)}</span>
            </div>
        </div>

        <div class="exercise-navigation">
            <button class="nav-arrow" @click=${this._previousExercise} ?disabled=${this.currentExerciseIndex === 0}>‹</button>
            <span class="exercise-counter">${this.currentExerciseIndex + 1} / ${this.workout.exercises.length}</span>
            <button class="nav-arrow" @click=${this._nextExercise} ?disabled=${this.currentExerciseIndex === this.workout.exercises.length - 1}>›</button>
        </div>

        <div id="exercise-list-container">
            <div class="exercise-card">
                <div class="exercise-header">
                    <h3 class="exercise-title">${currentExercise.name}</h3>
                    <span class="target-reps">Target: ${currentExercise.targetReps} reps</span>
                </div>
                ${(currentExercise.sets || []).map((set, setIndex) => html`
                    <div class="set-row">
                        <span class="set-number">${setIndex + 1}</span>
                        <input type="number" class="set-input" placeholder="-- ${this.units}" .value=${set.weight || ''} @input=${e => this._handleSetInput(e, setIndex, 'weight')}>
                        <input type="number" class="set-input" placeholder="-- reps" .value=${set.reps || ''} @input=${e => this._handleSetInput(e, setIndex, 'reps')}>
                        <button class="set-complete-btn ${set.completed ? 'completed' : ''}" @click=${() => this._toggleSetComplete(setIndex)}>
                            ${set.completed ? '✓' : ''}
                        </button>
                    </div>
                `)}
            </div>
        </div>
        <div class="workout-actions">
            <button id="complete-workout-btn" class="cta-button" @click=${this._completeWorkout} ?disabled=${this.isSaving}>
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
