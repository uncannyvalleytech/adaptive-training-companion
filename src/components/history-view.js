/**
 * @file history-view.js
 * This component is responsible for displaying a history of the user's
 * completed workouts. It fetches the workout data from the backend and
 * renders it as a list.
 */

// Corrected import path for Lit
import { LitElement, html } from "lit";
import { getData } from "../services/api.js";
import { getCredential } from "../services/google-auth.js";
import "../style.css"; // Import the main stylesheet

class HistoryView extends LitElement {
  static properties = {
    workouts: { type: Array },
    isLoading: { type: Boolean },
    errorMessage: { type: String },
  };

  constructor() {
    super();
    this.workouts = [];
    this.isLoading = true;
    this.errorMessage = "";
  }
  
  connectedCallback() {
    super.connectedCallback();
    this.fetchWorkoutHistory();
  }

  static styles = []; // The component's styles will now be handled by the imported stylesheet.

  async fetchWorkoutHistory() {
    this.isLoading = true;
    this.errorMessage = "";

    try {
      const token = getCredential().credential;
      if (!token) {
        throw new Error("User not authenticated.");
      }

      const response = await getData(token);
      if (response && response.data && response.data.workouts) {
        // Simulate a delay to show the skeleton loader
        setTimeout(() => {
          this.workouts = response.data.workouts;
          this.isLoading = false;
        }, 1000);
      } else {
        throw new Error(response.error || "Unexpected API response format.");
      }
    } catch (error) {
      console.error("Failed to fetch workout history:", error);
      this.errorMessage =
        "Failed to load your workout history. Please try again.";
      this.isLoading = false;
    }
  }

  render() {
    if (this.isLoading) {
      return this.renderSkeleton();
    }

    if (this.errorMessage) {
      return html`
        <div class="container error-container">
          <p class="error-message">${this.errorMessage}</p>
          <button @click=${this.fetchWorkoutHistory} class="btn-primary">Retry</button>
        </div>
      `;
    }

    return html`
      <div class="container">
        <h1>Workout History</h1>
        ${this.workouts.length > 0
          ? html`
              ${this.workouts.map(
                (workout) => html`
                  <div class="card workout-card">
                    <h2>
                      Workout on ${new Date(workout.date).toLocaleDateString()}
                    </h2>
                    <ul>
                      ${workout.exercises.map(
                        (exercise) => html`
                          <li>
                            <strong>${exercise.name}</strong>
                            <ul>
                              ${exercise.completedSets.map(
                                (set, setIndex) => html`
                                  <li>
                                    Set ${setIndex + 1}: ${set.reps} reps @
                                    ${set.rpe} RPE with ${set.weight} lbs
                                  </li>
                                `
                              )}
                            </ul>
                          </li>
                        `
                      )}
                    </ul>
                  </div>
                `
              )}
            `
          : html`<p>You have no workouts logged yet. Start a new workout!</p>`}
      </div>
    `;
  }

  renderSkeleton() {
    return html`
      <div class="container">
        <h1>Workout History</h1>
        ${[...Array(3)].map(() => html`
          <div class="card">
            <div class="skeleton skeleton-title" style="width: 70%;"></div>
            <div class="skeleton skeleton-text" style="width: 50%;"></div>
            <div class="skeleton skeleton-text" style="width: 80%;"></div>
            <div class="skeleton skeleton-text" style="width: 60%;"></div>
          </div>
        `)}
      </div>
    `;
  }
}

customElements.define("history-view", HistoryView);
