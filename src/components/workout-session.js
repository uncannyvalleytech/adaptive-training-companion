/**
 * @file workout-session.js
 * This component handles the core workout experience.
 * It is responsible for displaying the current workout,
 * managing user input for sets, reps, and RPE, and
 * implementing the core adaptive engine logic.
 */

import { LitElement, html } from "lit";
import { saveData, generateRecommendation } from "../services/api.js";
import { getCredential } from "../services/google-auth.js";
import "./workout-feedback-modal.js";

// A simple workout object for our MVP (Minimum Viable Product)
const initialWorkout = {
  name: "Full Body Strength",
  exercises: [
    {
      name: "Barbell Squats",
      sets: 3,
      reps: 5,
      rpe: 8,
      rest: 90, // Rest time in seconds
      completedSets: [],
      notes: "",
      category: "strength",
      muscleGroup: "Legs",
      nextSetSuggestion: { reps: 5, rpe: 8, adjustment: "Start with a warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Back Soreness": ["Never Got Sore", "Healed a While Ago", "Healed Just on Time", "I'm Still Sore!"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
    {
      name: "Deadlifts",
      sets: 3,
      reps: 5,
      rpe: 8,
      rest: 120,
      completedSets: [],
      notes: "",
      category: "strength",
      muscleGroup: "Back",
      nextSetSuggestion: { reps: 5, rpe: 8, adjustment: "Start with a warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Back Soreness": ["Never Got Sore", "Healed a While Ago", "Healed Just on Time", "I'm Still Sore!"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
    {
      name: "Bench Press",
      sets: 3,
      reps: 8,
      rpe: 7,
      rest: 60,
      completedSets: [],
      notes: "",
      category: "strength",
      muscleGroup: "Chest",
      nextSetSuggestion: { reps: 8, rpe: 7, adjustment: "Warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Biceps Pump": ["Low Pump", "Moderate Pump", "Amazing Pump"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
    {
      name: "Overhead Press",
      sets: 3,
      reps: 8,
      rpe: 7,
      rest: 60,
      completedSets: [],
      notes: "",
      category: "strength",
      muscleGroup: "Shoulders",
      nextSetSuggestion: { reps: 8, rpe: 7, adjustment: "Warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
    {
      name: "Pull-ups",
      sets: 3,
      reps: 8,
      rpe: 8,
      rest: 75,
      completedSets: [],
      notes: "",
      category: "strength",
      muscleGroup: "Back",
      nextSetSuggestion: { reps: 8, rpe: 8, adjustment: "Warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Back Soreness": ["Never Got Sore", "Healed a While Ago", "Healed Just on Time", "I'm Still Sore!"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
    {
      name: "Barbell Rows",
      sets: 3,
      reps: 8,
      rpe: 8,
      rest: 75,
      completedSets: [],
      notes: "",
      category: "strength",
      muscleGroup: "Back",
      nextSetSuggestion: { reps: 8, rpe: 8, adjustment: "Warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Back Soreness": ["Never Got Sore", "Healed a While Ago", "Healed Just on Time", "I'm Still Sore!"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
    {
      name: "Bicep Curls",
      sets: 3,
      reps: 12,
      rpe: 7,
      rest: 45,
      completedSets: [],
      notes: "",
      category: "accessory",
      muscleGroup: "Arms",
      nextSetSuggestion: { reps: 12, rpe: 7, adjustment: "Warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Biceps Pump": ["Low Pump", "Moderate Pump", "Amazing Pump"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
    {
      name: "Tricep Pushdowns",
      sets: 3,
      reps: 12,
      rpe: 7,
      rest: 45,
      completedSets: [],
      notes: "",
      category: "accessory",
      muscleGroup: "Arms",
      nextSetSuggestion: { reps: 12, rpe: 7, adjustment: "Warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Tricep Pump": ["Low Pump", "Moderate Pump", "Amazing Pump"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
    {
      name: "Leg Press",
      sets: 3,
      reps: 10,
      rpe: 8,
      rest: 60,
      completedSets: [],
      notes: "",
      category: "strength",
      muscleGroup: "Legs",
      nextSetSuggestion: { reps: 10, rpe: 8, adjustment: "Warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
    {
      name: "Leg Curls",
      sets: 3,
      reps: 12,
      rpe: 7,
      rest: 45,
      completedSets: [],
      notes: "",
      category: "accessory",
      muscleGroup: "Legs",
      nextSetSuggestion: { reps: 12, rpe: 7, adjustment: "Warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    }
  ],
};

class WorkoutSession extends LitElement {
  static properties = {
    workout: { type: Object },
    isSaving: { type: Boolean },
    errors: { type: Object },
    showFeedbackModal: { type: Boolean },
    feedbackQuestions: { type: Object },
    currentFeedbackExerciseIndex: { type: Number },
    isResting: { type: Boolean },
    restTimeRemaining: { type: Number },
    totalRestTime: { type: Number },
    nextExerciseName: { type: String },
    isPaused: { type: Boolean },
    pauseDuration: { type: Number },
    estimatedTimeRemaining: { type: Number },
    showExitModal: { type: Boolean },
    units: { type: String },
  };

  constructor() {
    super();
    this.workout = initialWorkout;
    this.isSaving = false;
    this.errors = {};
    this.showFeedbackModal = false;
    this.feedbackQuestions = {};
    this.currentFeedbackExerciseIndex = -1;
    this.isResting = false;
    this.restTimeRemaining = 0;
    this.totalRestTime = 0;
    this.nextExerciseName = '';
    this.restTimerInterval = null;
    this.isPaused = false;
    this.pauseDuration = 0;
    this.estimatedTimeRemaining = 0;
    this.showExitModal = false;
    this.units = 'lbs';
    this.workoutStartTime = Date.now();
  }

  static styles = [];

  connectedCallback() {
    super.connectedCallback();
    this._loadProgressFromLocalStorage();
    window.addEventListener('units-change', (e) => this._handleUnitsChange(e.detail.units));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopRestTimer();
    window.removeEventListener('units-change', this._handleUnitsChange.bind(this));
  }
  
  _handleUnitsChange(units) {
    this.units = units;
    this.requestUpdate();
  }

  _getExerciseIcon(category) {
    // A simple mapping for now. Can be expanded later.
    const icons = {
      'strength': html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M14 2L6 2v6a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V2zM14 2h6l-6 6a4 4 0 0 0-4-4V2zM14 2h6L14 8a4 4 0 0 0-4-4V2z"></path></svg>`,
      'cardio': html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M12 21.5a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19zM12 2a9.5 9.5 0 0 0 0 19M12 2a9.5 9.5 0 0 0 0 19zM12 2a9.5 9.5 0 0 0 0 19z"></path></svg>`,
      'flexibility': html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 2v10l-4-4"></path></svg>`,
      'default': html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`
    };
    return icons[category] || icons['default'];
  }

  _convertWeight(weight) {
    if (this.units === 'kg') {
      return (weight * 0.453592).toFixed(1);
    }
    return weight;
  }

  _loadProgressFromLocalStorage() {
    const savedWorkout = localStorage.getItem('currentWorkout');
    if (savedWorkout) {
      try {
        const data = JSON.parse(savedWorkout);
        this.workout = data.workout;
        // Restore timers and state if needed, though this is a basic implementation
        // For now, we'll just check if a rest was active.
        if (data.isResting && data.restTimeRemaining > 0) {
          this._startRestTimer(data.restTimeRemaining, data.nextExerciseName);
        }
        this.workoutStartTime = data.workoutStartTime || Date.now();
        this.pauseDuration = data.pauseDuration || 0;
        this._calculateEstimatedTime();
      } catch (e) {
        console.error("Failed to parse saved workout data.", e);
        localStorage.removeItem('currentWorkout');
      }
    }
  }

  _saveProgressToLocalStorage() {
    const dataToSave = {
      workout: this.workout,
      isResting: this.isResting,
      restTimeRemaining: this.restTimeRemaining,
      nextExerciseName: this.nextExerciseName,
      workoutStartTime: this.workoutStartTime,
      pauseDuration: this.pauseDuration,
    };
    localStorage.setItem('currentWorkout', JSON.stringify(dataToSave));
  }

  _calculateEstimatedTime() {
    let remainingTime = 0;
    for (let i = 0; i < this.workout.exercises.length; i++) {
      const exercise = this.workout.exercises[i];
      const setsToComplete = exercise.sets - exercise.completedSets.length;
      if (setsToComplete > 0) {
        // Estimate 1 minute per set, plus the prescribed rest time
        remainingTime += setsToComplete * 60; 
        if (i < this.workout.exercises.length - 1) {
          remainingTime += exercise.rest;
        }
      }
    }
    this.estimatedTimeRemaining = remainingTime;
  }

  _validateInput(e) {
    const input = e.target;
    const { exerciseIndex, inputType } = input.dataset;
    const value = parseFloat(input.value);
    const errorKey = `${exerciseIndex}-${inputType}`;
    let errorMessage = '';

    if (input.value !== '' && (isNaN(value) || value < 0)) {
      errorMessage = 'Must be a positive number.';
    }

    this.errors = { ...this.errors, [errorKey]: errorMessage };
  }

  _handleInputKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const exerciseIndex = e.target.dataset.exerciseIndex;
      const addButton = this.shadowRoot.querySelector(`.add-set-button[data-exercise-index="${exerciseIndex}"]`);
      if (addButton) {
        addButton.click();
      }
    }
  }

  _startRestTimer(duration, nextExerciseName) {
    this.totalRestTime = duration;
    this.restTimeRemaining = duration;
    this.nextExerciseName = nextExerciseName;
    this.isResting = true;
    this._saveProgressToLocalStorage();

    this.restTimerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.restTimeRemaining -= 1;
        this._saveProgressToLocalStorage();
        if (this.restTimeRemaining <= 0) {
          this._stopRestTimer();
        }
      }
    }, 1000);
  }

  _stopRestTimer() {
    clearInterval(this.restTimerInterval);
    this.isResting = false;
    this._saveProgressToLocalStorage();
  }

  _adjustRestTime(seconds) {
    this.restTimeRemaining += seconds;
    if (this.restTimeRemaining < 0) this.restTimeRemaining = 0;
  }

  _pauseWorkout() {
    this.isPaused = true;
    this.pauseStartTime = Date.now();
  }

  _resumeWorkout() {
    this.isPaused = false;
    if (this.pauseStartTime) {
      this.pauseDuration += Date.now() - this.pauseStartTime;
      this.pauseStartTime = null;
    }
    // Automatically focus on the next input field after resuming
    const nextInput = this.shadowRoot.querySelector('input:not([disabled])');
    if (nextInput) {
      nextInput.focus();
    }
  }

  _showExitModal() {
    this.showExitModal = true;
  }

  _closeExitModal() {
    this.showExitModal = false;
  }
  
  _exitWorkoutAndSave() {
    // This will trigger the _completeWorkout method with a flag to save and exit.
    this.shadowRoot.querySelector('.complete-workout-button').click();
  }
  
  _discardWorkout() {
    localStorage.removeItem('currentWorkout');
    this.dispatchEvent(new CustomEvent('workout-cancelled', { bubbles: true, composed: true }));
  }

  renderRestTimer() {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (this.restTimeRemaining / this.totalRestTime) * circumference;
    const minutes = Math.floor(this.restTimeRemaining / 60);
    const seconds = this.restTimeRemaining % 60;

    return html`
      <div class="rest-timer-overlay">
        <h2>Resting...</h2>
        <div class="timer-circle">
          <svg>
            <circle class="background" cx="100" cy="100" r="${radius}"></circle>
            <circle class="progress" cx="100" cy="100" r="${radius}" style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};"></circle>
          </svg>
          <div class="timer-display">${minutes}:${seconds < 10 ? '0' : ''}${seconds}</div>
        </div>
        <p>Next up: ${this.nextExerciseName}</p>
        <div class="rest-timer-controls">
          <button @click=${() => this._adjustRestTime(15)} class="btn-secondary">+15s</button>
          <button @click=${this._stopRestTimer} class="btn-primary">Skip Rest</button>
        </div>
      </div>
    `;
  }
  
  renderPauseOverlay() {
    return html`
      <div class="pause-overlay">
        <h2>Workout Paused</h2>
        <button class="btn-primary" @click=${this._resumeWorkout}>Resume</button>
      </div>
    `;
  }

  renderExitModal() {
    return html`
      <div class="modal-overlay" @click=${this._closeExitModal}>
        <div class="glass-card modal-content" role="dialog" aria-modal="true">
          <h3>Exit Workout?</h3>
          <p>Are you sure you want to exit? You can save your progress or discard it completely.</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click=${this._discardWorkout}>Discard Workout</button>
            <button class="btn-primary" @click=${this._exitWorkoutAndSave}>Save and Exit</button>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const isWorkoutComplete = this.workout.exercises.every(ex => ex.completedSets.length >= ex.sets);
    const totalWorkoutDuration = Date.now() - this.workoutStartTime - (this.pauseDuration || 0);
    const totalMinutes = Math.floor(totalWorkoutDuration / 60000);
    const totalSeconds = Math.floor((totalWorkoutDuration % 60000) / 1000);
    const weightUnit = this.units === 'lbs' ? 'lbs' : 'kg';

    return html`
      ${this.isResting ? this.renderRestTimer() : ''}
      ${this.isPaused ? this.renderPauseOverlay() : ''}
      ${this.showExitModal ? this.renderExitModal() : ''}

      <div class="container">
        <div class="workout-header">
          <h1>${this.workout.name}</h1>
          <button @click=${this._pauseWorkout} class="btn-icon" aria-label="Pause workout">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
          </button>
        </div>
        
        <div class="stats-card glass-card">
          <div class="stat-item">
            <span>Time Elapsed</span>
            <span>${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}</span>
          </div>
          <div class="stat-item">
            <span>Est. Time Remaining</span>
            <span>~${Math.floor(this.estimatedTimeRemaining / 60)} min</span>
          </div>
        </div>
        
        ${this.workout.exercises.map(
          (exercise, index) => {
            const currentSetNumber = exercise.completedSets.length + 1;
            const isExerciseComplete = currentSetNumber > exercise.sets;

            return html`
              <div class="card" role="region" aria-labelledby="exercise-title-${index}">
                <div class="exercise-header">
                  <div class="exercise-title-group">
                    <span class="exercise-icon">${this._getExerciseIcon(exercise.category)}</span>
                    <h3 id="exercise-title-${index}">${exercise.name}</h3>
                  </div>
                  <span class="set-progress">Set ${Math.min(currentSetNumber, exercise.sets)} of ${exercise.sets}</span>
                </div>
                
                ${exercise.completedSets.length > 0 ? html`
                  <div class="completed-sets">
                    ${exercise.completedSets.map(
                      (set, setIndex) => html`
                        <div class="completed-set">
                          <span class="checkmark">✓</span>
                          <p>Set ${setIndex + 1}: ${set.reps} reps @ ${this._convertWeight(set.weight)} ${weightUnit}</p>
                        </div>
                      `
                    )}
                  </div>
                ` : ''}
                
                ${!isExerciseComplete ? html`
                  <div class="suggestion-box">
                    <p><strong>Suggestion:</strong> ${exercise.nextSetSuggestion.reps} reps @ RPE ${exercise.nextSetSuggestion.rpe}</p>
                    <p class="feedback-impact-note"><em>${exercise.nextSetSuggestion.adjustment}</em></p>
                  </div>

                  <div class="set-input-grid">
                    ${['reps', 'weight', 'rpe', 'rir'].map(inputType => html`
                      <div class="input-group">
                        <label for="${inputType}-${index}" class="sr-only">${inputType.charAt(0).toUpperCase() + inputType.slice(1)} for ${exercise.name}</label>
                        <div class="input-wrapper">
                          <input
                            id="${inputType}-${index}"
                            type="number"
                            placeholder="${inputType.charAt(0).toUpperCase() + inputType.slice(1)}"
                            class=${this.errors[`${index}-${inputType}`] ? 'input-error' : ''}
                            data-exercise-index="${index}"
                            data-input-type="${inputType}"
                            @input=${this._validateInput}
                            @keydown=${this._handleInputKeydown}
                            aria-label="${inputType} for ${exercise.name}, set ${currentSetNumber}"
                            aria-invalid=${!!this.errors[`${index}-${inputType}`]}
                            aria-describedby="${inputType}-error-${index}"
                          />
                        </div>
                        <div id="${inputType}-error-${index}" class="error-message-text" aria-live="polite">${this.errors[`${index}-${inputType}`] || ''}</div>
                      </div>
                    `)}
                    <button @click=${this._addSet} data-exercise-index="${index}" class="btn-primary add-set-button" aria-label="Add set ${currentSetNumber} for ${exercise.name}">
                      Add Set
                    </button>
                  </div>
                ` : html`<p><strong>Exercise complete! Great job.</strong></p>`}
              </div>
            `;
          }
        )}
        
        <div class="workout-action-buttons">
          <button class="btn-secondary" @click=${this._showExitModal}>
            Exit Workout
          </button>
          <button class="btn-primary complete-workout-button" @click=${this._completeWorkout} ?disabled=${this.isSaving || !isWorkoutComplete}>
            ${this.isSaving
              ? html`<div class="loading-spinner" style="width: 20px; height: 20px; border-width: 3px;"></div> Saving...`
              : 'Complete Workout'
            }
          </button>
        </div>
      </div>
      
      ${this.showFeedbackModal
        ? html`
            <workout-feedback-modal
              .feedbackData=${this.feedbackQuestions}
              .onFeedbackSubmit=${this._handleFeedbackSubmit.bind(this)}
              .onClose=${() => this._closeFeedbackModal()}
            ></workout-feedback-modal>
          `
        : ""}
    `;
  }

  _calculateVolume() {
    return this.workout.exercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.completedSets.reduce((sum, set) => {
        return sum + (set.reps * set.weight);
      }, 0);
      return total + exerciseVolume;
    }, 0);
  }

  _addSet(event) {
    const exerciseIndex = parseInt(event.target.closest('button').dataset.exerciseIndex);
    const exercise = this.workout.exercises[exerciseIndex];

    const parent = event.target.closest(".set-input-grid");
    const repsInput = parent.querySelector('input[data-input-type="reps"]');
    const weightInput = parent.querySelector('input[data-input-type="weight"]');
    const rpeInput = parent.querySelector('input[data-input-type="rpe"]');
    const rirInput = parent.querySelector('input[data-input-type="rir"]');

    const reps = parseFloat(repsInput.value);
    const weight = parseFloat(weightInput.value);
    const rpe = parseFloat(rpeInput.value);
    const rir = parseFloat(rirInput.value);

    let hasError = false;
    if (repsInput.value === '' || isNaN(reps) || reps < 0) {
      this.errors = { ...this.errors, [`${exerciseIndex}-reps`]: 'Required.' }; hasError = true;
    }
    if (weightInput.value === '' || isNaN(weight) || weight < 0) {
      this.errors = { ...this.errors, [`${exerciseIndex}-weight`]: 'Required.' }; hasError = true;
    }
    if (rpeInput.value === '' || isNaN(rpe) || rpe < 0) {
      this.errors = { ...this.errors, [`${exerciseIndex}-rpe`]: 'Required.' }; hasError = true;
    }
    if (rirInput.value === '' || isNaN(rir) || rir < 0) {
      this.errors = { ...this.errors, [`${exerciseIndex}-rir`]: 'Required.' }; hasError = true;
    }

    if (hasError) {
      this.requestUpdate();
      return;
    }

    const newSet = { reps, weight, rpe, rir };
    const updatedExercises = [...this.workout.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      completedSets: [...exercise.completedSets, newSet],
    };

    this.workout = { ...this.workout, exercises: updatedExercises };
    this._saveProgressToLocalStorage();
    this._calculateEstimatedTime();

    repsInput.value = "";
    weightInput.value = "";
    rpeInput.value = "";
    rirInput.value = "";
    this.errors = {};
    
    this.feedbackQuestions = exercise.feedbackRequired;
    this.currentFeedbackExerciseIndex = exerciseIndex;
    this.showFeedbackModal = true;
  }
  
  async _handleFeedbackSubmit(feedback) {
    const updatedExercises = [...this.workout.exercises];
    const currentExercise = updatedExercises[this.currentFeedbackExerciseIndex];
    const lastSetIndex = currentExercise.completedSets.length - 1;
    
    if (lastSetIndex >= 0) {
      currentExercise.completedSets[lastSetIndex].feedback = feedback;
    }

    const isLastSetOfExercise = updatedExercises[this.currentFeedbackExerciseIndex].completedSets.length >= currentExercise.sets;
    let nextUp = "Workout Complete!";
    if (!isLastSetOfExercise) {
      nextUp = currentExercise.name;
    } else if (this.currentFeedbackExerciseIndex + 1 < this.workout.exercises.length) {
      nextUp = this.workout.exercises[this.currentFeedbackExerciseIndex + 1].name;
    }

    // Call the LLM to generate the next recommendation
    this.workout = { ...this.workout, exercises: updatedExercises };
    this._saveProgressToLocalStorage();
    
    // We only need to generate the next suggestion if there are more sets to do.
    if (!isLastSetOfExercise) {
      const context = {
        lastSet: currentExercise.completedSets[lastSetIndex],
        exerciseName: currentExercise.name,
        targetRpe: currentExercise.rpe,
      };
      
      const recommendation = await generateRecommendation(context);
      if (recommendation && recommendation.reps && recommendation.rpe) {
        currentExercise.nextSetSuggestion = {
          reps: recommendation.reps,
          rpe: recommendation.rpe,
          adjustment: recommendation.adjustment,
        };
        this.workout = { ...this.workout, exercises: updatedExercises };
        this._saveProgressToLocalStorage();
      }
    }
    
    this.showFeedbackModal = false;

    if (nextUp !== "Workout Complete!") {
      this._startRestTimer(currentExercise.rest, nextUp);
    }
  }

  _closeFeedbackModal() {
    this.showFeedbackModal = false;
  }

  async _completeWorkout() {
    this.isSaving = true;

    try {
      const token = getCredential().credential;
      if (!token) { throw new Error("User not authenticated."); }
      
      const totalDuration = Math.floor((Date.now() - this.workoutStartTime) / 1000) - (this.pauseDuration / 1000);
      const totalVolume = this._calculateVolume();

      const workoutToSave = {
        date: new Date().toISOString(),
        durationInSeconds: totalDuration,
        totalVolume: totalVolume,
        exercises: this.workout.exercises.map((exercise) => ({
          name: exercise.name,
          completedSets: exercise.completedSets,
          category: exercise.category,
          muscleGroup: exercise.muscleGroup,
        })),
      };

      const response = await saveData([workoutToSave], token);

      if (response.success === false) { throw new Error(response.error); }
      
      // Clear localStorage on successful save
      localStorage.removeItem('currentWorkout');

      this.dispatchEvent(new CustomEvent('workout-completed', { bubbles: true, composed: true }));

    } catch (error) {
      console.error("Failed to save workout data:", error);
      this.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Failed to save your workout. Please try again.', type: 'error' },
        bubbles: true, 
        composed: true 
      }));
    } finally {
      this.isSaving = false;
    }
  }
}

customElements.define("workout-session", WorkoutSession);
