import { LitElement, html } from "lit";
import { saveData } from "../services/api.js";
import { getCredential } from "../services/google-auth.js";
import "./workout-feedback-modal.js";
import "./motivational-elements.js";

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
    motivationalMessage: { type: String },
    showMotivation: { type: Boolean },
    workoutProgress: { type: Number },
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
    this.motivationalMessage = '';
    this.showMotivation = false;
    this.workoutProgress = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    this.startStopwatch();
    this.addEventListener('touchstart', this._handleTouchStart, false);
    this.addEventListener('touchmove', this._handleTouchMove, false);
    this.addEventListener('touchend', this._handleTouchEnd, false);
    this._calculateProgress();
    this._showRandomMotivation();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopStopwatch();
    this.stopRestTimer();
    this.removeEventListener('touchstart', this._handleTouchStart, false);
    this.removeEventListener('touchmove', this._handleTouchMove, false);
    this.removeEventListener('touchend', this._handleTouchEnd, false);
  }

  _calculateProgress() {
    if (!this.workout || !this.workout.exercises) return;
    
    const totalSets = this.workout.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
    const completedSets = this.workout.exercises.reduce((acc, ex) => {
      // Correctly access the sets and check if they're completed
      const setsForExercise = ex.sets || [];
      return acc + setsForExercise.filter(set => set.completed).length;
    }, 0);
    
    this.workoutProgress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  }

  _showRandomMotivation() {
    // Show motivational message every 5 minutes
    setInterval(() => {
      this.showMotivation = true;
      setTimeout(() => {
        this.showMotivation = false;
      }, 3000);
    }, 300000); // 5 minutes
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

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
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
          this.requestUpdate();
      }
  }
  
  _previousExercise() {
      if (this.currentExerciseIndex > 0) {
          this.currentExerciseIndex--;
          this.requestUpdate();
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
              // Show motivational message when rest is complete
              this.showMotivation = true;
              setTimeout(() => this.showMotivation = false, 2000);
          }
      }, 1000);
  }

  stopRestTimer() {
      this.isResting = false;
      clearInterval(this.restInterval);
      this.restTimeRemaining = this.restTotalTime;
  }

  _addRestTime(seconds) {
    this.restTotalTime += seconds;
    this.restTimeRemaining += seconds;
  }

  // --- Data Handling ---
  _handleSetInput(e, setIndex, field) {
    const value = e.target.value;
    const currentExercise = this.workout.exercises[this.currentExerciseIndex];
    if (!currentExercise.sets[setIndex]) {
        currentExercise.sets[setIndex] = {};
    }
    currentExercise.sets[setIndex][field] = value;
    this.requestUpdate();
  }

  _toggleSetComplete(setIndex) {
    const currentExercise = this.workout.exercises[this.currentExerciseIndex];
    if (!currentExercise.sets[setIndex]) {
        currentExercise.sets[setIndex] = {};
    }
    const isComplete = currentExercise.sets[setIndex].completed;
    currentExercise.sets[setIndex].completed = !isComplete;
    
    if (!isComplete) {
        this.startRestTimer();
        // Show encouragement after completing a set
        this.showMotivation = true;
        setTimeout(() => this.showMotivation = false, 2000);
    } else {
        this.stopRestTimer();
    }
    
    this._calculateProgress();
    this.requestUpdate();
  }

  async _completeWorkout() {
    this.isSaving = true;
    try {
        this.stopStopwatch();
        const durationInSeconds = Math.floor((Date.now() - this.workoutStartTime) / 1000);
        const totalVolume = this.workout.exercises.reduce((total, exercise) => {
            const exerciseVolume = (exercise.sets || []).reduce((sum, set) => {
                // Ensure weight and reps are valid numbers
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
            name: this.workout.name,
            durationInSeconds,
            totalVolume,
            exercises: this.workout.exercises.map(ex => ({
                name: ex.name,
                completedSets: (ex.sets || []).filter(s => s.completed),
                category: ex.category || 'strength',
                muscleGroup: ex.muscleGroup || 'unknown'
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
      return html`<div class="container"><div class="skeleton skeleton-text">Loading workout...</div></div>`;
    }
    
    const restProgress = ((this.restTotalTime - this.restTimeRemaining) / this.restTotalTime) * 100;
    const currentExercise = this.workout.exercises[this.currentExerciseIndex];

    return html`
      <div id="daily-workout-view" class="container">
        <!-- Enhanced Header -->
        <div class="workout-header">
            <h1 class="workout-title">${currentExercise.name}</h1>
            <p class="workout-subtitle">Exercise ${this.currentExerciseIndex + 1} of ${this.workout.exercises.length}</p>
        </div>

        <!-- Progress Bar -->
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.workoutProgress}%"></div>
          </div>
          <div class="progress-text">${Math.round(this.workoutProgress)}% Complete</div>
        </div>

        <!-- Timer Section -->
        <div class="timer-section card">
            <div class="timer-display">${this.stopwatchDisplay}</div>
            <div class="timer-label">Workout Time</div>
        </div>

        <!-- Rest Timer -->
        ${this.isResting ? html`
          <div class="rest-timer card">
            <progress-ring 
              .radius=${60} 
              .progress=${restProgress}
              .showValue=${true}
              .value=${this.formatTime(this.restTimeRemaining)}>
            </progress-ring>
            <div class="rest-controls">
              <button class="btn btn-secondary" @click=${() => this._addRestTime(30)}>+30s</button>
              <button class="btn btn-primary" @click=${this.stopRestTimer}>Skip Rest</button>
            </div>
          </div>
        ` : ''}

        <!-- Motivational Message -->
        ${this.showMotivation ? html`
          <motivational-message type="encouragement"></motivational-message>
        ` : ''}

        <!-- Exercise Navigation -->
        <div class="exercise-navigation">
            <button class="btn btn-icon" @click=${this._previousExercise} ?disabled=${this.currentExerciseIndex === 0} aria-label="Previous Exercise">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            </button>
            <span class="exercise-indicator">${this.currentExerciseIndex + 1} / ${this.workout.exercises.length}</span>
            <button class="btn btn-icon" @click=${this._nextExercise} ?disabled=${this.currentExerciseIndex === this.workout.exercises.length - 1} aria-label="Next Exercise">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
        </div>

        <!-- Current Exercise -->
        <div class="exercise-card card card-elevated">
            <div class="exercise-header">
                <h3 class="exercise-name">${currentExercise.name}</h3>
                <span class="target-reps">Target: ${currentExercise.targetReps || '8-12'} reps</span>
            </div>
            
            <div class="sets-container">
                ${(currentExercise.sets || []).map((set, setIndex) => html`
                    <div class="set-row ${set.completed ? 'completed' : ''}">
                        <span class="set-number">${setIndex + 1}</span>
                        <input 
                          type="number" 
                          class="set-input" 
                          placeholder="Weight (${this.units})" 
                          .value=${set.weight || ''} 
                          @input=${e => this._handleSetInput(e, setIndex, 'weight')}
                          ?disabled=${set.completed}
                        >
                        <input 
                          type="number" 
                          class="set-input" 
                          placeholder="Reps" 
                          .value=${set.reps || ''} 
                          @input=${e => this._handleSetInput(e, setIndex, 'reps')}
                          ?disabled=${set.completed}
                        >
                        <button 
                          class="set-complete-btn ${set.completed ? 'completed' : ''}" 
                          @click=${() => this._toggleSetComplete(setIndex)} 
                          aria-label="Mark set ${setIndex + 1} as complete"
                        >
                            ${set.completed ? '✓' : ''}
                        </button>
                    </div>
                `)}
            </div>
        </div>

        <!-- Action Buttons -->
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
