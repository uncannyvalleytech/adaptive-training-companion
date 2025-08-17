/**
 * @file workout-session.js
 * This component handles the core workout experience.
 * It is responsible for displaying the current workout,
 * managing user input for sets, reps, and RPE, and
 * implementing the core adaptive engine logic.
 */

import { LitElement, html } from "lit";
import { saveData } from "../services/api.js";
import { getCredential } from "../services/google-auth.js";
import "./workout-feedback-modal.js"; // Import the new modal component
import "../style.css"; // Import the main stylesheet

// A simple workout object for our MVP (Minimum Viable Product)
const initialWorkout = {
  name: "Full Body Strength",
  exercises: [
    {
      name: "Barbell Squats",
      sets: 3,
      reps: 5,
      rpe: 8,
      completedSets: [],
      notes: "",
      nextSetSuggestion: { reps: 5, rpe: 8, adjustment: "Start with a warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Back Soreness": ["Never Got Sore", "Healed a While Ago", "Healed Just on Time", "I'm Still Sore!"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
    {
      name: "Dumbbell Bench Press",
      sets: 3,
      reps: 8,
      rpe: 7,
      completedSets: [],
      notes: "",
      nextSetSuggestion: { reps: 8, rpe: 7, adjustment: "Warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Biceps Pump": ["Low Pump", "Moderate Pump", "Amazing Pump"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
    {
      name: "Pull-ups",
      sets: 3,
      reps: 8,
      rpe: 8,
      completedSets: [],
      notes: "",
      nextSetSuggestion: { reps: 8, rpe: 8, adjustment: "Warm-up set." },
      feedbackRequired: {
        "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
        "Back Soreness": ["Never Got Sore", "Healed a While Ago", "Healed Just on Time", "I'm Still Sore!"],
        "Workout Difficulty": ["Easy", "Pretty Good", "Pushed My Limits", "Too Much"]
      }
    },
  ],
};

class WorkoutSession extends LitElement {
  static properties = {
    workout: { type: Object },
    isSaving: { type: Boolean },
    errors: { type: Object },
    // New properties for the feedback modal
    showFeedbackModal: { type: Boolean },
    feedbackQuestions: { type: Object },
    currentFeedbackExerciseIndex: { type: Number },
  };

  constructor() {
    super();
    this.workout = initialWorkout;
    this.isSaving = false;
    this.errors = {}; // To store validation errors
    // Initialize new properties
    this.showFeedbackModal = false;
    this.feedbackQuestions = {};
    this.currentFeedbackExerciseIndex = -1;
  }

  static styles = []; // The component's styles will now be handled by the imported stylesheet.

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
      const exerciseIndex = e.target.dataset.exerciseIndex;
      const addButton = this.shadowRoot.querySelector(`.add-set-button[data-exercise-index="${exerciseIndex}"]`);
      if (addButton) {
        addButton.click();
      }
    } else {
      // Auto-focus next input
      const { exerciseIndex, inputType } = e.target.dataset;
      if (e.target.value.length > 0) {
        let nextInputType;
        switch (inputType) {
          case 'reps': nextInputType = 'weight'; break;
          case 'weight': nextInputType = 'rpe'; break;
          case 'rpe': nextInputType = 'rir'; break;
          default: return;
        }
        const nextInput = this.shadowRoot.querySelector(`input[data-exercise-index="${exerciseIndex}"][data-input-type="${nextInputType}"]`);
        if (nextInput) {
          // A small delay helps ensure the value is registered before focus shifts
          setTimeout(() => nextInput.focus(), 100);
        }
      }
    }
  }

  _adjustValue(exerciseIndex, inputType, amount) {
    const input = this.shadowRoot.querySelector(`input[data-exercise-index="${exerciseIndex}"][data-input-type="${inputType}"]`);
    if (input) {
      let currentValue = parseFloat(input.value) || 0;
      input.value = Math.max(0, currentValue + amount);
      this._validateInput({ target: input }); // Re-validate after change
    }
  }

  render() {
    return html`
      <div class="container">
        <h1>${this.workout.name}</h1>
        ${this.workout.exercises.map(
          (exercise, index) => {
            const repsError = this.errors[`${index}-reps`];
            const weightError = this.errors[`${index}-weight`];
            const rpeError = this.errors[`${index}-rpe`];
            const rirError = this.errors[`${index}-rir`];
            const currentSetNumber = exercise.completedSets.length + 1;

            return html`
              <div class="card exercise-card" role="region" aria-labelledby="exercise-title-${index}">
                <h3 id="exercise-title-${index}">${exercise.name}</h3>
                <p>
                  Target: ${exercise.sets} sets of ${exercise.reps} reps @ RPE
                  ${exercise.rpe}
                </p>
                ${exercise.completedSets.length > 0 ? html`
                  <div class="completed-sets">
                    ${exercise.completedSets.map(
                      (set, setIndex) => html`
                        <p>
                          Completed Set ${setIndex + 1}: ${set.reps} reps @ ${set.rpe}
                          RPE with ${set.weight} lbs
                        </p>
                      `
                    )}
                  </div>
                ` : ''}
                
                <div class="suggestion-box">
                  <p><strong>Next set:</strong> ${exercise.nextSetSuggestion.reps} reps @ RPE ${exercise.nextSetSuggestion.rpe}</p>
                  <p><em>${exercise.nextSetSuggestion.adjustment}</em></p>
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
                        <div class="stepper-buttons">
                          <button @click=${() => this._adjustValue(index, inputType, 1)} class="stepper-btn" aria-label="Increase ${inputType}">+</button>
                          <button @click=${() => this._adjustValue(index, inputType, -1)} class="stepper-btn" aria-label="Decrease ${inputType}">-</button>
                        </div>
                      </div>
                      <div id="${inputType}-error-${index}" class="error-message-text" aria-live="polite">${this.errors[`${index}-${inputType}`] || ''}</div>
                    </div>
                  `)}
                  <button @click=${this._addSet} data-exercise-index="${index}" class="btn-primary add-set-button" aria-label="Add set ${currentSetNumber} for ${exercise.name}">
                    Add Set
                  </button>
                </div>
              </div>
            `;
          }
        )}
        <button class="complete-workout-btn btn-primary" @click=${this._completeWorkout} ?disabled=${this.isSaving}>
          ${this.isSaving
            ? html`<div class="loading-spinner" style="width: 20px; height: 20px; border-width: 3px;"></div> Saving...`
            : 'Complete Workout'
          }
        </button>
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

  _addSet(event) {
    const exerciseIndex = parseInt(event.target.closest('button').dataset.exerciseIndex);
    const exercise = this.workout.exercises[exerciseIndex];

    const parent = event.target.closest(".set-input-grid");
    const repsInput = parent.querySelector('input[data-input-type="reps"]');
    const weightInput = parent.querySelector('input[data-input-type="weight"]');
    const rpeInput = parent.querySelector('input[data-input-type="rpe"]');
    const rirInput = parent.querySelector('input[data-input-type="rir"]');

    // Final validation check before adding the set
    const reps = parseFloat(repsInput.value);
    const weight = parseFloat(weightInput.value);
    const rpe = parseFloat(rpeInput.value);
    const rir = parseFloat(rirInput.value);

    let hasError = false;
    if (repsInput.value === '' || isNaN(reps) || reps < 0) {
      this.errors = { ...this.errors, [`${exerciseIndex}-reps`]: 'Required.' };
      hasError = true;
    }
    if (weightInput.value === '' || isNaN(weight) || weight < 0) {
      this.errors = { ...this.errors, [`${exerciseIndex}-weight`]: 'Required.' };
      hasError = true;
    }
    if (rpeInput.value === '' || isNaN(rpe) || rpe < 0) {
      this.errors = { ...this.errors, [`${exerciseIndex}-rpe`]: 'Required.' };
      hasError = true;
    }
    if (rirInput.value === '' || isNaN(rir) || rir < 0) {
      this.errors = { ...this.errors, [`${exerciseIndex}-rir`]: 'Required.' };
      hasError = true;
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

    const lastSet = newSet;
    let nextReps = lastSet.reps;
    let nextRpe = lastSet.rpe;
    let adjustment = "You're on track!";
    
    if (lastSet.rpe > exercise.rpe) {
      nextReps = Math.max(1, lastSet.reps - 1);
      nextRpe = Math.max(1, lastSet.rpe - 1);
      adjustment = "That was a little tough. Let's pull back slightly.";
    } else if (lastSet.rpe < exercise.rpe) {
      nextReps = lastSet.reps;
      nextRpe = lastSet.rpe + 1;
      adjustment = "That was easier than expected! Let's challenge you a bit more.";
    }
    
    updatedExercises[exerciseIndex].nextSetSuggestion = {
      reps: nextReps,
      rpe: nextRpe,
      adjustment: adjustment,
    };
    
    this.workout = { ...this.workout, exercises: updatedExercises };

    repsInput.value = "";
    weightInput.value = "";
    rpeInput.value = "";
    rirInput.value = "";
    this.errors = {}; // Clear errors after successful submission
    
    this.feedbackQuestions = exercise.feedbackRequired;
    this.currentFeedbackExerciseIndex = exerciseIndex;
    this.showFeedbackModal = true;
  }
  
  _handleFeedbackSubmit(feedback) {
    const updatedExercises = [...this.workout.exercises];
    const currentExercise = updatedExercises[this.currentFeedbackExerciseIndex];
    const lastSetIndex = currentExercise.completedSets.length - 1;
    
    if (lastSetIndex >= 0) {
      currentExercise.completedSets[lastSetIndex].feedback = feedback;
    }
    
    this.workout = { ...this.workout, exercises: updatedExercises };
    this.showFeedbackModal = false;
  }

  _closeFeedbackModal() {
    this.showFeedbackModal = false;
  }

  async _completeWorkout() {
    this.isSaving = true;

    try {
      const token = getCredential().credential;
      if (!token) {
        throw new Error("User not authenticated.");
      }

      const workoutToSave = {
        date: new Date().toISOString(),
        exercises: this.workout.exercises.map((exercise) => ({
          name: exercise.name,
          completedSets: exercise.completedSets,
        })),
      };

      const response = await saveData([workoutToSave], token);

      if (response.success === false) {
        throw new Error(response.error);
      }

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
