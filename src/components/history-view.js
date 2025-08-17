/**
 * @file history-view.js
 * This component is responsible for displaying a history of the user's
 * completed workouts. It fetches the workout data from the backend and
 * renders it as a list.
 */

// Corrected import path for Lit
import { LitElement, html, css } from "lit";
import { getData } from "../services/api.js";
import { getCredential } from "../services/google-auth.js";

class HistoryView extends LitElement {
  static properties = {
    workouts: { type: Array },
    loadingMessage: { type: String },
    errorMessage: { type: String },
  };

  constructor() {
    super();
    this.workouts = [];
    this.loadingMessage = "Loading workout history...";
    this.errorMessage = "";
    this.fetchWorkoutHistory();
  }

  static styles = css`
    .container {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .workout-card {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: var(--shadow-sm);
    }
    h2 {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      margin-bottom: 0.5rem;
    }
  `;

  async fetchWorkoutHistory() {
    this.loadingMessage = "Fetching your workout history...";
    this.errorMessage = "";

    try {
      const token = getCredential().credential;
      if (!token) {
        throw new Error("User not authenticated.");
      }

      const response = await getData(token);
      if (response && response.data && response.data.workouts) {
        this.workouts = response.data.workouts;
        this.loadingMessage = "";
      } else {
        throw new Error(response.error || "Unexpected API response format.");
      }
    } catch (error) {
      console.error("Failed to fetch workout history:", error);
      this.errorMessage =
        "Failed to load your workout history. Please try again.";
      this.loadingMessage = "";
    }
  }

  render() {
    if (this.loadingMessage) {
      return html`
        <div class="container">
          <p>${this.loadingMessage}</p>
        </div>
      `;
    }

    if (this.errorMessage) {
      return html`
        <div class="container">
          <p class="error-message">${this.errorMessage}</p>
        </div>
      `;
    }

    return html`
      <div class="container">
        <h1>Workout History</h1>
        ${this.workouts.length > 0
          ? html`
              ${this.workouts.map(
                (workout, index) => html`
                  <div class="workout-card">
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
}

customElements.define("history-view", HistoryView);
