/*
===============================================
SECTION 1: COMPONENT INITIALIZATION
===============================================
*/
import { LitElement, html } from "lit";
import { getDataLocally } from "../services/local-storage.js";

class AnalyticsDashboard extends LitElement {
  static properties = {
    workouts: { type: Array },
    isLoading: { type: Boolean },
    errorMessage: { type: String },
    units: { type: String },
  };

  constructor() {
    super();
    this.workouts = [];
    this.isLoading = true;
    this.errorMessage = "";
    this.units = localStorage.getItem('units') || 'lbs';
  }

/*
===============================================
SECTION 2: LIFECYCLE METHODS
===============================================
*/

  connectedCallback() {
    super.connectedCallback();
    this.fetchWorkoutHistory();
  }

  async fetchWorkoutHistory() {
    this.isLoading = true;
    try {
      const data = getDataLocally();
      if (data && data.workouts) {
        this.workouts = data.workouts;
      }
    } catch (error) {
      this.errorMessage = "Failed to load workout data.";
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

/*
===============================================
SECTION 3: DATA PROCESSING
===============================================
*/

  _calculateTotalVolume() {
    return this.workouts.reduce((total, workout) => total + (workout.totalVolume || 0), 0);
  }

  _calculateTotalWorkouts() {
    return this.workouts.length;
  }

  _calculateAverageDuration() {
    const totalDuration = this.workouts.reduce((total, workout) => total + (workout.durationInSeconds || 0), 0);
    return this.workouts.length > 0 ? Math.round((totalDuration / this.workouts.length) / 60) : 0;
  }

/*
===============================================
SECTION 4: RENDERING
===============================================
*/

  render() {
    if (this.isLoading) {
      return html`<div class="container"><p>Loading analytics...</p></div>`;
    }

    if (this.errorMessage) {
      return html`<div class="container"><p class="error-message">${this.errorMessage}</p></div>`;
    }

    const totalVolume = this._calculateTotalVolume();
    const totalWorkouts = this._calculateTotalWorkouts();
    const avgDuration = this._calculateAverageDuration();

    return html`
      <div class="container">
        <header class="app-header">
          <h1>Analytics</h1>
        </header>

        <div class="card summary-card">
          <h3>Lifetime Stats</h3>
          <div class="progress-metrics">
            <div class="metric-card">
              <div class="metric-value">${totalWorkouts}</div>
              <div class="metric-label">Total Workouts</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${totalVolume.toLocaleString()}</div>
              <div class="metric-label">Total Volume (${this.units})</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${avgDuration}</div>
              <div class="metric-label">Avg. Duration (min)</div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <h3>More Analytics Coming Soon!</h3>
          <p>We're working on advanced charts and insights to help you visualize your progress.</p>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("analytics-dashboard", AnalyticsDashboard);
