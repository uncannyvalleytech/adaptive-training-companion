/**
 * @file workout-session.js
 * This component handles the core workout experience.
 * It is responsible for displaying the current workout,
 * managing user input for sets, reps, and RPE, and
 * implementing the core adaptive engine logic.
 */

import { LitElement, html, css } from "lit";
import { saveData } from "../services/api.js";
import { getCredential } from "../services/google-auth.js";

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
      nextSetSuggestion: { reps: 5, rpe: 8, adjustment: "Start with a warm-up set."}
    },
    {
      name: "Dumbbell Bench Press",
      sets: 3,
      reps: 8,
      rpe: 7,
      completedSets: [],
      notes: "",
      nextSetSuggestion: { reps: 8, rpe: 7, adjustment: "Warm-up set."}
    },
    {
      name: "Pull-ups",
      sets: 3,
      reps: 8,
      rpe: 8,
      completedSets: [],
      notes: "",
      nextSetSuggestion: { reps: 8, rpe: 8, adjustment: "Warm-up set."}
    },
  ],
};

class WorkoutSession extends LitElement {
  static properties = {
    workout: { type: Object },
    isWorkoutCompleted: { type: Boolean },
    loadingMessage: { type: String },
    errorMessage: { type: String },
  };

  constructor() {
    super();
    this.workout = initialWorkout;
    this.isWorkoutCompleted = false;
    this.loadingMessage = "";
    this.errorMessage = "";
  }

  static styles = css`
    .container {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .exercise-card {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: var(--shadow-sm);
    }
    .exercise-card h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
    .exercise-card p {
      margin-bottom: 0.5rem;
    }
    .set-input-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .set-input-group input {
      width: 60px;
      padding: 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
    }
    .set-input-group button {
      padding: 0.5rem 1rem;
      background-color: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--border-radius);
      cursor: pointer;
    }
    .set-input-group button:hover {
      background-color: var(--color-primary-hover);
    }
    .completed-sets {
      margin-top: 1rem;
      border-top: 1px dashed var(--color-border);
      padding-top: 1rem;
    }
    .completed-sets p {
      margin-bottom: 0.25rem;
    }
    .complete-workout-btn {
      width: 100%;
      padding: 1rem;
      background-color: green;
      color: white;
      border: none;
      border-radius: var(--border-radius);
      cursor: pointer;
      margin-top: 1rem;
    }
    .error-message {
      color: red;
      font-weight: bold;
      margin-bottom: 1rem;
    }
    .suggestion-box {
      background-color: #e3f2fd;
      border-left: 5px solid #2196f3;
      padding: 0.75rem;
      margin-top: 0.5rem;
      border-radius: var(--border-radius);
      font-style: italic;
    }
  `;

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
            <div class="exercise-card">
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
    `;
  }

  _addSet(event) {
    const exerciseIndex = parseInt(event.target.dataset.exerciseIndex);
    const exercise = this.workout.exercises[exerciseIndex];

    // Get the input values
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

    // Validate inputs and set an error message
    if (isNaN(newSet.reps) || isNaN(newSet.weight) || isNaN(newSet.rpe) || isNaN(newSet.rir)) {
      this.errorMessage = "Please enter valid numbers for all fields.";
      return;
    }

    this.errorMessage = ""; // Clear any previous error messages

    // Add the new set to the workout data
    const updatedExercises = [...this.workout.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      completedSets: [...exercise.completedSets, newSet],
    };

    // Recalculate the next set suggestion based on the last completed set
    const lastSet = newSet;
    let nextReps = lastSet.reps;
    let nextRpe = lastSet.rpe;
    let adjustment = "You're on track!";
    
    if (lastSet.rpe > exercise.rpe) {
      // The set was harder than expected, suggest a small reduction
      nextReps = Math.max(1, lastSet.reps - 1);
      nextRpe = Math.max(1, lastSet.rpe - 1);
      adjustment = "That was a little tough. Let's pull back slightly.";
    } else if (lastSet.rpe < exercise.rpe) {
      // The set was easier than expected, suggest a small increase
      nextReps = lastSet.reps;
      nextRpe = lastSet.rpe + 1;
      adjustment = "That was easier than expected! Let's challenge you a bit more.";
    } else {
      // On track, keep the same target
      nextReps = lastSet.reps;
      nextRpe = lastSet.rpe;
    }
    
    updatedExercises[exerciseIndex].nextSetSuggestion = {
      reps: nextReps,
      rpe: nextRpe,
      adjustment: adjustment,
    };
    
    // Update the workout object to trigger a re-render
    this.workout = { ...this.workout, exercises: updatedExercises };

    // Clear inputs
    repsInput.value = "";
    weightInput.value = "";
    rpeInput.value = "";
    rirInput.value = "";
  }

  async _completeWorkout() {
    this.loadingMessage = "Saving your workout...";
    this.errorMessage = "";

    try {
      // Get the authentication token
      const token = getCredential().credential;
      if (!token) {
        throw new Error("User not authenticated.");
      }

      // Add a timestamp and flatten the workout object for saving
      const workoutToSave = {
        date: new Date().toISOString(),
        exercises: this.workout.exercises.map((exercise) => ({
          name: exercise.name,
          completedSets: exercise.completedSets,
        })),
      };

      // Call the API to save the workout
      const response = await saveData([workoutToSave], token);

      if (response.success === false) {
        throw new Error(response.error);
      }

      this.isWorkoutCompleted = true; // Show the completion screen
      this.loadingMessage = ""; // Clear loading message
    } catch (error) {
      console.error("Failed to save workout data:", error);
      this.errorMessage = "Failed to save your workout. Please try again.";
      this.loadingMessage = "";
    }
  }

  _goBackToHome() {
    // This will reload the app and bring the user back to the home screen
    window.location.reload();
  }
}

customElements.define("workout-session", WorkoutSession);