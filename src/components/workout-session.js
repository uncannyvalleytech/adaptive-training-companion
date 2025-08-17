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
    isWorkoutCompleted: { type: Boolean },
    loadingMessage: { type: String },
    errorMessage: { type: String },
    // New properties for the feedback modal
    showFeedbackModal: { type: Boolean },
    feedbackQuestions: { type: Object },
    currentFeedbackExerciseIndex: { type: Number },
  };

  constructor() {
    super();
    this.workout = initialWorkout;
    this.isWorkoutCompleted = false;
    this.loadingMessage = "";
    this.errorMessage = "";
    // Initialize new properties
    this.showFeedbackModal = false;
    this.feedbackQuestions = {};
    this.currentFeedbackExerciseIndex = -1;
  }

  static styles = []; // The component's styles will now be handled by the imported stylesheet.

  render() {
    if (this.isWorkoutCompleted) {
      return html`
        <div class="container">
          <h2>Workout Completed!</h2>
          <p>
            You did a great job! Your workout has been saved to your personal
            Google Sheet.
          </p>
          <a href="#" @click=${() => this._goBackToHome()}>Go back to Home</a>
        </div>
      `;
    }

    return html`
      <div class="container">
        <h1>${this.workout.name}</h1>
        ${this.errorMessage
          ? html`<p class="error-message">${this.errorMessage}</p>`
          : ""}
        ${this.workout.exercises.map(
          (exercise, index) => html`
            <div class="card exercise-card">
              <h3>${exercise.name}</h3>
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
              
              <!-- Suggestion for the next set -->
              <div class="suggestion-box">
                <p>Next set suggestion: ${exercise.nextSetSuggestion.reps} reps @ RPE ${exercise.nextSetSuggestion.rpe}</p>
                <p>Note: ${exercise.nextSetSuggestion.adjustment}</p>
              </div>

              <div class="set-input-group">
                <input
                  type="number"
                  placeholder="Reps"
                  data-exercise-index="${index}"
                  data-input-type="reps"
                />
                <input
                  type="number"
                  placeholder="Weight (lbs)"
                  data-exercise-index="${index}"
                  data-input-type="weight"
                />
                <input
                  type="number"
                  placeholder="RPE"
                  data-exercise-index="${index}"
                  data-input-type="rpe"
                />
                <input
                  type="number"
                  placeholder="RIR"
                  data-exercise-index="${index}"
                  data-input-type="rir"
                />
                <button @click=${this._addSet} data-exercise-index="${index}">
                  Add Set
                </button>
              </div>
            </div>
          `
        )}
        <button class="complete-workout-btn" @click=${this._completeWorkout}>
          Complete Workout
        </button>
      </div>
      
      <!-- Render the feedback modal if needed -->
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
    const exerciseIndex = parseInt(event.target.dataset.exercise-index);
    const exercise = this.workout.exercises[exerciseIndex];

    const parent = event.target.closest(".set-input-group");
    const repsInput = parent.querySelector('input[data-input-type="reps"]');
    const weightInput = parent.querySelector('input[data-input-type="weight"]');
    const rpeInput = parent.querySelector('input[data-input-type="rpe"]');
    const rirInput = parent.querySelector('input[data-input-type="rir"]');

    const newSet = {
      reps: parseInt(repsInput.value),
      weight: parseInt(weightInput.value),
      rpe: parseInt(rpeInput.value),
      rir: parseInt(rirInput.value),
    };

    if (isNaN(newSet.reps) || isNaN(newSet.weight) || isNaN(newSet.rpe) || isNaN(newSet.rir)) {
      this.errorMessage = "Please enter valid numbers for all fields.";
      return;
    }

    this.errorMessage = "";

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
    } else {
      nextReps = lastSet.reps;
      nextRpe = lastSet.rpe;
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
    
    // Show the feedback modal for this exercise
    this.feedbackQuestions = exercise.feedbackRequired;
    this.currentFeedbackExerciseIndex = exerciseIndex;
    this.showFeedbackModal = true;
  }
  
  /**
   * Handles feedback submitted from the modal and saves it.
   * @param {Object} feedback - The feedback data submitted by the user.
   */
  _handleFeedbackSubmit(feedback) {
    // Add the feedback to the last completed set of the current exercise
    const updatedExercises = [...this.workout.exercises];
    const currentExercise = updatedExercises[this.currentFeedbackExerciseIndex];
    const lastSetIndex = currentExercise.completedSets.length - 1;
    
    if (lastSetIndex >= 0) {
      currentExercise.completedSets[lastSetIndex].feedback = feedback;
    }
    
    this.workout = { ...this.workout, exercises: updatedExercises };
    this.showFeedbackModal = false; // Hide the modal
  }

  /**
   * Hides the feedback modal.
   */
  _closeFeedbackModal() {
    this.showFeedbackModal = false;
  }

  async _completeWorkout() {
    this.loadingMessage = "Saving your workout...";
    this.errorMessage = "";

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

      this.isWorkoutCompleted = true;
      this.loadingMessage = "";
    } catch (error) {
      console.error("Failed to save workout data:", error);
      this.errorMessage = "Failed to save your workout. Please try again.";
      this.loadingMessage = "";
    }
  }

  _goBackToHome() {
    window.location.reload();
  }
}

customElements.define("workout-session", WorkoutSession);
